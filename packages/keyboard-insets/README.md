# KeyboardInsetsView

`KeyboardInsetsView` 是一个 React Native 原生 UI 组件，用于处理软键盘遮挡输入框的问题。

`KeyboardInsetsView` 使用简单，自动模式下不需要额外代码来处理键盘。

|                                                                                                                                                 |                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://raw.githubusercontent.com/sdcxtech/react-native-troika/master/packages/keyboard-insets/docs/assets/avoiding.gif" width="320"> | <img src="https://raw.githubusercontent.com/sdcxtech/react-native-troika/master/packages/keyboard-insets/docs/assets/chat.gif" width="320"> |

本库主要依据 Android 官方指南 [Synchronize animation with the software keyboard](https://developer.android.com/develop/ui/views/layout/sw-keyboard#synchronize-animation) 来实现，同时参考了 [react-native-keyboard-controller](https://github.com/kirillzyusko/react-native-keyboard-controller)。因为该库不是很符合我的需求，所以我自己写了一个。

## 版本兼容

| 版本 | RN 版本 | RN 架构 |
| ---- | ------- | ------- |
| 0.x  | < 0.82  | 旧架构  |
| 1.x  | >= 0.82 | 新架构  |

## Installation

```bash
yarn add @sdcx/keyboard-insets
```

### iOS

```sh
cd ios
pod install
```

### Android

开启 [edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)。 这将使得 APP 的 UI 撑满整个屏幕，而不是被系统 UI（譬如虚拟导航键）遮挡，从而实现更摩登的 UI 效果。

```java
// MainActivity.java
import androidx.core.view.WindowCompat;

public class MainActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
        // enable Edge-to-Edge
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
```

为了更好的向后（Android 10 以前）兼容, 在 AndroidManifest 中设置 `android:windowSoftInputMode="adjustResize"`。

```xml
<!-- AndroidManifest.xml -->
<activity
  android:name=".MainActivity"
    ...
  android:windowSoftInputMode="adjustResize">
  <intent-filter>
    ...
  </intent-filter>
</activity>
```

开启 Edge-to-Edge 后，你的 UI 会撑满整个屏幕，可使用 [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) 来处理和系统 UI (譬如虚拟导航键) 重叠的部分。

可参考以下代码进行全局处理，也可以每个页面单独处理，以实现更美观更摩登的 UI 效果。

```tsx
import { Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>...</NavigationContainer>
      {Platform.OS === 'android' && <SafeAreaView mode="margin" edges={['bottom']} />}
    </SafeAreaProvider>
  );
}
```

> 如果使用 [hybrid-navigation](https://github.com/listenzz/hybrid-navigation) 作为导航组件，则不需要做任何事情，因为它已经帮你处理好了。

## Usage

使用 `KeyboardInsetsView` 代替 `View` 作为容器，或者使用 `KeyboardInsetsView` 将 `ScrollView` 包裹起来。当键盘显示或隐藏时，`KeyboardInsetsView` 会自动调整自身的位置，以保证输入框不被键盘遮挡。

```tsx
import { KeyboardInsetsView } from '@sdcx/keyboard-insets';

function MyComponent() {
  return (
    <KeyboardInsetsView extraHeight={16} style={{ flex: 1 }}>
      <ScrollView>
        ...
        <TextInput />
        ...
      </ScrollView>
    </KeyboardInsetsView>
  );
}
```

### 嵌套 KeyboardInsetsView

支持嵌套，但同一焦点只由最近的原生 `KeyboardInsetsView` 祖先处理。以下示例中，内层输入框使用 `extraHeight={8}`；外层的 16 不会与它相加，外层也不会为这个输入框再避让一次。只有放在内层宿主子树中的内容才会随它移动。

```tsx
import { KeyboardInsetsView } from '@sdcx/keyboard-insets';

function MyComponent() {
  return (
    <KeyboardInsetsView extraHeight={16} style={{ flex: 1 }}>
      ...
      <KeyboardInsetsView extraHeight={8}>
        <TextInput />
      </KeyboardInsetsView>
      ...
    </KeyboardInsetsView>
  );
}
```

### 与 BottomSheet 组合

含输入框的 `fitToContents` 面板应使用以下层级：

```text
KeyboardInsetsView（flex: 1，完整场景宿主）
└─ BottomSheet / BottomModal
   └─ 面板背景、圆角、标题、输入框和底部操作
```

- `BottomSheet` 默认绝对定位并填满父级；外层 `KeyboardInsetsView` 必须有完整的可用高度，不能依靠这个绝对定位子视图撑开自身。页面或模态场景通常使用 `flex: 1`。
- 键盘避让使用原生平移，不会增大 Yoga 布局高度。把 `KeyboardInsetsView` 只放在 `fitToContents` 内容内部时，上移后的输入框或按钮可能越过原内容宿主的触摸边界，出现“看得见但点不到”、点击被遮罩接收的问题。应把整个弹层放进避让宿主，而不是用固定 `minHeight` 撑出平移空间。
- 背景、圆角和按钮与输入框共用同一个避让宿主；不要在输入框周围再套一个 `KeyboardInsetsView`，否则最近祖先会接管键盘，外层整块面板将不再跟随。
- `extraHeight` 从焦点输入框底边起算。要让整个表单露在键盘上方，应包含输入框之后的提示、按钮、间距、底部留白，再加键盘上方的目标间距。安全区按实际布局计入一次；不直接使用键盘高度，也不在外层重复设置一份键盘 padding / translateY。
- 等弹层展开、操作区布局完成后再聚焦。示例通过点击输入框触发键盘；若业务需要自动聚焦，应在弹层的原生展开完成回调中触发，不在仍收起的内容上使用 `autoFocus` 或用固定延时猜测入场结束。

```tsx
import React, { useState } from 'react';
import { Button, Keyboard, TextInput, View } from 'react-native';
import BottomSheet from '@sdcx/bottom-sheet';
import { KeyboardInsetsView } from '@sdcx/keyboard-insets';

function InputSheet() {
  const [actionsHeight, setActionsHeight] = useState(0);

  return (
    <KeyboardInsetsView style={{ flex: 1 }} extraHeight={actionsHeight + 16}>
      <BottomSheet
        fitToContents
        peekHeight={0}
        state="expanded"
        contentContainerStyle={{ backgroundColor: '#FFFFFF' }}
      >
        <TextInput placeholder="请输入名称" style={{ padding: 16 }} />
        <View
          style={{ paddingTop: 24, paddingBottom: 16 }}
          onLayout={event => setActionsHeight(event.nativeEvent.layout.height)}
        >
          <Button title="完成" onPress={Keyboard.dismiss} />
        </View>
      </BottomSheet>
    </KeyboardInsetsView>
  );
}
```

此例测量输入框下方完整操作区，按钮尺寸或底部留白变化后会更新避让距离；自动模式的最大平移仍受键盘高度限制。很高的表单需要自行限高并滚动，不能仅靠增加 `extraHeight` 让所有内容可见。

可运行示例：[TextInputBottomSheet](../../demo/bottom-sheet/TextInputBottomSheet/index.tsx)，在 **BottomSheet** 和 **Keyboard Insets** 菜单中均可进入 **BottomSheet + KeyboardInsetsView**。该示例使用外层整块避让、内容自然高度和操作区实测高度。手动核对键盘弹出后的输入、保存与关闭按钮，以及收键盘后恢复位置；组件层级测试不代替两端原生触摸验收。

### 属性

`KeyboardInsetsView` 本质上是个 `View`，所以你可以使用 `View` 的所有属性，也可以和 `View` 互相替换。

`KeyboardInsetsView` 仅有少量几个属性：

- `extraHeight`：自动模式下，键盘总是紧贴着输入框的下边缘，这个属性设置输入框距离键盘的额外高度。<u>KeyboardInsetsView 的最大偏移受键盘高度限制，若加入额外高度后，KeyboardInsetsView 偏移距离大于键盘高度，将产生截断，此时 KeyboardInsetsView 偏移距离等于键盘高度，底部将与键盘顶部相贴</u>

- `explicitly`：仅对 iOS 生效，自动模式下，是否显式地跟随键盘位置变化。默认为 `false`，通过隐式动画来处理。

- `onKeyboard`：是个回调函数，一旦设置，就进入手动模式，`KeyboardInsetsView` 不会帮你调整输入框的位置。你需要利用这个回调函数实现自己想要的效果。

  `onKeyboard` 的参数声明如下：

  ```tsx
  interface KeyboardState {
    height: number; // 键盘的高度，不会因为键盘隐藏而变为 0
    shown: boolean; // 当键盘将隐已隐时，这个值为 false；当键盘将显已显时，这个值为 true
    transitioning: boolean; // 键盘是否正在显示或隐藏
    position: Animated.Value; // 键盘的位置，从 0 到 height，可以用来实现动画效果
  }
  ```

## API

- `useKeyboard`

  为了方便用户编写 `onKeyboard` 回调，keyboard-insets 提供了一个 `useKeyboard` hook，使用方法如下：

  ```tsx
  import { useKeyboard } from '@sdcx/keyboard-insets'

  function MyComponent() {
    const { keyboard, onKeyboard } = useKeyboard()

    console.log(keyboard.height), // 键盘的高度

    return (
      <KeyboardInsetsView onKeyboard={onKeyboard}>
        <TextInput />
      </KeyboardInsetsView>
    )
  }
  ```

- `getEdgeInsetsForView`

  有时候你需要知道某个 `View` 距离屏幕四边的距离，这个时候就可以使用 `getEdgeInsetsForView` 方法。

  ```tsx
  import { getEdgeInsetsForView } from '@sdcx/keyboard-insets';

  function MyComponent() {
    const inputRef = useRef<TextInput>(null);

    const onLayout = useCallback(() => {
      const viewTag = findNodeHandle(inputRef.current);
      if (viewTag === null) {
        return;
      }

      // 获得 TextInput 距离屏幕四边的距离
      getEdgeInsetsForView(viewTag, insets => {
        console.log('insets', insets);
      });
    }, []);

    return (
      <View>
        <TextInput ref={inputRef} onLayout={onLayout} />
      </View>
    );
  }
  ```

## Caution

如果你在项目中同时使用了[react-native-bars](https://github.com/zoontek/react-native-bars)，那么在初始化它的时候，需要把它内置的键盘处理逻辑关闭：

```java
// in MainActivity.java

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // ...other code
    super.onCreate(savedInstanceState);
    RNBars.init(this, "dark-content", false); // <- 第三个参数必须要设置为false
    // ...other code
  }
```
