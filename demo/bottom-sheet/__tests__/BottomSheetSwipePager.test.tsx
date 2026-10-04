import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Platform } from 'react-native';
import BottomSheetSwipePager from '../BottomSheetSwipePager';

jest.mock('hybrid-navigation', () => ({ withNavigationItem: () => (component: unknown) => component }));
jest.mock('@sdcx/bottom-sheet', () => ({ __esModule: true, default: 'BottomSheet' }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 20 }) }));
jest.mock('../../components/DemoKit', () => ({
	...jest.requireActual('../../components/DemoKit'),
	DemoButton: 'DemoButton', DemoPanel: 'DemoPanel', DemoScreen: 'DemoScreen',
}));
jest.mock('../../swipe-pager/PagerExample', () => ({ __esModule: true, default: 'PagerExample' }));
jest.mock('react-native-gesture-handler', () => ({
	GestureHandlerRootView: 'GestureHandlerRootView', GestureDetector: 'GestureDetector',
	Gesture: { Pan: () => ({ onChange: jest.fn().mockReturnThis() }) },
}));
jest.mock('react-native-reanimated', () => ({
	__esModule: true, ...require('../../components/SwipePager/testUtils/pageIndicatorAnimationMock'),
}));

it.each(['ios', 'android'] as const)('%s keeps the ordinary slider independent of the sheet and pager', platform => {
	const originalPlatform = Platform.OS;
	Platform.OS = platform;
	let tree: ReactTestRenderer | undefined;
	try {
		act(() => { tree = create(<BottomSheetSwipePager />); });
		const root = tree!.root;
		const sheet = () => root.findByType('BottomSheet' as React.ElementType);
		const slider = root.findByType('GestureDetector' as React.ElementType);
		const change = slider.props.gesture.onChange.mock.calls[0][0];
		expect(slider.props.children.props.nativeID).toBeUndefined();
		expect(root.findByType('PagerExample' as React.ElementType).props.variant).toBe('pages');
		act(() => root.findAllByType('DemoButton' as React.ElementType)[0].props.onPress());
		expect(sheet().props.state).toBe('expanded');
		act(() => change({ changeY: -1000 }));
		expect(root.findAllByProps({ testID: 'ordinary-slider-value' })[0].props.children).toBe(100);
		act(() => change({ changeY: 2000 }));
		expect(root.findAllByProps({ testID: 'ordinary-slider-value' })[0].props.children).toBe(0);
		expect(sheet().props.state).toBe('expanded');
		expect(sheet().props.draggable).toBe(true);
		act(() => root.findAllByType('DemoButton' as React.ElementType)[1].props.onPress());
		expect(sheet().props.state).toBe('collapsed');
	} finally {
		if (tree) { act(() => tree!.unmount()); }
		Platform.OS = originalPlatform;
	}
});
