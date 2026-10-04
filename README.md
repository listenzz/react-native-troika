# React Native 原生 UI 组件

本仓库包含一系列原生组件：

## 版本兼容

| 版本 | RN 版本 | 新旧架构 |
| ---- | ------- | -------- |
| 0.x  | < 0.82  | 旧架构   |
| 1.x  | >= 0.82 | 新架构   |

## 库

### [NestedScrollView](./packages/nested-scroll/README.md)

用于实现嵌套滚动，使用简单。可以和 PagerView，TabView 等组合使用。

<img src="./packages/nested-scroll/docs/assets/struct.png">

### [PullToRefresh](./packages/pull-to-refresh/README.md)

提供了在 React 层自定义下拉刷新的能力。

<img src="./packages/pull-to-refresh/docs/assets/separated.gif" width="320">

### [BottomSheet](./packages/bottom-sheet/README.md)

将 Android 的 [BottomSheetBehavior](https://developer.android.com/reference/com/google/android/material/bottomsheet/BottomSheetBehavior) 迁移到了 React Native 中，在 API 设计上也尽量和 Android 保持一致，同时支持 iOS。主要组件已支持新架构，支持 RN 0.82 及以上，已发布 1.x 版本。

<img src="./packages/bottom-sheet/docs/assets/pagerview.gif" width="320">

### BottomSheet 高度过渡演示

进入 **BottomSheet → BottomSheet + Animated Height**，切换长短内容、比较动画开关、验证固定底栏与限高滚动。演示用 `BottomModal` 通过 `animateContentHeight`、`footer`、`background` 组合共享内容高度组件；详见 [组件用法与原生重建说明](./packages/bottom-sheet/README.md#内容高度过渡)。

### SwipePager 演示

首页 **SwipePager** 展示相邻卡片、整页图片、跟手分页点及按钮切换。整页图片在离场时缩小至 94%，入场时恢复至原尺寸。进入 **BottomSheet → BottomSheet + SwipePager**，可从图片区域左右翻页、上下拖动面板，并与同屏普通纵向滑块比对；滑块无需弹层专用包装。

通用组件位于 [demo/components/SwipePager](./demo/components/SwipePager/index.tsx)，示例位于 [demo/swipe-pager](./demo/swipe-pager/index.tsx)。它使用 Gesture Handler Pan + Reanimated，与演示项目已有的 PagerView 示例并存，不是新增的 npm 包。运行方式仍是 `yarn start` 后启动 iOS / Android 调试应用；Bottom Sheet 的手势修正涉及原生代码，已有应用需要重新构建。

### [ActivityIndicator](./packages/activity-indicator/README.md)

在 Android 上实现了和 iOS 类似的菊花组件。

<img src="./packages/activity-indicator/docs/assets/activity.png" width="320">

### [ImageCropView](./packages/image-crop/README.md)

用来实现头像裁剪，和社区其它方案不同，仅仅只是个 View，非常方便页面的自定义布局。

也可以用来实现图片裁剪，支持设置裁剪区域。

### [KeyboardInsetsView](./packages/keyboard-insets/README.md)

KeyboardInsetsView 是一个 React Native 原生 UI 组件，用于处理软键盘遮挡输入框的问题。自动模式下使用非常简单，不需要额外代码来处理键盘。

如果想要实现类似聊天界面那样的效果，也不在话下。

<img src="./packages/keyboard-insets/docs/assets/chat.gif" width="320">

### [Overlay](./packages/overlay/README.md)

`Overlay` 是一个 React Native 原生 UI 基础设施，它漂浮在你的 React Native 应用之上，可用于实现 Modal, Alert, Toast, Popover, Notification, Hoverball 等顶层 UI。

### [WheelPicker](./packages/wheel-picker/README.md)

一个非常简单的 WheelPicker

一个非常帅的 WheelPicker

<img src="./packages/wheel-picker/docs/assets/wheelpicker.png" width="320">
