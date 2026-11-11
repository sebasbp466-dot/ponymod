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
    private static final int MAX_STEPS = 80;

    private static final String P =
            "Eres un agente que maneja el editor de personajes de Pony Town (juego pixel art con interfaz web, en un teléfono) para recrear una skin. "
            + "Imagen 1 = skin OBJETIVO (recorte). Imagen 2 = pantalla actual; en el editor, el poni de la vista previa es MI poni, el que debes modificar. "
            + "Recibes la lista de elementos visibles, una línea por elemento: id|tag|texto|etiqueta|icono|clases|cx,cy|ancho x alto|marcas. "
            + "cx,cy y ancho/alto están en escala 0 a 1000 sobre la pantalla. Marcas: sel = activo o seleccionado, dis = deshabilitado, val = valor de un campo. "
            + "Las líneas con tag SCROLLER son zonas que se pueden desplazar (max = cuánto se puede bajar, en = posición actual). "
            + "Los botones con solo icono se reconocen por el campo icono (por ejemplo fa-xmark = cerrar, fa-clone = copiar, fa-arrow-rotate-left = deshacer). "
            + "Responde SOLO con un JSON, sin texto extra: "
            + "{\"say\":\"qué haces ahora, corto\",\"note\":\"dato útil para recordar, opcional\",\"ask\":\"pregunta al usuario o vacío\",\"done\":false,"
            + "\"actions\":[{\"type\":\"click\",\"id\":0},{\"type\":\"tap\",\"x\":500,\"y\":500},{\"type\":\"type\",\"id\":0,\"text\":\"#aabbcc\",\"enter\":true},"
            + "{\"type\":\"select\",\"id\":0,\"text\":\"opción\"},{\"type\":\"key\",\"key\":\"Enter\"},{\"type\":\"scroll\",\"id\":0,\"dy\":300},"
            + "{\"type\":\"drag\",\"x1\":300,\"y1\":500,\"x2\":600,\"y2\":500}]}. "
            + "Acciones: click toca un elemento por id; tap toca unas coordenadas (úsalo para tarjetas de imagen sin id o para paletas de color); "
            + "type escribe en un campo (enter true pulsa Enter después); select elige una opción de un desplegable; "
            + "key pulsa una tecla (Enter, Escape, Tab, ArrowLeft, ArrowRight, ArrowUp, ArrowDown); "
            + "scroll desplaza (usa el id de un SCROLLER o de un elemento dentro de él, o x,y; dy positivo baja y negativo sube; dx opcional); "
            + "drag arrastra de un punto a otro (deslizadores y paletas de color). Máximo 5 acciones por respuesta. "
            + "CÓMO ABRIR EL EDITOR: ya se intentó abrir antes de empezar. En la pantalla de inicio de Pony Town (logo, botón verde Play, tu poni con los botones new y edit) "
            + "se abre con el botón edit, que está junto al nombre del poni. Dentro del juego (mapa) se abre con el engranaje de arriba a la derecha y luego la opción Character editor. "
            + "No cierres el editor ni salgas hasta terminar. Si ves un menú abierto que estorba, ciérralo con key Escape. "
            + "ESTRUCTURA PROBABLE DEL EDITOR (confírmala con lo que ves, los nombres pueden variar): secciones o pestañas como Body (cuerpo), Mane (melena), Tail (cola), "
            + "Face (cara y ojos) e Items o accesorios. Body: opciones generales (líneas o contornos), color del cuerpo, tipo de poni (tierra, pegaso, unicornio, alicornio, changeling u otro), "
            + "cuerno, alas, orejas y marcas. Mane: estilo de melena delantera y de melena trasera (back mane), cada una con su estilo y sus colores. "
            + "Tail: estilo y colores de la cola. Face: ojos (estilo y colores), expresión, nariz y boca. Items: accesorios de cabeza, cuello, cuerpo, patas y cola, y ropa. "
            + "CÓMO FUNCIONAN LOS CONTROLES: cada parte suele tener un selector de estilo (cuadrícula de imágenes, flechas anterior y siguiente, o un desplegable) y uno o más cuadritos de color. "
            + "Un cuadrito de color abre un selector con un campo de texto hexadecimal (#rrggbb): haz click en el cuadrito, luego type en ese campo con el HEX y enter true. "
            + "Si no hay campo de texto, usa tap o drag en la paleta. Las listas largas se desplazan con scroll; sigue bajando hasta ver todas las opciones. "
            + "ESTRATEGIA: 1) Si el editor no está abierto, ábrelo. 2) Recorre las secciones en orden: Body, Mane, Tail, Face, Items. "
            + "3) En cada sección compara con el objetivo, elige el estilo más parecido (prueba 2 o 3 si dudas) y ajusta los colores con HEX estimados del objetivo. "
            + "4) Haz un cambio a la vez y verifica en la siguiente captura que cambió la vista previa. "
            + "5) Si un cambio no tuvo efecto tras 2 intentos, prueba otra forma (tap en coordenadas, otro elemento) o pregunta. "
            + "6) Anota en note lo que ya terminaste (por ejemplo: Body listo, Mane pendiente) para no repetirlo. "
            + "Usa ask cuando no puedas igualar algo, no encuentres un control, o no estés seguro de qué opción elegir, y siempre antes de guardar, salir o borrar. Nunca borres personajes. "
            + "Cuando todo coincida o ya no puedas mejorar, pon done en true y en ask pregunta si quiere guardar.";

    private final MainActivity a;
    private boolean running, waiting;
    private int step, gen;
    private final ArrayList<String> notes = new ArrayList<>();
    private final ArrayList<String> hist = new ArrayList<>();
    private String userMsg = "", actLog = "";

    Agent(MainActivity act) { a = act; }

    private void js(String code) { a.w.post(() -> a.w.evaluateJavascript(code, null)); }

    private void err0(String m) { js("pmSkinErr(" + JSONObject.quote(m) + ")"); }

    void start() {
        if (a.store.key().isEmpty()) { err0("Falta la clave de Gemini. Ponla en Ajustes."); return; }
        if (a.skins.target == null) { err0("Primero elige la skin objetivo."); return; }
        if (Build.VERSION.SDK_INT < 26) { err0("Esta función necesita Android 8 o más."); return; }
        running = true;
        waiting = false;
        step = 0;
        gen++;
        notes.clear();
        hist.clear();
        userMsg = "";
        actLog = "";
        final int g = gen;
        js("pmAgentState(true);pmCap(true);document.body.classList.add('pm-snap');pmAgentStatus('Abriendo el editor...')");
        a.w.postDelayed(() -> a.w.evaluateJavascript("pmOpenEditor()", raw -> {
            boolean gear = raw != null && raw.contains("engranaje");
            if (gear) a.w.postDelayed(() -> js("pmOpenEditor()"), 1200);
            a.w.postDelayed(() -> loop(g), gear ? 3000 : 1800);
        }), 400);
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
            String els = "";
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
                + "\nTus últimos pasos: " + (hist.isEmpty() ? "ninguno" : TextUtils.join(" > ", hist))
                + "\nMensaje del usuario: " + (userMsg.isEmpty() ? "ninguno" : userMsg)
                + "\nResultado de las acciones anteriores: " + (actLog.isEmpty() ? "sin problemas" : actLog)
                + "\nPaso " + step + " de " + MAX_STEPS
                + "\nElementos visibles:\n" + els;
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
        if (!say.isEmpty()) {
            hist.add(say);
            while (hist.size() > 10) hist.remove(0);
            js("pmAgentStatus(" + JSONObject.quote(say) + ")");
        }
        final int n = hist.size();
        final boolean rep = n >= 3 && hist.get(n - 1).equals(hist.get(n - 2)) && hist.get(n - 2).equals(hist.get(n - 3));

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
            if (rep) log += " ALERTA: llevas 3 pasos iguales. Cambia de enfoque o pregunta al usuario.";
            actLog = log;
            a.w.postDelayed(() -> loop(g), 1000);
        });
    }
}
