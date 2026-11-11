package com.ponymod.app;

import android.graphics.Bitmap;
import android.graphics.Rect;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.PixelCopy;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.util.ArrayList;

final class Agent {
    private static final int MAX_STEPS = 60;

    private static final String P =
            "Eres un agente que maneja el editor de personajes de Pony Town (juego pixel art con interfaz web) para recrear una skin. "
            + "Imagen 1 = skin OBJETIVO. Imagen 2 = pantalla actual. Recibes la lista de elementos visibles e interactivos: "
            + "id, tag, text, label, type, value, cls, cx y cy (centro, escala 0 a 1000 sobre la pantalla), w y h. "
            + "Responde SOLO con un JSON, sin texto extra: "
            + "{\"say\":\"qué haces ahora, corto\",\"note\":\"dato útil para recordar, opcional\",\"ask\":\"pregunta al usuario o vacío\","
            + "\"done\":false,\"actions\":[{\"type\":\"click\",\"id\":0},{\"type\":\"tap\",\"x\":500,\"y\":500},"
            + "{\"type\":\"type\",\"id\":0,\"text\":\"#aabbcc\"},{\"type\":\"scroll\",\"id\":0,\"dy\":300}]}. "
            + "Reglas: máximo 4 acciones por respuesta y haz un cambio a la vez. Si el editor no está abierto, ábrelo (Character editor o edit). "
            + "Compara el poni actual con el objetivo parte por parte (especie, pelaje, ojos, melena, cola, cascos, marcas, accesorios) y corrige lo que difiera. "
            + "Los colores se escriben en HEX en el campo de color. "
            + "Usa ask cuando no puedas igualar algo o no estés seguro de qué opción elegir, y siempre antes de guardar, salir o borrar. "
            + "Nunca borres personajes. Cuando todo coincida o ya no puedas mejorar, pon done en true y en ask pregunta si quiere guardar.";

    private final MainActivity a;
    private boolean running, waiting;
    private int step, gen;
    private final ArrayList<String> notes = new ArrayList<>();
    private String userMsg = "", actLog = "";

    Agent(MainActivity act) { a = act; }

    private void js(String code) { a.w.post(() -> a.w.evaluateJavascript(code, null)); }

    private void err0(String m) { js("pmSkinErr(" + JSONObject.quote(m) + ")"); }

    void start() {
        if (a.store.key().isEmpty()) { err0("Falta la clave de Gemini. Ponla en Ajustes."); return; }
        if (a.skins.target == null) { err0("Primero captura la skin objetivo."); return; }
        if (Build.VERSION.SDK_INT < 26) { err0("Esta función necesita Android 8 o más."); return; }
        running = true;
        waiting = false;
        step = 0;
        gen++;
        notes.clear();
        userMsg = "";
        actLog = "";
        js("pmAgentState(true)");
        loop(gen);
    }

    void stop() {
        running = false;
        waiting = false;
        gen++;
        js("pmAgentState(false);pmCap(false);pmSkinBusy('Detenido.')");
    }

    void answer(String s) {
        if (!running || !waiting) return;
        waiting = false;
        userMsg = (s == null || s.trim().isEmpty()) ? "Sigue." : s.trim();
        js("pmAgentAskHide();pmCap(true);document.body.classList.add('pm-snap')");
        loop(gen);
    }

    private void finish(String msg) {
        running = false;
        waiting = false;
        gen++;
        js("pmAgentState(false);pmCap(false);pmSkinBusy(" + JSONObject.quote(msg) + ")");
    }

    private void fail(String msg) {
        running = false;
        waiting = false;
        a.skins.last = () -> resume();
        js("pmAgentState(false);pmCap(false);pmSkinErr(" + JSONObject.quote(msg) + ")");
    }

    private void resume() {
        running = true;
        step = Math.max(0, step - 1);
        js("pmAgentState(true)");
        loop(gen);
    }

    private void loop(int g) {
        if (!running || g != gen) return;
        if (step >= MAX_STEPS) { finish("Llegué al límite de " + MAX_STEPS + " pasos. Revisa cómo quedó."); return; }
        step++;
        js("pmCap(true);document.body.classList.add('pm-snap')");
        a.w.postDelayed(() -> observe(g), 450);
    }

    private void observe(int g) {
        if (!running || g != gen) return;
        a.w.evaluateJavascript("pmObs()", raw -> {
            String els = "[]";
            try {
                Object o = new JSONTokener(raw).nextValue();
                if (o instanceof String) els = (String) o;
            } catch (Exception e) { }
            shot(g, els);
        });
    }

    private void shot(int g, String els) {
        try {
            int wd = a.w.getWidth(), ht = a.w.getHeight();
            if (wd <= 0 || ht <= 0) { fail("No pude medir la pantalla."); return; }
            Bitmap bmp = Bitmap.createBitmap(wd, ht, Bitmap.Config.ARGB_8888);
            int[] loc = new int[2];
            a.w.getLocationInWindow(loc);
            Rect r = new Rect(loc[0], loc[1], loc[0] + wd, loc[1] + ht);
            PixelCopy.request(a.getWindow(), r, bmp, res -> {
                if (!running || g != gen) return;
                if (res != PixelCopy.SUCCESS) { fail("No pude capturar la pantalla (código " + res + ")."); return; }
                think(g, els, Skins.encode(bmp));
            }, new Handler(Looper.getMainLooper()));
        } catch (Exception e) {
            fail("Error al capturar: " + e.getMessage());
        }
    }

    private void think(int g, String els, String cur) {
        js("document.body.classList.remove('pm-snap');pmAgentStatus('Paso " + step + ": Gemini está pensando...')");
        String prompt = P
                + "\nNotas anteriores: " + (notes.isEmpty() ? "ninguna" : TextUtils.join(" | ", notes))
                + "\nMensaje del usuario: " + (userMsg.isEmpty() ? "ninguno" : userMsg)
                + "\nResultado de las acciones anteriores: " + (actLog.isEmpty() ? "sin problemas" : actLog)
                + "\nPaso " + step + " de " + MAX_STEPS
                + "\nElementos visibles: " + els;
        final String um = userMsg;
        userMsg = "";
        Gemini.ask(a.store.key(), a.store.model(), prompt, new String[]{a.skins.target, cur}, (text, err) -> {
            if (!running || g != gen) return;
            if (err != null) { userMsg = um; fail(err); return; }
            handle(g, text);
        });
    }

    private void handle(int g, String text) {
        JSONObject o;
        try {
            int i = text.indexOf('{'), j = text.lastIndexOf('}');
            o = new JSONObject(text.substring(i, j + 1));
        } catch (Exception e) {
            fail("Gemini no respondió en el formato esperado. Reintenta.");
            return;
        }
        String say = o.optString("say", "");
        String note = o.optString("note", "");
        String ask = o.optString("ask", "");
        boolean done = o.optBoolean("done", false);
        JSONArray acts = o.optJSONArray("actions");

        if (!note.isEmpty()) {
            notes.add(note);
            while (notes.size() > 12) notes.remove(0);
        }
        if (!say.isEmpty()) js("pmAgentStatus(" + JSONObject.quote(say) + ")");

        if (done) {
            finish("Terminé: " + (say.isEmpty() ? "la skin quedó como pude." : say) + (ask.isEmpty() ? "" : "\n" + ask));
            return;
        }
        if (!ask.isEmpty()) {
            waiting = true;
            js("pmCap(false);pmAgentAsk(" + JSONObject.quote(ask) + ")");
            return;
        }
        if (acts == null || acts.length() == 0) {
            actLog = "No enviaste acciones; elige alguna o pregunta.";
            a.w.postDelayed(() -> loop(g), 600);
            return;
        }
        a.w.evaluateJavascript("pmAct(" + acts.toString() + ")", raw -> {
            String log = "";
            try {
                Object x = new JSONTokener(raw).nextValue();
                if (x instanceof String) log = (String) x;
            } catch (Exception e) { }
            actLog = log;
            a.w.postDelayed(() -> loop(g), 1000);
        });
    }
}
