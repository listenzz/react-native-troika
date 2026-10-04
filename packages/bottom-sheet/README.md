# BottomSheet

[BottomSheet](https://github.com/sdcxtech/react-native-troika/blob/master/packages/bottom-sheet/README.md) 是一个类似于 Android 原生的 [BottomSheetBehavior](https://developer.android.com/reference/com/google/android/material/bottomsheet/BottomSheetBehavior) 组件，我们在 API 设计上也尽量和 Android 原生保持一致。

它位于屏幕底部，可拖拽，支持嵌套滚动，可以和可滚动视图（`FlatList`, `FlashList`, `WebView` 等等）一起使用。

|                                                                                                                                                |                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://raw.githubusercontent.com/sdcxtech/react-native-troika/master/packages/bottom-sheet/docs/assets/scrollview.gif" width="320"> | <img src="https://raw.githubusercontent.com/sdcxtech/react-native-troika/master/packages/bottom-sheet/docs/assets/pagerview.gif" width="320"> |

## 版本兼容

| 版本 | RN 版本 | RN 架构 |
| ---- | ------- | ------- |
| 0.x  | < 0.82  | 旧架构  |
| 1.x  | >= 0.82 | 新架构  |

## Installation

```bash
yarn install @sdcx/bottom-sheet
# &
pod install
```

## Usage

`BottomSheet` 在使用上是非常简单的，几乎没有什么心智负担。

```tsx
import BottomSheet from '@sdcx/bottom-sheet';

const App = () => {
  return (
    <View style={styles.container}>
      <ScrollView>...</ScrollView>
      <BottomSheet peekHeight={200}>
        {
          // 在这里放置你的内容，可以是任何组件，如：
        }
        <View />
        <PagerView>
          <FlatList nestedScrollEnabled />
          <ScrollView nestedScrollEnabled />
          <WebView />
        </PagerView>
      </BottomSheet>
    </View>
  );
};
```

> :exclamation: :exclamation: :exclamation:
> Android 是基于 [NestedScrolling API](https://developer.android.com/reference/androidx/core/view/NestedScrollingChild) 实现的。
>
> <h3>请记得为你的列表开启 `nestedScrollEnabled` 属性。</h3>
>
> :exclamation: :exclamation: :exclamation:

## 横向轮播与弹层拖动

`BottomSheet` 可以承载 Gesture Handler Pan 驱动的横向轮播。演示入口为 **BottomSheet → BottomSheet + SwipePager**，代码见 [BottomSheetSwipePager](../../demo/bottom-sheet/BottomSheetSwipePager/index.tsx)。图片区域保留两个方向的操作：横向翻页，纵向拖动弹层；拖动方向在下一次触摸重新判断。

- iOS 在弹层 pan 开始前拒绝横向拖动，仅声明横向协作的直接宿主 Pan 等待弹层先判定方向，防止子手势先取消弹层后再放弃。UIScrollView 沿用已有同时识别与滚动交接。
- Android 在触摸拦截和直接处理两条路径均锁定初始主方向，横向开始后不因后续纵向偏移而抢占轮播。
- 轮播自身也需做方向判定。本仓库的 [SwipePager](../../demo/components/SwipePager/index.tsx) 在 UI 线程超过 12pt 后锁定主方向；横向激活，纵向放弃。分页点、缩放与内容位置使用同一个连续进度。

这些改动从 mower_app 的 `@sdcx/bottom-sheet` 1.0.12 补丁同步到本包源码；本仓库通过 workspace 直接使用本包，无需另加一份 patch-package 补丁。未调整包版本或发布。原生变更需要重新构建，JS 热更新不能替代。

手动验证：图片上的双向横滑、上下拖动、斜向起滑、横滑抬手后再次纵向拖动、首尾回弹，以及上一页 / 下一页 / 分页点操作；已有 PagerView、ScrollView、FlashList 示例也应检查原有滚动交接。组件测试不代表原生手势或视觉验收。

## 普通内容优先与轮播协作

普通滑块直接使用自身 View 和 Pan，无需弹层专用包装。iOS 弹层等待普通内容 Pan 失败后才参与；滑块已激活后移出区域或到达端点，不会因位置变化转交。抓手、标题和空白处继续拖动弹层。

公共 [SwipePager](../../demo/components/SwipePager/index.tsx) 在既有 GestureDetector 宿主 View 上用 `useId` 生成稳定、唯一的 `nativeID`，前缀为 `sdcx-pan-axis:horizontal:`，并设置 `collapsable={false}`。两端使用相同声明，不增加包装或公开参数，业务调用方无需设置。iOS 只检查识别器直接绑定的 View，不查祖先，因此轮播内部的普通滑块仍拥有普通内容优先权。声明不使用 RNGH 私有类、testID 或无障碍标签。

依赖关系仅作用于当前弹层内容内已启用的 Pan；UIScrollView 保留原有同时识别和滚动交接，`draggable=false` 及 settling 期间不建立依赖。点击、弹层外识别器不受影响。Android 保留原有触摸拦截与子手势协调，不动态切换 `draggable`。

**BottomSheet → BottomSheet + SwipePager** 同屏展示普通纵向滑块、轮播、抓手、空白与收起按钮。两端人工核对滑块上下拖动、端点/移出区域不转交，轮播横滑/纵拖/斜滑与抬手后换方向，按钮点击和抓手拖拽；另外检查现有 ScrollView / FlashList 的滚动交接、Animated Height 示例的过渡中关闭/拖动。普通控件、轮播和滚动交接均通过后才完成交互验收；组件测试和构建不能代替真实触摸验收。

2026-10-05 从 mower_app 同步此规则并删除旧区域组件和包导出；普通控件取消/失败时应在自身 `onFinalize` 清理输入状态，两端一致，清理不额外触发保存或结束回调。原生 iOS 规则需要重建安装，JS 热更新不能代替。未改包版本或发布 npm。

本轮验证：5 组 / 29 项相关 Jest、TypeScript、定向 ESLint、包构建、iOS / Android Debug 构建及差异格式检查通过；两端原生源码与 mower_app 新补丁应用结果一致。8082 Metro 健康但无连接的 Demo 调试应用，未进行 Demo 加载或真实手势验收。原生等待关系的 XCTest 维护在 mower_app，本轮编译通过但运行受 x86_64 测试产物与模拟器 arm64 目标不匹配阻塞。

## 内容高度过渡

内容高度过渡由共享 JS 组件实现，原生 BottomSheet 沿用普通 fitToContents 布局。演示入口为 **BottomSheet → BottomSheet + Animated Height**，源码见 [BottomSheetAnimatedHeight](../../demo/bottom-sheet/BottomSheetAnimatedHeight.tsx)。支持简洁/详细、更多内容、快速反向和过渡中关闭/拖动；“高度动画”开关可比较动画与直接布局。

```tsx
import { BottomModal } from '../../demo/bottom-sheet/BottomModal';

<BottomModal
  visible={visible}
  onClose={() => setVisible(false)}
  fitToContents
  animateContentHeight
  modalContentStyle={{ maxHeight: 640, backgroundColor: '#F3F6FA',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}
  background={<SheetBackground />}
  footer={<View style={{ paddingBottom: bottomInset }}><Actions /></View>}
>
  <Header />
  <ScrollView nestedScrollEnabled style={{ flexShrink: 1 }}>
    {selected === 'details' ? <Details /> : <Summary />}
  </ScrollView>
</BottomModal>
```

`animateContentHeight / footer / background` 属于演示用 **BottomModal**，不是 BottomSheet 包 API。[AnimatedContentHeight](../../demo/bottom-sheet/AnimatedContentHeight.tsx) 独立测量一份真实内容，Reanimated 在 UI 线程以 220ms ease-out 改变裁切视口高度；[BottomSheetContent](../../demo/bottom-sheet/BottomSheetContent.tsx) 在视口之外组合背景和固定底栏。相同目标不重启、连续切换从当前高度继续；原生进出与拖拽期间冻结高度，首次布局直接就位，减少动态效果沿用默认 System 策略。

正文限高从场景可用高度扣除 footer、数字 padding 和边框，适用于有限内容与可收缩 ScrollView；无限/虚拟化列表保持原包接法。仅一份正文，不复制地图或表单。圆角、背景、滚动内容均由常规 Yoga / Fabric 布局负责；没有原生帧快照、挂载观察或手动图层刷新，`peekHeight` 仍仅控制收起高度。每帧 height 更新仍需布局，不能把减少原生代码等同于性能已验收。

原生层负责 iOS 内容 Pan 等待关系及两端横向轮播方向判断，高度动画无需额外原生属性。包发布输出通过 `yarn workspace @sdcx/bottom-sheet build` 生成；未改版本或发布 npm。原生手势修改需要重新构建安装两端应用；调整内容组件可通过 JS 更新。

2026-10-05 验证：4 组 / 9 项相关 Jest、全仓类型检查、改动文件定向 ESLint、包构建及 iOS / Android Debug 构建通过。当时无连接的 Demo 调试应用，未启动 Demo 业务页面。用户已确认 mower_app 中的新方案满足需求；Demo 的长短切换、反向、底栏、安全区、圆角背景、限高滚动、拖拽关闭和系统减少动态效果仍由人工验收。

## 基本概念和 API

`BottomSheet` 由内外两层视图组成，外层是绝对定位，默认填满父组件，除非设置了 `top` 样式属性，内层也是绝对定位，默认填满外层视图。外层的位置固定不变，内层则可拖动。

![README-2023-04-18-16-17-39](https://raw.githubusercontent.com/sdcxtech/react-native-troika/master/packages/bottom-sheet/docs/assets/struct.png)

`BottomSheet` 的主要属性和回调如下。

### 属性

- `peekHeight`, 是指 BottomSheet 收起时，在屏幕上露出的高度，支持小数，默认是 200。

- `state`, 是指 BottomSheet 的状态，有三种状态：

  - `'collapsed'`，收起状态，此时 BottomSheet 的高度为 `peekHeight`。

  - `'expanded'`，展开状态，此时 BottomSheet 的高度为父组件的高度或内容的高度，参考 `fitToContents` 属性。

  - `'hidden'`，隐藏状态，此时 BottomSheet 的高度为 0。

- `fitToContents`，是指 BottomSheet 在展开时，是否适应内容的高度，默认是 `false`。无限或虚拟化列表通常保持默认值；有限动态内容可配合 `maxHeight` 与可收缩的 ScrollView 使用。

- `contentContainerStyle`，用来设置内层视图的样式；动态内容的 `maxHeight`、圆角、背景和边框放在这里。

### 回调

- `onStateChanged`, 是指 BottomSheet 状态变化时的回调，它和 `state` 属性是一对，用来实现受控模式。

  ```tsx
  export type BottomSheetState = 'collapsed' | 'expanded' | 'hidden';

  export interface StateChangedEventData {
    state: BottomSheetState;
  }

  interface NativeBottomSheetProps extends ViewProps {
    onStateChanged?: (event: NativeSyntheticEvent<StateChangedEventData>) => void;
  }
  ```

- `onSlide`, 是指 BottomSheet 滑动时的回调，可以用它来实现一些动画效果。

  ```tsx
  export interface OffsetChangedEventData {
    progress: number; // 是指 `BottomSheet` 当前的位置在 `collapsedOffset` 和 `expandedOffset` 之间的比例，它的值在 0 和 1 之间。
    offset: number; // 是指 `BottomSheet` 当前的位置，它的值在 `collapsedOffset` 和 `expandedOffset` 之间。
    expandedOffset: number; // 是指 `BottomSheet` 完全展开时，内层顶部距离外层顶部的距离，通常是 0。但如果设置了 `fitToContents` 属性，则可能大于 0。
    collapsedOffset: number; // 是指 `BottomSheet` 完全收起时，内层顶部距离外层顶部的距离。可以看到，它的值等于外层的高度减去 `peekHeight`。
  }

  interface NativeBottomSheetProps extends ViewProps {
    onSlide?: (event: NativeSyntheticEvent<OffsetChangedEventData>) => void;
  }
  ```
