import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { View, StyleSheet } from 'react-native';
import BottomSheet from '../src';
jest.mock('../src/BottomSheetNativeComponent', () => ({
	__esModule: true,
	default: 'NativeSheet',
}));
jest.mock('../src/BottomSheetContentViewNativeComponent', () => ({
	__esModule: true,
	default: 'NativeContent',
}));
let tree: ReactTestRenderer;
afterEach(() => {
	act(() => tree.unmount());
});
it('uses ordinary fit-to-content layout and keeps the same content instance on resize', () => {
	const mounted = jest.fn();
	function Body({ height }: { height: number }) {
		React.useEffect(mounted, []);
		return <View style={{ height }} />;
	}
	const render = (height: number) => (
		<BottomSheet fitToContents peekHeight={0} state="expanded">
			<Body height={height} />
		</BottomSheet>
	);
	act(() => {
		tree = create(render(200));
	});
	const native = tree.root.findByType('NativeSheet' as never);
	expect(native.props.animateContentHeight).toBeUndefined();
	expect(native.props).toMatchObject({ peekHeight: 0, status: 'expanded' });
	const content = tree.root.findByType('NativeContent' as never);
	expect(StyleSheet.flatten(content.props.style)).toMatchObject({
		position: 'absolute',
		bottom: 0,
	});
	act(() => tree.update(render(400)));
	expect(mounted).toHaveBeenCalledTimes(1);
});
