import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import ActivityIndicator from '@sdcx/activity-indicator';
import { withNavigationItem } from 'hybrid-navigation';
import { DemoPanel, DemoScreen, demoTheme } from '../components/DemoKit';

function ActivityIndicatorScreen() {
	return (
		<DemoScreen
			title="Activity Indicator"
			subtitle="不同尺寸、颜色与动画状态"
			eyebrow="Loading"
			accentColor={demoTheme.colors.blue}
		>
			<View style={styles.grid}>
				<DemoPanel style={styles.sample}>
					<ActivityIndicator />
					<Text style={styles.label}>Default</Text>
				</DemoPanel>
				<DemoPanel style={styles.sample}>
					<ActivityIndicator size="large" />
					<Text style={styles.label}>Large</Text>
				</DemoPanel>
				<DemoPanel style={styles.sample}>
					<ActivityIndicator size="small" color={demoTheme.colors.indigo} />
					<Text style={styles.label}>Tinted</Text>
				</DemoPanel>
				<DemoPanel style={styles.sample}>
					<ActivityIndicator
						size="large"
						color={demoTheme.colors.green}
						animating={false}
					/>
					<Text style={styles.label}>Paused</Text>
				</DemoPanel>
			</View>
		</DemoScreen>
	);
}

export default withNavigationItem({})(ActivityIndicatorScreen);

const styles = StyleSheet.create({
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	sample: {
		width: '48%',
		minHeight: 136,
		alignItems: 'center',
		justifyContent: 'center',
	},
	label: {
		color: demoTheme.colors.muted,
		fontSize: 13,
		lineHeight: 18,
		fontWeight: '700',
		letterSpacing: 0,
		marginTop: 18,
	},
});
