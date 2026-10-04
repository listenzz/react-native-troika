import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { interpolateColor, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import PageIndicator from '../PageIndicator';
import { demoTheme } from '../../DemoKit';

jest.mock('react-native-safe-area-context', () => ({}));

jest.mock('react-native-reanimated', () =>
    require('../testUtils/pageIndicatorAnimationMock')
);
jest.mock('react-native-drop-shadow', () => ({ __esModule: true, default: 'DropShadow' }));
jest.mock('react-native-gesture-handler', () => ({ Pressable: 'GesturePressable' }));

const labels = ['First', 'Second', 'Third'];
const change = jest.fn();
let tree: ReactTestRenderer;
let progress: SharedValue<number>;
const dot = (index: number) => tree.root.findAllByProps({ testID: `pages-${index}` })[0];
type Props = Omit<React.ComponentProps<typeof PageIndicator>, 'progress'>;
function Fixture(props: Props) {
    progress = useSharedValue(props.index);
    return <PageIndicator {...props} progress={progress} />;
}
const render = (index: number, props: Partial<Props> = {}) => (
    <Fixture labels={labels} index={index} onChange={change} testID="pages" {...props} />
);
function mount(index = 0, props: Partial<Props> = {}) {
    act(() => { tree = create(render(index, props)); });
}
// 直接执行已注册的 UI 样式计算，模拟 shared value 帧更新，不重新渲染 React。
const currentStyles = () => jest.mocked(useAnimatedStyle).mock.calls.slice(-labels.length)
    .map(([factory]) => factory());
const widths = () => currentStyles().map(style => style.width);
beforeEach(() => jest.clearAllMocks());
afterEach(() => act(() => tree?.unmount()));

it('renders the initial page immediately with the shared dimensions and colors', () => {
    mount(1);
    expect(dot(1).props.accessibilityState.selected).toBe(true);
    expect(widths()).toEqual([4, 12, 4]);
    expect(currentStyles().map(style => style.backgroundColor)).toEqual([
        demoTheme.colors.line, demoTheme.colors.indigo, demoTheme.colors.line,
    ]);
});

it('follows fractional pan progress and reverses before release without changing the selected page', () => {
    mount();
    progress.value = 0.25;
    expect(widths()).toEqual([10, 6, 4]);
    progress.value = 0.5;
    expect(widths()).toEqual([8, 8, 4]);
    expect(interpolateColor).toHaveBeenCalledWith(
        0.5, [0, 1], [demoTheme.colors.line, demoTheme.colors.indigo]
    );
    progress.value = 0.1;
    expect(widths()[0]).toBeCloseTo(11.2);
    expect(widths()[1]).toBeCloseTo(4.8);
    progress.value = 0;
    expect(widths()).toEqual([12, 4, 4]);
    expect(dot(0).props.accessibilityState.selected).toBe(true);
    expect(change).not.toHaveBeenCalled();
});

it('requests a page immediately but keeps the indicator at the actual in-flight position', () => {
    mount();
    act(() => dot(2).props.onPress());
    expect(change).toHaveBeenCalledWith(2);
    act(() => tree.update(render(2)));
    expect(dot(2).props.accessibilityState.selected).toBe(true);
    expect(widths()).toEqual([12, 4, 4]);
    progress.value = 1.5;
    expect(widths()).toEqual([4, 8, 8]);
    progress.value = 2;
    expect(widths()).toEqual([4, 4, 12]);
    act(() => dot(2).props.onPress());
    expect(change).toHaveBeenCalledTimes(1);
});

it('clamps overscroll so the end dots do not shrink or stretch beyond their bounds', () => {
    mount();
    progress.value = -0.4;
    expect(widths()).toEqual([12, 4, 4]);
    progress.value = 2.4;
    expect(widths()).toEqual([4, 4, 12]);
});

it('supports passive home pagination with its brand color and no new tap action', () => {
    mount(0, { labels: labels.slice(0, 2), onChange: undefined, activeColor: demoTheme.colors.violet });
    expect(dot(0).props.onPress).toBeUndefined();
    expect(dot(1).props.onPress).toBeUndefined();
    expect(currentStyles()[0].backgroundColor).toBe(demoTheme.colors.violet);
    progress.value = 0.5;
    expect(widths()).toEqual([8, 8]);
});
