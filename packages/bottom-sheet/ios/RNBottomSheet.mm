#import "RNBottomSheet.h"
#import "RNBottomSheetStateChangedEvent.h"
#import "RNBottomSheetOffsetChangedEvent.h"

#import "RNBottomSheetContentView.h"

#import <react/renderer/components/bottomsheet/ComponentDescriptors.h>
#import <react/renderer/components/bottomsheet/EventEmitters.h>
#import <react/renderer/components/bottomsheet/Props.h>
#import <react/renderer/components/bottomsheet/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>


static void
RCTSendOffsetForNativeAnimations_DEPRECATED(NSInteger tag,
											CGFloat progress,
											CGFloat offset,
											CGFloat minY,
											CGFloat maxY) {
	RNBottomSheetOffsetChangedEvent *event =[[RNBottomSheetOffsetChangedEvent alloc] initWithViewTag:@(tag) progress:progress offset:offset minY:minY maxY:maxY];
	NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:event, @"event", nil];
	[[NSNotificationCenter defaultCenter] postNotificationName:RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED
													  object:nil
													userInfo:userInfo];
}

static void
RCTSendStateForNativeAnimations_DEPRECATED(NSInteger tag, NSString *state) {
	RNBottomSheetStateChangedEvent *event =[[RNBottomSheetStateChangedEvent alloc] initWithViewTag:@(tag) state:state];
	NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:event, @"event", nil];
	[[NSNotificationCenter defaultCenter] postNotificationName:RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED
													  object:nil
													userInfo:userInfo];
}


using namespace facebook::react;

@interface RNBottomSheet () <UIGestureRecognizerDelegate>

@property(nonatomic, assign) BottomSheetStatus status;
@property(nonatomic, assign) BottomSheetStatus finalStatus;
@property(nonatomic, assign) BOOL draggable;
@property(nonatomic, assign) CGFloat peekHeight;
@property(nonatomic, assign) CGFloat minY;
@property(nonatomic, assign) CGFloat maxY;
@property(nonatomic, assign) BOOL nextReturn;

@property(nonatomic, strong) UIView *child;
@property(nonatomic, strong) UIScrollView *target;
@property(nonatomic, strong) UIPanGestureRecognizer *panGestureRecognizer;
@property(nonatomic, strong) CADisplayLink *displayLink;
@property(nonatomic, strong) UIViewPropertyAnimator *animator;

@end

@implementation RNBottomSheet {
	__weak UIView *_rootView;
	BOOL _isInitialRender;
	__weak UIView *_reactRootView;
	CGFloat _layoutContentTop;  // 子 View 的布局 origin.y，用于 contentOffset = 实际 top - 布局 top
}

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load {
	[super load];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
	return concreteComponentDescriptorProvider<BottomSheetComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled {
	return NO;
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		static const auto defaultProps = std::make_shared<const BottomSheetProps>();
		_props = defaultProps;
		_panGestureRecognizer = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handlePan:)];
		_panGestureRecognizer.delegate = self;
		_draggable = YES;
		_peekHeight = 200;
		_status = BottomSheetStatus::Collapsed;
		_finalStatus = BottomSheetStatus::Collapsed;
		_isInitialRender = YES;
		_layoutContentTop = NAN;
	}
	return self;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
	UIView *hitView = [super hitTest:point withEvent:event];
	if (hitView == self) {
		return nil;
	}
	return hitView;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
	[super mountChildComponentView:childComponentView index:index];
	if ([childComponentView isKindOfClass:[UIView class]] && index == 0) {
		self.child = (UIView *)childComponentView;
		[self.child addGestureRecognizer:_panGestureRecognizer];
	}
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
	if (self.child == childComponentView) {
		[self.child removeGestureRecognizer:_panGestureRecognizer];
	}
	[super unmountChildComponentView:childComponentView index:index];
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps {
	const auto &oldViewProps = static_cast<const BottomSheetProps &>(*_props);
	const auto &newViewProps = static_cast<const BottomSheetProps &>(*props);

	// `draggable`
	if (newViewProps.draggable != oldViewProps.draggable) {
		self.draggable = newViewProps.draggable;
	}

	// `peekHeight`
	if (newViewProps.peekHeight != oldViewProps.peekHeight) {
		self.peekHeight = newViewProps.peekHeight;
	}

	// `status`
	if (newViewProps.status != oldViewProps.status) {
		self.status = newViewProps.status;
	}

	[super updateProps:props oldProps:oldProps];
}

- (const BottomSheetEventEmitter &)eventEmitter {
	return static_cast<const BottomSheetEventEmitter &>(*_eventEmitter);
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer {
	if (gestureRecognizer == self.panGestureRecognizer && otherGestureRecognizer == self.target.panGestureRecognizer) {
		return YES;
	}
	return NO;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer {
	if (gestureRecognizer == self.panGestureRecognizer) {
		if ([super gestureRecognizerShouldBegin:gestureRecognizer]) {
			[self cancelRootViewTouches];
			return YES;
		}
		return NO;
	}
	return [super gestureRecognizerShouldBegin:gestureRecognizer];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch {
	if (!self.draggable) {
		return NO;
	}

	if (gestureRecognizer != self.panGestureRecognizer) {
		return YES;
	}

	if (self.target) {
		[self.target removeObserver:self forKeyPath:@"contentOffset"];
	}
	self.target = nil;

	UIView *touchView = touch.view;

	while (touchView != nil && [touchView isDescendantOfView:self]) {
		if ([touchView isKindOfClass:[UIScrollView class]]) {
			UIScrollView *scrollView = (UIScrollView *)touchView;
			if (![self isHorizontal:scrollView]) {
				self.target = scrollView;
				[self.target addObserver:self forKeyPath:@"contentOffset" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
				break;
			}
		}
		touchView = touchView.superview;
	}

	return YES;
}

- (void)willMoveToSuperview:(UIView *)superview {
	[super willMoveToSuperview:superview];
	if (superview == nil) {
		[self stopWatchBottomSheetTransition];
		if (self.target) {
			[self.target removeObserver:self forKeyPath:@"contentOffset"];
			self.target = nil;
		}
	}
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
	[super willMoveToWindow:newWindow];
	if (newWindow == nil) {
		[self stopWatchBottomSheetTransition];
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

- (BOOL)isHorizontal:(UIScrollView *)scrollView {
	return scrollView.contentSize.width > self.frame.size.width;
}

- (void)layoutSubviews {
	[super layoutSubviews];

	if (!self.child) {
		return;
	}

	[self layoutChild];

	dispatch_async(dispatch_get_main_queue(), ^{
		if (self.finalStatus == BottomSheetStatus::Expanded && self->_isInitialRender) {
			[self settleToStatus:self.finalStatus withFling:YES];
		}

		self->_isInitialRender = NO;
	});
}

- (void)layoutChild {
	if (!CGRectEqualToRect(self.child.frame, CGRectZero) && !CGRectEqualToRect(self.frame, CGRectZero)) {
		[self calculateOffset];
		// 仅当当前 frame.origin.y 不是“本轮要设的目标”时才视为布局结果并捕获，避免初始 collapsed + peekHeight 0 时误把已是 maxY 的 frame 当布局
		if (isnan(_layoutContentTop)) {
			CGFloat currentY = self.child.frame.origin.y;
			CGFloat targetY = (self.status == BottomSheetStatus::Collapsed) ? self.maxY
				: (self.status == BottomSheetStatus::Expanded) ? self.minY
				: (CGFloat)self.frame.size.height;
			if (fabs(currentY - targetY) > 0.5) {
				_layoutContentTop = currentY;
			} else {
				_layoutContentTop = self.minY;  // 无法区分时假定布局在 minY（展开位）
			}
		}
		if (self.status == BottomSheetStatus::Collapsed) {
			self.child.frame = CGRectOffset(self.child.frame, 0, self.maxY - self.child.frame.origin.y);
		} else if (self.status == BottomSheetStatus::Expanded) {
			self.child.frame = CGRectOffset(self.child.frame, 0, self.minY - self.child.frame.origin.y);
		} else if (self.status == BottomSheetStatus::Hidden) {
			self.child.frame = CGRectOffset(self.child.frame, 0, self.frame.size.height - self.child.frame.origin.y);
		}
		[self dispatchOnSlide:self.child.frame.origin.y];
	}
}

- (void)calculateOffset {
	CGFloat parentHeight = self.frame.size.height;
	self.minY = fmax(0, parentHeight - self.child.frame.size.height);
	self.maxY = fmax(self.minY, parentHeight - self.peekHeight);
}

- (void)handlePan:(UIPanGestureRecognizer *)pan {
	if (!self.draggable || self.status == BottomSheetStatus::Settling) {
		return;
	}

	CGFloat translationY = [pan translationInView:self.child].y;
	[pan setTranslation:CGPointZero inView:self.child];

	CGFloat top = self.child.frame.origin.y;

	if (pan.state == UIGestureRecognizerStateChanged) {
		[self setStateInternal:BottomSheetStatus::Dragging];
	}

	// 如果有嵌套滚动
	if (self.target) {
		if(translationY > 0 && top < self.maxY && self.target.contentOffset.y <= 0) {
			//向下拖
			CGFloat y = fmin(top + translationY, self.maxY);
			self.child.frame = CGRectOffset(self.child.frame, 0, y - top);
			[self dispatchOnSlide:self.child.frame.origin.y];
		}

		if (translationY < 0 && top > self.minY) {
			//向上拖
			CGFloat y = fmax(top + translationY, self.minY);
			self.child.frame = CGRectOffset(self.child.frame, 0, y - top);
			[self dispatchOnSlide:self.child.frame.origin.y];
		}
	}

	// 没有嵌套滚动
	if (!self.target) {
		if(translationY > 0 && top < self.maxY) {
			//向下拖
			CGFloat y = fmin(top + translationY, self.maxY);
			self.child.frame = CGRectOffset(self.child.frame, 0, y - top);
			[self dispatchOnSlide:self.child.frame.origin.y];
		}

		if (translationY < 0 && top > self.minY) {
			//向上拖
			CGFloat y = fmax(top + translationY, self.minY);
			self.child.frame = CGRectOffset(self.child.frame, 0, y - top);
			[self dispatchOnSlide:self.child.frame.origin.y];
		}
	}

	if (pan.state == UIGestureRecognizerStateEnded || pan.state == UIGestureRecognizerStateCancelled) {
		// RCTLogInfo(@"velocity:%f", [pan velocityInView:self.child].y);
		CGFloat velocity = [pan velocityInView:self.child].y;
		if (velocity > 400) {
			if (self.target && self.target.contentOffset.y <= 0) {
				//如果是类似轻扫的那种
				[self settleToStatus:BottomSheetStatus::Collapsed withFling:YES];
			}

			if (!self.target) {
				//如果是类似轻扫的那种
				[self settleToStatus:BottomSheetStatus::Collapsed withFling:YES];
			}
		} else if (velocity < -400) {
			//如果是类似轻扫的那种
			[self settleToStatus:BottomSheetStatus::Expanded withFling:YES];
		} else {
			//如果是普通拖拽
			if(fabs(self.child.frame.origin.y - self.minY) > fabs(self.child.frame.origin.y - self.maxY)) {
				[self settleToStatus:BottomSheetStatus::Collapsed withFling:YES];
			} else {
				[self settleToStatus:BottomSheetStatus::Expanded withFling:YES];
			}
		}
	}
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(UIScrollView *)target change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context{
	if (_nextReturn) {
		_nextReturn = false;
		return;
	}

	if (![keyPath isEqualToString:@"contentOffset"]) {
		return;
	}

	CGFloat newY = [change[@"new"] CGPointValue].y;
	CGFloat oldY = [change[@"old"] CGPointValue].y;

	if (newY == oldY) {
		return;
	}

	CGFloat dy = oldY - newY;

	if (dy > 0) {
		//向下
		if(target.contentOffset.y < 0){
			_nextReturn = true;
			target.contentOffset = CGPointMake(0, 0);
		}
	}

	if (dy < 0) {
		//向上
		if (self.child.frame.origin.y > self.minY) {
			_nextReturn = true;
			target.contentOffset = CGPointMake(0, oldY);
		}
	}
}

- (void)setPeekHeight:(CGFloat)peekHeight {
	_peekHeight = peekHeight;
	if (_isInitialRender) {
		return;
	}
	if (!CGRectEqualToRect(self.child.frame, CGRectZero)) {
		[self calculateOffset];
		if (self.status == BottomSheetStatus::Collapsed) {
			[self settleToStatus:BottomSheetStatus::Collapsed withFling:NO];
		}
	}
}

- (void)setStatus:(BottomSheetStatus)status {
	if (_isInitialRender) {
		self.finalStatus = status;
		return;
	}

	if (self.finalStatus == status || _status == BottomSheetStatus::Settling) {
		return;
	}

	self.finalStatus = status;

	[self settleToStatus:status withFling:YES];
}

- (void)settleToStatus:(BottomSheetStatus)status withFling:(BOOL)fling {
	if (!fling) {
		[self setStateInternal:status];
		[self layoutChild];
		return;
	}
	if (status == BottomSheetStatus::Collapsed) {
		[self settleToStatus:status top:self.maxY withFling:fling];
	} else if (status == BottomSheetStatus::Expanded) {
		[self settleToStatus:status top:self.minY withFling:fling];
	} else if (status == BottomSheetStatus::Hidden) {
		[self settleToStatus:status top:self.frame.size.height withFling:fling];
	}
}

- (void)settleToStatus:(BottomSheetStatus)status top:(CGFloat)top withFling:(BOOL)fling {
	self.target.pagingEnabled = YES;
	[self setStateInternal:BottomSheetStatus::Settling];
	[self startWatchBottomSheetTransition];

	if (self.animator) {
		[self.animator stopAnimation:YES];
	}

	UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState | UIViewAnimationOptionCurveEaseOut;

	self.animator = [UIViewPropertyAnimator runningPropertyAnimatorWithDuration:0.3 delay:0 options:options animations:^{
		self.child.frame = CGRectOffset(self.child.frame, 0, top - self.child.frame.origin.y);
	} completion:^(UIViewAnimatingPosition finalPosition) {
		self.target.pagingEnabled = NO;
		self.animator = nil;
		[self stopWatchBottomSheetTransition];
		[self setStateInternal:status];
	}];
}

- (void)setStateInternal:(BottomSheetStatus)status {
	if (_status == status) {
		return;
	}
	_status = status;

	if (status == BottomSheetStatus::Expanded) {
		[self dispatchOnSlide:self.minY];
	}

	if (status == BottomSheetStatus::Hidden) {
		[self dispatchOnSlide:self.frame.size.height];
	}

	if (status == BottomSheetStatus::Collapsed) {
		[self dispatchOnSlide:self.maxY];
	}

	if (status == BottomSheetStatus::Collapsed ||
		status == BottomSheetStatus::Expanded ||
		status == BottomSheetStatus::Hidden) {

		self.finalStatus = status;
		[self dispatchOnStateChanged:status];
	}
}

- (void)dispatchOnSlide:(CGFloat)top {
	if (top < 0 || self.maxY == 0) {
		return;
	}
	// 传的是「实际 top - 布局 top」的差值，供 getContentOriginOffset 做 hit-test 校正
	if ([self.child respondsToSelector:@selector(updateContentOffset:)]) {
		CGFloat offsetY = top - _layoutContentTop;
		[(id)self.child updateContentOffset:offsetY];
	}

	CGFloat progress = fmin((top - self.minY) * 1.0f / (self.maxY - self.minY), 1);
	BottomSheetEventEmitter::OnSlide payload = BottomSheetEventEmitter::OnSlide{
		.progress = static_cast<Float>(progress),
		.offset = static_cast<Float>(top),
		.expandedOffset = static_cast<Float>(self.minY),
		.collapsedOffset = static_cast<Float>(self.maxY)
	};
	RCTSendOffsetForNativeAnimations_DEPRECATED(self.tag, progress, top, self.minY, self.maxY);
	[self eventEmitter].onSlide(payload);
}

- (void)dispatchOnStateChanged:(BottomSheetStatus)status {
	BottomSheetEventEmitter::OnStateChanged payload = BottomSheetEventEmitter::OnStateChanged{
		.state = [self convertStatus:status]
	};
	RCTSendStateForNativeAnimations_DEPRECATED(self.tag, [self convertStatusToString:status]);
	[self eventEmitter].onStateChanged(payload);
}

- (BottomSheetEventEmitter::OnStateChangedState)convertStatus:(BottomSheetStatus)status {
	if (status == BottomSheetStatus::Expanded) {
		return BottomSheetEventEmitter::OnStateChangedState::Expanded;
	} else if (status == BottomSheetStatus::Hidden) {
		return BottomSheetEventEmitter::OnStateChangedState::Hidden;
	} else {
		return BottomSheetEventEmitter::OnStateChangedState::Collapsed;
	}
}

- (NSString *)convertStatusToString:(BottomSheetStatus)status {
	if (status == BottomSheetStatus::Expanded) {
		return @"expanded";
	} else if (status == BottomSheetStatus::Hidden) {
		return @"hidden";
	} else {
		return @"collapsed";
	}
}

- (void)startWatchBottomSheetTransition {
	[self stopWatchBottomSheetTransition];
	_displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(watchBottomSheetTransition)];
	_displayLink.preferredFramesPerSecond = 120;
	[_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)stopWatchBottomSheetTransition {
	if (_displayLink) {
		[_displayLink invalidate];
		_displayLink = nil;
	}
}

- (void)watchBottomSheetTransition {
	CGFloat top = [self.child.layer presentationLayer].frame.origin.y;
	[self dispatchOnSlide:top];
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
