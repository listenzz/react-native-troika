import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { BottomSheetAnimatedHeight } from '../BottomSheetAnimatedHeight';
import AnimatedChoiceGroup from '../../components/AnimatedChoiceGroup';

jest.mock('../BottomModal', () => ({
	BottomModal: (props: React.PropsWithChildren<{ footer?: React.ReactNode }>) =>
		require('react').createElement('BottomModal', props, props.children, props.footer),
}));
jest.mock('hybrid-navigation', () => ({
	withNavigationItem: () => (component: unknown) => component,
}));
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: 'GestureRoot' }));
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 34 }),
}));
jest.mock('react-native-svg', () => ({
	__esModule: true,
	default: 'Svg',
	Defs: 'Defs',
	LinearGradient: 'Gradient',
	Rect: 'Rect',
	Stop: 'Stop',
}));
jest.mock('../../components/AnimatedChoiceGroup', () => ({
	__esModule: true,
	default: jest.fn(() => null),
}));

let tree: ReactTestRenderer;
const sheet = () => tree.root.findByType('BottomModal' as never);
const choice = () => jest.mocked(AnimatedChoiceGroup).mock.calls.at(-1)![0];
const input = (id: string) =>
	tree.root.findAll(node => node.props.testID === id && !!node.props.onValueChange)[0];
beforeEach(() => {
	act(() => {
		tree = create(<BottomSheetAnimatedHeight />);
	});
});
afterEach(() => act(() => tree.unmount()));

it('enables content viewport animation while keeping a footer outside changing content', () => {
	expect(sheet().props).toMatchObject({
		fitToContents: true,
		animateContentHeight: true,
		visible: false,
	});
	act(() => tree.root.findByProps({ title: '打开面板' }).props.onPress());
	expect(sheet().props.visible).toBe(true);
	const footer = tree.root.findAll(node => node.props.testID === 'height-sheet-footer')[0];
	act(() => choice().onChange('details'));
	expect(choice().value).toBe('details');
	expect(tree.root.findAll(node => node.props.testID === 'height-sheet-footer')[0]).toBe(footer);
	expect(sheet().props.visible).toBe(true);
	act(() => input('height-more-rows').props.onValueChange(true));
	expect(
		tree.root.findAll(node => node.props.testID === 'height-sheet-row-11').length,
	).toBeGreaterThan(0);
	act(() => tree.root.findByProps({ title: '切换内容' }).props.onPress());
	expect(choice().value).toBe('compact');
	expect(tree.root.findAll(node => node.props.testID === 'height-sheet-row-2')).toHaveLength(0);
});

it('compares animation disabled and permits closing during a content change', () => {
	act(() => input('height-animation-switch').props.onValueChange(false));
	expect(sheet().props.animateContentHeight).toBe(false);
	act(() => tree.root.findByProps({ title: '打开面板' }).props.onPress());
	act(() => choice().onChange('details'));
	act(() => tree.root.findByProps({ title: '收起' }).props.onPress());
	expect(sheet().props.visible).toBe(false);
	act(() => sheet().props.onClose());
	expect(sheet().props.visible).toBe(false);
});
