# iOS：NestedScrollView 与 PagerView 组合首次打开内容空白

记录日期：2026-10-04；更新日期：2026-10-05。状态：已定位并修复本库 iOS Fabric 布局缺陷，mower_app 用户确认方案可行，原生修复已同步本库；尚未发布新包版本。

## 现象与复现环境

来源为相邻 `mower_app` 仓库的 `app/mower/screens/ConnectionHelp/index.tsx`。设备离线指引使用可收起的信息卡、吸顶标签栏和三个可左右切换的滚动页面，底部操作栏位于嵌套滚动区外。

| 项目 | 出现问题时的环境 |
| --- | --- |
| React Native / React | 0.86.0 / 19.2.3，新架构 |
| `@sdcx/nested-scroll` | 1.0.8 |
| `react-native-pager-view` | 8.0.0 |
| 平台 | iPhone 16 Pro 模拟器，iOS 18.5，x86_64 调试应用 |
| 页面入口 | hybrid-navigation `present`，自绘关闭按钮，无导航栏 |
| 初始分页 | `initialPage={1}`，默认 Wi-Fi；其他页为 Bluetooth、4G |
| 布局 | `stickyHeaderBeginIndex={1}`；pager 使用 `flex: 1`，页容器宽高为 `100%`，内部 `ScrollView nestedScrollEnabled` |

业务页面中的复现步骤：

1. 从设备离线提示的 Reason 打开连接帮助。
2. 不操作标签：信息卡、默认 Wi-Fi 选中态及底部按钮正常，但卡片内容区域空白。
3. 切换标签，再切回 Wi-Fi，内容恢复显示。

预期：首次打开即显示默认页内容，不依赖切页触发布局。复现频率未统计，Android 上是否存在同一问题未验证。

记录时 `mower_app` 基线 HEAD 为 `8d6857cdd`，上述接入与规避方案属于该基线之上的未提交改动，不能仅检出此提交还原问题。本仓库 HEAD 为 `058b726`；当前声明的 RN 为 0.85.3、React 为 19.2.3，nested-scroll 包为 1.0.8，PagerView 依赖范围为 `^8.0.0`。独立复现时应记录实际安装版本，不能把两仓库环境视为完全一致。

## 初期观察到的证据与边界（2026-10-04）

- 原始空白现象由用户截图及操作反馈确认。未捕获该原始版本从首帧到恢复的完整原生布局时序。
- 调试时尝试过在内容区增加 `flex: 1` 的 View，等待它的 `onLayout` 给出正尺寸后才挂载 pager。此尝试仍为空白：运行时外层 NestedScrollView 为 **402×657**，该内容 View 为 **402×0**，pager 因挂载条件未满足而不存在。
- 上述零高度测量属于这次未成功的规避尝试，不能直接当作原始版本中 PagerView 高度必然为零的证据。它说明不能只等待依赖内容布局的容器来解除挂载条件。
- 最终改为独立测量外框与吸顶栏：运行时外框为 **402×657**，吸顶部分为 **56**，pager 和 Wi-Fi 页均为 **402×601**；首张卡片高度约 **355.33**。
- 最新代码已在业务调试应用中加载；用户关闭页面后重新进入，确认“首次打开正常显示”。未修改 nested-scroll 或 PagerView 的依赖源码。

截至 2026-10-04，上述证据只能确认尺寸初始化方式影响结果，尚不足以确认责任库。后续原生实验和修复结果见下文；未捕获原始页面完整布局时序的证据边界仍然保留。

## 业务侧规避方案（历史，已移除）

1. 在 NestedScrollView 的 `onLayout` 中取得外框宽高。
2. 在吸顶标签栏的 `onLayout` 中取得实际高度，不把可收起的信息卡高度算入吸顶高度。
3. 计算 `pagerHeight = scrollHeight - stickyHeight`。宽度和结果均为正、且两处测量已完成后，才首次挂载 pager。
4. 给 pager 外框、pager 及各页传入明确的数值宽高。尺寸变化更新现有实例，不通过修改 key、自动切页或延时切换标签来刷新。
5. 保留 `initialPage`、原生 `setPage` 动画和每页独立滚动状态。

这与 nested-scroll “内容区高度 = 外框高度 − 吸顶部分高度”的布局约定一致，但仍是使用端规避方案，不代表库层修复已完成。

业务验证：相关 6 组 / 129 项 Jest、类型检查、定向 ESLint 通过，包含零/无效尺寸、默认页挂载及尺寸更新后保留分页实例的测试。组件测试没有模拟真实 Fabric/SwiftUI 布局时序，不能单独证明原生问题修复。双端原生依赖集成构建通过；最新尺寸修复在 iOS 调试应用加载并经用户确认，Android UI 未验收。

## 根因与原生修复（2026-10-05）

`RNNestedScrollView.updateContentSizeIfNeeded` 在原生布局后计算“外框高度 − 吸顶高度”并回填 state。iOS 的 `NestedScrollViewShadowNode.adjustLayoutWithState` 原先直接修改共享内容子节点的 Yoga min/max height，只把子节点标为 dirty，没有使父节点布局失效。state-only clone 会继承父节点的 clean 状态，祖先可继续使用旧布局；初始 `flex: 1` 内容高度为 0 时，回填高度也不会落实到 pager。直接修改共享子节点还会污染已提交的旧树。

修复同步自 mower_app 的 `@sdcx+nested-scroll+1.0.8.patch`，业务提交为 `6d369863f`：

- 高度发生变化时先克隆内容 ShadowNode，更新克隆的高度约束并替换子节点，再使父节点布局失效。
- 恢复 iOS 子节点的 `ensureUnsealed()` 检查，保证不直接修改旧树。
- 相同高度（包括仅滚动偏移变化）保留内容节点与布局缓存；忽略非正数及非有限高度。
- Android 原生分支沿用现有实现；没有修改 PagerView 依赖，也没有通过延时、自动切页或更换 key 强制刷新。

mower_app 的 ConnectionHelp 在 iOS / Android 均移除手动测量、延迟挂载及 `useNativePagerLayout` 平台开关，统一直接挂载 `flex: 1` pager，页容器使用百分比尺寸。用户在双端页面代码加载后确认“可行”，授权提交并同步本库；不额外推定逐型号、全部系统版本或整个回归矩阵均已人工验收。

## 自动化验证与重跑

使用 RN 0.86.0 的真实 Fabric 和本库 ShadowNode 进行原生实验，修复前在“state 高度变化应使祖先布局失效”的断言失败，修复后通过：首次 0→601 高度更新、三个绝对定位页尺寸更新、旧树样式/dirty/布局隔离、滚动偏移更新不触发布局、601→501 尺寸变化与 pager 身份保留，以及 0/负数/NaN/Infinity 保护。该用例只模拟 PagerView 的 Yoga 层级，不运行其 UIKit/SwiftUI 宿主。

业务侧 2 组 / 51 项 Jest、类型检查、定向 ESLint、iOS `LdMower_sta / Debug_sta` 与 Android `staDebug` arm64-v8a 构建通过。iOS 原生构建已安装；移除平台开关后的 JS 已在双端现有调试应用中热更新并核对实际加载源码。

同步后，本库 RN 0.85.3 的 iOS Debug / arm64 模拟器构建及同一真实 Fabric 回归均通过，覆盖上述四组布局行为；没有新增或改动业务 UI 示例。

本库保存了 [Fabric 原生回归用例](../../tests/ios/layout-regression.cpp) 和 [运行脚本](../../tests/ios/run.py)。先用当前源码构建 iOS 模拟器应用，再使用同一个 DerivedData 目录运行；脚本复用 pod 的 C++ 参数和真实构建库，不启动模拟器或操作业务 UI。默认配置为 Debug、arm64、iOS deployment target 16.4，使用其他构建配置或架构时传入对应参数。

```sh
xcodebuild -workspace ios/MyUiDemo.xcworkspace -scheme MyUiDemo \
  -configuration Debug -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/nested-scroll-build ARCHS=arm64 ONLY_ACTIVE_ARCH=YES \
  IPHONEOS_DEPLOYMENT_TARGET=16.4 CODE_SIGNING_ALLOWED=NO build
python3 packages/nested-scroll/tests/ios/run.py \
  --derived-data /tmp/nested-scroll-build --device <已启动模拟器的UUID>
```

## 初期排查入口（历史）

- 现有示例：[NestedScrollPagerViewStickyHeader](../../../../demo/nested-scroll/NestedScrollPagerViewStickyHeader/index.tsx)。当前 pager 使用 `height: '100%'`，与业务出问题时的 `flex: 1` 不同；初始页也不是显式的第二页。原示例正常不能直接否定此问题。
- 原生尺寸回填：[RNNestedScrollView.mm](../../ios/RNNestedScrollView.mm)，重点是 `mountChildComponentView`、`layoutSubviews`、`updateContentSizeIfNeeded` 和 `_state->updateState` 的调用顺序。
- Fabric 布局：[NestedScrollViewShadowNode.cpp](../../common/cpp/react/renderer/components/nestedscrollview/NestedScrollViewShadowNode.cpp) 与 [NestedScrollViewChildShadowNode.cpp](../../common/cpp/react/renderer/components/nestedscrollview/NestedScrollViewChildShadowNode.cpp)，检查状态变化后子节点高度约束与布局失效是否完整传播。
- PagerView 8 对照源码：安装包内 `ios/PagerViewProvider.swift`、`ios/PagerView.swift`、`ios/Extensions.swift` 和 `src/utils.tsx`。检查 SwiftUI 首次挂载、初始选中第二页及绝对定位子页在父尺寸变化后的更新；当前只是排查方向。

建议从现有示例派生最小用例：使用三个静态 ScrollView、显式 `initialPage={1}`、可收起头部、吸顶栏及外置固定页脚，先还原 `flex: 1` pager 与百分比页尺寸，不引入设备、图片请求或蓝牙业务。该最小用例尚未建立或验证。

在最小用例中分别比较：

| 变量 | 对照 |
| --- | --- |
| 容器 | 单独 PagerView / NestedScrollView + PagerView |
| 尺寸 | `flex: 1` / `height: '100%'` / 明确数值宽高 |
| 初始页 | 第 0 页 / 第 1 页 |
| 入口 | 普通展示 / present 弹起 |
| RN 版本 | 本仓库 0.85.3 / 问题环境 0.86.0 |

记录首次打开至恢复期间的外框、header、sticky height、child、pager、选中页尺寸及事件顺序，确定最早出现不一致的层级后再选择修复位置。需要核对 `NestedScrollViewChild` 是否已获得正确约束、pager 是否收到尺寸变化，以及选中页是否实际应用该尺寸。

## 持续回归范围

- 不采用业务侧数值尺寸规避，也能在首次打开时显示第 0 页和第 1 页。
- 关闭后重新打开、不同可收起头部高度及容器尺寸变化时不空白，不丢失当前分页。
- 点击标签动画、左右滑动、纵向头部收起和标签吸顶正常，各页滚动位置保留。
- iOS 和 Android 分别验证；明确 RN/PagerView 适用版本，并为实际修复层补充回归用例。

初始记录阶段仅添加问题文档；2026-10-05 已同步下述原生修复及回归用例。原始业务页面的 SwiftUI 首帧时序未完整采集，不能推定所有版本或所有首次空白问题均由同一原因造成。
