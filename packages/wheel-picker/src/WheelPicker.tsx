import React, { useCallback } from 'react';
import type { StyleProp, TextStyle, ViewProps } from 'react-native';
import { StyleSheet } from 'react-native';
import WheelPickerNativeComponent, { type OnItemSelectedEvent } from './WheelPickerNativeComponent';

export interface PickerItem<T> {
	value: T;
	label: string;
}

interface WheelPickerProps<T> extends ViewProps {
	onValueChange?: (value: T, index: number) => void;
	selectedValue: T;
	items: PickerItem<T>[];
	style?: StyleProp<TextStyle>;
	itemStyle?: StyleProp<TextStyle>;
	cyclic?: boolean;
}

function WheelPicker<T>(props: WheelPickerProps<T>) {
	const { selectedValue, onValueChange, items = [], itemStyle = {}, style, ...rest } = props;

	const handleItemSelected = useCallback(
		(event: OnItemSelectedEvent) => {
			const selectedIndex = event.nativeEvent.selectedIndex;
			if (onValueChange && items.length > selectedIndex) {
				onValueChange(items[selectedIndex].value, selectedIndex);
			}
		},
		[onValueChange, items],
	);

	const selectedIndex = items.findIndex(v => v.value === selectedValue);
	const _style = StyleSheet.flatten(style);
	const _itemStyle = StyleSheet.flatten(itemStyle);
	const lineHeight = _itemStyle.lineHeight || 36;
	const itemHeight =
		_itemStyle.height && typeof _itemStyle.height === 'number' ? _itemStyle.height : lineHeight;
	const fontSize = _itemStyle.fontSize ?? 14;
	const colorCenter =
		_itemStyle?.color && typeof _itemStyle.color === 'string' ? _itemStyle.color : undefined;
	const colorOut = _style?.color && typeof _style.color === 'string' ? _style.color : colorCenter;
	const height = (itemHeight * 16) / Math.PI;

	return (
		<WheelPickerNativeComponent
			{...rest}
			style={[{ height }, _style]}
			onItemSelected={handleItemSelected}
			selectedIndex={selectedIndex === -1 ? 0 : selectedIndex}
			items={items.map(item => item.label)}
			itemHeight={Math.max(itemHeight, lineHeight)}
			fontSize={fontSize}
			textColorCenter={colorCenter}
			textColorOut={colorOut}
		/>
	);
}

export default WheelPicker;
