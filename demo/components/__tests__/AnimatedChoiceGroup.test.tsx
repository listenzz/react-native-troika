import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { cancelAnimation, withTiming } from 'react-native-reanimated';
import AnimatedChoiceGroup, { ChoiceTransition } from '../AnimatedChoiceGroup';

let mockReduceMotion = false;
const mockStyles: Array<() => { color?: string }> = [];
jest.mock('react-native-drop-shadow', () => ({ __esModule: true, default: 'DropShadow' }));
jest.mock('react-native-gesture-handler', () => ({ Pressable: 'GesturePressable' }));
jest.mock('react-native-reanimated', () => ({
    __esModule: true,
    default: { View: 'AnimatedView', Text: 'AnimatedText' },
    Easing: { cubic: 'cubic', out: (v: unknown) => v },
    useSharedValue: (value: number) => require('react').useRef({ value }).current,
    useAnimatedStyle: (fn: () => { color?: string }) => {
        mockStyles.push(fn);
        return fn();
    },
    interpolateColor: (value: number, _input: number[], output: string[]) =>
        output[value > 0 ? 1 : 0],
    useReducedMotion: () => mockReduceMotion,
    withTiming: jest.fn((value: number) => value),
    cancelAnimation: jest.fn(),
}));

const change = jest.fn();
const blocked = jest.fn();
const options = [
    { value: 'first', label: 'First', testID: 'first' },
    { value: 'second', label: 'Second', testID: 'second' },
    {
        value: 'blocked',
        label: 'Blocked',
        testID: 'blocked',
        disabled: true,
        onDisabledPress: blocked,
    },
];
let tree: ReactTestRenderer;
const render = (value: string, variant: 'tabs' | 'segments' = 'segments') => (
    <AnimatedChoiceGroup value={value} options={options} onChange={change} variant={variant} />
);
const button = (id: string) =>
    tree.root.findAll(n => n.props.testID === id && !!n.props.onPress)[0];
function mount(variant: 'tabs' | 'segments' = 'segments') {
    act(() => {
        tree = create(render('first', variant));
    });
    act(() => {
        options.forEach((option, i) =>
            button(option.value).props.onLayout({
                nativeEvent: { layout: { x: i * 100, y: 0, width: 100, height: 40 } },
            })
        );
    });
}
beforeEach(() => {
    jest.clearAllMocks();
    mockReduceMotion = false;
    mockStyles.length = 0;
});
afterEach(() => act(() => tree.unmount()));

it('首次布局不播放切换；点击即时回调，父级接受后才移动背景', () => {
    mount();
    expect(withTiming).not.toHaveBeenCalled();
    act(() => button('second').props.onPress());
    expect(change).toHaveBeenCalledWith('second');
    expect(button('first').props.accessibilityState.selected).toBe(true);
    expect(withTiming).not.toHaveBeenCalled();
    act(() => tree.update(render('second')));
    expect(withTiming).toHaveBeenCalledWith(100, expect.objectContaining({ duration: 220 }));
    expect(change).toHaveBeenCalledTimes(1);
});

it('同项不重复切换，禁用项只提示，不改变选择或触发动画', () => {
    mount();
    act(() => {
        button('first').props.onPress();
        button('blocked').props.onPress();
    });
    expect(change).not.toHaveBeenCalled();
    expect(blocked).toHaveBeenCalledTimes(1);
    expect(withTiming).not.toHaveBeenCalled();
});

it('页签下划线按标签中心移动；快速反向不延迟业务值，卸载停止动画', () => {
    mount('tabs');
    act(() => tree.update(render('second', 'tabs')));
    expect(withTiming).toHaveBeenCalledWith(138, expect.objectContaining({ duration: 220 }));
    act(() => tree.update(render('first', 'tabs')));
    expect(withTiming).toHaveBeenCalledWith(38, expect.objectContaining({ duration: 220 }));
    expect(button('first').props.accessibilityState.selected).toBe(true);
    act(() => tree.unmount());
    expect(cancelAnimation).toHaveBeenCalledTimes(2);
    expect(change).not.toHaveBeenCalled();
});

it('减少动态效果时直接定位；内容过渡不重新挂载表单', () => {
    mockReduceMotion = true;
    mount();
    act(() => tree.update(render('second')));
    expect(withTiming).not.toHaveBeenCalled();
    const mounted = jest.fn();
    function Form() {
        React.useEffect(mounted, []);
        return null;
    }
    act(() =>
        tree.update(
            <ChoiceTransition selectionKey="first">
                <Form />
            </ChoiceTransition>
        )
    );
    act(() =>
        tree.update(
            <ChoiceTransition selectionKey="second">
                <Form />
            </ChoiceTransition>
        )
    );
    expect(mounted).toHaveBeenCalledTimes(1);
});

it('父级选中值已改变但胶囊尚未移动时，文字对比度仍跟随胶囊', () => {
    mount();
    const labels = mockStyles.slice(-options.length);
    const firstColor = labels[0]().color;
    const secondColor = labels[1]().color;
    jest.mocked(withTiming).mockImplementationOnce(() => 0);
    act(() => tree.update(render('second')));
    expect(button('second').props.accessibilityState.selected).toBe(true);
    const switchingLabels = mockStyles.slice(-options.length);
    expect(switchingLabels[0]().color).toBe(firstColor);
    expect(switchingLabels[1]().color).toBe(secondColor);
    expect(firstColor).not.toBe(secondColor);
});
