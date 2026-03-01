package com.reactnative.keyboardinsets;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.KeyboardInsetsViewManagerDelegate;
import com.facebook.react.viewmanagers.KeyboardInsetsViewManagerInterface;

import java.util.Map;

public class KeyboardInsetsViewManager extends ViewGroupManager<KeyboardInsetsView>
	implements KeyboardInsetsViewManagerInterface<KeyboardInsetsView> {

	public static final String REACT_CLASS = "KeyboardInsetsView";

	private final KeyboardInsetsViewManagerDelegate<KeyboardInsetsView, KeyboardInsetsViewManager> mDelegate = new KeyboardInsetsViewManagerDelegate<>(this);

	@Override
	protected ViewManagerDelegate<KeyboardInsetsView> getDelegate() {
		return mDelegate;
	}

	@NonNull
	@Override
	public String getName() {
		return REACT_CLASS;
	}

	@NonNull
	@Override
	public KeyboardInsetsView createViewInstance(@NonNull ThemedReactContext context) {
		KeyboardInsetsView view = new KeyboardInsetsView(context);
		KeyboardInsetsCallback callback = new KeyboardInsetsCallback(view, context);
		ViewCompat.setWindowInsetsAnimationCallback(view, callback);
		ViewCompat.setOnApplyWindowInsetsListener(view, callback);
		return view;
	}

	@Override
	public void setMode(KeyboardInsetsView view, @Nullable String mode) {
		view.setMode(mode);
	}

	@Override
	public void setExtraHeight(KeyboardInsetsView view, float extraHeight) {
		view.setExtraHeight(extraHeight);
	}

	@Override
	public void setExplicitly(KeyboardInsetsView view, boolean value) {

	}

	@Nullable
	@Override
	public Object updateState(
			@NonNull KeyboardInsetsView view,
			ReactStylesDiffMap props,
			StateWrapper stateWrapper) {
		view.setStateWrapper(stateWrapper);
		return super.updateState(view, props, stateWrapper);
	}

	@Nullable
	@Override
	public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
		return MapBuilder.of(
			"topStatusChanged", MapBuilder.of("registrationName", "onStatusChanged"),
			"topPositionChanged", MapBuilder.of("registrationName", "onPositionChanged")
		);
	}

}
