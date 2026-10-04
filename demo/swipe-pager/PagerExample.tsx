import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { DemoButton, demoTheme } from '../components/DemoKit';
import SwipePager from '../components/SwipePager';
import PageIndicator from '../components/SwipePager/PageIndicator';

const images = [
	require('../assets/album-art-1.jpg'),
	require('../assets/album-art-2.jpg'),
	require('../assets/album-art-3.jpg'),
];
const labels = ['画面一', '画面二', '画面三'];

/** 两种容器共用组件；进度、缩放与圆点均读取同一次拖动。 */
export default function PagerExample({ variant }: { variant: 'cards' | 'pages' }) {
	const [index, setIndex] = useState(0);
	const progress = useSharedValue(0);
	const cards = variant === 'cards';
	const pageCount = cards ? 2 : 3;
	return (
		<View style={styles.example}>
			<SwipePager
				testID={`${variant}-pager`}
				variant={variant}
				pageCount={pageCount}
				index={index}
				onPageSelected={setIndex}
				progress={progress}
				pageInset={12}
				pageGap={12}
				inactivePageScale={cards ? 1 : 0.94}
				haptic={cards}
				style={styles.viewport}
				renderPage={(page, width) => (
					<View key={page} style={[styles.tile, { width }]}>
						<Image source={images[page]} style={styles.image} resizeMode="cover" />
						<View style={styles.caption}>
							<Text style={styles.captionText}>{labels[page]}</Text>
						</View>
					</View>
				)}
			/>
			<PageIndicator
				testID={`${variant}-indicator`}
				labels={labels.slice(0, pageCount)}
				index={index}
				progress={progress}
				onChange={setIndex}
				style={styles.indicator}
			/>
			<Text style={styles.counter}>{index + 1} / {pageCount}</Text>
			<View style={styles.actions}>
				<DemoButton title="上一页" disabled={index === 0} style={styles.button}
					onPress={() => setIndex(current => Math.max(0, current - 1))} />
				<DemoButton title="下一页" disabled={index === pageCount - 1} style={styles.button}
					onPress={() => setIndex(current => Math.min(pageCount - 1, current + 1))} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	example: { gap: 10 },
	viewport: { height: 210, overflow: 'hidden' },
	tile: { height: '100%', borderRadius: 18, overflow: 'hidden', backgroundColor: demoTheme.colors.line },
	image: { width: '100%', height: '100%' },
	caption: { position: 'absolute', bottom: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6,
		borderRadius: 12, backgroundColor: '#00000088' },
	captionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
	indicator: { paddingVertical: 6 },
	counter: { color: demoTheme.colors.muted, textAlign: 'center', fontSize: 13 },
	actions: { flexDirection: 'row', gap: 12 },
	button: { flex: 1 },
});
