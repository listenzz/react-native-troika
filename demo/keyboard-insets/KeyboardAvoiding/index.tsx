import React, { useRef, useState } from 'react';
import { withNavigationItem } from 'hybrid-navigation';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardInsetsView } from '@sdcx/keyboard-insets';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const colors = {
	background: '#FFFFFF',
	text: '#202124',
	secondary: '#73777E',
	placeholder: '#989CA3',
	field: '#F5F6F7',
	line: '#E9EAEC',
	focus: '#777D86',
};

const inputLength = 9;
const multilineLength = 10;

function KeyboardAvoiding() {
	return (
		<SafeAreaProvider>
			<SafeAreaView edges={['top']} style={styles.topSafeArea} />
			<KeyboardInsetsView extraHeight={16} style={styles.screen}>
				<ScrollView
					style={styles.screen}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.intro}>
						<Text style={styles.pageTitle}>键盘避让</Text>
						<Text style={styles.pageDescription}>
							点击输入框，体验键盘弹起与焦点切换。
						</Text>
					</View>

					<Section
						title="连续输入"
						meta="9 项"
						description="使用键盘上的“下一项”依次填写。"
					>
						<SubmitToNextInputs />
					</Section>

					<Section title="显式跟随" description="输入框随键盘位置移动。">
						<ExplicitKeyboardInput />
					</Section>

					<Section
						title="多行输入"
						meta="10 项"
						description="聚焦下方输入框，查看长表单自动避让。"
					>
						<MultilineInputs />
					</Section>
				</ScrollView>
				<FixedComposer />
			</KeyboardInsetsView>
		</SafeAreaProvider>
	);
}

function Section({
	title,
	description,
	meta,
	children,
}: {
	title: string;
	description: string;
	meta?: string;
	children: React.ReactNode;
}) {
	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>{title}</Text>
				{meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
			</View>
			<Text style={styles.sectionDescription}>{description}</Text>
			{children}
		</View>
	);
}

function SubmitToNextInputs() {
	const inputRefs = useRef<(TextInput | null)[]>([]);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	return (
		<View style={styles.inputList}>
			{Array.from({ length: inputLength }, (_, index) => {
				const isLast = index === inputLength - 1;
				const isActive = activeIndex === index;

				return (
					<View
						key={index}
						style={[
							styles.inputRow,
							!isLast && styles.inputRowDivider,
							isActive && styles.inputRowActive,
						]}
					>
						<Text style={[styles.inputNumber, isActive && styles.inputNumberActive]}>
							{String(index + 1).padStart(2, '0')}
						</Text>
						<TextInput
							ref={ref => {
								inputRefs.current[index] = ref;
							}}
							style={styles.singleInput}
							placeholder={isLast ? '输入内容，完成填写' : '输入内容'}
							placeholderTextColor={colors.placeholder}
							textAlignVertical="center"
							submitBehavior={isLast ? 'blurAndSubmit' : 'submit'}
							autoCorrect={false}
							returnKeyType={isLast ? 'done' : 'next'}
							onFocus={() => setActiveIndex(index)}
							onBlur={() => {
								setActiveIndex(current => (current === index ? null : current));
							}}
							onSubmitEditing={() => {
								if (!isLast) {
									inputRefs.current[index + 1]?.focus();
								}
							}}
							accessibilityLabel={`连续填写输入框 ${index + 1}`}
						/>
					</View>
				);
			})}
		</View>
	);
}

function ExplicitKeyboardInput() {
	const [focused, setFocused] = useState(false);

	return (
		<KeyboardInsetsView explicitly extraHeight={16}>
			<TextInput
				style={[styles.explicitInput, focused && styles.inputFocused]}
				placeholder="点击输入"
				placeholderTextColor={colors.placeholder}
				textAlignVertical="center"
				returnKeyType="done"
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onSubmitEditing={Keyboard.dismiss}
				accessibilityLabel="显式跟随键盘输入框"
			/>
		</KeyboardInsetsView>
	);
}

function MultilineInputs() {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	return (
		<View style={styles.multilineList}>
			{Array.from({ length: multilineLength }, (_, index) => {
				const isActive = activeIndex === index;

				return (
					<View
						key={index}
						style={[styles.multilineField, isActive && styles.inputFocused]}
					>
						<Text style={styles.multilineLabel}>
							内容 {String(index + 1).padStart(2, '0')}
						</Text>
						<TextInput
							style={styles.multilineInput}
							multiline
							placeholder="输入多行文字…"
							placeholderTextColor={colors.placeholder}
							textAlignVertical="top"
							onFocus={() => setActiveIndex(index)}
							onBlur={() => {
								setActiveIndex(current => (current === index ? null : current));
							}}
							accessibilityLabel={`多行输入框 ${index + 1}`}
						/>
					</View>
				);
			})}
		</View>
	);
}

function FixedComposer() {
	const [value, setValue] = useState('');

	const finishInput = () => {
		setValue('');
		Keyboard.dismiss();
	};

	return (
		<KeyboardInsetsView extraHeight={16} style={styles.composerShell}>
			<SafeAreaView edges={['bottom']} style={styles.composerSafeArea}>
				<View style={styles.composerRow}>
					<TextInput
						style={styles.composerInput}
						value={value}
						onChangeText={setValue}
						placeholder="在此输入，体验底栏跟随"
						placeholderTextColor={colors.placeholder}
						textAlignVertical="center"
						returnKeyType="done"
						onSubmitEditing={finishInput}
						accessibilityLabel="固定输入栏"
					/>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="完成并收起键盘"
						onPress={finishInput}
						style={({ pressed }) => [
							styles.composerButton,
							pressed && styles.composerButtonPressed,
						]}
					>
						<Text style={styles.composerButtonText}>完成</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		</KeyboardInsetsView>
	);
}

export default withNavigationItem({})(KeyboardAvoiding);

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: colors.background,
	},
	topSafeArea: {
		backgroundColor: colors.background,
	},
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 28,
		paddingBottom: 8,
	},
	intro: {
		marginBottom: 36,
	},
	pageTitle: {
		color: colors.text,
		fontSize: 28,
		lineHeight: 38,
		fontWeight: '600',
	},
	pageDescription: {
		color: colors.secondary,
		fontSize: 13,
		lineHeight: 21,
		marginTop: 8,
	},
	section: {
		marginBottom: 32,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sectionTitle: {
		color: colors.text,
		fontSize: 16,
		lineHeight: 24,
		fontWeight: '600',
	},
	sectionMeta: {
		color: colors.secondary,
		fontSize: 12,
		lineHeight: 18,
	},
	sectionDescription: {
		color: colors.secondary,
		fontSize: 12,
		lineHeight: 19,
		marginTop: 4,
		marginBottom: 14,
	},
	inputList: {
		backgroundColor: colors.field,
		borderRadius: 12,
		overflow: 'hidden',
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	inputRowDivider: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.line,
	},
	inputRowActive: {
		backgroundColor: '#ECEEF0',
	},
	inputNumber: {
		width: 32,
		color: colors.placeholder,
		fontSize: 12,
		fontVariant: ['tabular-nums'],
	},
	inputNumberActive: {
		color: colors.text,
	},
	singleInput: {
		flex: 1,
		minWidth: 0,
		height: 52,
		padding: 0,
		color: colors.text,
		fontSize: 14,
		lineHeight: 22,
	},
	explicitInput: {
		height: 52,
		paddingHorizontal: 16,
		paddingVertical: 0,
		color: colors.text,
		backgroundColor: colors.field,
		borderWidth: 1,
		borderColor: colors.field,
		borderRadius: 12,
		fontSize: 14,
		lineHeight: 22,
	},
	inputFocused: {
		borderColor: colors.focus,
	},
	multilineList: {
		gap: 12,
	},
	multilineField: {
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: 12,
		backgroundColor: colors.field,
		borderWidth: 1,
		borderColor: colors.field,
		borderRadius: 12,
	},
	multilineLabel: {
		color: colors.secondary,
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 8,
	},
	multilineInput: {
		minHeight: 70,
		padding: 0,
		color: colors.text,
		fontSize: 14,
		lineHeight: 22,
	},
	composerShell: {
		backgroundColor: colors.background,
	},
	composerSafeArea: {
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.line,
	},
	composerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	composerInput: {
		flex: 1,
		minWidth: 0,
		height: 46,
		paddingHorizontal: 14,
		paddingVertical: 0,
		color: colors.text,
		backgroundColor: colors.field,
		borderRadius: 10,
		fontSize: 13,
		lineHeight: 20,
	},
	composerButton: {
		width: 60,
		height: 46,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.text,
		borderRadius: 10,
	},
	composerButtonPressed: {
		opacity: 0.7,
	},
	composerButtonText: {
		color: colors.background,
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '500',
	},
});
