import { withNavigationItem } from 'hybrid-navigation';
import React, { useRef, useState } from 'react';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DemoSafeAreaView, demoTheme } from '../../components/DemoKit';

function PullRefreshRemoveViewLog() {
	const [enableRefresh, setEnableRefresh] = useState(true);
	const [enableLoadMore, setEnableLoadMore] = useState(true);
	const [contentVersion, setContentVersion] = useState(1);
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const loadMoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearRefreshTimer = () => {
		if (refreshTimer.current) {
			clearTimeout(refreshTimer.current);
			refreshTimer.current = null;
		}
	};

	const clearLoadMoreTimer = () => {
		if (loadMoreTimer.current) {
			clearTimeout(loadMoreTimer.current);
			loadMoreTimer.current = null;
		}
	};

	const beginRefresh = () => {
		setRefreshing(true);
		clearRefreshTimer();
		refreshTimer.current = setTimeout(() => {
			setRefreshing(false);
			refreshTimer.current = null;
		}, 1200);
	};

	const beginLoadMore = () => {
		setLoadingMore(true);
		clearLoadMoreTimer();
		loadMoreTimer.current = setTimeout(() => {
			setLoadingMore(false);
			loadMoreTimer.current = null;
		}, 1200);
	};

	return (
		<DemoSafeAreaView style={styles.container}>
			<View style={styles.toolbar}>
				<ActionButton
					text={enableRefresh ? '移除 Header' : '添加 Header'}
					onPress={() => {
						setEnableRefresh(value => !value);
						setRefreshing(false);
						clearRefreshTimer();
					}}
				/>
				<ActionButton
					text={enableLoadMore ? '移除 Footer' : '添加 Footer'}
					onPress={() => {
						setEnableLoadMore(value => !value);
						setLoadingMore(false);
						clearLoadMoreTimer();
					}}
				/>
				<ActionButton
					text="替换 Content"
					onPress={() => setContentVersion(value => value + 1)}
				/>
			</View>

			<PullToRefresh
				style={styles.pull}
				onRefresh={enableRefresh ? beginRefresh : undefined}
				refreshing={enableRefresh ? refreshing : false}
				onLoadMore={enableLoadMore ? beginLoadMore : undefined}
				loadingMore={enableLoadMore ? loadingMore : false}
			>
				<View key={`content-${contentVersion}`} style={styles.content}>
					<Text style={styles.title}>Content version #{contentVersion}</Text>
					<Text style={styles.desc}>
						点击上方按钮，观察 Android Logcat 中 PullToRefresh 的 removeViewAt 日志
					</Text>
					<Text style={styles.desc}>
						建议过滤关键字：PullToRefresh 或 SurfaceMountingManager
					</Text>
				</View>
			</PullToRefresh>
		</DemoSafeAreaView>
	);
}

function ActionButton({ text, onPress }: { text: string; onPress?: () => void }) {
	return (
		<Pressable style={styles.button} onPress={onPress}>
			<Text style={styles.buttonText}>{text}</Text>
		</Pressable>
	);
}

export default withNavigationItem({})(PullRefreshRemoveViewLog);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: demoTheme.colors.background,
	},
	toolbar: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		paddingHorizontal: 12,
		paddingTop: 12,
		paddingBottom: 8,
		gap: 8,
	},
	button: {
		height: 36,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: demoTheme.colors.indigo,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 13,
		fontWeight: '700',
		letterSpacing: 0,
	},
	pull: {
		flex: 1,
	},
	content: {
		flex: 1,
		backgroundColor: demoTheme.colors.surface,
		margin: 12,
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: demoTheme.colors.line,
		padding: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: '800',
		color: demoTheme.colors.text,
		marginBottom: 10,
		letterSpacing: 0,
	},
	desc: {
		color: demoTheme.colors.muted,
		lineHeight: 22,
		marginBottom: 6,
	},
});
