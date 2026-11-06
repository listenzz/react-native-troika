import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export type BottomSheetStatus = 'collapsed' | 'expanded' | 'hidden' | 'dragging' | 'settling';

export type OnStateChangedEventPayload = {
	state: 'collapsed' | 'expanded' | 'hidden';
	requestId: CodegenTypes.Int32;
	source: 'command' | 'gesture' | 'layout';
};

export type OnSlideEventPayload = {
	progress: CodegenTypes.Float;
	offset: CodegenTypes.Float;
	expandedOffset: CodegenTypes.Float;
	collapsedOffset: CodegenTypes.Float;
};

export interface NativeProps extends ViewProps {
	peekHeight?: CodegenTypes.WithDefault<CodegenTypes.Float, 200>;
	draggable?: CodegenTypes.WithDefault<boolean, true>;
	// 无法使用 state，会生成 BottomSheetState 枚举类型，和原本要生成的 BottomSheetState 结构体冲突
	status?: CodegenTypes.WithDefault<BottomSheetStatus, 'collapsed'>;
	requestId?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;
	onSlide?: CodegenTypes.DirectEventHandler<OnSlideEventPayload>;
	onStateChanged?: CodegenTypes.DirectEventHandler<OnStateChangedEventPayload>;
}

export default codegenNativeComponent<NativeProps>('BottomSheet') as HostComponent<NativeProps>;
