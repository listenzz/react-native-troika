import type {
	CodegenTypes,
	HostComponent,
	ViewProps,
	ColorValue,
	NativeSyntheticEvent,
} from 'react-native';
import { codegenNativeComponent } from 'react-native';

export type OnItemSelectedEventPayload = {
	selectedIndex: CodegenTypes.Int32;
};

export type OnItemSelectedEvent = NativeSyntheticEvent<OnItemSelectedEventPayload>;

export interface NativeProps extends ViewProps {
	onItemSelected: CodegenTypes.DirectEventHandler<OnItemSelectedEventPayload>;
	selectedIndex: CodegenTypes.Int32;
	items: string[];
	fontSize?: CodegenTypes.WithDefault<CodegenTypes.Int32, 14>;
	itemHeight?: CodegenTypes.WithDefault<CodegenTypes.Float, 36>;
	textColorCenter?: ColorValue;
	textColorOut?: ColorValue;
	cyclic?: CodegenTypes.WithDefault<boolean, false>;
}

export default codegenNativeComponent<NativeProps>('WheelPicker') as HostComponent<NativeProps>;
