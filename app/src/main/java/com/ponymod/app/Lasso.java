package com.ponymod.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.MotionEvent;
import android.view.View;

final class Lasso extends View {
    interface Done { void onRect(RectF r); }

    private final Path path = new Path();
    private final Paint line = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint box = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF bounds = new RectF();
    private boolean drawing, finished;
    private final Done cb;
    private final float d;

    Lasso(Context c, Done cb) {
        super(c);
        this.cb = cb;
        d = c.getResources().getDisplayMetrics().density;
        line.setStyle(Paint.Style.STROKE);
        line.setStrokeWidth(3 * d);
        line.setColor(Color.WHITE);
        line.setStrokeCap(Paint.Cap.ROUND);
        line.setStrokeJoin(Paint.Join.ROUND);
        glow.setStyle(Paint.Style.STROKE);
        glow.setStrokeWidth(9 * d);
        glow.setColor(0x55FFFFFF);
        glow.setStrokeCap(Paint.Cap.ROUND);
        glow.setStrokeJoin(Paint.Join.ROUND);
        box.setStyle(Paint.Style.STROKE);
        box.setStrokeWidth(3 * d);
        box.setColor(0xFF7CF2FF);
        fill.setStyle(Paint.Style.FILL);
        fill.setColor(0x2A7CF2FF);
    }

    @Override
    protected void onDraw(Canvas c) {
        if (finished) {
            c.drawRoundRect(bounds, 14 * d, 14 * d, fill);
            c.drawRoundRect(bounds, 14 * d, 14 * d, box);
        } else if (!path.isEmpty()) {
            c.drawPath(path, glow);
            c.drawPath(path, line);
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        if (finished) return true;
        switch (e.getAction()) {
            case MotionEvent.ACTION_DOWN:
                path.reset();
                path.moveTo(e.getX(), e.getY());
                drawing = true;
                invalidate();
                return true;
            case MotionEvent.ACTION_MOVE:
                if (drawing) { path.lineTo(e.getX(), e.getY()); invalidate(); }
                return true;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                if (!drawing) return true;
                drawing = false;
                path.close();
                path.computeBounds(bounds, true);
                if (bounds.width() < 30 * d && bounds.height() < 30 * d) {
                    float half = 110 * d;
                    bounds.set(e.getX() - half, e.getY() - half, e.getX() + half, e.getY() + half);
                }
                bounds.intersect(0, 0, getWidth(), getHeight());
                finished = true;
                invalidate();
                postDelayed(() -> cb.onRect(new RectF(bounds)), 450);
                return true;
        }
        return true;
    }
}
