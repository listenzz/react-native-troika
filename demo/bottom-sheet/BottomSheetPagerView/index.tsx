import React from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { LoremIpsum } from '../../components/LoremIpsum';
import BottomSheet from '@sdcx/bottom-sheet';
import { withNavigationItem } from 'hybrid-navigation';

import PagerView from 'react-native-pager-view';
import { ScrollViewPage } from '../../components/ScrollViewPage';
import { WebViewPage } from '../../components/WebViewPage';
import TabBar from '../../components/TabBar';
import usePagerView from '../../components/usePagerView';
import Contacts from '../../components/contacts/Contacts';
import ContactsSectionList from '../../components/contacts/ContactsSectionList';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedPagerView = Animated.createAnimatedComponent<typeof PagerView>(PagerView);

const pages = ['SectionList', 'FlashList', 'ScrollView', 'WebView'];

const HEADER_HEIGHT = 80;

function BottomSheetPagerView() {
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
	return (
		<SafeAreaView edges={['top']} style={styles.container}>
			<ScrollView>
				<LoremIpsum />
				<LoremIpsum />
				<LoremIpsum />
			</ScrollView>
			<BottomSheet style={styles.bottomSheet}>
				<View style={styles.header}>
					<TabBar
						tabs={pages}
						onTabPress={setPage}
						position={position}
						offset={offset}
						page={page}
						isIdle={isIdle}
					/>
				</View>
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
			</BottomSheet>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#eef',
	},
	header: {
		height: HEADER_HEIGHT,
		backgroundColor: 'coral',
		justifyContent: 'flex-end',
	},
	bottomSheet: {
		...StyleSheet.absoluteFillObject,
		top: 80,
		backgroundColor: '#ff9f7A',
	},
	pager: {
		flex: 1,
	},
});

export default withNavigationItem({})(BottomSheetPagerView);
