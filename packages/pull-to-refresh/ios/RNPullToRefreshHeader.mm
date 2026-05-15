#import "RNPullToRefreshHeader.h"
#import "RNRefreshState.h"
#import "RNRefreshingEvent.h"
#import "RNRefreshOffsetChangedEvent.h"
#import "RNRefreshStateChangedEvent.h"

#import <react/renderer/components/pulltorefresh/PullToRefreshHeaderComponentDescriptor.h>
#import <react/renderer/components/pulltorefresh/EventEmitters.h>
#import <react/renderer/components/pulltorefresh/Props.h>
#import <react/renderer/components/pulltorefresh/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>
#import <React/RCTScrollViewComponentView.h>


static void
RCTSendOffsetEventForNativeAnimations_DEPRECATED(NSInteger tag, CGFloat offset) {
	RNRefreshOffsetChangedEvent *event = [[RNRefreshOffsetChangedEvent alloc] initWithViewTag:@(tag) offset:offset];
	NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:event, @"event", nil];
	[[NSNotificationCenter defaultCenter] postNotificationName:RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED
													  object:nil
													userInfo:userInfo];
}


using namespace facebook::react;

@interface RNPullToRefreshHeader ()

@property(nonatomic, assign) RNRefreshState state;
@property(nonatomic, assign) CGFloat topInset;
@property(nonatomic, assign) CGFloat progressViewOffset;

- (void)setNativeRefreshing:(BOOL)refreshing;
- (void)beginRefreshingWithRefreshEvent:(BOOL)emitRefreshEvent;
- (void)setState:(RNRefreshState)state emitRefreshEvent:(BOOL)emitRefreshEvent;
- (void)settleToRefreshingWithRefreshEvent:(BOOL)emitRefreshEvent;

@end

@implementation RNPullToRefreshHeader {
    BOOL _isInitialRender;
    BOOL _hasObserver;
	__weak UIView *_reactRootView;
}

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load {
	[super load];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
	return concreteComponentDescriptorProvider<PullToRefreshHeaderComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled {
	return NO;
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		static const auto defaultProps = std::make_shared<const PullToRefreshHeaderProps>();
		_props = defaultProps;
        _isInitialRender = YES;
        _hasObserver = NO;
        _state = RNRefreshStateIdle;
		self.hidden = YES;
    }
    return self;
}

- (void)prepareForRecycle {
	[super prepareForRecycle];
	_isInitialRender = YES;
	_hasObserver = NO;
	_state = RNRefreshStateIdle;
	self.refreshing = NO;
}

- (void)dealloc {
	// Ensure observer removed to avoid crashes
	[self removeObserver];
}

- (void)updateState:(const facebook::react::State::Shared &)state oldState:(const facebook::react::State::Shared &)oldState {
	[super updateState:state oldState:oldState];
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
	[super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
	if (layoutMetrics.frame.origin.y < self.progressViewOffset) {
		self.hidden = NO;
	}

	if (self.scrollView) {
		[self adjustScrollViewContentSize];
	}
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps {
	const auto &oldViewProps = static_cast<const PullToRefreshHeaderProps &>(*_props);
	const auto &newViewProps = static_cast<const PullToRefreshHeaderProps &>(*props);

	// `refreshing`
	if (newViewProps.refreshing != oldViewProps.refreshing) {
		self.refreshing = newViewProps.refreshing;
	}

	// `progressViewOffset`
	if (newViewProps.progressViewOffset != oldViewProps.progressViewOffset) {
		self.progressViewOffset = newViewProps.progressViewOffset;
	}

	[super updateProps:props oldProps:oldProps];
}

- (const PullToRefreshHeaderEventEmitter &)eventEmitter {
	return static_cast<const PullToRefreshHeaderEventEmitter &>(*_eventEmitter);
}

- (void)layoutSubviews {
	[super layoutSubviews];

	if (self.backgroundColor == nil) {
		self.backgroundColor = [UIColor clearColor];
	}

	dispatch_async(dispatch_get_main_queue(), ^{
		[self attachToNearestScrollViewIfNeeded];
		if (self.state == RNRefreshStateRefreshing && self->_isInitialRender) {
			[self settleToRefreshingWithRefreshEvent:NO];
		}
		self->_isInitialRender = NO;
	});
}

- (void)setScrollView:(UIScrollView *)scrollView {
	[self removeObserver];
	_scrollView = scrollView;
	_scrollView.bounces = YES;
	[self addObserver];
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
	[super willMoveToWindow:newWindow];
	if (newWindow) {
		[self attachToNearestScrollViewIfNeeded];
		[self addObserver];
	} else {
		// Ensure contentInset is restored when detached while still refreshing.
		if (self.state == RNRefreshStateRefreshing) {
			[self endRefreshing];
		}
		[self removeObserver];
	}
}

- (void)didMoveToWindow {
	[super didMoveToWindow];
	if (self.window) {
		[self cacheRootView];
	} else {
		_reactRootView = nil;
	}
}

- (void)attachToNearestScrollViewIfNeeded {
	if (self.scrollView) {
		return;
	}

	UIView *v = self;
	UIScrollView *found = nil;
	while (v) {
		if ([v isKindOfClass:[UIScrollView class]]) {
			found = (UIScrollView *)v;
			break;
		}
		v = v.superview;
	}

	if (found && found != self.scrollView) {
		RCTLogInfo(@"[pull-to-refresh] attaching header to nearest UIScrollView: %@", found);
		[self setScrollView:found];
		[self removeFromSuperview];
		[self.scrollView addSubview:self];
	}
}

- (void)adjustScrollViewContentSize {
	RCTScrollViewComponentView *comp = [RCTScrollViewComponentView findScrollViewComponentViewForView:self];
	CGRect frame = comp.containerView.frame;
	if (frame.origin.y < 0) {
		comp.containerView.frame = CGRectMake(frame.origin.x,
											  0,
											  frame.size.width,
											  frame.size.height + frame.origin.y);
		comp.scrollView.contentSize = comp.containerView.frame.size;
	}
}

- (void)addObserver {
	if (!_hasObserver && self.scrollView) {
		NSKeyValueObservingOptions options = NSKeyValueObservingOptionInitial | NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld;
		[self.scrollView addObserver:self forKeyPath:@"contentOffset" options:options context:nil];
		[self.scrollView addObserver:self forKeyPath:@"contentSize" options:options context:nil];
		_hasObserver = YES;
	}
}

- (void)removeObserver {
	if (_hasObserver && self.scrollView) {
		[self.scrollView removeObserver:self forKeyPath:@"contentOffset" context:nil];
		[self.scrollView removeObserver:self forKeyPath:@"contentSize" context:nil];
	}
	_hasObserver = NO;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
	if (!self.scrollView) {
		return;
	}

	if ([keyPath isEqualToString:@"contentSize"]) {
		[self adjustScrollViewContentSize];
	}

	if (![keyPath isEqualToString:@"contentOffset"]) {
		return;
	}

	CGFloat adjustedTop = 0;
	if (@available(iOS 11.0, *)) {
		adjustedTop = self.scrollView.adjustedContentInset.top;
	} else {
		adjustedTop = self.scrollView.contentInset.top;
	}

	CGFloat rawOffsetY = self.scrollView.contentOffset.y;
	CGFloat pullDistance = - (rawOffsetY + adjustedTop);

	if (pullDistance > 0) {
		[self dispatchOnOffsetChanged:pullDistance];
	} else {
		[self dispatchOnOffsetChanged:0.0f];

	}

	[self adjustFrameWithOffset:rawOffsetY adjustedTop:adjustedTop];

	if (self.state == RNRefreshStateRefreshing) {
		return;
	}

	if (pullDistance <= 0) {
		return;
	}

	CGFloat threshold = self.bounds.size.height;

	if (self.scrollView.isDragging) {
		[self cancelRootViewTouches];
		if (self.state == RNRefreshStateIdle && pullDistance >= threshold) {
			self.state = RNRefreshStateComing;
		} else if (self.state == RNRefreshStateComing && pullDistance < threshold) {
			self.state = RNRefreshStateIdle;
		}
		return;
	}

	if (self.state == RNRefreshStateComing) {
		[self beginRefreshingWithRefreshEvent:YES];
		return;
	}
}

- (void)adjustFrameWithOffset:(CGFloat)offsetY adjustedTop:(CGFloat)adjustedTop {
	if (self.progressViewOffset != 0) {
		CGRect frame = self.frame;
		CGFloat spinnerY = fmax(-frame.size.height + self.progressViewOffset + offsetY + adjustedTop,
								-frame.size.height + self.progressViewOffset);
		[self setFrame:CGRectMake(frame.origin.x, spinnerY, frame.size.width, frame.size.height)];
	}
}

- (void)dispatchOnOffsetChanged:(CGFloat)offset {
	if (self.state == RNRefreshStateRefreshing) {
		return;
	}
	RCTSendOffsetEventForNativeAnimations_DEPRECATED(self.tag, offset);
	[self eventEmitter].onOffsetChanged({
		.offset = static_cast<float>(offset)
	});
}

#pragma mark - Native commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args {
	if ([commandName isEqualToString:@"setNativeRefreshing"]) {
		if (args.count < 1 || ![args[0] isKindOfClass:[NSNumber class]]) {
#if RCT_DEBUG
			RCTLogError(
				@"%@ command %@ received invalid arguments, expected [boolean].",
				@"PullToRefreshHeader",
				commandName);
#endif
			return;
		}

		BOOL refreshing = [(NSNumber *)args[0] boolValue];
		[self setNativeRefreshing:refreshing];
		return;
	}

#if RCT_DEBUG
	RCTLogError(@"%@ received command %@, which is not a supported command.", @"PullToRefreshHeader", commandName);
#endif
}

- (void)setNativeRefreshing:(BOOL)refreshing {
	[self setRefreshing:refreshing];
}

@dynamic refreshing;

- (BOOL)isRefreshing {
	return self.state == RNRefreshStateRefreshing;
}

- (void)setRefreshing:(BOOL)refreshing {
	if (refreshing) {
		[self beginRefreshing];
	} else {
		[self endRefreshing];
	}
}

- (void)beginRefreshing {
	[self beginRefreshingWithRefreshEvent:NO];
}

- (void)beginRefreshingWithRefreshEvent:(BOOL)emitRefreshEvent {
	[self setState:RNRefreshStateRefreshing emitRefreshEvent:emitRefreshEvent];
}

- (void)endRefreshing {
	[self setState:RNRefreshStateIdle];
}

- (void)setState:(RNRefreshState)state {
	[self setState:state emitRefreshEvent:NO];
}

- (void)setState:(RNRefreshState)state emitRefreshEvent:(BOOL)emitRefreshEvent {
	if (_isInitialRender) {
		_state = state;
		return;
	}

	if (_state == state || !self.scrollView) {
		return;
	}

	RNRefreshState old = _state;
	_state = state;

	if (state == RNRefreshStateIdle && old == RNRefreshStateRefreshing) {
		[self settleToIdle];
		return;
	}

	if (state == RNRefreshStateRefreshing) {
		[self settleToRefreshingWithRefreshEvent:emitRefreshEvent];
		return;
	}

	RCTLogInfo(@"[pull-to-refresh] ReleaseToRefresh");
	[self eventEmitter].onStateChanged({
		.state = static_cast<int>(state)
	});
}

- (void)settleToRefreshingWithRefreshEvent:(BOOL)emitRefreshEvent {
	[self animateToRefreshingState:^(BOOL finished) {
		RCTLogInfo(@"[pull-to-refresh] Refreshing");
		[self eventEmitter].onStateChanged({
			.state = static_cast<int>(RNRefreshStateRefreshing)
		});
		if (emitRefreshEvent) {
			[self eventEmitter].onRefresh({});
		}
	}];
}

- (void)settleToIdle {
	[self animateToIdleState:^(BOOL finished) {
		RCTLogInfo(@"[pull-to-refresh] None");
		[self eventEmitter].onStateChanged({
			.state = static_cast<int>(RNRefreshStateIdle)
		});

	}];
}

- (void)animateToIdleState:(void (^ __nullable)(BOOL finished))completion {
	[UIView animateWithDuration:0.2 delay:0 options:UIViewAnimationOptionBeginFromCurrentState animations:^{
		UIScrollView *scrollView = self.scrollView;
		if (!scrollView) return;
		UIEdgeInsets insets = scrollView.contentInset;
		scrollView.contentInset = UIEdgeInsetsMake(self.topInset, insets.left, insets.bottom, insets.right);
	} completion:completion];
}

- (void)animateToRefreshingState:(void (^ __nullable)(BOOL finished))completion {
	[UIView animateWithDuration:0.2 animations:^{
		UIScrollView *scrollView = self.scrollView;
		if (!scrollView) return;
		UIEdgeInsets insets = scrollView.contentInset;
		self.topInset = insets.top;
		CGFloat newTop = self.topInset + self.bounds.size.height;
		scrollView.contentInset = UIEdgeInsetsMake(newTop, insets.left, insets.bottom, insets.right);
		CGPoint offset = CGPointMake(scrollView.contentOffset.x, -newTop);
		[scrollView setContentOffset:offset animated:NO];
	} completion:completion];
}

- (void)cacheRootView {
	if (_reactRootView) {
		return;
	}

	UIView *v = self;
	while (v) {
		if ([NSStringFromClass([v class]) isEqualToString:@"RCTSurfaceView"]) {
			_reactRootView = v;
			return;
		}
		v = v.superview;
	}
}

- (void)cancelRootViewTouches {
	if (!_reactRootView) {
		return;
	}
	[self cancelTouchesInView:_reactRootView];
}

- (void)cancelTouchesInView:(UIView *)view {
	NSArray<UIGestureRecognizer *> *gestureRecognizers = view.gestureRecognizers;
	if (gestureRecognizers.count > 0) {
		for (UIGestureRecognizer *gr in gestureRecognizers) {
			Class surfaceTouchHandlerClass = NSClassFromString(@"RCTSurfaceTouchHandler");
			if (surfaceTouchHandlerClass && [gr isKindOfClass:surfaceTouchHandlerClass]) {
				gr.enabled = NO;
				gr.enabled = YES;
				continue;
			}
		}
	}
}

@end
