#import "RNNestedScrollViewContent.h"

#import <react/renderer/components/nestedscrollview/NestedScrollViewContentComponentDescriptor.h>
#import <react/renderer/components/nestedscrollview/EventEmitters.h>
#import <react/renderer/components/nestedscrollview/Props.h>
#import <react/renderer/components/nestedscrollview/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>

using namespace facebook::react;

@implementation RNNestedScrollViewContent

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load {
	[super load];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
	return concreteComponentDescriptorProvider<NestedScrollViewContentComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled {
	return NO;
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		static const auto defaultProps = std::make_shared<const NestedScrollViewContentProps>();
		_props = defaultProps;
	}
	return self;
}

@end
