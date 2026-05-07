import React, { useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { withNavigationItem } from 'hybrid-navigation';
import { NestedScrollView, NestedScrollViewHeader } from '@sdcx/nested-scroll';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import PagerView from 'react-native-pager-view';
import TabBar from '../../components/TabBar';
import usePagerView from '../../components/usePagerView';
import { ScrollViewPage } from '../../components/ScrollViewPage';
import { WebViewPage } from '../../components/WebViewPage';
import Contacts from '../../components/contacts/Contacts';
import ContactsSectionList from '../../components/contacts/ContactsSectionList';
import { DemoSafeAreaView } from '../../components/DemoKit';

const AnimatedPagerView = Animated.createAnimatedComponent<typeof PagerView>(PagerView);

const pages = ['SectionList', 'FlashList', 'ScrollView', 'WebView'];

export function PullRefreshNestedScrollPagerView() {
	const [refreshing, setRefreshing] = useState(false);

	const {
		pagerRef,
		setPage,
		page,
		position,
		offset,
		isIdle,
		onPageScroll,
		onPageSelected,
		onPageScrollStateChanged,
	} = usePagerView();

	const beginRefresh = async () => {
		setRefreshing(true);
		setTimeout(() => {
			setRefreshing(false);
		}, 2000);
	};

	return (
		<DemoSafeAreaView edges={['top']}>
			<PullToRefresh style={{ flex: 1 }} refreshing={refreshing} onRefresh={beginRefresh}>
				<NestedScrollView style={styles.coordinator}>
					<NestedScrollViewHeader stickyHeaderBeginIndex={1}>
						<Image
							source={require('assets/cover.webp')}
							style={styles.image}
							resizeMode="cover"
						/>
						<TabBar
							tabs={pages}
							onTabPress={setPage}
							position={position}
							offset={offset}
							page={page}
							isIdle={isIdle}
						/>
					</NestedScrollViewHeader>
					<AnimatedPagerView
						ref={pagerRef}
						style={styles.pager}
						overdrag={true}
						overScrollMode="always"
						onPageScroll={onPageScroll}
						onPageSelected={onPageSelected}
						onPageScrollStateChanged={onPageScrollStateChanged}
					>
						<ContactsSectionList />
						<Contacts />
						<ScrollViewPage />
						<WebViewPage url="https://wangdoc.com" />
					</AnimatedPagerView>
				</NestedScrollView>
			</PullToRefresh>
		</DemoSafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FF0000',
	},
	pager: {
		height: '100%',
	},
	coordinator: {
		flex: 1,
		backgroundColor: '#fff',
	},
	content: {
		backgroundColor: '#0000FF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		height: 160,
		width: '100%',
	},
	text: {
		paddingVertical: 20,
		fontSize: 18,
		color: '#FFFFFF',
	},
});

export default withNavigationItem({})(PullRefreshNestedScrollPagerView);
