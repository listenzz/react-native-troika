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
			ViewGroup viewGroup = (ViewGroup) scrollableView;
			viewGroup.onInterceptTouchEvent(ev);
			viewGroup.onTouchEvent(ev);
			if (ev.getAction() == MotionEvent.ACTION_DOWN) {
				scrollableView.startNestedScroll(ViewCompat.SCROLL_AXIS_VERTICAL);
			}

			if (ev.getAction() == MotionEvent.ACTION_UP || ev.getAction() == MotionEvent.ACTION_CANCEL) {
				scrollableView.stopNestedScroll();
			}

			if (shouldInterceptTouchEvent(ev)) {
				NativeGestureUtil.notifyNativeGestureStarted(this, ev);
				ViewParent parent = getParent();
				if (parent != null) {
					parent.requestDisallowInterceptTouchEvent(true);
				}
				return true;
			}
		}
		return super.dispatchTouchEvent(ev);
	}

	private int mLastMotionY;

	private boolean shouldInterceptTouchEvent(MotionEvent ev) {
		final int action = ev.getAction();
		if ((action == MotionEvent.ACTION_MOVE) && (mIsBeingDragged)) {
			return true;
		}

		switch (action & MotionEvent.ACTION_MASK) {
			case MotionEvent.ACTION_MOVE: {
				final int y = (int) ev.getRawY();
				final int yDiff = Math.abs(y - mLastMotionY);
				if (yDiff >= mTouchSlop) {
					mIsBeingDragged = true;
				}
				break;
			}
			case MotionEvent.ACTION_DOWN: {
				mLastMotionY = (int) ev.getRawY();
				break;
			}
			case MotionEvent.ACTION_CANCEL:
			case MotionEvent.ACTION_UP:
				mIsBeingDragged = false;
		}

		return mIsBeingDragged;
	}

	public boolean onInterceptTouchEvent(MotionEvent ev) {
		if (mShouldRequestDisallowInterceptTouchEvent) {
			requestDisallowInterceptTouchEvent(true);
		}
		if (super.onInterceptTouchEvent(ev)) {
			NativeGestureUtil.notifyNativeGestureStarted(this, ev);
			return true;
		}
		return false;
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
