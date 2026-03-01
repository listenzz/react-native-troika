import type { HostComponent, NativeSyntheticEvent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { CodegenTypes } from 'react-native';

export interface KeyboardStatusPayload {
	height: CodegenTypes.Float;
	shown: boolean;
	transitioning: boolean;
}

export interface KeyboardPositionPayload {
	position: CodegenTypes.Float;
}

export type KeyboardPositionChangedEvent = NativeSyntheticEvent<KeyboardPositionPayload>;
export type KeyboardStatusChangedEvent = NativeSyntheticEvent<KeyboardStatusPayload>;

export interface NativeProps extends ViewProps {
	mode?: CodegenTypes.WithDefault<'auto' | 'manual', 'auto'>;
	extraHeight?: CodegenTypes.WithDefault<CodegenTypes.Float, 0>;
	explicitly?: CodegenTypes.WithDefault<boolean, false>;
	onPositionChanged?: CodegenTypes.BubblingEventHandler<KeyboardPositionPayload>;
	onStatusChanged?: CodegenTypes.DirectEventHandler<KeyboardStatusPayload>;
}

export default codegenNativeComponent<NativeProps>('KeyboardInsetsView', {
	interfaceOnly: true,
}) as HostComponent<NativeProps>;
