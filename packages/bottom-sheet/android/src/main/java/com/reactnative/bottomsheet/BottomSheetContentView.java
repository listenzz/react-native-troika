package com.reactnative.bottomsheet;

import android.content.Context;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.views.view.ReactViewGroup;

/**
 * Content view for BottomSheet. Implements getContentOriginOffset via state so that
 * hit-testing uses the correct coordinates when the parent BottomSheet moves this view.
 */
public class BottomSheetContentView extends ReactViewGroup {

    @SuppressWarnings("NullableProblems")
    private StateWrapper stateWrapper;

    public BottomSheetContentView(Context context) {
        super(context);
    }

    public void setStateWrapper(StateWrapper wrapper) {
        this.stateWrapper = wrapper;
    }

    /**
     * Updates Fabric state with content offset (actual top - layout top) so that
     * getContentOriginOffset can correct hit-testing. Called by the parent BottomSheet.
     */
    public void updateContentOffset(int offsetPx) {
        if (stateWrapper != null) {
            WritableMap map = Arguments.createMap();
            map.putDouble("contentOffset", PixelUtil.toDIPFromPixel(offsetPx));
            stateWrapper.updateState(map);
        }
    }
}
