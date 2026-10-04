import React, { PropsWithChildren, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { AnimatedContentHeight, ContentHeightPhase } from './AnimatedContentHeight';

interface Props extends PropsWithChildren {
	availableHeight: number;
	contentStyle?: StyleProp<ViewStyle>;
	animate: boolean;
	phase: SharedValue<ContentHeightPhase>;
	footer?: React.ReactNode;
	background?: React.ReactNode;
	onReady?: () => void;
}

export function contentHeightLimit(available: number, style: ViewStyle, footerHeight: number) {
	const max = style.maxHeight;
	const limit =
		typeof max === 'number'
			? max
			: typeof max === 'string' && max.endsWith('%')
			? (available * parseFloat(max)) / 100
			: available;
	const top = style.paddingTop ?? style.paddingVertical ?? style.padding ?? 0;
	const bottom = style.paddingBottom ?? style.paddingVertical ?? style.padding ?? 0;
	const border =
		(style.borderTopWidth ?? style.borderWidth ?? 0) +
		(style.borderBottomWidth ?? style.borderWidth ?? 0);
	return Math.max(
		0,
		Math.min(available, limit) -
			footerHeight -
			border -
			(typeof top === 'number' ? top : 0) -
			(typeof bottom === 'number' ? bottom : 0),
	);
}

/** JS composition only: the native sheet receives ordinary layout and no animation props. */
export function BottomSheetContent({
	children,
	availableHeight,
	contentStyle,
	animate,
	phase,
	footer,
	background,
	onReady,
}: Props) {
	const [footerHeight, setFooterHeight] = useState<number | null>(null);
	return (
		<>
			{background != null && (
				<View pointerEvents="none" style={StyleSheet.absoluteFill}>
					{background}
				</View>
			)}
			{animate ? (
				<AnimatedContentHeight
					maxHeight={
						footer != null && footerHeight === null
							? 0
							: contentHeightLimit(
									availableHeight,
									StyleSheet.flatten(contentStyle) ?? {},
									footerHeight ?? 0,
							  )
					}
					enabled={animate}
					phase={phase}
					onReady={onReady}
				>
					{children}
				</AnimatedContentHeight>
			) : (
				children
			)}
			{footer != null && (
				<View
					style={styles.footer}
					onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}
				>
					{footer}
				</View>
			)}
		</>
	);
}

const styles = StyleSheet.create({ footer: { flexShrink: 0 } });
