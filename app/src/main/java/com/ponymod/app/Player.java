package com.ponymod.app;

import android.content.ContentUris;
import android.content.Context;
import android.database.Cursor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;

final class Player {
    static final class Track {
        final String title, uri;
        Track(String t, String u) { title = t; uri = u; }
    }

    interface Cb { void done(String err); }

    private final Context ctx;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private MediaPlayer mp;
    private boolean prepared = false;
    boolean radio = false;
    String cur = "";
    final ArrayList<Track> tracks = new ArrayList<>();
    int idx = -1;
    Runnable onChange;

    Player(Context c) { ctx = c.getApplicationContext(); }

    private void changed() { if (onChange != null) onChange.run(); }

    boolean playing() {
        try { return mp != null && prepared && mp.isPlaying(); } catch (Exception e) { return false; }
    }

    void release() {
        if (mp != null) { try { mp.release(); } catch (Exception e) { } mp = null; }
        prepared = false;
    }

    void play(int i) {
        if (i < 0 || i >= tracks.size()) return;
        idx = i;
        cur = tracks.get(i).title;
        release();
        try {
            mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            mp.setWakeMode(ctx, PowerManager.PARTIAL_WAKE_LOCK);
            mp.setDataSource(ctx, Uri.parse(tracks.get(i).uri));
            mp.setOnPreparedListener(m -> { prepared = true; m.start(); changed(); });
            mp.setOnCompletionListener(m -> { if (!radio) next(); });
            mp.setOnErrorListener((m, what, extra) -> {
                prepared = false;
                Toast.makeText(ctx, "No se pudo reproducir esto", Toast.LENGTH_SHORT).show();
                changed();
                return true;
            });
            mp.prepareAsync();
        } catch (Exception e) {
            Toast.makeText(ctx, "No se pudo reproducir esto", Toast.LENGTH_SHORT).show();
        }
        changed();
    }

    void next() { if (!tracks.isEmpty()) play((idx + 1) % tracks.size()); }

    void prev() { if (!tracks.isEmpty()) play((idx <= 0 ? tracks.size() : idx) - 1); }

    void toggle() {
        if (mp == null || !prepared) return;
        try { if (mp.isPlaying()) mp.pause(); else mp.start(); } catch (Exception e) { }
        changed();
    }

    void loadLocal() {
        tracks.clear();
        radio = false;
        idx = -1;
        String[] proj = {MediaStore.Audio.Media._ID, MediaStore.Audio.Media.TITLE, MediaStore.Audio.Media.ARTIST};
        try (Cursor c = ctx.getContentResolver().query(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, proj,
                MediaStore.Audio.Media.IS_MUSIC + "!=0", null, MediaStore.Audio.Media.TITLE + " COLLATE NOCASE ASC")) {
            if (c != null) {
                while (c.moveToNext() && tracks.size() < 1000) {
                    long id = c.getLong(0);
                    String t = c.getString(1);
                    String ar = c.getString(2);
                    if (t == null) t = "Sin título";
                    if (ar != null && !ar.equals("<unknown>")) t = t + " · " + ar;
                    Uri u = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id);
                    tracks.add(new Track(t, u.toString()));
                }
            }
        } catch (Exception e) { }
    }

    void loadRadio(String q, Cb cb) {
        final String tag = q.isEmpty() ? "lofi" : q.toLowerCase();
        new Thread(() -> {
            String err = "No pude conectar con el directorio de radios";
            ArrayList<Track> out = new ArrayList<>();
            String[] hosts = {"de1", "nl1", "at1"};
            for (String h : hosts) {
                try {
                    String u = "https://" + h + ".api.radio-browser.info/json/stations/search"
                            + "?hidebroken=true&limit=40&order=clickcount&reverse=true&tag="
                            + URLEncoder.encode(tag, "UTF-8");
                    HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
                    c.setRequestProperty("User-Agent", "PonyMod/1.0");
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(8000);
                    BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = r.readLine()) != null) sb.append(line);
                    r.close();
                    JSONArray arr = new JSONArray(sb.toString());
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject o = arr.getJSONObject(i);
                        String name = o.optString("name", "").trim();
                        String url = o.optString("url_resolved", "").trim();
                        if (!name.isEmpty() && !url.isEmpty() && o.optInt("hls", 0) == 0) {
                            out.add(new Track(name, url));
                        }
                    }
                    err = out.isEmpty() ? "No encontré emisoras con ese nombre" : null;
                    break;
                } catch (Exception e) { }
            }
            final String fe = err;
            ui.post(() -> {
                if (fe == null) { tracks.clear(); tracks.addAll(out); radio = true; idx = -1; }
                cb.done(fe);
            });
        }).start();
    }
}
