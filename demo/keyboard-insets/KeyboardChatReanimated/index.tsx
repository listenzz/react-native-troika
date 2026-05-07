import React, { useRef } from 'react';
import { Image, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { withNavigationItem } from 'hybrid-navigation';

import Message from './Message';
import { history } from './Message/data';
import styles from './styles';

import { RekeyboardInsetsView } from './RekeyboardInsetsView';
import { useRekeyboard } from './useRekeyboard';
import { interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

function KeyboardChat() {
	const inputRef = useRef<TextInput>(null);
	const senderRef = useRef<View>(null);
	const bottom = useSafeAreaInsets().bottom;

	const { onPositionChanged, onStatusChanged, keyboard } = useRekeyboard();

	const position = useDerivedValue(() => {
		if (Platform.OS === 'android') {
			return keyboard.position.value;
		}

		// 需要了解 iOS 的隐式动画机制
		if (keyboard.shown.value) {
			return keyboard.height.value;
		} else {
			return 0;
		}
	}, []);

	const mainStyle = useAnimatedStyle(() => {
		// keyboardHeight 只有在初始化时为 0，后续尽管隐藏都是有值的
		const keyboardHeight = keyboard.height.value;
		return {
			transform: [
				{
					translateY: interpolate(
						position.value,
						[bottom, Math.max(keyboardHeight, bottom)],
						[0, -keyboardHeight + bottom],
						'clamp',
					),
				},
			],
		};
	}, [bottom]);

	return (
		<SafeAreaProvider style={styles.provider}>
			<SafeAreaView edges={['top']} />
			<RekeyboardInsetsView
				style={[styles.fill, mainStyle]}
				onPositionChanged={onPositionChanged}
				onStatusChanged={onStatusChanged}
			>
				<ScrollView showsVerticalScrollIndicator={false} style={styles.inverted}>
					<View style={styles.inverted}>
						{history.map((message, index) => (
							<Message key={index} {...message} />
						))}
					</View>
				</ScrollView>
				<View style={styles.sender} ref={senderRef}>
					<TextInput
						ref={inputRef}
						style={styles.input}
						multiline
						textAlignVertical="center"
					/>
					<Pressable style={styles.button}>
						<Image source={require('./icon/emoji.png')} />
					</Pressable>
					<Pressable style={styles.button}>
						<Image source={require('./icon/plus.png')} />
					</Pressable>
				</View>
			</RekeyboardInsetsView>
			<SafeAreaView edges={['bottom']} />
		</SafeAreaProvider>
	);
}

export default withNavigationItem({})(KeyboardChat);
