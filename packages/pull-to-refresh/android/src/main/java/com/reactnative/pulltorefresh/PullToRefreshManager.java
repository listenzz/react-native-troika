package com.reactnative.pulltorefresh;

import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.common.logging.FLog;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.PullToRefreshManagerDelegate;
import com.facebook.react.viewmanagers.PullToRefreshManagerInterface;
import com.scwang.smart.refresh.layout.api.RefreshFooter;
import com.scwang.smart.refresh.layout.api.RefreshHeader;

public class PullToRefreshManager extends ViewGroupManager<PullToRefresh> implements PullToRefreshManagerInterface<PullToRefresh> {
	public final static String REACT_CLASS = "PullToRefresh";

	private final PullToRefreshManagerDelegate<PullToRefresh, PullToRefreshManager> mDelegate = new PullToRefreshManagerDelegate<>(this);

	@Override
	protected ViewManagerDelegate<PullToRefresh> getDelegate() {
		return mDelegate;
	}

	@NonNull
	@Override
	public String getName() {
		return REACT_CLASS;
	}

	@NonNull
	@Override
	protected PullToRefresh createViewInstance(@NonNull ThemedReactContext reactContext) {
		PullToRefresh pullToRefresh = new PullToRefresh(reactContext);
		pullToRefresh.setEnableOverScrollBounce(false);
		pullToRefresh.setEnableOverScrollDrag(true);
		pullToRefresh.setEnableRefresh(false);
		pullToRefresh.setEnableLoadMore(false);
		return pullToRefresh;
	}

	@Override
	public void addView(@NonNull PullToRefresh parent, @NonNull View child, int index) {
		FLog.i("PullToRefresh", "addView index:%s, tag:%s, child:%s", index, child.getId(), child);
		parent.addReactChild(child, index);
		if (child instanceof PullToRefreshHeader) {
			parent.setEnableRefresh(true);
			parent.setRefreshHeader((RefreshHeader) child);
			if (parent.isLaidOut()) {
				((PullToRefreshHeader) child).onInitialized(parent.getRefreshKernel(), 0, 0);
			}
		} else if (child instanceof PullToRefreshFooter) {
			parent.setEnableLoadMore(true);
			parent.setRefreshFooter((RefreshFooter) child);
			if (parent.isLaidOut()) {
				((PullToRefreshFooter) child).onInitialized(parent.getRefreshKernel(), 0, 0);
			}
		} else {
			parent.setRefreshContent(child);
		}
	}

	@Override
	public void removeViewAt(PullToRefresh parent, int index) {
		View child = parent.removeReactChildAt(index);
		if (child == null) {
			child = parent.getChildAt(index);
			if (child != null) {
				parent.removeReactChild(child);
			}
		}
		if (child == null) {
			FLog.w("PullToRefresh", "removeViewAt index:%s ignored because child is null", index);
			return;
		}
		FLog.i("PullToRefresh", "removeViewAt index:%s, tag:%s child:%s", index, child.getId(), child);
		if (child instanceof PullToRefreshHeader) {
			parent.setEnableRefresh(false);
			parent.setOnRefreshListener(null);
			parent.removeView(child);
		} else if (child instanceof PullToRefreshFooter) {
			parent.setEnableLoadMore(false);
			parent.setOnLoadMoreListener(null);
			parent.removeView(child);
		} else {
			parent.removeView(child);
		}
	}

	@Override
	public int getChildCount(@NonNull PullToRefresh parent) {
		return parent.getReactChildCount();
	}

	@Nullable
	@Override
	public View getChildAt(@NonNull PullToRefresh parent, int index) {
		return parent.getReactChildAt(index);
	}

	@ReactProp(name = "overflow")
	public void setOverflow(PullToRefresh view, @Nullable String overflow) {
		view.setOverflow(overflow);
	}

	@Override
	public boolean needsCustomLayoutForChildren() {
		return true;
	}

	@Override
	public void setRequestDisallowInterceptTouchEvent(PullToRefresh view, boolean value) {
		view.setShouldRequestDisallowInterceptTouchEvent(value);
	}
}
