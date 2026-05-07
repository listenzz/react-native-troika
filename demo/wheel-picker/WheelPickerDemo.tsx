import React, { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import TimePicker from './TimePicker';
import { withNavigationItem } from 'hybrid-navigation';
import CityPicker from './CityPicker';
import { DemoPanel, DemoScreen, demoTheme } from '../components/DemoKit';

export default withNavigationItem({})(WheelPicker);

function WheelPicker() {
	const [citycode, setCitycode] = useState('15');
	const { width } = useWindowDimensions();
	const pickerWidth = Math.min(width - 64, 340);

	return (
		<DemoScreen
			title="WheelPicker"
			subtitle="城市与时间选择器"
			eyebrow="Picker"
			accentColor={demoTheme.colors.amber}
			contentContainerStyle={styles.content}
		>
			<DemoPanel style={styles.panel}>
				<Text style={styles.panelTitle}>City</Text>
				<View style={styles.pickerFrame}>
					<CityPicker
						citycode={citycode}
						onCitycodeChange={setCitycode}
						style={[styles.region, { width: pickerWidth }]}
					/>
				</View>
			</DemoPanel>
			<DemoPanel style={styles.panel}>
				<Text style={styles.panelTitle}>Time</Text>
				<View style={styles.pickerFrame}>
					<TimePicker style={[styles.time, { width: Math.min(pickerWidth, 240) }]} />
				</View>
			</DemoPanel>
		</DemoScreen>
	);
}

const styles = StyleSheet.create({
	content: {
		paddingBottom: 36,
	},
	panel: {
		alignItems: 'stretch',
	},
	panelTitle: {
		color: demoTheme.colors.text,
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		letterSpacing: 0,
		marginBottom: 12,
	},
	pickerFrame: {
		alignItems: 'center',
	},
	region: {
		height: 224,
	},
	time: {
		height: 224,
	},
});
