import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { withNavigationItem } from 'hybrid-navigation';
import Alert from './Alert';
import { DemoButton, DemoPanel, DemoScreen, demoTheme } from '../components/DemoKit';

function AlertScreen() {
	const [result, setResult] = useState('');

	return (
		<DemoScreen
			title="Alert"
			subtitle="确认与取消动作"
			eyebrow="Overlay"
			accentColor={demoTheme.colors.rose}
		>
			<DemoPanel>
				<Text style={styles.title}>Hello World!</Text>
				<Text style={styles.caption}>你好，世界！</Text>
				<DemoButton
					title="Show Alert"
					accentColor={demoTheme.colors.rose}
					style={styles.button}
					onPress={() => {
						Alert.alert('Hello World!', '你好，世界！', [
							{
								text: 'Cancel',
								onPress: () => {
									setResult('Cancel');
								},
							},
							{
								text: 'OK',
								onPress: () => {
									setResult('OK');
								},
							},
						]);
					}}
				/>
			</DemoPanel>
			<DemoPanel style={styles.resultPanel}>
				<Text style={styles.resultLabel}>Result</Text>
				<Text style={styles.result}>{result || 'Pending'}</Text>
			</DemoPanel>
		</DemoScreen>
	);
}

export default withNavigationItem({})(AlertScreen);

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
		fontSize: 15,
		lineHeight: 22,
		marginTop: 6,
	},
	button: {
		marginTop: 18,
	},
	resultPanel: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	resultLabel: {
		color: demoTheme.colors.muted,
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '700',
		letterSpacing: 0,
	},
	result: {
		color: demoTheme.colors.text,
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '800',
		letterSpacing: 0,
	},
});
