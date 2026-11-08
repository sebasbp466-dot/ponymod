package com.ponymod.app;

import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

final class Gemini {
    interface Cb { void done(String text, String err); }

    private static final Handler UI = new Handler(Looper.getMainLooper());

    static void ask(String key, String model, String prompt, String[] imgs, Cb cb) {
        new Thread(() -> {
            String text = null, err = null;
            try {
                JSONArray parts = new JSONArray();
                parts.put(new JSONObject().put("text", prompt));
                for (String im : imgs) {
                    parts.put(new JSONObject().put("inline_data",
                            new JSONObject().put("mime_type", "image/jpeg").put("data", im)));
                }
                JSONObject body = new JSONObject()
                        .put("contents", new JSONArray().put(new JSONObject().put("role", "user").put("parts", parts)))
                        .put("generationConfig", new JSONObject().put("temperature", 0.2));
                URL u = new URL("https://generativelanguage.googleapis.com/v1beta/models/"
                        + URLEncoder.encode(model, "UTF-8") + ":generateContent");
                HttpURLConnection c = (HttpURLConnection) u.openConnection();
                c.setRequestMethod("POST");
                c.setDoOutput(true);
                c.setConnectTimeout(15000);
                c.setReadTimeout(90000);
                c.setRequestProperty("Content-Type", "application/json");
                c.setRequestProperty("x-goog-api-key", key);
                OutputStream os = c.getOutputStream();
                os.write(body.toString().getBytes("UTF-8"));
                os.close();
                int code = c.getResponseCode();
                String resp = read(code < 400 ? c.getInputStream() : c.getErrorStream());
                if (code >= 400) {
                    err = explain(code, resp);
                } else {
                    text = extract(resp);
                    if (text.isEmpty()) err = "Gemini no devolvió texto (puede que haya bloqueado la imagen). Reintenta.";
                }
            } catch (Exception e) {
                err = "No pude conectar con Gemini. Revisa el internet. (" + e.getMessage() + ")";
            }
            final String ft = text, fe = err;
            UI.post(() -> cb.done(ft, fe));
        }).start();
    }

    private static String read(InputStream is) throws Exception {
        if (is == null) return "";
        BufferedReader r = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = r.readLine()) != null) sb.append(line).append('\n');
        r.close();
        return sb.toString();
    }

    private static String extract(String resp) {
        StringBuilder sb = new StringBuilder();
        try {
            JSONArray cands = new JSONObject(resp).optJSONArray("candidates");
            if (cands != null && cands.length() > 0) {
                JSONObject content = cands.getJSONObject(0).optJSONObject("content");
                JSONArray parts = content == null ? null : content.optJSONArray("parts");
                if (parts != null) {
                    for (int i = 0; i < parts.length(); i++) sb.append(parts.getJSONObject(i).optString("text", ""));
                }
            }
        } catch (Exception e) { }
        return sb.toString().trim();
    }

    private static String explain(int code, String resp) {
        String msg = "";
        try { msg = new JSONObject(resp).getJSONObject("error").optString("message", ""); } catch (Exception e) { }
        if (code == 429) return "Se acabó la cuota de Gemini (429). Espera un poco o cambia el modelo en Ajustes, y toca Reintentar.";
        if (code == 404) return "Ese modelo no existe (404). Revisa el nombre del modelo en Ajustes.";
        if (code == 401 || code == 403 || (code == 400 && msg.toLowerCase().contains("api key"))) {
            return "La clave de Gemini no sirve (" + code + "). Revísala en Ajustes.";
        }
        if (code >= 500) return "Gemini está fallando ahora mismo (" + code + "). Reintenta en un momento.";
        return "Error " + code + ": " + (msg.length() > 200 ? msg.substring(0, 200) : msg);
    }
}
