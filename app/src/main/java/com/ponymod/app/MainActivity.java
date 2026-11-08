package com.ponymod.app;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    WebView w;
    Player player;
    Store store;
    private Runnable pendingPerm;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Ui.init(this);
        store = new Store(this);
        player = new Player(this);
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
        w.setWebViewClient(new WebViewClient());
        w.setWebChromeClient(new WebChromeClient());
        w.loadUrl("https://pony.town");
    }

    private View makeFab() {
        TextView fab = Ui.text(this, "☰", 20);
        fab.setGravity(Gravity.CENTER);
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(0x55FFFFFF);
        g.setStroke(Ui.dp(1), 0x77FFFFFF);
        fab.setBackground(g);
        fab.setAlpha(0.75f);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(Ui.dp(44), Ui.dp(44), Gravity.TOP | Gravity.START);
        lp.leftMargin = Ui.dp(10);
        lp.topMargin = Ui.dp(90);
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
                        if (Math.abs(e.getRawX() - sx) > Ui.dp(6) || Math.abs(e.getRawY() - sy) > Ui.dp(6)) moved = true;
                        if (moved) {
                            v.setX(e.getRawX() + dx);
                            v.setY(e.getRawY() + dy);
                        }
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (!moved) new Panel(MainActivity.this).show();
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
        if (w.canGoBack()) w.goBack(); else super.onBackPressed();
    }
}
