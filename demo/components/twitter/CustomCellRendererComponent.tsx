import React, { useCallback, useEffect, useRef } from 'react';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
} from 'react-native-reanimated';
import { View, ViewProps } from 'react-native';

import Twitter from './Twitter';

interface CellRendererProps extends ViewProps {
	index: number;
}

const AnimatedCellContainer = Animated.createAnimatedComponent(View);

export const CustomCellRendererComponent = React.forwardRef<View, CellRendererProps>(
	(props, ref) => {
		const { index, style, ...rest } = props;
		const offset = useSharedValue(400);
		const cellContainerRef = useRef<View>(null);
		const setRef = useCallback(
			(node: View | null) => {
				cellContainerRef.current = node;
				if (typeof ref === 'function') {
					ref(node);
				} else if (ref) {
					ref.current = node;
				}
			},
			[ref],
		);
		const animatedStyles = useAnimatedStyle(() => {
			return {
				transform: [{ translateY: offset.value }],
			};
		}, []);
		useEffect(() => {
			offset.value = withDelay(index * 50, withSpring(0));
		}, [index, offset]);
		useEffect(() => {
			// You can get access to animated cell container's ref. This step is just for demonstration.
			cellContainerRef.current?.setNativeProps({ opacity: 1 });
		});

		return (
			<AnimatedCellContainer
				ref={setRef}
				{...rest}
				style={[animatedStyles, { opacity: 0 }, style]}
			/>
		);
	},
);

CustomCellRendererComponent.displayName = 'CustomCellRendererComponent';

const TwitterCustomCellContainer = () => {
	return <Twitter CellRendererComponent={CustomCellRendererComponent} />;
};
export default TwitterCustomCellContainer;
