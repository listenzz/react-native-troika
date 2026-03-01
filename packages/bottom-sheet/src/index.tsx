import React from 'react';
import { NativeSyntheticEvent, StyleSheet, ViewProps } from 'react-native';
import splitLayoutProps from './splitLayoutProps';
import BottomSheetNativeComponent from './BottomSheetNativeComponent';
import BottomSheetContentViewNativeComponent from './BottomSheetContentViewNativeComponent';
import type { OnStateChangedEventPayload, OnSlideEventPayload } from './BottomSheetNativeComponent';

export type BottomSheetState = 'collapsed' | 'expanded' | 'hidden';
export type BottomSheetOnSlideEvent = NativeSyntheticEvent<OnSlideEventPayload>;
export type BottomSheetOnStateChangedEvent = NativeSyntheticEvent<OnStateChangedEventPayload>;

interface BottomSheetProps extends ViewProps {
	onSlide?: (event: BottomSheetOnSlideEvent) => void;
	onStateChanged?: (event: BottomSheetOnStateChangedEvent) => void;
	peekHeight?: number;
	draggable?: boolean;
	state?: BottomSheetState;
	fitToContents?: boolean;
	contentContainerStyle?: ViewProps['style'];
}

function BottomSheet(props: BottomSheetProps) {
	const {
		style,
		contentContainerStyle,
		children,
		peekHeight = 200,
		draggable = true,
		state = 'collapsed',
		fitToContents,
		...rest
	} = props;
	const { outer, inner } = splitLayoutProps(StyleSheet.flatten(style));
	return (
		<BottomSheetNativeComponent
			style={[StyleSheet.absoluteFill, outer]}
			peekHeight={peekHeight}
			draggable={draggable}
			status={state}
			{...rest}
		>
			<BottomSheetContentViewNativeComponent
				style={[
					fitToContents ? styles.fitToContents : StyleSheet.absoluteFill,
					inner,
					contentContainerStyle,
				]}
				collapsable={false}
			>
				{children}
			</BottomSheetContentViewNativeComponent>
		</BottomSheetNativeComponent>
	);
}

const styles = StyleSheet.create({
	fitToContents: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
	},
});

export default BottomSheet;
