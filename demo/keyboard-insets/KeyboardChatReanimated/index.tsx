import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { withNavigationItem } from 'hybrid-navigation';

import Message from './Message';
import { history } from './Message/data';
import styles from './styles';

import { RekeyboardInsetsView } from './RekeyboardInsetsView';
import { KeyboardPanel, useRekeyboard } from './useRekeyboard';
import Reanimated from 'react-native-reanimated';

function KeyboardChat() {
	const inputRef = useRef<TextInput>(null);
	const senderRef = useRef<View>(null);
	const bottom = useSafeAreaInsets().bottom;
	const [activePanel, setActivePanel] = useState<KeyboardPanel | null>(null);

	const {
		mainStyle,
		emojiStyle,
		toolboxStyle,
		onEmojiLayout,
		onToolboxLayout,
		onPositionChanged,
		onStatusChanged,
		showPanel,
		hidePanel,
	} = useRekeyboard({ bottom });

	const showKeyboard = () => {
		setActivePanel(null);
		inputRef.current?.focus();
	};

	const onEmojiPress = () => {
		if (activePanel === 'emoji') {
			showKeyboard();
			return;
		}

		setActivePanel('emoji');
		showPanel('emoji');
	};

	const onToolboxPress = () => {
		if (activePanel === 'toolbox') {
			setActivePanel(null);
			hidePanel('toolbox');
			return;
		}

		setActivePanel('toolbox');
		showPanel('toolbox');
	};

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
						onFocus={() => setActivePanel(null)}
					/>
					<Pressable style={styles.button} onPress={onEmojiPress}>
						<Image
							source={
								activePanel === 'emoji'
									? require('./icon/keyboard.png')
									: require('./icon/emoji.png')
							}
						/>
					</Pressable>
					<Pressable style={styles.button} onPress={onToolboxPress}>
						<Image source={require('./icon/plus.png')} />
					</Pressable>
				</View>
			</RekeyboardInsetsView>
			<SafeAreaView edges={['bottom']} />

			<Reanimated.View
				style={[styles.absolute, styles.red, emojiStyle]}
				pointerEvents={activePanel === 'emoji' ? 'auto' : 'none'}
			>
				<View onLayout={onEmojiLayout}>
					<View style={styles.emoji}>
						<Text style={styles.text}>表情包</Text>
					</View>
					<SafeAreaView edges={['bottom']} />
				</View>
			</Reanimated.View>
			<Reanimated.View
				style={[styles.absolute, styles.blue, toolboxStyle]}
				pointerEvents={activePanel === 'toolbox' ? 'auto' : 'none'}
			>
				<View onLayout={onToolboxLayout}>
					<View style={styles.toolbox}>
						<Text style={styles.text}>工具箱</Text>
					</View>
					<SafeAreaView edges={['bottom']} />
				</View>
			</Reanimated.View>
		</SafeAreaProvider>
	);
}

export default withNavigationItem({})(KeyboardChat);
