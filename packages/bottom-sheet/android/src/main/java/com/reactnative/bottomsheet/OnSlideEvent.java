package com.reactnative.bottomsheet;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.events.Event;

public class OnSlideEvent extends Event<OnSlideEvent> {
    public static final String Name = "topSlide";
    public static final String JSEventName = "onSlide";

    private final int offset;
    private final int minOffset;
    private final int maxOffset;

    public OnSlideEvent(int surfaceId, int viewTag, int offset, int minOffset, int maxOffset) {
        super(surfaceId, viewTag);
        this.offset = offset;
        this.maxOffset = maxOffset;
        this.minOffset = minOffset;
    }

	@NonNull
    @Override
    public String getEventName() {
        return Name;
    }

    @Nullable
    protected WritableMap getEventData() {
        double range = maxOffset - minOffset;
        double progress;
        if (range <= 0) {
            progress = 1;
        } else {
            progress = Math.max(0, Math.min((offset - minOffset) * 1.0f / range, 1));
        }
        WritableMap data = Arguments.createMap();
        data.putDouble("progress", progress);
        data.putDouble("offset", PixelUtil.toDIPFromPixel(offset));
        data.putDouble("expandedOffset", PixelUtil.toDIPFromPixel(minOffset));
        data.putDouble("collapsedOffset", PixelUtil.toDIPFromPixel(maxOffset));
        return data;
    }
}
