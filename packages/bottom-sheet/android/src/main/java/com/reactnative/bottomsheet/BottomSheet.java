package com.reactnative.bottomsheet;


import static com.reactnative.bottomsheet.BottomSheetStatus.COLLAPSED;
import static com.reactnative.bottomsheet.BottomSheetStatus.DRAGGING;
import static com.reactnative.bottomsheet.BottomSheetStatus.EXPANDED;
import static com.reactnative.bottomsheet.BottomSheetStatus.HIDDEN;
import static com.reactnative.bottomsheet.BottomSheetStatus.SETTLING;
import static java.lang.Math.max;

import android.annotation.SuppressLint;
import android.graphics.Rect;
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;
import androidx.core.math.MathUtils;
import androidx.core.util.Pools;
import androidx.core.view.NestedScrollingParent;
import androidx.core.view.NestedScrollingParentHelper;
import androidx.core.view.ViewCompat;
import androidx.customview.widget.ViewDragHelper;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactPointerEventsView;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.views.view.ReactViewGroup;

import java.lang.ref.WeakReference;

@SuppressLint("ViewConstructor")
public class BottomSheet extends ReactViewGroup implements NestedScrollingParent, ReactPointerEventsView {

    private static final String TAG = "ReactBottomSheet";

    private final ReactContext reactContext;

    public BottomSheet(ThemedReactContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.nestedScrollingParentHelper = new NestedScrollingParentHelper(this);
    }

    private BottomSheetStatus status = COLLAPSED;

    private SettleRunnable settleRunnable = null;

    private boolean draggable;

    private int peekHeight;

    private int expandedOffset;

    private int collapsedOffset;

    private View contentView;

    @Nullable
    private WeakReference<View> nestedScrollingChildRef;

    private boolean touchingScrollingChild;

    @Nullable
    private ViewDragHelper viewDragHelper;

    private final NestedScrollingParentHelper nestedScrollingParentHelper;

    private boolean ignoreEvents;

    private int lastNestedScrollDy;

    private VelocityTracker velocityTracker;

    private int activePointerId;

    private int initialY;

    private int contentHeight = -1;

    /** 子 View 的布局 top，用于计算 getContentOriginOffset 的差值 (实际 top - layoutContentTop) */
    private int layoutContentTop = -1;

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        if (viewDragHelper == null) {
            viewDragHelper = ViewDragHelper.create(this, dragCallback);
        }

        viewDragHelper.abort();
        if (settleRunnable != null && settleRunnable.isPosted) {
            settleRunnable.run();
        }

        layoutChild();
    }

    private void layoutChild() {
        int count = getChildCount();
        if (count == 1) {
            View child = getChildAt(0);
            if (contentView == null) {
                contentView = child;
            }

            contentHeight = contentView.getHeight();
            calculateOffset();

            getViewTreeObserver().removeOnPreDrawListener(preDrawListener);
            int top = contentView.getTop();
            if (layoutContentTop < 0) {
                layoutContentTop = top;
            }
            if (status == COLLAPSED) {
                child.offsetTopAndBottom(collapsedOffset - top);
            } else if (status == EXPANDED) {
                child.offsetTopAndBottom(expandedOffset - top);
            } else if (status == HIDDEN) {
                child.offsetTopAndBottom(getHeight() - top);
            }
            getViewTreeObserver().addOnPreDrawListener(preDrawListener);

            dispatchOnSlide(child.getTop());
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        getViewTreeObserver().removeOnPreDrawListener(preDrawListener);
    }

    ViewTreeObserver.OnPreDrawListener preDrawListener = new ViewTreeObserver.OnPreDrawListener() {
        @Override
        public boolean onPreDraw() {
            if (contentHeight != -1 && contentHeight != contentView.getHeight()) {
                layoutChild();
            }
            return true;
        }
    };

    private void calculateOffset() {
        expandedOffset = Math.max(0, getHeight() - contentView.getHeight());
        collapsedOffset = Math.max(getHeight() - peekHeight, expandedOffset);
    }

    public void setPeekHeight(int peekHeight) {
        this.peekHeight = max(peekHeight, 0);
        if (contentView != null) {
            calculateOffset();
            if (status == COLLAPSED) {
                settleToStatus(contentView, status);
            }
        }
    }

    public void setDraggable(boolean draggable) {
        this.draggable = draggable;
    }

    public void setStatus(BottomSheetStatus status) {
        if (this.status == status || this.status == SETTLING) {
            return;
        }

        if (contentView == null) {
            // The view is not laid out yet; modify mState and let onLayoutChild handle it later
            if (status == COLLAPSED || status == EXPANDED || status == HIDDEN) {
                this.status = status;
            }
            return;
        }
        settleToStatus(contentView, status);
    }

    @Nullable
    @VisibleForTesting
    View findScrollingChild(View view) {
        if (ViewCompat.isNestedScrollingEnabled(view)) {
            if (!view.canScrollHorizontally(1) && !view.canScrollHorizontally(-1) &&
                (view.canScrollVertically(-1) || view.canScrollVertically(1))) {
                return view;
            }
        }

        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0, count = group.getChildCount(); i < count; i++) {
                View child = group.getChildAt(i);
                if (child.getVisibility() == VISIBLE) {
                    View scrollingChild = findScrollingChild(child);
                    if (scrollingChild != null) {
                        return scrollingChild;
                    }
                }
            }
        }

        return null;
    }

	@NonNull
    public PointerEvents getPointerEvents() {
        return PointerEvents.BOX_NONE;
    }

    @Override
    public boolean onInterceptTouchEvent(@NonNull MotionEvent event) {
        if (shouldInterceptTouchEvent(event)) {
            NativeGestureUtil.notifyNativeGestureStarted(this, event);
            return true;
        }
        return false;
    }

    private boolean shouldInterceptTouchEvent(MotionEvent event) {
        if (!draggable) {
            return false;
        }

        int action = event.getActionMasked();
        // Record the velocity
        if (action == MotionEvent.ACTION_DOWN) {
            reset();
        }
        if (velocityTracker == null) {
            velocityTracker = VelocityTracker.obtain();
        }
        velocityTracker.addMovement(event);
        switch (action) {
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                touchingScrollingChild = false;
                activePointerId = MotionEvent.INVALID_POINTER_ID;
                // Reset the ignore flag
                if (ignoreEvents) {
                    ignoreEvents = false;
                    return false;
                }
                break;
            case MotionEvent.ACTION_DOWN:
                nestedScrollingChildRef = new WeakReference<>(findScrollingChild(contentView));
                int initialX = (int) event.getX();
                initialY = (int) event.getY();
                // Only intercept nested scrolling events here if the view not being moved by the
                // ViewDragHelper.
                if (status != SETTLING) {
                    View scroll = nestedScrollingChildRef != null ? nestedScrollingChildRef.get() : null;
                    if (scroll != null && isPointInChildBounds(scroll, initialX, initialY)) {
                        activePointerId = event.getPointerId(event.getActionIndex());
                        touchingScrollingChild = true;
                    }
                }

                ignoreEvents = activePointerId == MotionEvent.INVALID_POINTER_ID
                    && !isPointInChildBounds(contentView, initialX, initialY);
                break;
            default: // fall out
        }

        if (!ignoreEvents && viewDragHelper != null && viewDragHelper.shouldInterceptTouchEvent(event)) {
            return true;
        }

        // We have to handle cases that the ViewDragHelper does not capture the bottom sheet because
        // it is not the top most view of its parent. This is not necessary when the touch event is
        // happening over the scrolling content as nested scrolling logic handles that case.
        View scroll = nestedScrollingChildRef != null ? nestedScrollingChildRef.get() : null;
        return action == MotionEvent.ACTION_MOVE
            && scroll != null
            && !ignoreEvents
            && status != DRAGGING
            && !isPointInChildBounds(scroll, (int) event.getX(), (int) event.getY())
            && viewDragHelper != null
            && Math.abs(initialY - event.getY()) > viewDragHelper.getTouchSlop();
    }

    @SuppressLint("ClickableViewAccessibility")
	@Override
    public boolean onTouchEvent(@NonNull MotionEvent event) {
        if (!draggable) {
            return false;
        }

        int action = event.getActionMasked();
        if (status == DRAGGING && action == MotionEvent.ACTION_DOWN) {
            return true;
        }
        if (viewDragHelper != null) {
            viewDragHelper.processTouchEvent(event);
        }
        // Record the velocity
        if (action == MotionEvent.ACTION_DOWN) {
            reset();
        }
        if (velocityTracker == null) {
            velocityTracker = VelocityTracker.obtain();
        }
        velocityTracker.addMovement(event);
        if (viewDragHelper != null && action == MotionEvent.ACTION_MOVE && !ignoreEvents) {
            if (Math.abs(initialY - event.getY()) > viewDragHelper.getTouchSlop()) {
                viewDragHelper.captureChildView(contentView, event.getPointerId(event.getActionIndex()));
            }
        }

        return !ignoreEvents;
    }

    @Override
    public boolean onStartNestedScroll(@NonNull View child, @NonNull View target, int nestedScrollAxes) {
        return (nestedScrollAxes & ViewCompat.SCROLL_AXIS_VERTICAL) != 0;
    }

    @Override
    public void onNestedScrollAccepted(@NonNull View child, @NonNull View target, int axes) {
        lastNestedScrollDy = 0;
        nestedScrollingParentHelper.onNestedScrollAccepted(child, target, axes);
    }

    @Override
    public void onNestedPreScroll(@NonNull View target, int dx, int dy, @NonNull int[] consumed) {
        View scrollingChild = nestedScrollingChildRef != null ? nestedScrollingChildRef.get() : null;
        if (target != scrollingChild) {
            return;
        }

        View child = contentView;
        int currentTop = child.getTop();
        int newTop = currentTop - dy;
        if (dy > 0) { // Upward
            if (newTop < expandedOffset) {
                consumed[1] = currentTop - expandedOffset;
                ViewCompat.offsetTopAndBottom(child, -consumed[1]);
                setStatusInternal(EXPANDED);
            } else {
                consumed[1] = dy;
                ViewCompat.offsetTopAndBottom(child, -dy);
                setStatusInternal(DRAGGING);
            }
        } else if (dy < 0) { // Downward
            if (!target.canScrollVertically(-1)) {
                if (newTop <= collapsedOffset) {
                    consumed[1] = dy;
                    ViewCompat.offsetTopAndBottom(child, -dy);
                    setStatusInternal(DRAGGING);
                } else {
                    consumed[1] = currentTop - collapsedOffset;
                    ViewCompat.offsetTopAndBottom(child, -consumed[1]);
                    setStatusInternal(COLLAPSED);
                }
            }
        }
        if (currentTop != child.getTop()) {
            dispatchOnSlide(child.getTop());
        }
        lastNestedScrollDy = dy;
    }

    @Override
    public int getNestedScrollAxes() {
        return nestedScrollingParentHelper.getNestedScrollAxes();
    }

    @Override
    public void onStopNestedScroll(@NonNull View target) {
        nestedScrollingParentHelper.onStopNestedScroll(target);
        View child = contentView;

        if (child.getTop() == expandedOffset) {
            setStatusInternal(EXPANDED);
            return;
        }

        if (nestedScrollingChildRef == null || target != nestedScrollingChildRef.get()) {
            return;
        }

        int top;
        BottomSheetStatus targetState;

        if (lastNestedScrollDy > 0) {
            top = expandedOffset;
            targetState = EXPANDED;
        } else if (lastNestedScrollDy == 0) {
            int currentTop = child.getTop();
            if (Math.abs(currentTop - collapsedOffset) < Math.abs(currentTop - expandedOffset)) {
                top = collapsedOffset;
                targetState = COLLAPSED;
            } else {
                top = expandedOffset;
                targetState = EXPANDED;
            }
        } else {
            top = collapsedOffset;
            targetState = COLLAPSED;
        }

        startSettlingAnimation(child, targetState, top, false);
    }

    @Override
    public void onNestedScroll(@NonNull View target, int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed) {
        // Overridden to prevent the default consumption of the entire scroll distance.
    }

    @Override
    public boolean onNestedPreFling(@NonNull View target, float velocityX, float velocityY) {
        if (nestedScrollingChildRef != null) {
            return target == nestedScrollingChildRef.get() && (status != EXPANDED);
        } else {
            return false;
        }
    }

    @Override
    public boolean onNestedFling(@NonNull View target, float velocityX, float velocityY, boolean consumed) {
        return false;
    }

    private void reset() {
        activePointerId = ViewDragHelper.INVALID_POINTER;
        if (velocityTracker != null) {
            velocityTracker.recycle();
            velocityTracker = null;
        }
    }

    private static final Pools.Pool<Rect> sRectPool = new Pools.SynchronizedPool<>(12);

    private static Rect acquireTempRect() {
        Rect rect = sRectPool.acquire();
        if (rect == null) {
            rect = new Rect();
        }
        return rect;
    }

    private static void releaseTempRect(@NonNull Rect rect) {
        rect.setEmpty();
        sRectPool.release(rect);
    }

    public boolean isPointInChildBounds(@NonNull View child, int x, int y) {
        final Rect r = acquireTempRect();
        child.getDrawingRect(r);
        offsetDescendantRectToMyCoords(child, r);
        try {
            return r.contains(x, y);
        } finally {
            releaseTempRect(r);
        }
    }

    private final ViewDragHelper.Callback dragCallback = new ViewDragHelper.Callback() {
        @Override
        public boolean tryCaptureView(@NonNull View child, int pointerId) {
            if (status == DRAGGING) {
                return false;
            }
            if (touchingScrollingChild) {
                return false;
            }
            if (status == EXPANDED && activePointerId == pointerId) {
                View scroll = nestedScrollingChildRef != null ? nestedScrollingChildRef.get() : null;
                if (scroll != null && scroll.canScrollVertically(-1)) {
                    // Let the content scroll up
                    return false;
                }
            }
            return contentView == child;
        }

        @Override
        public void onViewPositionChanged(@NonNull View changedView, int left, int top, int dx, int dy) {
            dispatchOnSlide(top);
        }

        @Override
        public void onViewDragStateChanged(int state) {
            if (state == ViewDragHelper.STATE_DRAGGING) {
                setStatusInternal(DRAGGING);
            }
        }

        @Override
        public void onViewReleased(@NonNull View releasedChild, float xvel, float yvel) {
            int top;
            BottomSheetStatus targetState;
            if (yvel < 0) { // Moving up
                top = expandedOffset;
                targetState = EXPANDED;
            } else if (yvel == 0.f || Math.abs(xvel) > Math.abs(yvel)) {
                // If the Y velocity is 0 or the swipe was mostly horizontal indicated by the X velocity
                // being greater than the Y velocity, settle to the nearest correct height.
                int currentTop = releasedChild.getTop();
                if (Math.abs(currentTop - collapsedOffset) < Math.abs(currentTop - expandedOffset)) {
                    top = collapsedOffset;
                    targetState = COLLAPSED;
                } else {
                    top = expandedOffset;
                    targetState = EXPANDED;
                }
            } else { // Moving Down
                top = collapsedOffset;
                targetState = COLLAPSED;
            }

            startSettlingAnimation(releasedChild, targetState, top, true);
        }

        @Override
        public int clampViewPositionVertical(@NonNull View child, int top, int dy) {
            return MathUtils.clamp(top, expandedOffset, collapsedOffset);
        }

        @Override
        public int clampViewPositionHorizontal(@NonNull View child, int left, int dx) {
            return child.getLeft();
        }

        @Override
        public int getViewVerticalDragRange(@NonNull View child) {
            return collapsedOffset;
        }
    };

    void dispatchOnSlide(int top) {
        if (contentView != null) {
            if (contentView instanceof BottomSheetContentView && layoutContentTop >= 0) {
                int offsetY = top - layoutContentTop;
                ((BottomSheetContentView) contentView).updateContentOffset(offsetY);
            }
            sentEvent(new OnSlideEvent(UIManagerHelper.getSurfaceId(reactContext), getId(), top, expandedOffset, collapsedOffset));
        }
    }

    void settleToStatus(@NonNull View child, BottomSheetStatus status) {
        int top;
        if (status == COLLAPSED) {
            top = collapsedOffset;
        } else if (status == EXPANDED) {
            top = expandedOffset;
        } else if (status == HIDDEN) {
            top = getHeight();
        } else {
            throw new IllegalArgumentException("Illegal status argument: " + status);
        }
        startSettlingAnimation(child, status, top, false);
    }

    void startSettlingAnimation(View child, BottomSheetStatus status, int top, boolean settleFromViewDragHelper) {
        boolean startedSettling =
            viewDragHelper != null
                && (settleFromViewDragHelper
                ? viewDragHelper.settleCapturedViewAt(child.getLeft(), top)
                : viewDragHelper.smoothSlideViewTo(child, child.getLeft(), top));
        if (startedSettling) {
            setStatusInternal(SETTLING);
            // STATE_SETTLING won't animate the material shape, so do that here with the target status.
            // updateDrawableForTargetState(status);
            if (settleRunnable == null) {
                // If the singleton SettleRunnable instance has not been instantiated, create it.
                settleRunnable = new SettleRunnable(child, status);
            }
            // If the SettleRunnable has not been posted, post it with the correct status.
            if (!settleRunnable.isPosted) {
                settleRunnable.targetStatus = status;
                ViewCompat.postOnAnimation(child, settleRunnable);
                settleRunnable.isPosted = true;
            } else {
                // Otherwise, if it has been posted, just update the target status.
                settleRunnable.targetStatus = status;
            }
        } else {
            setStatusInternal(status);
        }
    }

    void setStatusInternal(BottomSheetStatus status) {
        if (this.status == status) {
            return;
        }
        this.status = status;

        if (status == COLLAPSED || status == EXPANDED || status == HIDDEN) {
            sentEvent(new OnStateChangedEvent(UIManagerHelper.getSurfaceId(reactContext), getId(), status.name().toLowerCase()));
        }
    }

    private class SettleRunnable implements Runnable {

        private final View view;

        private boolean isPosted;

        BottomSheetStatus targetStatus;

        SettleRunnable(View view, BottomSheetStatus targetStatus) {
            this.view = view;
            this.targetStatus = targetStatus;
        }

        @Override
        public void run() {
            if (viewDragHelper != null && viewDragHelper.continueSettling(true)) {
                ViewCompat.postOnAnimation(view, this);
            } else {
                setStatusInternal(targetStatus);
            }
            this.isPosted = false;
        }
    }

    void sentEvent(Event<?> event) {
        int viewId = getId();
        EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId);
        if (eventDispatcher != null) {
            eventDispatcher.dispatchEvent(event);
        }
    }

}
