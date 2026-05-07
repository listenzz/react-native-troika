import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { demoTheme } from './DemoKit';

interface PrimayButtonProps {
	style?: ViewStyle;
	textStyle?: TextStyle;
	onPress?: () => void;
	text: string;
}

export default function PrimaryButton(props: PrimayButtonProps) {
	const { text, onPress, style, textStyle } = props;
	const [pressed, setPressed] = useState(false);
	const onPressIn = () => {
		setPressed(true);
	};

	const onPressOut = () => {
		setPressed(false);
	};
	return (
		<Pressable
			style={[styles.button, pressed ? styles.pressIn : styles.pressOut, style]}
			onPress={onPress}
			onPressIn={onPressIn}
			onPressOut={onPressOut}
		>
			<Text style={[styles.title, textStyle]}>{text}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		height: 44,
		backgroundColor: demoTheme.colors.indigo,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 8,
	},
	pressIn: {
		backgroundColor: '#3730A3',
	},
	pressOut: {
		backgroundColor: demoTheme.colors.indigo,
	},
	title: {
		lineHeight: 32,
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '700',
		letterSpacing: 0,
	},
});
