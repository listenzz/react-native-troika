package com.reactnative.pulltorefresh;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;

import com.facebook.react.uimanager.ReactOverflowView;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.scwang.smart.refresh.layout.SmartRefreshLayout;
import com.scwang.smart.refresh.layout.api.RefreshFooter;
import com.scwang.smart.refresh.layout.api.RefreshHeader;
import com.scwang.smart.refresh.layout.api.RefreshKernel;

import java.util.ArrayList;
import java.util.List;

public class PullToRefresh extends SmartRefreshLayout implements ReactOverflowView {

	private final static String TAG = "PullToRefresh";

	private final Rect mRect;
	private String mOverflow = "hidden";
	private boolean mShouldRequestDisallowInterceptTouchEvent = true;
	private final List<View> mReactChildren = new ArrayList<>();

	public PullToRefresh(Context context) {
		super(context);
		mRect = new Rect();
	}

	public void setOverflow(String overflow) {
		mOverflow = overflow;
		invalidate();
	}

	public void setShouldRequestDisallowInterceptTouchEvent(boolean disallow) {
		mShouldRequestDisallowInterceptTouchEvent = disallow;
	}

	void addReactChild(View child, int index) {
		int existingIndex = mReactChildren.indexOf(child);
		if (existingIndex >= 0) {
			mReactChildren.remove(existingIndex);
			if (existingIndex < index) {
				index -= 1;
			}
		}

		int safeIndex = Math.max(0, Math.min(index, mReactChildren.size()));
		mReactChildren.add(safeIndex, child);
	}

	@Nullable
	View getReactChildAt(int index) {
		if (index < 0 || index >= mReactChildren.size()) {
			return null;
		}
		return mReactChildren.get(index);
	}

	int getReactChildCount() {
		return mReactChildren.size();
	}

	@Nullable
	View removeReactChildAt(int index) {
		if (index < 0 || index >= mReactChildren.size()) {
			return null;
		}
		return mReactChildren.remove(index);
	}

	void removeReactChild(View child) {
		mReactChildren.remove(child);
	}

	@Nullable
	@Override
	public String getOverflow() {
		return mOverflow;
	}

	private final Runnable measureAndLayout = () -> {
		measure(
			View.MeasureSpec.makeMeasureSpec(getWidth(), View.MeasureSpec.EXACTLY),
			View.MeasureSpec.makeMeasureSpec(getHeight(), View.MeasureSpec.EXACTLY));
		layout(getLeft(), getTop(), getRight(), getBottom());
	};

	@Override
	public void requestLayout() {
		super.requestLayout();
		post(measureAndLayout);
	}

	@Override
	public boolean dispatchTouchEvent(MotionEvent ev) {
		if (mRefreshContent == null) {
			return super.dispatchTouchEvent(ev);
		}

		View scrollableView = mRefreshContent.getScrollableView();
		if (scrollableView == null) {
			return super.dispatchTouchEvent(ev);
		}

		// When nested scrolling is enabled, SmartRefreshLayout handles refresh via
		// NestedScrollingParent callbacks (onNestedPreScroll, onNestedScroll, etc.).
		// Skip custom touch handling to avoid interfering with child gesture handlers
		// (e.g., Pressable click events).
		if (ViewCompat.isNestedScrollingEnabled(scrollableView)) {
			return super.dispatchTouchEvent(ev);
		}

		String viewName = scrollableView.getClass().getCanonicalName();

		if (viewName != null && viewName.contains("ViewPager2")) {
			if (mIsBeingDragged) {
				NativeGestureUtil.notifyNativeGestureStarted(this, ev);
			}
			return super.dispatchTouchEvent(ev);
		}

		if (scrollableView.canScrollHorizontally(-1) || scrollableView.canScrollHorizontally(1)) {
			if (mIsBeingDragged) {
				NativeGestureUtil.notifyNativeGestureStarted(this, ev);
			}
			return super.dispatchTouchEvent(ev);
		}

		// 数据不足以填满整个页面
		if (!scrollableView.canScrollVertically(-1)
			&& !scrollableView.canScrollVertically(1)
			&& scrollableView instanceof ViewGroup) {
			if (shouldInterceptTouchEvent(ev)) {
				NativeGestureUtil.notifyNativeGestureStarted(this, ev);
				ViewParent parent = getParent();
				if (parent != null) {
					parent.requestDisallowInterceptTouchEvent(true);
				}
				return super.dispatchTouchEvent(ev);
			}
		}
		return super.dispatchTouchEvent(ev);
	}

	public boolean onInterceptTouchEvent(MotionEvent ev) {
		View scrollableView = mRefreshContent != null ? mRefreshContent.getScrollableView() : null;
		if (scrollableView != null && ViewCompat.isNestedScrollingEnabled(scrollableView)) {
			// When nested scrolling is enabled, SmartRefreshLayout handles refresh via the
			// NestedScrollingParent protocol. Don't call requestDisallowInterceptTouchEvent here,
			// because SmartRefreshLayout propagates FLAG_DISALLOW_INTERCEPT to all ancestors.
			// When it reaches RNGestureHandlerRootView, that view's override calls
			// tryCancelAllHandlers(), which cancels all RNGH gesture handlers and breaks
			// Pressable click events.
			return false;
		}

		if (mShouldRequestDisallowInterceptTouchEvent) {
			requestDisallowInterceptTouchEvent(true);
		}

		if (super.onInterceptTouchEvent(ev)) {
			NativeGestureUtil.notifyNativeGestureStarted(this, ev);
			return true;
		}
		return false;
	}

	private int mLastMotionX;
	private int mLastMotionY;

	private boolean shouldInterceptTouchEvent(MotionEvent ev) {
		final int action = ev.getActionMasked();
		if ((action == MotionEvent.ACTION_MOVE) && (mIsBeingDragged)) {
			return true;
		}

		switch (action) {
			case MotionEvent.ACTION_MOVE: {
				final int x = (int) ev.getRawX();
				final int y = (int) ev.getRawY();
				final int xDiff = Math.abs(x - mLastMotionX);
				final int yDiff = Math.abs(y - mLastMotionY);
				if (yDiff >= mTouchSlop && yDiff > xDiff) {
					mIsBeingDragged = true;
				}
				break;
			}
			case MotionEvent.ACTION_DOWN: {
				mLastMotionX = (int) ev.getRawX();
				mLastMotionY = (int) ev.getRawY();
				mIsBeingDragged = false;
				break;
			}
			case MotionEvent.ACTION_CANCEL:
			case MotionEvent.ACTION_UP:
				mIsBeingDragged = false;
		}

		return mIsBeingDragged;
	}

	@Override
	protected void onSizeChanged(int w, int h, int oldw, int oldh) {
		super.onSizeChanged(w, h, oldw, oldh);
		float height = (float) (getMeasuredHeight() * 0.3);

		RefreshHeader header = getRefreshHeader();
		if (header != null) {
			int headerHeight = header.getView().getMeasuredHeight();
			setHeaderMaxDragRate(height / headerHeight);
		}

		RefreshFooter footer = getRefreshFooter();
		if (footer != null) {
			int footerHeight = footer.getView().getMeasuredHeight();
			setFooterMaxDragRate(height / footerHeight);
		}
	}

	@Override
	protected void dispatchDraw(@NonNull Canvas canvas) {
		getDrawingRect(mRect);
		if (!"visible".equals(mOverflow)) {
			canvas.clipRect(mRect);
		}
		super.dispatchDraw(canvas);
	}

	public RefreshKernel getRefreshKernel() {
		return mKernel;
	}
}
