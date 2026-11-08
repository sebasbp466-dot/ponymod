package com.ponymod.app;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.method.PasswordTransformationMethod;
import android.view.Gravity;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

final class Ui {
    static float D = 1f;
    static final Typeface FAT = Typeface.create("sans-serif-black", Typeface.NORMAL);

    static void init(Context c) { D = c.getResources().getDisplayMetrics().density; }

    static int dp(int v) { return Math.round(v * D); }

    static GradientDrawable pill(int color, int radiusDp) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radiusDp));
        return g;
    }

    static TextView text(Context c, String s, float sp) {
        TextView t = new TextView(c);
        t.setText(s);
        t.setTextColor(Color.WHITE);
        t.setTextSize(sp);
        t.setTypeface(FAT);
        return t;
    }

    static TextView chip(Context c, String s, boolean on, View.OnClickListener l) {
        TextView t = text(c, s, 14);
        t.setGravity(Gravity.CENTER);
        t.setPadding(dp(14), dp(8), dp(14), dp(8));
        t.setBackground(pill(on ? 0x66FFFFFF : 0x26FFFFFF, 20));
        t.setOnClickListener(l);
        return t;
    }

    static EditText input(Context c, String hint, String val, boolean secret) {
        EditText e = new EditText(c);
        e.setHint(hint);
        e.setText(val);
        e.setTextColor(Color.WHITE);
        e.setHintTextColor(0x88FFFFFF);
        e.setTextSize(14);
        e.setSingleLine(true);
        e.setPadding(dp(14), dp(10), dp(14), dp(10));
        e.setBackground(pill(0x26FFFFFF, 14));
        if (secret) e.setTransformationMethod(PasswordTransformationMethod.getInstance());
        return e;
    }
}
