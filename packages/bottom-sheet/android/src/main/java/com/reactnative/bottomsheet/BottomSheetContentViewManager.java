package com.reactnative.bottomsheet;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.BottomSheetContentViewManagerDelegate;
import com.facebook.react.viewmanagers.BottomSheetContentViewManagerInterface;

public class BottomSheetContentViewManager extends ViewGroupManager<BottomSheetContentView>
        implements BottomSheetContentViewManagerInterface<BottomSheetContentView> {

    private final BottomSheetContentViewManagerDelegate<BottomSheetContentView, BottomSheetContentViewManager> mDelegate =
            new BottomSheetContentViewManagerDelegate<>(this);

    @Override
    protected ViewManagerDelegate<BottomSheetContentView> getDelegate() {
        return mDelegate;
    }

    @NonNull
    @Override
    public String getName() {
        return "BottomSheetContentView";
    }

    @NonNull
    @Override
    protected BottomSheetContentView createViewInstance(@NonNull ThemedReactContext context) {
        return new BottomSheetContentView(context);
    }

    @Nullable
    @Override
    public Object updateState(
            @NonNull BottomSheetContentView view,
            ReactStylesDiffMap props,
            StateWrapper stateWrapper) {
        view.setStateWrapper(stateWrapper);
        return super.updateState(view, props, stateWrapper);
    }
}
