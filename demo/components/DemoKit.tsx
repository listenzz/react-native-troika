import React, { ReactNode } from 'react';
import {
	FlatList,
	Image,
	ListRenderItem,
	Platform,
	ScrollView,
	StyleProp,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const demoTheme = {
	colors: {
		background: '#F6F7F9',
		surface: '#FFFFFF',
		text: '#121826',
		muted: '#667085',
		subtle: '#98A2B3',
		line: '#E4E7EC',
		blue: '#2563EB',
		cyan: '#0891B2',
		green: '#168A5A',
		amber: '#B7791F',
		rose: '#C02668',
		indigo: '#4F46E5',
		violet: '#7C3AED',
		orange: '#C2410C',
	},
};

export interface DemoItem {
	title: string;
	subtitle?: string;
	badge?: string;
	accentColor?: string;
}

interface DemoListProps<T extends DemoItem> {
	title: string;
	subtitle?: string;
	eyebrow?: string;
	data: Array<T>;
	accentColor?: string;
	headerMedia?: ReactNode;
	contentContainerStyle?: StyleProp<ViewStyle>;
	onItemPress: (item: T) => void;
	keyExtractor?: (item: T, index: number) => string;
}

interface DemoListHeaderProps {
	title: string;
	subtitle?: string;
	eyebrow?: string;
	accentColor?: string;
	children?: ReactNode;
}

interface DemoScreenProps extends DemoListHeaderProps {
	children: ReactNode;
	contentContainerStyle?: StyleProp<ViewStyle>;
}

interface DemoPanelProps {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}

interface DemoSafeAreaViewProps {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	edges?: Array<'top' | 'bottom'>;
}

interface DemoButtonProps {
	title: string;
	accentColor?: string;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
}

export function DemoList<T extends DemoItem>({
	title,
	subtitle,
	eyebrow,
	data,
	accentColor = demoTheme.colors.blue,
	headerMedia,
	contentContainerStyle,
	onItemPress,
	keyExtractor,
}: DemoListProps<T>) {
	const insets = useSafeAreaInsets();
	const renderItem: ListRenderItem<T> = ({ item, index }) => (
		<DemoListCard
			item={item}
			index={index}
			accentColor={item.accentColor ?? accentColor}
			onPress={() => onItemPress(item)}
		/>
	);

	return (
		<FlatList
			style={styles.screen}
			contentContainerStyle={[
				styles.listContent,
				contentContainerStyle,
				{
					paddingTop: insets.top + pagePaddingTop,
					paddingBottom: insets.bottom + pagePaddingBottom,
				},
			]}
			data={data}
			keyExtractor={keyExtractor ?? ((item, index) => `${item.title}-${index}`)}
			ListHeaderComponent={
				<DemoListHeader
					title={title}
					subtitle={subtitle}
					eyebrow={eyebrow}
					accentColor={accentColor}
				>
					{headerMedia}
				</DemoListHeader>
			}
			renderItem={renderItem}
			showsVerticalScrollIndicator={false}
		/>
	);
}

export function DemoScreen({
	title,
	subtitle,
	eyebrow,
	accentColor = demoTheme.colors.blue,
	children,
	contentContainerStyle,
}: DemoScreenProps) {
	const insets = useSafeAreaInsets();

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={[
				styles.screenContent,
				contentContainerStyle,
				{
					paddingTop: insets.top + pagePaddingTop,
					paddingBottom: insets.bottom + pagePaddingBottom,
				},
			]}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
		>
			<DemoListHeader
				title={title}
				subtitle={subtitle}
				eyebrow={eyebrow}
				accentColor={accentColor}
			/>
			{children}
		</ScrollView>
	);
}

export function DemoListHeader({
	title,
	subtitle,
	eyebrow,
	accentColor = demoTheme.colors.blue,
	children,
}: DemoListHeaderProps) {
	return (
		<View style={styles.header}>
			{eyebrow ? (
				<Text style={[styles.eyebrow, { color: accentColor }]}>{eyebrow}</Text>
			) : null}
			<Text
				style={styles.headerTitle}
				numberOfLines={2}
				adjustsFontSizeToFit
				minimumFontScale={0.82}
			>
				{title}
			</Text>
			{subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
			<View style={[styles.headerLine, { backgroundColor: accentColor }]} />
			{children ? <View style={styles.headerMedia}>{children}</View> : null}
		</View>
	);
}

export function DemoPanel({ children, style }: DemoPanelProps) {
	return <View style={[styles.panel, style]}>{children}</View>;
}

export function DemoSafeAreaView({
	children,
	style,
	edges = ['top', 'bottom'],
}: DemoSafeAreaViewProps) {
	const insets = useSafeAreaInsets();

	return (
		<View
			style={[
				styles.safeArea,
				style,
				{
					paddingTop: edges.includes('top') ? insets.top : 0,
					paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
				},
			]}
		>
			{children}
		</View>
	);
}

export function DemoButton({
	title,
	accentColor = demoTheme.colors.blue,
	disabled = false,
	style,
	onPress,
}: DemoButtonProps) {
	return (
		<TouchableOpacity
			activeOpacity={0.82}
			style={[
				styles.button,
				{ backgroundColor: disabled ? demoTheme.colors.subtle : accentColor },
				style,
			]}
			disabled={disabled}
			onPress={onPress}
		>
			<Text
				style={styles.buttonText}
				numberOfLines={1}
				adjustsFontSizeToFit
				minimumFontScale={0.82}
			>
				{title}
			</Text>
		</TouchableOpacity>
	);
}

function DemoListCard({
	item,
	index,
	accentColor,
	onPress,
}: {
	item: DemoItem;
	index: number;
	accentColor: string;
	onPress: () => void;
}) {
	return (
		<TouchableOpacity activeOpacity={0.82} style={styles.itemCard} onPress={onPress}>
			<View style={[styles.itemMark, { backgroundColor: tint(accentColor, '18') }]}>
				<Text style={[styles.itemNumber, { color: accentColor }]}>
					{String(index + 1).padStart(2, '0')}
				</Text>
			</View>
			<View style={styles.itemTextColumn}>
				<Text style={styles.itemTitle} numberOfLines={2}>
					{item.title}
				</Text>
				{item.subtitle ? (
					<Text style={styles.itemSubtitle} numberOfLines={2}>
						{item.subtitle}
					</Text>
				) : null}
			</View>
			{item.badge ? (
				<View style={[styles.badge, { backgroundColor: tint(accentColor, '12') }]}>
					<Text style={[styles.badgeText, { color: accentColor }]} numberOfLines={1}>
						{item.badge}
					</Text>
				</View>
			) : null}
			<Image
				source={require('assets/indicator.png')}
				style={styles.chevron}
				resizeMode="contain"
			/>
		</TouchableOpacity>
	);
}

function tint(color: string, alpha: string) {
	if (color.startsWith('#') && color.length === 7) {
		return `${color}${alpha}`;
	}
	return '#EEF2FF';
}

const elevated = Platform.select({
	ios: {
		shadowColor: '#101828',
		shadowOpacity: 0.08,
		shadowRadius: 14,
		shadowOffset: { width: 0, height: 8 },
	},
	android: {
		elevation: 2,
	},
	default: {},
});

const pagePaddingTop = 18;
const pagePaddingBottom = 28;

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: demoTheme.colors.background,
	},
	listContent: {
		paddingHorizontal: 16,
	},
	screenContent: {
		paddingHorizontal: 16,
	},
	safeArea: {
		flex: 1,
	},
	header: {
		paddingTop: 4,
		paddingBottom: 18,
	},
	eyebrow: {
		fontSize: 12,
		lineHeight: 16,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0,
		marginBottom: 8,
	},
	headerTitle: {
		color: demoTheme.colors.text,
		fontSize: 30,
		lineHeight: 36,
		fontWeight: '800',
		letterSpacing: 0,
	},
	headerSubtitle: {
		color: demoTheme.colors.muted,
		fontSize: 15,
		lineHeight: 22,
		marginTop: 8,
	},
	headerLine: {
		width: 48,
		height: 4,
		borderRadius: 2,
		marginTop: 14,
	},
	headerMedia: {
		marginTop: 18,
	},
	itemCard: {
		minHeight: 82,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: demoTheme.colors.surface,
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: demoTheme.colors.line,
		marginBottom: 10,
		paddingVertical: 14,
		paddingLeft: 14,
		paddingRight: 12,
		...elevated,
	},
	itemMark: {
		width: 44,
		height: 44,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	itemNumber: {
		fontSize: 13,
		lineHeight: 18,
		fontWeight: '800',
		letterSpacing: 0,
	},
	itemTextColumn: {
		flex: 1,
		minWidth: 0,
		marginRight: 10,
	},
	itemTitle: {
		color: demoTheme.colors.text,
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '700',
		letterSpacing: 0,
	},
	itemSubtitle: {
		color: demoTheme.colors.muted,
		fontSize: 13,
		lineHeight: 18,
		marginTop: 3,
	},
	badge: {
		maxWidth: 86,
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 5,
		marginRight: 8,
	},
	badgeText: {
		fontSize: 12,
		lineHeight: 15,
		fontWeight: '700',
		letterSpacing: 0,
	},
	chevron: {
		width: 14,
		height: 14,
		tintColor: demoTheme.colors.subtle,
	},
	panel: {
		backgroundColor: demoTheme.colors.surface,
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: demoTheme.colors.line,
		padding: 18,
		marginBottom: 14,
		...elevated,
	},
	button: {
		height: 48,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 18,
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '700',
		letterSpacing: 0,
	},
});
