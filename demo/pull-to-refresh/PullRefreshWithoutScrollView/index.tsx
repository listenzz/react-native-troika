import React, { PropsWithChildren, useState } from 'react';
import { withNavigationItem } from 'hybrid-navigation';
import { Animated, Platform, ScrollView, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import Page from './Page';
import ExpandingDot from './ExpandingDot';
import usePagerView from './usePagerView';
import { DemoSafeAreaView } from '../../components/DemoKit';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const data = ['1', '2', '3', '4'];

function PullRefreshWithoutScrollView() {
	const [refreshing, setRefreshing] = useState(false);
	const onRefresh = () => {
		setRefreshing(true);
		setTimeout(() => {
			setRefreshing(false);
		}, 2000);
	};

	const { onPageScroll, scrollX } = usePagerView(data.length);

	return (
		<DemoSafeAreaView>
			<PullToRefresh
				style={styles.pull}
				onRefresh={onRefresh}
				refreshing={refreshing}
				requestDisallowInterceptTouchEvent={false}
			>
				<Scrollable key="scrollable">
					<AnimatedPagerView
						style={styles.pager}
						initialPage={0}
						onPageScroll={onPageScroll}
					>
						{data.map(d => (
							<Page key={d} />
						))}
					</AnimatedPagerView>
					<ExpandingDot
						data={data}
						expandingDotWidth={12}
						scrollX={scrollX}
						inActiveDotOpacity={0.5}
						containerStyle={styles.dots}
					/>
				</Scrollable>
			</PullToRefresh>
		</DemoSafeAreaView>
	);
}

function Scrollable(props: PropsWithChildren<any>) {
	const { children } = props;
	if (Platform.OS === 'ios') {
		return (
			<ScrollView
				style={styles.content}
				contentContainerStyle={styles.scroll}
				showsVerticalScrollIndicator={false}
			>
				{children}
			</ScrollView>
		);
	} else {
		return (
			<View style={[styles.content]} collapsable={false}>
				{children}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	bg: {
		width: '100%',
		height: '100%',
	},
	pull: {
		flex: 1,
		backgroundColor: '#F0F0F0',
	},
	content: {
		flex: 1,
	},
	scroll: {
		flexGrow: 1,
	},
	pager: {
		flex: 1,
		marginBottom: 36,
	},
	dots: {
		height: 36,
		alignItems: 'center',
	},
});

export default withNavigationItem({})(PullRefreshWithoutScrollView);
