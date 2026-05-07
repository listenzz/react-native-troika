import 'react-native-gesture-handler';

// 设置全局下拉刷新样式
import './demo/pull-to-refresh/PullToRefresh';

import App from './App';
import Navigation from 'hybrid-navigation';

import SafeAreaContextHOC from './demo/SafeAreaContextHOC';
import ActivityIndicator from './demo/activity-indicator/ActivityIndicatorScreen';
import { registerNestedScrollComponent } from './demo/nested-scroll';
import { registerPullToRefreshComponent } from './demo/pull-to-refresh';
import { registerBottomSheetComponent } from './demo/bottom-sheet';
import { registerKeyboardComponent } from './demo/keyboard-insets';
import { registerImageCropComponent } from './demo/image-crop';
import { registerOverlayComponent } from './demo/overlay';
import { registerWheelPickerComponent } from './demo/wheel-picker';

// 配置全局样式
Navigation.setDefaultOptions({
	statusBarStyle: 'dark-content',
});

// 重要必须
Navigation.startRegisterComponent(SafeAreaContextHOC);

// 注意，你的每一个页面都需要注册
Navigation.registerComponent('App', () => App);

registerNestedScrollComponent();
registerPullToRefreshComponent();
registerBottomSheetComponent();
registerKeyboardComponent();
registerImageCropComponent();
registerOverlayComponent();
registerWheelPickerComponent();

Navigation.registerComponent('ActivityIndicator', () => ActivityIndicator);

// 重要必须
Navigation.endRegisterComponent();

Navigation.setRoot({
	stack: {
		children: [{ screen: { moduleName: 'App' } }],
	},
});
