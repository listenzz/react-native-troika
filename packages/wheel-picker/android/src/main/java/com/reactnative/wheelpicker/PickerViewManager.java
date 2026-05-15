package com.reactnative.wheelpicker;

import android.os.Handler;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.WheelPickerManagerDelegate;
import com.facebook.react.viewmanagers.WheelPickerManagerInterface;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class PickerViewManager extends SimpleViewManager<PickerView> implements WheelPickerManagerInterface<PickerView> {

	public static final String REACT_CLASS = "WheelPicker";

	private final WheelPickerManagerDelegate<PickerView, PickerViewManager> mDelegate = new WheelPickerManagerDelegate<>(this);

	@Override
	protected ViewManagerDelegate<PickerView> getDelegate() {
		return mDelegate;
	}

	@NonNull
	@Override
	public String getName() {
		return REACT_CLASS;
	}

	@NonNull
	@Override
	protected PickerView createViewInstance(@NonNull ThemedReactContext reactContext) {
		return new PickerView(reactContext);
	}

	@Override
	public void onDropViewInstance(@NonNull PickerView view) {
		super.onDropViewInstance(view);
		Handler handler = view.wheelView.getHandler();
		if (handler != null) {
			handler.removeCallbacksAndMessages(null);
		}
	}

	@Override
	public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
		return MapBuilder.<String, Object>builder()
			.put(OnItemSelectedEvent.Name, MapBuilder.of("registrationName", OnItemSelectedEvent.JSEventName))
			.build();
	}

	@Override
	public void setSelectedIndex(PickerView view, int index) {
		view.setSelectedItem(index);
	}

	@Override
	public void setItems(PickerView view, @androidx.annotation.Nullable ReadableArray items) {
		if (items == null) {
			view.setItems(Collections.<String>emptyList());
		} else {
			List<String> list = new ArrayList<>();
			for (int i = 0; i < items.size(); i++) {
				list.add(items.getString(i));
			}
			view.setItems(list);
		}
	}

	@Override
	public void setFontSize(PickerView view, int size) {
		view.setTextSize(size);
	}

	@Override
	public void setItemHeight(PickerView view, float height) {
		view.setItemHeight(PixelUtil.toPixelFromDIP(height));
	}

	@Override
	public void setTextColorCenter(PickerView view, @Nullable Integer color) {
		if (color != null) {
			view.setTextColorCenter(color);
		}
	}

	@Override
	public void setTextColorOut(PickerView view, @Nullable Integer color) {
		if (color != null) {
			view.setTextColorOut(color);
		}
	}

	@Override
	public void setCyclic(PickerView view, boolean cyclic) {
		view.setCyclic(cyclic);
	}

}
