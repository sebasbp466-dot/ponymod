package com.ponymod.app;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
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
    private static final int MAX_STEPS = 80, MAX_LEARN = 50;

    private static final String P_PLAN =
            "Eres experto en el editor de personajes de Pony Town. La imagen es un recorte ampliado del poni OBJETIVO (pixel art). "
            + "Escribe un PLAN para reconstruirlo en el editor. Una línea por parte, con el formato parte: descripción del estilo (forma, largo, tamaño) "
            + "y colores HEX aproximados (hasta 3 por parte si hay varios). Partes: tipo de poni, cuerpo (color base, marcas y patrones), cuerno, alas, orejas, "
            + "ojos (forma, color del iris, pupila), melena delantera, melena trasera, cola, cascos y patas, accesorios y ropa, cutie mark. "
            + "Escribe no visible si algo no se ve; no lo inventes. Máximo 1500 caracteres, en español, sin introducción.";

    private static final String P_BASE =
            "Eres un agente que maneja el editor de personajes de Pony Town (juego pixel art con interfaz web, en un teléfono). "
            + "Recibes la lista de elementos visibles, una línea por elemento: id|tag|texto|etiqueta|icono|clases|cx,cy|ancho x alto|marcas. "
            + "Las tarjetas de estilo van en formato corto: id|tile|cx,cy|marcas. cx,cy y ancho/alto están en escala 0 a 1000 sobre la pantalla. "
            + "Marcas: sel = activo o seleccionado, dis = deshabilitado, var = la tarjeta tiene variantes, val = valor de un campo. "
            + "En la captura de pantalla he dibujado el id de cada elemento en un cuadrito negro con número blanco, en su centro: úsalo para saber qué id es cada tarjeta o botón. "
            + "Las líneas SCROLLER son zonas desplazables (max = cuánto se puede bajar, en = posición actual). "
            + "Los botones con solo icono se reconocen por el campo icono (fa-xmark = cerrar, fa-clone = copiar, fa-arrow-rotate-left = deshacer). "
            + "Responde SOLO con un JSON, sin texto extra: "
            + "{\"say\":\"qué haces ahora, corto\",\"note\":\"dato útil solo para esta sesión, opcional\",\"learn\":\"lección permanente corta sobre cómo funciona el editor, opcional\","
            + "\"ask\":\"pregunta al usuario o vacío\",\"done\":false,"
            + "\"actions\":[{\"type\":\"click\",\"id\":0},{\"type\":\"tap\",\"x\":500,\"y\":500},{\"type\":\"type\",\"id\":0,\"text\":\"#aabbcc\",\"enter\":true},"
            + "{\"type\":\"select\",\"id\":0,\"text\":\"opción\"},{\"type\":\"key\",\"key\":\"Enter\"},{\"type\":\"scroll\",\"id\":0,\"dy\":300},"
            + "{\"type\":\"drag\",\"x1\":300,\"y1\":500,\"x2\":600,\"y2\":500}]}. "
            + "Acciones: click toca un elemento por id (también las tarjetas tile); tap toca unas coordenadas; type escribe en un campo (enter true pulsa Enter después); "
            + "select elige una opción de un desplegable; key pulsa una tecla (Enter, Escape, Tab, ArrowLeft, ArrowRight, ArrowUp, ArrowDown); "
            + "scroll desplaza (id de un SCROLLER o de un elemento dentro, o x,y; dy positivo baja y negativo sube; para ir al inicio usa dy -3000); "
            + "drag arrastra de un punto a otro. Máximo 5 acciones por respuesta. "
            + "CÓMO ABRIR EL EDITOR: ya se intentó abrir antes de empezar. En la pantalla de inicio de Pony Town se abre con el botón edit junto al nombre del poni; "
            + "dentro del juego, con el engranaje de arriba a la derecha y luego Character editor. Si un menú estorba, ciérralo con key Escape. "
            + "COSAS VERIFICADAS DEL EDITOR: es una ventana modal con una lista larga que se desliza (SCROLLER) con las opciones de la pestaña actual; "
            + "si no ves los nombres de las pestañas o secciones, sube con scroll dy -3000. "
            + "Cada parte tiene una etiqueta de texto (por ejemplo Back mane), una cuadrícula de estilos (tarjetas tile; la que tiene sel es la elegida; var indica variantes) "
            + "y a veces un selector Color pattern. "
            + "Los colores son filas con un número (1, 2, 3 = el número de color de esa parte), un campo de texto HEX (aria Color, valor como #1a1a1a) y un botón Pick color. "
            + "Si el campo HEX sale con marca dis, el color es automático: toca primero el botón Automatic color de esa fila para desactivarlo, y luego haz type con el HEX y enter true. "
            + "Abajo hay botones fijos: zoom de la vista previa (3x), Turn head, Flip preview, Toggle color panel, Undo edit, Redo edit, Close y Save & Play. "
            + "NUNCA toques Close ni Save & Play sin preguntar antes con ask. Para probar un estilo toca su tarjeta y mira la vista previa; si no sirve, usa Undo edit. "
            + "ESTRATEGIA: recorre las secciones en orden, un cambio a la vez, y verifica en la siguiente captura que cambió la vista previa. "
            + "Si un cambio no tuvo efecto tras 2 intentos, prueba otra forma (tap en coordenadas, otro elemento) o pregunta. "
            + "Anota en note lo que ya terminaste para no repetirlo. Cuando descubras algo que siempre será cierto del editor, ponlo en learn en una frase corta. "
            + "Usa ask cuando no puedas igualar algo, no encuentres un control o dudes entre opciones, y siempre antes de guardar, salir o borrar. Nunca borres personajes.";

    private static final String P_GOAL =
            "OBJETIVO: recrear la skin objetivo en el editor. Imagen 1 = skin OBJETIVO (recorte ampliado). "
            + "Imagen 2 = pantalla actual; en el editor, el poni de la vista previa es MI poni, el que debes modificar. "
            + "Sigue el PLAN: cada parte del plan debe corresponder a una sección del editor. Compara la vista previa con el objetivo y corrige lo que difiera. "
            + "Cuando todo coincida o ya no puedas mejorar, pon done en true y en ask pregunta si quiere guardar.";

    private static final String P_LEARN =
            "MODO APRENDER: no hay skin objetivo; hay una sola imagen, la pantalla actual. Tu trabajo es aprender a usar el editor y dejar lo aprendido en learn. "
            + "Sube al inicio de la lista (scroll dy -3000), anota los nombres de las pestañas o secciones en el orden en que aparecen, baja la lista completa "
            + "y anota qué partes tiene cada una (etiquetas, selectores de estilo, filas de color). Recorre todas las pestañas o secciones. "
            + "Prueba cada tipo de control una vez (tocar una tarjeta de estilo, escribir un HEX y comprobar que la vista previa cambia, Undo edit para volver atrás). "
            + "Cada hallazgo útil va en learn, en una frase corta y concreta. NUNCA toques Close ni Save & Play y nunca borres nada. "
            + "Cuando hayas cubierto todas las secciones, pon done en true.";

    private final MainActivity a;
    private boolean running, waiting, learnMode;
    private int step, gen;
    private String plan = "";
    private final ArrayList<String> notes = new ArrayList<>();
    private final ArrayList<String> hist = new ArrayList<>();
    private final ArrayList<String> mem = new ArrayList<>();
    private String userMsg = "", actLog = "";

    Agent(MainActivity act) { a = act; }

    private void js(String code) { a.w.post(() -> a.w.evaluateJavascript(code, null)); }

    private void err0(String m) { js("pmSkinErr(" + JSONObject.quote(m) + ")"); }

    private int max() { return learnMode ? MAX_LEARN : MAX_STEPS; }

    void start() { start(false); }

    void learn() { start(true); }

    private void start(boolean learn) {
        if (a.store.key().isEmpty()) { err0("Falta la clave de Gemini. Ponla en Ajustes."); return; }
        if (!learn && a.skins.target == null) { err0("Primero elige la skin objetivo."); return; }
        if (Build.VERSION.SDK_INT < 26) { err0("Esta función necesita Android 8 o más."); return; }
        learnMode = learn;
        running = true;
        waiting = false;
        step = 0;
        gen++;
        plan = "";
        notes.clear();
        hist.clear();
        userMsg = "";
        actLog = "";
        mem.clear();
        for (String line : a.store.mem().split("\n")) {
            String t = line.trim();
            if (!t.isEmpty()) mem.add(t);
        }
        final int g = gen;
        js("pmAgentState(true);pmCap(true)");
        if (learn) { openEditor(g); return; }
        js("pmAgentStatus('Analizando la skin objetivo...')");
        Gemini.ask(a.store.key(), a.store.model(), P_PLAN, new String[]{a.skins.target}, (text, err) -> {
            if (!running || g != gen) return;
            if (err != null) { failPlan(err); return; }
            plan = text.length() > 2000 ? text.substring(0, 2000) : text;
            openEditor(g);
        });
    }

    private void openEditor(int g) {
        js("pmAgentStatus('Abriendo el editor...')");
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

    private void failPlan(String msg) {
        running = false;
        waiting = false;
        final boolean lm = learnMode;
        a.skins.last = () -> start(lm);
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
        if (step >= max()) {
            finish("Llegué al límite de " + max() + " pasos. Revisa cómo quedó."
                    + (learnMode ? " Lo aprendido quedó en la memoria (Ajustes)." : ""));
            return;
        }
        step++;
        js("pmCap(true);document.body.classList.add('pm-snap')");
        a.w.postDelayed(() -> observe(g), 450);
    }

    private void observe(int g) {
        if (!running || g != gen) return;
        a.w.evaluateJavascript("pmObs()", raw -> {
            String els = "";
            JSONArray marks = new JSONArray();
            try {
                Object o = new JSONTokener(raw).nextValue();
                if (o instanceof String) {
                    JSONObject j = new JSONObject((String) o);
                    els = j.optString("t", "");
                    JSONArray m = j.optJSONArray("m");
                    if (m != null) marks = m;
                }
            } catch (Exception e) { }
            shot(g, els, marks);
        });
    }

    private void shot(int g, String els, JSONArray marks) {
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
                drawMarks(bmp, marks);
                think(g, els, Skins.encode(bmp));
            }, new Handler(Looper.getMainLooper()));
        } catch (Exception e) {
            fail("Error al capturar: " + e.getMessage());
        }
    }

    private void drawMarks(Bitmap bmp, JSONArray m) {
        try {
            Canvas c = new Canvas(bmp);
            float W = bmp.getWidth(), H = bmp.getHeight();
            float ts = W * 0.03f;
            Paint bg = new Paint(Paint.ANTI_ALIAS_FLAG);
            bg.setColor(0xCC000000);
            Paint tx = new Paint(Paint.ANTI_ALIAS_FLAG);
            tx.setColor(Color.WHITE);
            tx.setTextSize(ts);
            tx.setTextAlign(Paint.Align.CENTER);
            tx.setTypeface(Typeface.DEFAULT_BOLD);
            for (int i = 0; i < m.length(); i++) {
                JSONArray k = m.optJSONArray(i);
                if (k == null) continue;
                String s = String.valueOf(k.optInt(0));
                float x = k.optInt(1) / 1000f * W, y = k.optInt(2) / 1000f * H;
                float w = tx.measureText(s) + ts * 0.5f;
                c.drawRoundRect(x - w / 2, y - ts * 0.75f, x + w / 2, y + ts * 0.4f, 6, 6, bg);
                c.drawText(s, x, y + ts * 0.3f, tx);
            }
        } catch (Exception e) { }
    }

    private void think(int g, String els, String cur) {
        js("document.body.classList.remove('pm-snap');pmAgentStatus('Paso " + step + ": Gemini está pensando...')");
        String goal = learnMode ? P_LEARN : P_GOAL + "\nPLAN DE LA SKIN OBJETIVO:\n" + plan;
        String prompt = P_BASE + "\n" + goal
                + "\nMEMORIA PERMANENTE (lo que ya aprendiste del editor):\n" + (mem.isEmpty() ? "vacía" : TextUtils.join("\n", mem))
                + "\nNotas de esta sesión: " + (notes.isEmpty() ? "ninguna" : TextUtils.join(" | ", notes))
                + "\nTus últimos pasos: " + (hist.isEmpty() ? "ninguno" : TextUtils.join(" > ", hist))
                + "\nMensaje del usuario: " + (userMsg.isEmpty() ? "ninguno" : userMsg)
                + "\nResultado de las acciones anteriores: " + (actLog.isEmpty() ? "sin problemas" : actLog)
                + "\nPaso " + step + " de " + max()
                + "\nElementos visibles:\n" + els;
        final String um = userMsg;
        userMsg = "";
        String[] imgs = learnMode ? new String[]{cur} : new String[]{a.skins.target, cur};
        Gemini.ask(a.store.key(), a.store.model(), prompt, imgs, (text, err) -> {
            if (!running || g != gen) return;
            if (err != null) { userMsg = um; fail(err); return; }
            handle(g, text);
        });
    }

    private void addMem(String s) {
        s = s.replaceAll("\\s+", " ").trim();
        if (s.isEmpty()) return;
        if (s.length() > 240) s = s.substring(0, 240);
        for (String m : mem) if (m.equalsIgnoreCase(s)) return;
        mem.add(s);
        while (mem.size() > 60) mem.remove(0);
        a.store.setMem(TextUtils.join("\n", mem));
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
        String lesson = o.optString("learn", "");
        String ask = o.optString("ask", "");
        boolean done = o.optBoolean("done", false);
        JSONArray acts = o.optJSONArray("actions");

        if (!note.isEmpty()) {
            notes.add(note);
            while (notes.size() > 12) notes.remove(0);
        }
        if (!lesson.isEmpty()) addMem(lesson);
        if (!say.isEmpty()) {
            hist.add(say);
            while (hist.size() > 10) hist.remove(0);
            js("pmAgentStatus(" + JSONObject.quote(say) + ")");
        }
        final int n = hist.size();
        final boolean rep = n >= 3 && hist.get(n - 1).equals(hist.get(n - 2)) && hist.get(n - 2).equals(hist.get(n - 3));

        if (done) {
            String head = learnMode ? "Terminé de aprender. La memoria tiene " + mem.size() + " lecciones (míralas en Ajustes)." : "Terminé: " + (say.isEmpty() ? "la skin quedó como pude." : say);
            finish(head + (ask.isEmpty() ? "" : "\n" + ask));
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
