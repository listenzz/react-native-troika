import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { withNavigationItem } from 'hybrid-navigation';
import Toast from './Toast';
import { DemoButton, DemoPanel, DemoScreen, demoTheme } from '../components/DemoKit';

function ToastScreen() {
	return (
		<DemoScreen
			title="Toast"
			subtitle="短时反馈浮层"
			eyebrow="Overlay"
			accentColor={demoTheme.colors.green}
		>
			<DemoPanel>
				<Text style={styles.title}>Hello World!</Text>
				<Text style={styles.caption}>Duration 2000ms</Text>
				<DemoButton
					title="Show Toast"
					accentColor={demoTheme.colors.green}
					style={styles.button}
					onPress={() => {
						Toast.show({
							message: 'Hello World!',
							duration: 2000,
						});
					}}
				/>
			</DemoPanel>
		</DemoScreen>
	);
}

export default withNavigationItem({})(ToastScreen);

const styles = StyleSheet.create({
	title: {
		color: demoTheme.colors.text,
		fontSize: 22,
		lineHeight: 28,
		fontWeight: '800',
		letterSpacing: 0,
	},
	caption: {
		color: demoTheme.colors.muted,
		fontSize: 14,
		lineHeight: 20,
		marginTop: 6,
	},
	button: {
		marginTop: 18,
	},
});
