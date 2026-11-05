import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import TextInputBottomSheet from '../TextInputBottomSheet';

jest.mock('@sdcx/keyboard-insets', () => ({ KeyboardInsetsView: 'KeyboardHost' }));
jest.mock('../BottomModal', () => ({ BottomModal: 'BottomModal' }));
jest.mock('hybrid-navigation', () => ({
	useNavigator: () => ({ hideModal: jest.fn() }),
	withNavigationItem: () => (component: unknown) => component,
}));
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 34 }),
}));
jest.mock('react-native-toast-hybrid', () => ({
	useToast: () => ({ text: jest.fn(), loading: jest.fn(), hide: jest.fn() }),
}));

let tree: ReactTestRenderer;
const byID = (testID: string) => tree.root.findAllByProps({ testID })[0];

beforeEach(() => {
	act(() => {
		tree = create(<TextInputBottomSheet />);
	});
});
afterEach(() => act(() => tree.unmount()));

it('moves the complete fit-to-content sheet instead of translating only its form', () => {
	const host = tree.root.findByType('KeyboardHost' as never);
	const sheet = tree.root.findByType('BottomModal' as never);
	expect(sheet.parent).toBe(host);
	expect(StyleSheet.flatten(host.props.style)).toMatchObject({ flex: 1 });
	expect(sheet.props.fitToContents).toBe(true);
	expect(sheet.props.modalContentStyle).toBeUndefined();
	expect(sheet.findAllByType('KeyboardHost' as never)).toHaveLength(0);
	expect(byID('text-input-bottom-sheet-input').props.autoFocus).not.toBe(true);
	expect(byID('text-input-bottom-sheet-close-button')).toBeDefined();
	expect(byID('text-input-bottom-sheet-button')).toBeDefined();
});

it('reserves the measured actions and bottom spacing below the focused input', () => {
	const host = () => tree.root.findByType('KeyboardHost' as never);
	const actions = byID('text-input-bottom-sheet-actions');
	const button = byID('text-input-bottom-sheet-button');
	expect(StyleSheet.flatten(button.props.style).marginBottom).toBe(34);
	expect(StyleSheet.flatten(actions.props.style).paddingBottom).toBe(16);

	act(() => actions.props.onLayout({ nativeEvent: { layout: { height: 108 } } }));
	expect(host().props.extraHeight).toBe(124);
	act(() => actions.props.onLayout({ nativeEvent: { layout: { height: 142 } } }));
	expect(host().props.extraHeight).toBe(158);

	act(() => byID('text-input-bottom-sheet-input').props.onChangeText('Garden mower'));
	expect(byID('text-input-bottom-sheet-input').props.value).toBe('Garden mower');
	expect(host().props.extraHeight).toBe(158);
});
