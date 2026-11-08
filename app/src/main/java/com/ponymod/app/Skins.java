package com.ponymod.app;

import android.graphics.Bitmap;
import android.graphics.Rect;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.PixelCopy;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;

final class Skins {
    private static final String P_RECIPE =
            "Eres experto en el editor de personajes de Pony Town. La imagen es una captura del juego (pixel art). "
            + "Analiza el poni que está más cerca del centro de la imagen y descríbelo para poder reconstruirlo en el editor "
            + "con la mayor exactitud posible. Para cada parte da el estilo y el color aproximado en HEX: "
            + "especie (tierra, unicornio, pegaso, alicornio u otra), pelaje (color y sombreado), ojos (forma y colores), "
            + "melena (estilo y colores), cola (estilo y colores), cascos y patas, marcas, accesorios y ropa, y cutie mark si se ve. "
            + "Si algo no se alcanza a ver, dilo; no lo inventes. Responde en español, como lista por partes, sin introducción.";

    private static final String P_COMPARE =
            "Hay dos capturas de Pony Town (pixel art). La imagen 1 es el poni objetivo y la imagen 2 es mi poni ahora. "
            + "Compara el poni central de cada imagen parte por parte: especie, pelaje, ojos, melena, cola, cascos, marcas y accesorios, "
            + "con colores aproximados en HEX. Dime solo lo que se ve diferente y cómo corregirlo en el editor. "
            + "Si una parte ya es igual, resúmelo en una línea. Si algo no se ve bien, dilo. Responde en español.";

    private final MainActivity a;
    private String target, mine;
    private Runnable last;

    Skins(MainActivity act) { a = act; }

    private void js(String code) { a.w.post(() -> a.w.evaluateJavascript(code, null)); }

    private void err(String m) {
        js("window.pmCap&&pmCap(false);window.pmSkinErr&&pmSkinErr(" + JSONObject.quote(m) + ")");
    }

    void capture(String kind) {
        if (a.store.key().isEmpty()) { err("Falta la clave de Gemini. Ponla en Ajustes."); return; }
        if (kind.equals("mine") && target == null) { err("Primero captura la skin objetivo."); return; }
        if (Build.VERSION.SDK_INT < 26) { err("Esta función necesita Android 8 o más."); return; }
        js("pmCap(true)");
        a.w.postDelayed(() -> grab(kind), 500);
    }

    private void grab(String kind) {
        try {
            int wd = a.w.getWidth(), ht = a.w.getHeight();
            if (wd <= 0 || ht <= 0) { err("No pude medir la pantalla."); return; }
            Bitmap bmp = Bitmap.createBitmap(wd, ht, Bitmap.Config.ARGB_8888);
            int[] loc = new int[2];
            a.w.getLocationInWindow(loc);
            Rect r = new Rect(loc[0], loc[1], loc[0] + wd, loc[1] + ht);
            PixelCopy.request(a.getWindow(), r, bmp, res -> {
                if (res != PixelCopy.SUCCESS) { err("No pude capturar la pantalla (código " + res + ")."); return; }
                String b64 = encode(bmp);
                if (kind.equals("target")) target = b64; else mine = b64;
                js("pmCap(false)");
                run(kind);
            }, new Handler(Looper.getMainLooper()));
        } catch (Exception e) {
            err("Error al capturar: " + e.getMessage());
        }
    }

    private static String encode(Bitmap src) {
        int max = 1600, w = src.getWidth(), h = src.getHeight();
        float s = Math.min(1f, (float) max / Math.max(w, h));
        Bitmap b = s < 1f ? Bitmap.createScaledBitmap(src, Math.round(w * s), Math.round(h * s), true) : src;
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.JPEG, 88, o);
        return Base64.encodeToString(o.toByteArray(), Base64.NO_WRAP);
    }

    private void run(String kind) {
        last = () -> run(kind);
        js("pmSkinBusy('Gemini está analizando...')");
        boolean cmp = kind.equals("mine");
        String[] imgs = cmp ? new String[]{target, mine} : new String[]{target};
        Gemini.ask(a.store.key(), a.store.model(), cmp ? P_COMPARE : P_RECIPE, imgs, (text, e) -> {
            if (e != null) js("pmSkinErr(" + JSONObject.quote(e) + ")");
            else js("pmSkinOut(" + JSONObject.quote(text) + ")");
        });
    }

    void retry() {
        if (last != null) last.run(); else err("No hay nada que reintentar.");
    }
}
