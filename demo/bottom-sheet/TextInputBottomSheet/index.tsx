import { KeyboardInsetsView } from '@sdcx/keyboard-insets';
import { useNavigator, withNavigationItem } from 'hybrid-navigation';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-hybrid';

import { BottomModal } from '../BottomModal';

const TITLE = '重命名';
const SAVE = '保存';
const NAME_EMPTY = '设备名称不能为空';
const NAME_TOO_LONG = '设备名称最多60个字符';

function TextInputBottomSheet() {
	const navigator = useNavigator();
	const [name, setName] = useState('');
	const [visible, setVisible] = useState(true);
	const toast = useToast();

	const closeModal = () => {
		setVisible(false);
	};

	const onClose = () => {
		navigator.hideModal();
	};

	const save = async () => {
		if (!name.trim()) {
			toast.text(NAME_EMPTY);
			return;
		}
		try {
			toast.loading();
			// Demo: simulate save
			await new Promise<void>(resolve => setTimeout(resolve, 300));
			toast.hide();
			setVisible(false);
			onClose();
		} catch (error) {
			toast.text(error instanceof Error ? error.message : String(error));
		}
	};

	const onChangeText = useCallback(
		(text: string) => {
			if (text.length > 60) {
				toast.text(NAME_TOO_LONG);
				setName(text.trim().substring(0, 60));
				return;
			}
			setName(text);
		},
		[toast],
	);

	const insets = useSafeAreaInsets();

	return (
		<BottomModal
			fitToContents
			visible={visible}
			onClose={onClose}
			modalContentStyle={styles.modal}
		>
			<Pressable style={styles.pressable} onPress={closeModal} />
			<KeyboardInsetsView extraHeight={80}>
				<View style={styles.content}>
					<View style={styles.header}>
						<Text style={styles.title}>{TITLE}</Text>
						<Pressable
							testID="text-input-bottom-sheet-close-button"
							style={styles.close}
							onPress={closeModal}
						>
							<Text style={styles.closeText}>×</Text>
						</Pressable>
					</View>
					<TextInput
						testID="text-input-bottom-sheet-input"
						autoFocus
						textAlignVertical="center"
						style={styles.input}
						value={name}
						onChangeText={onChangeText}
						placeholder="请输入名称"
					/>
					<Pressable
						testID="text-input-bottom-sheet-button"
						style={[styles.button, { marginBottom: insets.bottom || 16 }]}
						onPress={save}
					>
						<Text style={styles.buttonText}>{SAVE}</Text>
					</Pressable>
				</View>
			</KeyboardInsetsView>
		</BottomModal>
	);
}

const styles = StyleSheet.create({
	modal: {
		backgroundColor: 'red',
		flex: 1,
		justifyContent: 'flex-end',
		// important
		minHeight: 600,
	},
	pressable: {
		flex: 1,
	},
	content: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingBottom: 16,
	},
	header: {
		flexDirection: 'row',
		height: 60,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		color: '#292F33',
		fontSize: 18,
		paddingHorizontal: 16,
	},
	close: {
		position: 'absolute',
		right: 16,
		padding: 8,
	},
	closeText: {
		fontSize: 24,
		color: '#666',
	},
	input: {
		backgroundColor: '#F2F5F7',
		marginHorizontal: 16,
		paddingHorizontal: 16,
		paddingVertical: Platform.OS === 'ios' ? 16 : 12,
		borderRadius: 12,
		color: '#292F33',
		textAlignVertical: 'center',
		fontSize: 14,
	},
	button: {
		marginTop: 24,
		marginHorizontal: 16,
		backgroundColor: '#1DA1F2',
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
});

export default withNavigationItem({
	forceTransparentDialogWindow: true,
	navigationBarColorAndroid: '#FFFFFF',
})(TextInputBottomSheet);
