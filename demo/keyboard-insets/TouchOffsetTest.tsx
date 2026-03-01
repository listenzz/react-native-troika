/**
 * 用于验证 KeyboardInsetsView 的 getContentOriginOffset 是否生效：
 * 键盘弹起后，点击是否落在正确的视觉位置。
 *
 * 测试步骤：
 * 1. 先聚焦输入框，让键盘弹起（此时会 setTranslationY，视图整体上移）
 * 2. 点击下方「点我测试」按钮
 * 3. offset 有效：点按钮的视觉位置即可触发 toast
 * 4. offset 无效：需要点比按钮更靠上/下的位置才能触发，或点不准
 */
import { KeyboardInsetsView } from '@sdcx/keyboard-insets';
import { withNavigationItem } from 'hybrid-navigation';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useToast } from 'react-native-toast-hybrid';

function TouchOffsetTest() {
	const [log, setLog] = useState<string[]>([]);
	const toast = useToast();

	const onButtonPress = () => {
		const msg = '点击有效，offset 生效';
		setLog(prev => [...prev, msg]);
		toast.text(msg);
	};

	const onTouchMove = () => {
		console.log('touch move');
		toast.text('touch move');
	};

	return (
		<KeyboardInsetsView style={styles.container} extraHeight={140}>
			<View style={styles.content} onTouchMove={onTouchMove}>
				<Text style={styles.hint}>
					1. 先聚焦输入框让键盘弹起{'\n'}
					2. 再点击下方「点我测试」按钮，稍微移动一下手指{'\n'}
					3. 若 offset 正确，点按钮视觉位置即可触发
				</Text>
				<TextInput
					style={styles.input}
					placeholder="聚焦以弹起键盘"
					placeholderTextColor="#999"
				/>
				<Pressable
					style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
					onPress={onButtonPress}
				>
					<Text style={styles.buttonText}>点我测试</Text>
				</Pressable>
				{<Text style={styles.log}>触发次数: {log.length}</Text>}
			</View>
		</KeyboardInsetsView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	content: {
		flex: 1,
		padding: 24,
		justifyContent: 'center',
	},
	hint: {
		fontSize: 14,
		color: '#666',
		marginBottom: 24,
		lineHeight: 22,
	},
	input: {
		height: 48,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		paddingHorizontal: 12,
		marginBottom: 32,
		fontSize: 16,
		backgroundColor: '#fff',
	},
	button: {
		height: 56,
		borderRadius: 12,
		backgroundColor: '#2196F3',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonPressed: {
		opacity: 0.8,
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
	},
	log: {
		marginTop: 16,
		fontSize: 14,
		color: '#333',
	},
});

export default withNavigationItem({
	titleItem: { title: 'Touch Offset 测试' },
})(TouchOffsetTest);
