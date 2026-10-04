# NestedScrollView

`NestedScrollView` 是一个 React Native 原生 UI 组件。

主要用来实现如下结构的视图：

![README-2023-10-30-15-06-11](https://raw.githubusercontent.com/sdcxtech/react-native-troika/master/packages/nested-scroll/docs/assets/struct.png)

最外层是一个可纵向滚动的视图， 也就是我们的 `NestedScrollView`， 它的子组件往往由一个头部和一个可横向滚动的视图组成。

这个可横向滚动的视图在 React Native 中通常是设置了 `horizontal` 属性的 `ScrollView`，也可以是 `PagerView`。

最里层是若干也可以纵向滚动的视图，譬如 `ScrollView`、`FlashList`、`WebView` 等等。

`NestedScrollView` 的作用是协调最里层和最外层可滚动视图之间的（纵向）滚动，使得滚动体验更加流畅。

|                                                                                                                                             |                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://raw.githubusercontent.com/sdcxtech/react-native-troika/master/packages/nested-scroll/docs/assets/sticky.gif" width="320"> | <img src="https://raw.githubusercontent.com/sdcxtech/react-native-troika/master/packages/nested-scroll/docs/assets/parallax.gif" width="320"> |

## 版本兼容

| 版本 | RN 版本 | RN 架构 |
| ---- | ------- | ------- |
| 0.x  | < 0.82  | 旧架构  |
| 1.x  | >= 0.82 | 新架构  |

## Installation

```sh
yarn add @sdcx/nested-scroll
# &
pod install
```

## Usage

`NestedScrollView` 在使用上比较简单

```tsx
import { NestedScrollView, NestedScrollViewHeader } from '@sdcx/nested-scroll';

const App = () => {
  return (
    <NestedScrollView>
      <NestedScrollViewHeader stickyHeaderBeginIndex={1}>
        <Image />
        <TabBar />
      </NestedScrollViewHeader>
      <PagerView>
        <FlatList nestedScrollEnabled />
        <ScrollView nestedScrollEnabled />
        <WebView />
      </PagerView>
    </NestedScrollView>
  );
};
```

> :exclamation: :exclamation: :exclamation:
> Android 是基于 [NestedScrolling API](https://developer.android.com/reference/androidx/core/view/NestedScrollingChild) 实现的。
>
> <h3>请记得为你的列表开启 `nestedScrollEnabled` 属性。</h3>
>
> :exclamation: :exclamation: :exclamation:

## 问题记录

- [iOS：与 PagerView 组合首次打开内容空白（2026-10-04）](./docs/issues/2026-10-04-pager-initial-blank.md)：已修复 iOS Fabric 内容高度回填后的布局失效传播；业务验证通过，修复尚未发布。

## API

### NestedScrollView

`NestedScrollView` 只有两个属于自己的属性

- `bounces`：仅限于 iOS 平台，用于设置 `NestedScrollView` 是否有弹性，默认为 `false`。一旦设置为 `true`，最内层可滚动视图将失去弹性。

- `contentContainerStyle`：仅限于 Android 平台，用于设置 `NestedScrollView` 的 contentView 的样式。

### NestedScrollViewHeader

- `stickyHeaderBeginIndex`，它表示从第几个子组件开始，子组件将会被固定在顶部。

- `stickyHeaderHeight`，它表示 header 多高的区域将会被固定在顶部，优先级高于 `stickyHeaderBeginIndex`。

- `onScroll`， 是一个回调函数，可用于实现头部视图的视差效果。

  ```ts
  type OnScroll = (event: {
    nativeEvent: {
      contentOffset: {
        x: number;
        y: number;
      };
    };
  }) => void;
  ```
