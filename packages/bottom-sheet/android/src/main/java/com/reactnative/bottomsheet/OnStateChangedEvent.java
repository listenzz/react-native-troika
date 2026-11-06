package com.reactnative.bottomsheet;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class OnStateChangedEvent extends Event<OnStateChangedEvent> {
    public static final String Name = "topStateChanged";
    public static final String JSEventName = "onStateChanged";

    private final String state;
    private final int requestId;
    private final String source;

    public OnStateChangedEvent(int surfaceId, int viewTag, String state) {
        this(surfaceId, viewTag, state, 0, "layout");
    }

    public OnStateChangedEvent(int surfaceId, int viewTag, String state, int requestId, String source) {
        super(surfaceId, viewTag);
        this.state = state;
        this.requestId = requestId;
        this.source = source;
    }

	@NonNull
    @Override
    public String getEventName() {
        return Name;
    }

    @Nullable
    protected WritableMap getEventData() {
        WritableMap data = Arguments.createMap();
        data.putString("state", state);
        data.putInt("requestId", requestId);
        data.putString("source", source);
        return data;
    }

    @Override
    public boolean canCoalesce() {
        return false;
    }
}
