package com.ponymod.app;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.PixelCopy;
import android.widget.FrameLayout;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;

final class Skins {
    private static final String P_RECIPE =
            "Eres experto en el editor de personajes de Pony Town. La imagen es un recorte de una captura del juego (pixel art) "
            + "con un poni en el centro. Descríbelo para poder reconstruirlo en el editor con la mayor exactitud posible. "
            + "Para cada parte da el estilo y el color aproximado en HEX: "
            + "especie (tierra, unicornio, pegaso, alicornio u otra), pelaje (color y sombreado), ojos (forma y colores), "
            + "melena (estilo y colores), cola (estilo y colores), cascos y patas, marcas, accesorios y ropa, y cutie mark si se ve. "
            + "Si algo no se alcanza a ver, dilo; no lo inventes. Responde en español, como lista por partes, sin introducción.";

    private static final String P_COMPARE =
            "Hay dos recortes de Pony Town (pixel art), cada uno con un poni en el centro. La imagen 1 es el poni objetivo y la imagen 2 es mi poni ahora. "
            + "Compara ambos parte por parte: especie, pelaje, ojos, melena, cola, cascos, marcas y accesorios, "
            + "con colores aproximados en HEX. Dime solo lo que se ve diferente y cómo corregirlo en el editor. "
            + "Si una parte ya es igual, resúmelo en una línea. Si algo no se ve bien, dilo. Responde en español.";

    private final MainActivity a;
    String target, mine;
    Runnable last;
    private FrameLayout picker;

    Skins(MainActivity act) { a = act; }

    private void js(String code) { a.w.post(() -> a.w.evaluateJavascript(code, null)); }

    private void err(String m) {
        js("window.pmCap&&pmCap(false);window.pmSkinErr&&pmSkinErr(" + JSONObject.quote(m) + ")");
    }

    private TextView pill(String text, float d) {
        TextView t = new TextView(a);
        t.setText(text);
        t.setTextColor(Color.WHITE);
        t.setTextSize(16);
        t.setTypeface(Typeface.create("sans-serif-black", Typeface.NORMAL));
        t.setGravity(Gravity.CENTER);
        t.setPadding((int) (18 * d), (int) (10 * d), (int) (18 * d), (int) (10 * d));
        GradientDrawable g = new GradientDrawable();
        g.setColor(0xAA12121C);
        g.setCornerRadius(24 * d);
        g.setStroke(Math.max(1, (int) d), 0x66FFFFFF);
        t.setBackground(g);
        return t;
    }

    void capture(String kind) {
        js("pmSkinBusy('Preparando selección...')");
        if (a.store.key().isEmpty()) { err("Falta la clave de Gemini. Ponla en Ajustes."); return; }
        if (kind.equals("mine") && target == null) { err("Primero elige la skin objetivo."); return; }
        if (Build.VERSION.SDK_INT < 26) { err("Esta función necesita Android 8 o más."); return; }
        js("pmCap(true)");
        showPicker(kind);
    }

    private void closePicker() {
        if (picker != null) {
            ((FrameLayout) a.w.getParent()).removeView(picker);
            picker = null;
        }
    }

    private void showPicker(String kind) {
        if (picker != null) return;
        final float d = a.getResources().getDisplayMetrics().density;
        final FrameLayout root = (FrameLayout) a.w.getParent();
        picker = new FrameLayout(a);
        picker.setBackgroundColor(0x22000000);

        TextView hint = pill(kind.equals("target") ? "Toca al poni que quieres copiar" : "Toca a tu poni", d);
        FrameLayout.LayoutParams hp = new FrameLayout.LayoutParams(-2, -2, Gravity.TOP | Gravity.CENTER_HORIZONTAL);
        hp.topMargin = (int) (110 * d);
        picker.addView(hint, hp);

        TextView cancel = pill("Cancelar", d);
        FrameLayout.LayoutParams cp = new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
        cp.bottomMargin = (int) (40 * d);
        cancel.setOnClickListener(v -> { closePicker(); js("pmCap(false)"); });
        picker.addView(cancel, cp);

        picker.setOnTouchListener((v, e) -> {
            if (e.getAction() == MotionEvent.ACTION_UP) {
                final float x = e.getX(), y = e.getY();
                a.w.post(this::closePicker);
                a.w.postDelayed(() -> grab(kind, x, y), 350);
            }
            return true;
        });
        root.addView(picker, new FrameLayout.LayoutParams(-1, -1));
    }

    private void grab(String kind, float x, float y) {
        try {
            int wd = a.w.getWidth(), ht = a.w.getHeight();
            if (wd <= 0 || ht <= 0) { err("No pude medir la pantalla."); return; }
            Bitmap bmp = Bitmap.createBitmap(wd, ht, Bitmap.Config.ARGB_8888);
            int[] loc = new int[2];
            a.w.getLocationInWindow(loc);
            Rect r = new Rect(loc[0], loc[1], loc[0] + wd, loc[1] + ht);
            PixelCopy.request(a.getWindow(), r, bmp, res -> {
                if (res != PixelCopy.SUCCESS) { err("No pude capturar la pantalla (código " + res + ")."); return; }
                int side = Math.round(Math.min(wd, ht) * 0.7f);
                int left = Math.max(0, Math.min(wd - side, Math.round(x - side / 2f)));
                int top = Math.max(0, Math.min(ht - side, Math.round(y - side / 2f)));
                Bitmap crop = Bitmap.createBitmap(bmp, left, top, side, side);
                String b64 = encode(crop);
                if (kind.equals("target")) target = b64; else mine = b64;
                js("pmCap(false);pmSkinPrev('data:image/jpeg;base64," + b64 + "')");
                run(kind);
            }, new Handler(Looper.getMainLooper()));
        } catch (Exception e) {
            err("Error al capturar: " + e.getMessage());
        }
    }

    static String encode(Bitmap src) {
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
