import React from 'react';
import { Animated } from 'react-native';

export interface DriverState {
	// sender bottom
	bottom: number;
	driver: Driver | undefined;
	setDriver: React.Dispatch<React.SetStateAction<Driver | undefined>>;
	setTranslateY: (value: Animated.Value) => void;
}

export interface Driver {
	show: (state: DriverState) => void;
	hide: (state: DriverState) => void;
	toggle: (state: DriverState) => void;
	shown: boolean;
	height: number;
	name: string;
}
