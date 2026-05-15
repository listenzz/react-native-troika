#import "RNWheelPickerComponentView.h"
#import "RNWheelPicker.h"

#import <React/RCTLog.h>
#import <React/RCTFont.h>
#import <React/RCTConversions.h>

#import <react/renderer/components/wheelpicker/ComponentDescriptors.h>
#import <react/renderer/components/wheelpicker/EventEmitters.h>
#import <react/renderer/components/wheelpicker/Props.h>
#import <react/renderer/components/wheelpicker/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation RNWheelPickerComponentView {
	RNWheelPicker *_wheelPicker;
}

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load {
	[super load];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
	return concreteComponentDescriptorProvider<WheelPickerComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled {
	return NO;
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		_wheelPicker = [[RNWheelPicker alloc] initWithFrame:self.bounds];

		RNWheelPickerComponentView * __weak weakSelf = self;
		_wheelPicker.onItemSelected = ^(NSInteger index) {
			[weakSelf dispatchOnItemSelected:index];
		};

		self.contentView = _wheelPicker;
	}
	return self;
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps {
	const auto &oldViewProps = static_cast<const WheelPickerProps &>(*_props);
	const auto &newViewProps = static_cast<const WheelPickerProps &>(*props);

	// `selectedIndex`
	if (newViewProps.selectedIndex != oldViewProps.selectedIndex) {
		_wheelPicker.selectedIndex = newViewProps.selectedIndex;
	}

	// `items`
	if (newViewProps.items != oldViewProps.items) {
		_wheelPicker.items = NSArrayFromVector(newViewProps.items);
	}

	// `fontSize`
	if (newViewProps.fontSize != oldViewProps.fontSize) {
		_wheelPicker.font = [RCTFont updateFont:_wheelPicker.font withSize:@(newViewProps.fontSize)];
	}

	// `itemHeight`
	if (newViewProps.itemHeight != oldViewProps.itemHeight) {
		_wheelPicker.itemHeight = newViewProps.itemHeight;
	}

	// `textColorCenter`
	if (newViewProps.textColorCenter != oldViewProps.textColorCenter) {
		_wheelPicker.textColorCenter = RCTUIColorFromSharedColor(newViewProps.textColorCenter);
	}

	// `textColorOut`
	if (newViewProps.textColorOut != oldViewProps.textColorOut) {
		_wheelPicker.textColorOut = RCTUIColorFromSharedColor(newViewProps.textColorOut);
	}

	// `cyclic`
	if (newViewProps.cyclic != oldViewProps.cyclic) {
		_wheelPicker.cyclic = newViewProps.cyclic;
	}

	[super updateProps:props oldProps:oldProps];
}

static NSArray<NSString *> *NSArrayFromVector(const std::vector<std::string> &items,
											  NSStringEncoding encoding = NSUTF8StringEncoding) {
  NSMutableArray<NSString *> *result = [NSMutableArray arrayWithCapacity:items.size()];
  for (const auto &s : items) {
	NSString *ns = RCTNSStringFromString(s, encoding);
	[result addObject:ns];
  }
  return [result copy];
}

- (const WheelPickerEventEmitter &)eventEmitter {
	return static_cast<const WheelPickerEventEmitter &>(*_eventEmitter);
}

- (void)dispatchOnItemSelected:(NSInteger)selectedIndex {
	[self eventEmitter].onItemSelected({
		.selectedIndex = static_cast<int>(selectedIndex)
	});
}

@end
