import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewabilityConfig } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';

import TweetCell from './TweetCell';
import { tweets as tweetsData } from './data/tweets';
import Tweet from './models/Tweet';
import { RefreshControl } from '@sdcx/pull-to-refresh';

export interface TwitterProps {
	instance?: React.Ref<FlashListRef<Tweet>>;
	CellRendererComponent?: React.ComponentType<any>;
}

const Twitter = ({ instance, CellRendererComponent }: TwitterProps) => {
	const emptyListEnabled = false;

	const [refreshing, setRefreshing] = useState(false);
	const [noMoreData, setNoMoreData] = useState(false);
	const remainingTweets = useRef([...tweetsData].splice(10, tweetsData.length));
	const [tweets, setTweets] = useState([...tweetsData].splice(0, 10));
	const viewabilityConfig = useRef<ViewabilityConfig>({
		waitForInteraction: true,
		itemVisiblePercentThreshold: 50,
		minimumViewTime: 1000,
	}).current;

	return (
		<FlashList
			style={styles.list}
			nestedScrollEnabled
			ref={instance}
			testID="FlashList"
			keyExtractor={item => {
				return item.id;
			}}
			renderItem={({ item }) => {
				return <TweetCell tweet={item} />;
			}}
			CellRendererComponent={CellRendererComponent}
			ListHeaderComponent={Header}
			ListHeaderComponentStyle={{ backgroundColor: '#ccc' }}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={() => {
						setRefreshing(true);
						setTimeout(() => {
							setRefreshing(false);
							const reversedTweets = [...tweets];
							reversedTweets.reverse();
							setTweets(reversedTweets);
						}, 500);
					}}
				/>
			}
			onEndReached={() => {
				setTimeout(() => {
					setTweets([...tweets, ...remainingTweets.current.splice(0, 10)]);
					if (remainingTweets.current.length === 0) {
						setNoMoreData(true);
					}
				}, 1000);
			}}
			ListFooterComponent={
				<Footer
					isLoading={tweets.length !== tweetsData.length}
					isPagingEnabled={!noMoreData}
				/>
			}
			ListEmptyComponent={Empty()}
			ItemSeparatorComponent={Divider}
			data={emptyListEnabled ? [] : tweets}
			viewabilityConfig={viewabilityConfig}
			onViewableItemsChanged={info => {
				console.log(info);
			}}
		/>
	);
};

export const Divider = () => {
	return <View style={styles.divider} />;
};

export const Header = () => {
	return (
		<View style={styles.header}>
			<Text style={styles.headerTitle}>New tweets available</Text>
		</View>
	);
};

interface FooterProps {
	isLoading: boolean;
	isPagingEnabled: boolean;
}

export const Footer = ({ isLoading, isPagingEnabled }: FooterProps) => {
	return (
		<View style={styles.footer}>
			{isLoading && isPagingEnabled ? (
				<ActivityIndicator />
			) : (
				<Text style={styles.footerTitle}>No more tweets</Text>
			)}
		</View>
	);
};

export const Empty = () => {
	const title = 'Welcome to your timeline';
	const subTitle =
		"It's empty now but it won't be for long. Start following peopled you'll see Tweets show up here";
	return (
		<View style={styles.emptyComponent} testID="EmptyComponent">
			<Text style={styles.emptyComponentTitle}>{title}</Text>
			<Text style={styles.emptyComponentSubtitle}>{subTitle}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	list: {
		flex: 1,
	},
	divider: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#DDD',
	},
	header: {
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1DA1F2',
	},
	footer: {
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		color: '#FFFFFF',
		padding: 8,
		borderRadius: 12,
		fontSize: 12,
	},
	footerTitle: {
		padding: 8,
		borderRadius: 12,
		fontSize: 12,
	},
	emptyComponentTitle: {
		color: 'black',
		fontSize: 20,
		fontWeight: 'bold',
	},
	emptyComponentSubtitle: {
		color: '#808080',
		padding: 8,
		fontSize: 14,
		textAlign: 'center',
	},
	emptyComponent: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
});

export default Twitter;
