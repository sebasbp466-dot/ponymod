package com.ponymod.app;

import android.content.Context;
import android.content.SharedPreferences;

final class Store {
    static final String DEF_MODEL = "gemini-3.5-flash-lite";
    private final SharedPreferences p;

    Store(Context c) { p = c.getSharedPreferences("ponymod", Context.MODE_PRIVATE); }

    String key() { return p.getString("key", ""); }
    void setKey(String k) { p.edit().putString("key", k).apply(); }
    String model() { return p.getString("model", DEF_MODEL); }
    void setModel(String m) { p.edit().putString("model", m).apply(); }
    String mem() { return p.getString("mem", ""); }
    void setMem(String m) { p.edit().putString("mem", m).apply(); }
}
