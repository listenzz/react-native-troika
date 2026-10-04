import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import PagerExample from '../PagerExample';
import SwipePager from '../../components/SwipePager';
import PageIndicator from '../../components/SwipePager/PageIndicator';

jest.mock('../../components/SwipePager', () => jest.fn(() => null));
jest.mock('../../components/SwipePager/PageIndicator', () => jest.fn(() => null));
jest.mock('react-native-safe-area-context', () => ({}));
jest.mock('react-native-reanimated', () =>
	require('../../components/SwipePager/testUtils/pageIndicatorAnimationMock'),
);

let tree: ReactTestRenderer;
const pager = () => jest.mocked(SwipePager).mock.calls.at(-1)![0];
const indicator = () => jest.mocked(PageIndicator).mock.calls.at(-1)![0];
function mount(variant: 'cards' | 'pages') {
	act(() => { tree = create(<PagerExample variant={variant} />); });
}
beforeEach(() => jest.clearAllMocks());
afterEach(() => act(() => tree.unmount()));

it('keeps buttons, page selection and dots on the same controlled index and progress', () => {
	mount('pages');
	expect(indicator().progress).toBe(pager().progress);
	expect(tree.root.findByProps({ title: '上一页' }).props.disabled).toBe(true);
	act(() => tree.root.findByProps({ title: '下一页' }).props.onPress());
	expect(pager().index).toBe(1);
	expect(indicator().index).toBe(1);
	act(() => pager().onPageSelected?.(2));
	expect(indicator().index).toBe(2);
	expect(tree.root.findByProps({ title: '下一页' }).props.disabled).toBe(true);
	act(() => indicator().onChange?.(0));
	expect(pager().index).toBe(0);
});

it.each(['cards', 'pages'] as const)('provides valid %s pages and preserves its geometry', variant => {
	mount(variant);
	const cards = variant === 'cards';
	expect(pager()).toMatchObject({
		variant, pageCount: cards ? 2 : 3, inactivePageScale: cards ? 1 : 0.94,
		pageInset: 12, pageGap: 12,
	});
	expect(indicator().labels).toHaveLength(pager().pageCount);
	for (let index = 0; index < pager().pageCount; index++) {
		expect(pager().renderPage(index, 300)).toBeTruthy();
	}
});
