import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('BottomSheetContentView', {
	interfaceOnly: true,
}) as HostComponent<NativeProps>;
