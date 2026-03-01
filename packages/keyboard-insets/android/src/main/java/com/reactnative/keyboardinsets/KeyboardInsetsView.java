package com.reactnative.keyboardinsets;

import android.content.Context;
import android.view.View;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.views.view.ReactViewGroup;

public class KeyboardInsetsView extends ReactViewGroup {

    private String mode = "auto";

    private float extraHeight = 0.0f;

    private StateWrapper mStateWrapper;

    public KeyboardInsetsView(Context context) {
        super(context);
    }

    public void setStateWrapper(StateWrapper wrapper) {
        mStateWrapper = wrapper;
    }

    /**
     * Updates Fabric state with current translationY so that getContentOriginOffset
     * can correct hit-testing. Call this whenever setTranslationY is applied.
     */
    public void updateTranslationY(float translationY) {
        if (mStateWrapper != null) {
            WritableMap map = Arguments.createMap();
            map.putDouble("translationY", PixelUtil.toDIPFromPixel(translationY));
            mStateWrapper.updateState(map);
        }
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public boolean isAutoMode() {
        return this.mode.equals("auto");
    }

    public void setExtraHeight(float extraHeight) {
        this.extraHeight = extraHeight;
    }

    public float getExtraHeight() {
        return this.extraHeight;
    }


    @Override
    public void requestChildFocus(View child, View focused) {
        super.requestChildFocus(child, focused);
        requestApplyInsets();
    }
}
