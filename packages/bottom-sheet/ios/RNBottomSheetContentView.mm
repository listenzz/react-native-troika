#import "RNBottomSheetContentView.h"

#import <CoreGraphics/CoreGraphics.h>
#import <UIKit/UIKit.h>

#import <react/renderer/components/bottomsheet/BottomSheetContentViewComponentDescriptor.h>
#import <react/renderer/components/bottomsheet/BottomSheetContentViewShadowNode.h>
#import <react/renderer/components/bottomsheet/EventEmitters.h>
#import <react/renderer/components/bottomsheet/Props.h>
#import <react/renderer/components/bottomsheet/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation RNBottomSheetContentView {
	std::shared_ptr<const BottomSheetContentViewShadowNode::ConcreteState> _state;
}

+ (void)load {
	[super load];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
	return concreteComponentDescriptorProvider<BottomSheetContentViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		static const auto defaultProps = std::make_shared<const BottomSheetContentViewProps>();
		_props = defaultProps;
	}
	return self;
}

- (void)updateState:(const facebook::react::State::Shared &)state oldState:(const facebook::react::State::Shared &)oldState {
	_state = std::static_pointer_cast<const BottomSheetContentViewShadowNode::ConcreteState>(state);
}

- (void)updateContentOffset:(CGFloat)contentOffset {
	if (!_state) {
		return;
	}
	_state->updateState(
		[contentOffset](const BottomSheetContentViewShadowNode::ConcreteState::Data &oldData) -> BottomSheetContentViewShadowNode::ConcreteState::SharedData {
			auto newData = oldData;
			newData.contentOffset = static_cast<double>(contentOffset);
			return std::make_shared<BottomSheetContentViewShadowNode::ConcreteState::Data>(newData);
		});
}

- (BOOL)_isBackgroundTransparent {
	if (self.backgroundColor == nil) {
		return YES;
	}
	return CGColorGetAlpha(self.backgroundColor.CGColor) < 1.0;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
	UIView *hit = [super hitTest:point withEvent:event];
	// 背景透明时相当于 BOX_NONE：只有子视图接收触摸，自身不接收
	if ([self _isBackgroundTransparent] && hit == self) {
		return nil;
	}
	return hit;
}

@end
