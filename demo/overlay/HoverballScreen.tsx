import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { withNavigationItem } from 'hybrid-navigation';
import Hoverball from './Hoverball';
import { DemoPanel, DemoScreen, demoTheme } from '../components/DemoKit';

function FloatingBall() {
	const [enabled, setEnabled] = React.useState(false);

	useEffect(() => {
		enabled ? Hoverball.show() : Hoverball.hide();
	}, [enabled]);

	return (
		<DemoScreen
			title="Hoverball"
			subtitle="悬浮球开关状态"
			eyebrow="Overlay"
			accentColor={demoTheme.colors.violet}
		>
			<DemoPanel>
				<View style={styles.row}>
					<View style={styles.copy}>
						<Text style={styles.title}>Floating Entry</Text>
						<Text style={styles.caption}>{enabled ? 'Enabled' : 'Disabled'}</Text>
					</View>
					<Switch
						value={enabled}
						onValueChange={setEnabled}
						trackColor={{ false: '#D0D5DD', true: '#DDD6FE' }}
						thumbColor={enabled ? demoTheme.colors.violet : '#FFFFFF'}
					/>
				</View>
			</DemoPanel>
		</DemoScreen>
	);
}

export default withNavigationItem({})(FloatingBall);

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	copy: {
		flex: 1,
		minWidth: 0,
		marginRight: 16,
	},
	title: {
		color: demoTheme.colors.text,
		fontSize: 18,
		lineHeight: 24,
		fontWeight: '800',
		letterSpacing: 0,
	},
	caption: {
		color: demoTheme.colors.muted,
		fontSize: 14,
		lineHeight: 20,
		marginTop: 4,
	},
});
