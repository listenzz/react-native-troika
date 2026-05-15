#import "RNPullToRefreshFooter.h"
#import "RNRefreshState.h"
#import "RNRefreshingEvent.h"
#import "RNRefreshOffsetChangedEvent.h"
#import "RNRefreshStateChangedEvent.h"

#import <react/renderer/components/pulltorefresh/PullToRefreshFooterComponentDescriptor.h>
#import <react/renderer/components/pulltorefresh/EventEmitters.h>
#import <react/renderer/components/pulltorefresh/Props.h>
#import <react/renderer/components/pulltorefresh/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>

static void
RCTSendOffsetEventForNativeAnimations_DEPRECATED(NSInteger tag, CGFloat offset) {
	RNRefreshOffsetChangedEvent *event = [[RNRefreshOffsetChangedEvent alloc] initWithViewTag:@(tag) offset:offset];
	NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:event, @"event", nil];
	[[NSNotificationCenter defaultCenter] postNotificationName:RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED
													  object:nil
													userInfo:userInfo];
}

using namespace facebook::react;

@interface RNPullToRefreshFooter ()

@property(nonatomic, assign) RNRefreshState state;
@property(nonatomic, assign) CGFloat bottomInset;

- (void)setNativeRefreshing:(BOOL)refreshing;
- (void)beginRefreshingWithRefreshEvent:(BOOL)emitRefreshEvent;
- (void)setState:(RNRefreshState)state emitRefreshEvent:(BOOL)emitRefreshEvent;

@end

@implementation RNPullToRefreshFooter {
	PullToRefreshFooterShadowNode::ConcreteState::Shared _shadowState;
	BOOL _hasObserver;
	__weak UIView *_reactRootView;
}

static void *kKVOContextContentOffset = &kKVOContextContentOffset;
static void *kKVOContextContentSize = &kKVOContextContentSize;

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load {
	[super load];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
	return concreteComponentDescriptorProvider<PullToRefreshFooterComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled {
	return NO;
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		static const auto defaultProps = std::make_shared<const PullToRefreshFooterProps>();
		_props = defaultProps;
		_hasObserver = NO;
		_state = RNRefreshStateIdle;
		_noMoreData = NO;
		_manual = NO;
		self.hidden = YES;
	}
	return self;
}

- (void)dealloc {
	[self removeObserver];
}

- (void)prepareForRecycle {
	[super prepareForRecycle];
	_hasObserver = NO;
	_state = RNRefreshStateIdle;
	_noMoreData = NO;
	_manual = NO;
}

- (void)updateState:(const facebook::react::State::Shared &)state oldState:(const facebook::react::State::Shared &)oldState {
	_shadowState = std::static_pointer_cast<PullToRefreshFooterShadowNode::ConcreteState const>(state);
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
	[super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
	if (layoutMetrics.frame.origin.y > 0) {
		[self adjustContentInset];
	}
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps {
	const auto &oldViewProps = static_cast<const PullToRefreshFooterProps &>(*_props);
	const auto &newViewProps = static_cast<const PullToRefreshFooterProps &>(*props);

	// `refreshing`
	if (newViewProps.refreshing != oldViewProps.refreshing) {
		self.refreshing = newViewProps.refreshing;
	}

	// `noMoreData`
	if (newViewProps.noMoreData != oldViewProps.noMoreData) {
		self.noMoreData = newViewProps.noMoreData;
	}

	// `manual`
	if (newViewProps.manual != oldViewProps.manual) {
		self.manual = newViewProps.manual;
	}

	[super updateProps:props oldProps:oldProps];
}

- (const PullToRefreshFooterEventEmitter &)eventEmitter {
	return static_cast<const PullToRefreshFooterEventEmitter &>(*_eventEmitter);
}

- (void)layoutSubviews {
	[super layoutSubviews];
	if (self.backgroundColor == nil) {
		self.backgroundColor = [UIColor clearColor];
	}
}

- (void)adjustContentInset {
	// 如果不是 full scroll view（内容不满一屏）或手动模式，隐藏 footer 或调整 inset
	self.hidden = ![self isFullScrollView];
	if (!self.manual) {
		[self setScrollViewContentInset];
	}
}

- (void)setScrollViewContentInset {
	if (!self.scrollView) {
		return;
	}

	UIEdgeInsets insets = self.scrollView.contentInset;
	UIEdgeInsets newInsets = insets;
	newInsets.bottom = self.hidden ? 0 : self.frame.size.height;

	if (!UIEdgeInsetsEqualToEdgeInsets(insets, newInsets)) {
		dispatch_async(dispatch_get_main_queue(), ^{
			self.scrollView.contentInset = newInsets;
		});
	}
}

- (void)updateState {
	if (!self.scrollView || self.frame.size.height == 0) {
		return;
	}

	CGSize contentSize = self.scrollView.contentSize;
	if (self.frame.origin.y != contentSize.height) {
		auto capturedContentHeight = contentSize.height;
		_shadowState->updateState(
			[=](PullToRefreshFooterShadowNode::ConcreteState::Data const &oldData)
				-> PullToRefreshFooterShadowNode::ConcreteState::SharedData {
					auto newData = oldData;
					newData.contentHeight = capturedContentHeight;
					return std::make_shared<PullToRefreshFooterShadowNode::ConcreteState::Data const>(newData);
				});
	}
}

- (void)setScrollView:(UIScrollView *)scrollView {
	[self removeObserver];
	_scrollView = scrollView;
	[self addObserver];
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
	[super willMoveToWindow:newWindow];
	if (newWindow) {
		[self addObserver];
	} else {
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

- (void)addObserver {
	if (_hasObserver || !self.scrollView) {
		return;
	}

	NSKeyValueObservingOptions options = NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld;
	@try {
		[self.scrollView addObserver:self forKeyPath:@"contentOffset" options:options context:kKVOContextContentOffset];
		[self.scrollView addObserver:self forKeyPath:@"contentSize" options:options context:kKVOContextContentSize];
		_hasObserver = YES;
	} @catch (NSException *exception) {
		RCTLogWarn(@"RNPullToRefreshFooter: addObserver failed: %@", exception);
		_hasObserver = NO;
	}
}

- (void)removeObserver {
	if (!_hasObserver || !self.scrollView) {
		return;
	}
	@try {
		[self.scrollView removeObserver:self forKeyPath:@"contentOffset" context:kKVOContextContentOffset];
		[self.scrollView removeObserver:self forKeyPath:@"contentSize" context:kKVOContextContentSize];
	} @catch (NSException *exception) {
		RCTLogWarn(@"RNPullToRefreshFooter: removeObserver failed: %@", exception);
	}
	_hasObserver = NO;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
	if (object != self.scrollView) {
		return;
	}

	if (context == kKVOContextContentSize) {
		dispatch_async(dispatch_get_main_queue(), ^{
			[self adjustContentInset];
			[self updateState];
		});
		return;
	}

	if (context == kKVOContextContentOffset) {
		CGPoint newPoint = [change[NSKeyValueChangeNewKey] CGPointValue];
		CGPoint oldPoint = [change[NSKeyValueChangeOldKey] CGPointValue];

		// 立即可见 footer 的最小偏移
		CGFloat minRange = self.scrollView.contentSize.height - self.scrollView.frame.size.height;

		if (newPoint.y >= minRange) {
			CGFloat offset = newPoint.y - minRange;
			RCTSendOffsetEventForNativeAnimations_DEPRECATED(self.tag, offset);
			[self eventEmitter].onOffsetChanged({
				.offset = offset
			});
		}

		if (self.hidden || self.noMoreData) {
			return;
		}

		if (self.state == RNRefreshStateRefreshing) {
			return;
		}

		if (![self isFullScrollView]) { // 内容不满一屏
			return;
		}

		if (self.scrollView.isDragging) {
			[self cancelRootViewTouches];
		}

		CGFloat offsetY = newPoint.y;
		// 手动触发模式
		if (self.manual) {
			if (offsetY < minRange) {
				// 未到临界点，返回
				return;
			}

			// 完全可见 footer 时的最大范围
			CGFloat maxRange = minRange + self.bounds.size.height;

			if (self.scrollView.isDragging) {
				if (self.state == RNRefreshStateIdle && offsetY >= maxRange) {
					self.state = RNRefreshStateComing;
				} else if (self.state == RNRefreshStateComing && offsetY <= maxRange) {
					self.state = RNRefreshStateIdle;
				}
				return;
			}

			// 松手后，如果处于 coming 状态则触发刷新
			if (self.state == RNRefreshStateComing) {
				[self beginRefreshingWithRefreshEvent:YES];
				return;
			}

			return;
		}

		// 非手动（自动触发）模式：当用户继续上拉并超过阈值时触发
		CGFloat range = self.scrollView.contentSize.height - self.scrollView.frame.size.height + self.frame.size.height * 0.3;
		if (newPoint.y > oldPoint.y && offsetY >= range) {
			if (self.state == RNRefreshStateIdle) {
				[self beginRefreshingWithRefreshEvent:YES];
			}
		}
	}
}

- (BOOL)isFullScrollView {
	// 内容是否能撑满 scrollView（同时考虑上下 inset）
	CGFloat range = self.scrollView.contentInset.top + self.scrollView.contentSize.height + self.scrollView.contentInset.bottom;
	CGFloat height = self.scrollView.frame.size.height;
	return range >= height;
}

#pragma mark - Native commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args {
	if ([commandName isEqualToString:@"setNativeRefreshing"]) {
		if (args.count < 1 || ![args[0] isKindOfClass:[NSNumber class]]) {
#if RCT_DEBUG
			RCTLogError(
				@"%@ command %@ received invalid arguments, expected [boolean].",
				@"PullToRefreshFooter",
				commandName);
#endif
			return;
		}

		BOOL refreshing = [(NSNumber *)args[0] boolValue];
		[self setNativeRefreshing:refreshing];
		return;
	}

#if RCT_DEBUG
	RCTLogError(@"%@ received command %@, which is not a supported command.", @"PullToRefreshFooter", commandName);
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
	if (_state == state || !self.scrollView) {
		return;
	}

	RNRefreshState old = _state;
	_state = state;

	[self eventEmitter].onStateChanged({
		.state = static_cast<int>(state)
	});

	if (state == RNRefreshStateIdle && old == RNRefreshStateRefreshing) {
		if (self.manual) {
			[self animateToIdleState];
		}
		return;
	}

	if (state == RNRefreshStateRefreshing) {
		if (self.manual) {
			[self animateToRefreshingState];
		}
		if (emitRefreshEvent) {
			[self eventEmitter].onRefresh({});
		}
		return;
	}
}

- (void)animateToIdleState {
	dispatch_async(dispatch_get_main_queue(), ^{
		[UIView animateWithDuration:0.2 animations:^{
			UIScrollView *scrollView = self.scrollView;
			if (!scrollView) { return; }
			UIEdgeInsets insets = scrollView.contentInset;
			scrollView.contentInset = UIEdgeInsetsMake(insets.top, insets.left, self.bottomInset, insets.right);
		} completion:NULL];
	});
}

- (void)animateToRefreshingState {
	dispatch_async(dispatch_get_main_queue(), ^{
		[UIView animateWithDuration:0.2 animations:^{
			UIScrollView *scrollView = self.scrollView;
			if (!scrollView) { return; }
			CGFloat range = scrollView.contentSize.height - scrollView.frame.size.height + self.bounds.size.height;
			UIEdgeInsets insets = scrollView.contentInset;
			self.bottomInset = insets.bottom;
			scrollView.contentInset = UIEdgeInsetsMake(insets.top, insets.left, self.frame.size.height, insets.right);
			CGPoint offset = CGPointMake(scrollView.contentOffset.x, range);
			[scrollView setContentOffset:offset animated:NO];
		} completion:NULL];
	});
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
