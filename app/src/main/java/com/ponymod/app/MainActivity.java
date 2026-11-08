package com.ponymod.app;

import android.Manifest;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.PrintWriter;

public class MainActivity extends Activity {
    WebView w;
    Player player;
    Skins skins;
    Store store;
    private TextView fab;
    private Runnable pendingPerm;
    private String pmJs;
    private volatile boolean trusted = false;

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    private static boolean isPony(String url) {
        try {
            String h = Uri.parse(url).getHost();
            return h != null && (h.equals("pony.town") || h.endsWith(".pony.town"));
        } catch (Exception e) { return false; }
    }

    private String asset(String n) {
        try (InputStream in = getAssets().open(n); ByteArrayOutputStream o = new ByteArrayOutputStream()) {
            byte[] b = new byte[8192];
            int r;
            while ((r = in.read(b)) > 0) o.write(b, 0, r);
            return o.toString("UTF-8");
        } catch (Exception e) { return ""; }
    }

    private void toast(String s) { runOnUiThread(() -> Toast.makeText(this, s, Toast.LENGTH_SHORT).show()); }

    private void js(String code) { w.post(() -> w.evaluateJavascript(code, null)); }

    private void pushNow() {
        js("window.pmNow&&pmNow(" + JSONObject.quote(player.cur) + "," + player.playing() + ")");
    }

    private void pushList() {
        JSONArray a = new JSONArray();
        for (Player.Track t : player.tracks) a.put(t.title);
        js("window.pmList&&pmList(" + a.toString() + ")");
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);

        final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((t, e) -> {
            try {
                PrintWriter pw = new PrintWriter(new File(getExternalFilesDir(null), "crash.txt"));
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception x) { }
            if (prev != null) prev.uncaughtException(t, e);
        });

        store = new Store(this);
        player = new Player(this);
        player.onChange = this::pushNow;
        skins = new Skins(this);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        FrameLayout root = new FrameLayout(this);
        w = new WebView(this);
        root.addView(w, new FrameLayout.LayoutParams(-1, -1));
        root.addView(makeFab());
        setContentView(root);

        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(w, true);
        w.addJavascriptInterface(new Bridge(), "PM");
        w.setWebChromeClient(new WebChromeClient());
        w.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView v, String url, android.graphics.Bitmap icon) {
                super.onPageStarted(v, url, icon);
                trusted = isPony(url);
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                super.onPageFinished(v, url);
                if (!isPony(url)) return;
                if (pmJs == null) pmJs = asset("pm.js");
                v.evaluateJavascript(pmJs, null);
            }
        });
        w.loadUrl("https://pony.town");
    }

    private View makeFab() {
        fab = new TextView(this);
        fab.setText("☰");
        fab.setTextColor(Color.WHITE);
        fab.setTextSize(20);
        fab.setGravity(Gravity.CENTER);
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(0x55FFFFFF);
        g.setStroke(dp(1), 0x77FFFFFF);
        fab.setBackground(g);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(dp(44), dp(44), Gravity.TOP | Gravity.START);
        lp.leftMargin = dp(10);
        lp.topMargin = dp(90);
        fab.setLayoutParams(lp);
        fab.setOnTouchListener(new View.OnTouchListener() {
            float dx, dy, sx, sy;
            boolean moved;

            @Override
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        dx = v.getX() - e.getRawX();
                        dy = v.getY() - e.getRawY();
                        sx = e.getRawX();
                        sy = e.getRawY();
                        moved = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        if (Math.abs(e.getRawX() - sx) > dp(6) || Math.abs(e.getRawY() - sy) > dp(6)) moved = true;
                        if (moved) { v.setX(e.getRawX() + dx); v.setY(e.getRawY() + dy); }
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (!moved) {
                            w.evaluateJavascript("window.pmToggle?(pmToggle(),1):0", r -> {
                                if (!"1".equals(r)) toast("El panel todavía no cargó");
                            });
                        }
                        return true;
                }
                return false;
            }
        });
        return fab;
    }

    void withAudioPerm(Runnable r) {
        String p = Build.VERSION.SDK_INT >= 33
                ? Manifest.permission.READ_MEDIA_AUDIO
                : Manifest.permission.READ_EXTERNAL_STORAGE;
        if (checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED) {
            r.run();
        } else {
            pendingPerm = r;
            requestPermissions(new String[]{p}, 7);
        }
    }

    @Override
    public void onRequestPermissionsResult(int rc, String[] perms, int[] res) {
        super.onRequestPermissionsResult(rc, perms, res);
        if (rc == 7 && res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED && pendingPerm != null) {
            pendingPerm.run();
        }
        pendingPerm = null;
    }

    private class Bridge {
        @JavascriptInterface
        public String cfg() {
            JSONObject o = new JSONObject();
            try {
                String k = store.key();
                o.put("tail", k.isEmpty() ? "" : (k.length() >= 4 ? k.substring(k.length() - 4) : "****"));
                o.put("model", store.model());
            } catch (Exception e) { }
            return o.toString();
        }

        @JavascriptInterface
        public void saveCfg(String k, String m) {
            if (!trusted) return;
            if (k != null && !k.isEmpty()) store.setKey(k);
            store.setModel(m == null || m.isEmpty() ? Store.DEF_MODEL : m);
            toast("Guardado");
        }

        @JavascriptInterface
        public void local() {
            if (!trusted) return;
            runOnUiThread(() -> withAudioPerm(() -> { player.loadLocal(); pushList(); }));
        }

        @JavascriptInterface
        public void radio(String q) {
            if (!trusted) return;
            final String qq = q == null ? "" : q.trim();
            runOnUiThread(() -> player.loadRadio(qq, err -> {
                if (err != null) js("window.pmStatus&&pmStatus(" + JSONObject.quote(err) + ")");
                else pushList();
            }));
        }

        @JavascriptInterface
        public void play(int i) { if (trusted) runOnUiThread(() -> player.play(i)); }

        @JavascriptInterface
        public void toggle() { if (trusted) runOnUiThread(() -> player.toggle()); }

        @JavascriptInterface
        public void next() { if (trusted) runOnUiThread(() -> player.next()); }

        @JavascriptInterface
        public void prev() { if (trusted) runOnUiThread(() -> player.prev()); }

        @JavascriptInterface
        public void hideFab() { if (trusted) runOnUiThread(() -> fab.setVisibility(View.GONE)); }

        @JavascriptInterface
        public void copy(String s) {
            if (!trusted) return;
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("clases", s));
                Toast.makeText(MainActivity.this, "Copiado (" + s.length() + " caracteres)", Toast.LENGTH_SHORT).show();
            });
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        player.release();
    }

    @Override
    public void onBackPressed() {
        w.evaluateJavascript("(window.pmClose&&pmClose())?1:0", r -> {
            if (!"1".equals(r)) {
                if (w.canGoBack()) w.goBack(); else finish();
            }
        });
    }
}
