import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Picker, { PickerItem } from '@sdcx/wheel-picker';

function genItems(len: number) {
	const items: PickerItem<number>[] = [];
	for (let i = 0; i < len; i++) {
		items.push({
			label: i < 10 ? '0' + i : '' + i,
			value: i,
		});
	}
	return items;
}

const hours = genItems(24);
const minutes = genItems(60);

interface TimePickerProps {
	hour?: number;
	minute?: number;
	onValueChanged?: (hour: number, minute: number) => void;
	style?: StyleProp<ViewStyle>;
}

export default function TimePicker(props: TimePickerProps) {
	const { hour = 0, minute = 0, onValueChanged, style } = props;

	const onHourChanged = (value: number) => {
		onValueChanged?.(value, minute);
	};

	const onMinuteChanged = (value: number) => {
		onValueChanged?.(hour, value);
	};

	return (
		<View style={[styles.compose, style]}>
			<View style={styles.curtain} />
			<Picker
				testID="hour-picker"
				selectedValue={hour}
				onValueChange={onHourChanged}
				style={styles.picker}
				itemStyle={styles.itemStyle}
				items={hours}
				cyclic
			/>
			<Picker
				testID="minute-picker"
				selectedValue={minute}
				onValueChange={onMinuteChanged}
				style={styles.picker}
				itemStyle={styles.itemStyle}
				items={minutes}
				cyclic
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	compose: {
		height: 224,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
	},
	curtain: {
		position: 'absolute',
		left: 12,
		height: 40,
		width: '100%',
		backgroundColor: '#F2F5F7',
		borderRadius: 8,
	},
	picker: {
		flex: 1,
	},
	itemStyle: {
		color: '#1A9EFF',
		fontSize: 17,
	},
});
