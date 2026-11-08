package com.ponymod.app;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;

final class Panel extends Dialog {
    private final MainActivity a;
    private final Player pl;
    private final Store st;
    private FrameLayout content;
    private TextView tabMusic, tabSet, now, playBtn, status;
    private ListView list;
    private EditText search;

    Panel(MainActivity act) {
        super(act, android.R.style.Theme_DeviceDefault_Dialog_NoActionBar);
        a = act;
        pl = act.player;
        st = act.store;
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Window w = getWindow();
        boolean blur = false;
        if (Build.VERSION.SDK_INT >= 31) {
            WindowManager wm = (WindowManager) a.getSystemService(Context.WINDOW_SERVICE);
            blur = wm.isCrossWindowBlurEnabled();
        }
        w.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
        w.setBackgroundDrawable(new ColorDrawable(blur ? 0x33000000 : 0xB0000000));
        w.setLayout(-1, -1);
        w.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        if (blur) w.setBackgroundBlurRadius(Ui.dp(30));
        setContentView(build());
        pl.onChange = this::refresh;
    }

    @Override
    protected void onStop() {
        super.onStop();
        pl.onChange = null;
    }

    private View build() {
        FrameLayout root = new FrameLayout(a);
        root.setOnClickListener(v -> dismiss());

        LinearLayout card = new LinearLayout(a);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(Ui.dp(18), Ui.dp(16), Ui.dp(18), Ui.dp(16));
        GradientDrawable g = Ui.pill(0x4D12121C, 28);
        g.setStroke(Ui.dp(1), 0x44FFFFFF);
        card.setBackground(g);
        card.setClickable(true);

        DisplayMetrics m = a.getResources().getDisplayMetrics();
        int cw = Math.min((int) (m.widthPixels * 0.92f), Ui.dp(440));
        int ch = (int) (m.heightPixels * 0.78f);
        root.addView(card, new FrameLayout.LayoutParams(cw, ch, Gravity.CENTER));

        LinearLayout tabs = new LinearLayout(a);
        tabs.setOrientation(LinearLayout.HORIZONTAL);
        tabMusic = Ui.chip(a, "Música", true, v -> showMusic());
        tabSet = Ui.chip(a, "Ajustes", false, v -> showSettings());
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, -2, 1f);
        tp.rightMargin = Ui.dp(8);
        tabs.addView(tabMusic, tp);
        tabs.addView(tabSet, new LinearLayout.LayoutParams(0, -2, 1f));
        card.addView(tabs);

        content = new FrameLayout(a);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-1, 0, 1f);
        cp.topMargin = Ui.dp(14);
        card.addView(content, cp);

        showMusic();
        return root;
    }

    private void setTab(boolean music) {
        tabMusic.setBackground(Ui.pill(music ? 0x66FFFFFF : 0x26FFFFFF, 20));
        tabSet.setBackground(Ui.pill(music ? 0x26FFFFFF : 0x66FFFFFF, 20));
    }

    private void refresh() {
        if (now != null) now.setText(pl.cur.isEmpty() ? "Nada sonando" : pl.cur);
        if (playBtn != null) playBtn.setText(pl.playing() ? "❚❚" : "▶");
    }

    private void showMusic() {
        setTab(true);
        content.removeAllViews();
        LinearLayout col = new LinearLayout(a);
        col.setOrientation(LinearLayout.VERTICAL);

        now = Ui.text(a, "", 16);
        now.setSingleLine(true);
        now.setEllipsize(TextUtils.TruncateAt.END);
        col.addView(now);

        LinearLayout ctl = new LinearLayout(a);
        ctl.setGravity(Gravity.CENTER);
        ctl.setPadding(0, Ui.dp(10), 0, Ui.dp(10));
        ctl.addView(Ui.chip(a, "«", false, x -> pl.prev()));
        playBtn = Ui.chip(a, "▶", true, x -> pl.toggle());
        LinearLayout.LayoutParams pp = new LinearLayout.LayoutParams(-2, -2);
        pp.setMargins(Ui.dp(10), 0, Ui.dp(10), 0);
        ctl.addView(playBtn, pp);
        ctl.addView(Ui.chip(a, "»", false, x -> pl.next()));
        col.addView(ctl);

        status = Ui.text(a, "", 12);
        status.setAlpha(0.7f);

        TextView loc = Ui.chip(a, "Mi dispositivo", false, x -> a.withAudioPerm(() -> {
            pl.loadLocal();
            fillList();
            status.setText(pl.tracks.isEmpty() ? "No encontré música en el dispositivo" : "");
        }));
        col.addView(loc);

        search = Ui.input(a, "Género o nombre (ej: lofi)", "lofi", false);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-1, -2);
        sp.topMargin = Ui.dp(10);
        col.addView(search, sp);

        TextView go = Ui.chip(a, "Radio online (gratis)", false, x -> {
            status.setText("Buscando...");
            pl.loadRadio(search.getText().toString().trim(), err -> {
                fillList();
                status.setText(err == null ? "" : err);
            });
        });
        LinearLayout.LayoutParams gp = new LinearLayout.LayoutParams(-1, -2);
        gp.topMargin = Ui.dp(8);
        col.addView(go, gp);
        col.addView(status);

        list = new ListView(a);
        list.setDivider(null);
        list.setOnItemClickListener((p, view, pos, id) -> pl.play(pos));
        col.addView(list, new LinearLayout.LayoutParams(-1, 0, 1f));
        fillList();

        content.addView(col, new FrameLayout.LayoutParams(-1, -1));
        refresh();
    }

    private void fillList() {
        ArrayList<String> t = new ArrayList<>();
        for (Player.Track k : pl.tracks) t.add(k.title);
        list.setAdapter(new ArrayAdapter<String>(a, android.R.layout.simple_list_item_1, t) {
            @Override
            public View getView(int p, View cv, ViewGroup parent) {
                TextView tv = (TextView) super.getView(p, cv, parent);
                tv.setTextColor(Color.WHITE);
                tv.setTypeface(Ui.FAT);
                tv.setTextSize(14);
                tv.setSingleLine(true);
                tv.setEllipsize(TextUtils.TruncateAt.END);
                return tv;
            }
        });
    }

    private void showSettings() {
        setTab(false);
        content.removeAllViews();
        ScrollView sv = new ScrollView(a);
        LinearLayout col = new LinearLayout(a);
        col.setOrientation(LinearLayout.VERTICAL);

        col.addView(Ui.text(a, "Clave de Gemini", 14));
        EditText key = Ui.input(a, "Pega tu clave aquí", "", true);
        col.addView(key);
        String k = st.key();
        TextView ks = Ui.text(a, k.isEmpty() ? "Sin clave guardada"
                : "Guardada (termina en " + k.substring(Math.max(0, k.length() - 4)) + ")", 12);
        ks.setAlpha(0.7f);
        col.addView(ks);

        TextView ml = Ui.text(a, "Modelo", 14);
        ml.setPadding(0, Ui.dp(14), 0, 0);
        col.addView(ml);
        EditText model = Ui.input(a, Store.DEF_MODEL, st.model(), false);
        col.addView(model);

        TextView note = Ui.text(a, "La clave y el modelo se guardan solo en este teléfono. "
                + "Se usarán para copiar skins y para el modo IA.", 12);
        note.setAlpha(0.7f);
        note.setPadding(0, Ui.dp(10), 0, Ui.dp(10));
        col.addView(note);

        col.addView(Ui.chip(a, "Guardar", true, x -> {
            String nk = key.getText().toString().trim();
            if (!nk.isEmpty()) st.setKey(nk);
            String nm = model.getText().toString().trim();
            st.setModel(nm.isEmpty() ? Store.DEF_MODEL : nm);
            Toast.makeText(a, "Guardado", Toast.LENGTH_SHORT).show();
            showSettings();
        }));

        sv.addView(col);
        content.addView(sv, new FrameLayout.LayoutParams(-1, -1));
    }
}
