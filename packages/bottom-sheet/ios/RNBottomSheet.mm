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

- (void)requestStatus:(BottomSheetStatus)status requestId:(int32_t)requestId;
- (void)cancelMotion;
- (void)emitSlide:(CGFloat)top;

@end

@implementation RNBottomSheet {
	__weak UIView *_rootView;
	BOOL _isInitialRender;
	__weak UIView *_reactRootView;
	CGFloat _layoutContentTop;  // 子 View 的布局 origin.y，用于 contentOffset = 实际 top - 布局 top
	CGFloat _lastChildHeight;
	CGFloat _lastParentHeight;
	CGFloat _lastTop;  // 最近一次的实际 top，用于 layout 中断 settling/dragging 时恢复位置
	int32_t _requestId;
	BOOL _requestPending;
	BOOL _initialMotionScheduled;
	BOOL _cancellingGesture;
	NSUInteger _motionGeneration;
	BottomSheetEventEmitter::OnStateChangedSource _eventSource;
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
		_lastChildHeight = NAN;
		_lastParentHeight = NAN;
		_lastTop = NAN;
		_eventSource = BottomSheetEventEmitter::OnStateChangedSource::Layout;
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
		[self cancelMotion];
		if (self.target) {
			[self.target removeObserver:self forKeyPath:@"contentOffset"];
			self.target = nil;
		}
		[self.child removeGestureRecognizer:_panGestureRecognizer];
		self.child = nil;
		_requestPending = NO;
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
	if (newViewProps.status != oldViewProps.status || newViewProps.requestId != oldViewProps.requestId) {
		[self requestStatus:newViewProps.status requestId:newViewProps.requestId];
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

// Only a pan hosted directly by a horizontal collaborator opts into sheet-first
// direction arbitration. Descendants keep their own priority (e.g. a slider in a pager).
- (BOOL)isHorizontalContentPan:(UIGestureRecognizer *)recognizer {
	UIView *view = recognizer.view;
	return [view isKindOfClass:[RCTViewComponentView class]] &&
		[((RCTViewComponentView *)view).nativeId hasPrefix:@"sdcx-pan-axis:horizontal:"];
}

- (BOOL)canCoordinateContentPan:(UIGestureRecognizer *)recognizer withSheetPan:(UIGestureRecognizer *)sheetPan {
	UIView *view = recognizer.view;
	return sheetPan == self.panGestureRecognizer && recognizer != sheetPan &&
		self.draggable && self.status != BottomSheetStatus::Settling && recognizer.enabled &&
		[recognizer isKindOfClass:[UIPanGestureRecognizer class]] &&
		view != self.child && [view isDescendantOfView:self.child] &&
		![view isKindOfClass:[UIScrollView class]];
}

// A horizontal collaborator waits for the sheet to accept vertical movement or
// reject horizontal movement. Scroll views retain their existing simultaneous hand-off.
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer {
	return [self canCoordinateContentPan:otherGestureRecognizer withSheetPan:gestureRecognizer] &&
		[self isHorizontalContentPan:otherGestureRecognizer];
}

// Ordinary content owns its pan without a special wrapper. Waiting, rather than
// rejecting the initial touch, still lets the sheet begin if that content pan fails.
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRequireFailureOfGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer {
	return [self canCoordinateContentPan:otherGestureRecognizer withSheetPan:gestureRecognizer] &&
		![self isHorizontalContentPan:otherGestureRecognizer];
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer {
	if (gestureRecognizer == self.panGestureRecognizer) {
		// During settling we should not compete with content touches (e.g. button tap).
		if (!self.draggable || self.status == BottomSheetStatus::Settling) {
			return NO;
		}
		// Only claim vertical drags. A horizontal child pager must be allowed
		// to reach its own activation threshold without this pan cancelling it.
		CGPoint translation = [self.panGestureRecognizer translationInView:self.child];
		if (fabs(translation.x) > fabs(translation.y)) {
			return NO;
		}
		return [super gestureRecognizerShouldBegin:gestureRecognizer];
	}
	return [super gestureRecognizerShouldBegin:gestureRecognizer];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch {
	if (!self.draggable || self.status == BottomSheetStatus::Settling) {
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
	// UIPickerView owns its internal scroll offsets, including negative offsets
	// used to center the first row. Sheet observation would clamp them to zero.
	// Check the complete ancestry before choosing any nested UIScrollView.
	for (UIView *ancestor = touchView; ancestor != nil && [ancestor isDescendantOfView:self]; ancestor = ancestor.superview) {
		if ([ancestor isKindOfClass:[UIPickerView class]]) {
			return NO;
		}
	}

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
		[self cancelMotion];
		if (self.target) {
			[self.target removeObserver:self forKeyPath:@"contentOffset"];
			self.target = nil;
		}
	}
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
	[super willMoveToWindow:newWindow];
	if (newWindow == nil) {
		[self cancelMotion];
	}
}

- (void)didMoveToWindow {
	[super didMoveToWindow];
	if (self.window) {
		[self cacheRootView];
		if (!_isInitialRender && !_initialMotionScheduled &&
			(_requestPending || self.status == BottomSheetStatus::Settling)) {
			[self settleToStatus:self.finalStatus withFling:YES];
		}
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
}

- (void)layoutChild {
	if (self.child && self.child.bounds.size.width > 0 && self.child.bounds.size.height > 0 &&
		self.bounds.size.width > 0 && self.bounds.size.height > 0) {
		CGFloat previousMinY = self.minY;
		CGFloat previousMaxY = self.maxY;
		[self calculateOffset];
		BOOL offsetsChanged = fabs(previousMinY - self.minY) > 0.5 || fabs(previousMaxY - self.maxY) > 0.5;
		BOOL firstLayout = _isInitialRender;
		CGFloat parentHeight = self.frame.size.height;
		CGFloat childHeight = self.child.frame.size.height;
		BOOL metricsChanged =
			(!isnan(_lastChildHeight) && fabs(_lastChildHeight - childHeight) > 0.5) ||
			(!isnan(_lastParentHeight) && fabs(_lastParentHeight - parentHeight) > 0.5);
		// 首次布局或尺寸变化时重算布局基准，避免 fitToContents 动态高度导致 contentOffset 漂移
		if (isnan(_layoutContentTop) || metricsChanged) {
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
		_lastChildHeight = childHeight;
		_lastParentHeight = parentHeight;
		if (firstLayout) {
			_isInitialRender = NO;
			self.child.frame = CGRectOffset(self.child.frame, 0, self.maxY - self.child.frame.origin.y);
			if (_requestPending && !_initialMotionScheduled) {
				_initialMotionScheduled = YES;
				NSUInteger generation = _motionGeneration;
				__weak RNBottomSheet *weakSelf = self;
				dispatch_async(dispatch_get_main_queue(), ^{
					RNBottomSheet *sheet = weakSelf;
					if (!sheet || sheet->_motionGeneration != generation) return;
					sheet->_initialMotionScheduled = NO;
					if (sheet.child && sheet->_requestPending) {
						[sheet settleToStatus:sheet.finalStatus withFling:YES];
					}
				});
			}
		} else if (self.status == BottomSheetStatus::Collapsed) {
			self.child.frame = CGRectOffset(self.child.frame, 0, self.maxY - self.child.frame.origin.y);
		} else if (self.status == BottomSheetStatus::Expanded) {
			self.child.frame = CGRectOffset(self.child.frame, 0, self.minY - self.child.frame.origin.y);
		} else if (self.status == BottomSheetStatus::Hidden) {
			self.child.frame = CGRectOffset(self.child.frame, 0, self.frame.size.height - self.child.frame.origin.y);
		} else if (self.status == BottomSheetStatus::Settling) {
			CGFloat targetTop = self.finalStatus == BottomSheetStatus::Collapsed ? self.maxY
				: self.finalStatus == BottomSheetStatus::Expanded ? self.minY
				: self.frame.size.height;
			// An unchanged layout must not finish the transition or publish its model endpoint.
			// If Fabric changes the geometry, continue from the last visible position.
			if (metricsChanged || offsetsChanged || fabs(self.child.frame.origin.y - targetTop) > 0.5) {
				CGFloat currentTop = isnan(_lastTop) ? self.child.frame.origin.y : _lastTop;
				[self.animator stopAnimation:YES];
				self.animator = nil;
				self.child.frame = CGRectOffset(self.child.frame, 0, currentTop - self.child.frame.origin.y);
				[self settleToStatus:self.finalStatus withFling:YES];
			} else {
				CALayer *presentation = self.child.layer.presentationLayer;
				CGFloat currentTop = presentation ? presentation.frame.origin.y : _lastTop;
				if (!isnan(currentTop)) [self dispatchOnSlide:currentTop];
			}
			return;
		} else if (self.status == BottomSheetStatus::Dragging) {
			// Layout 中断了拖拽，恢复到最近一次的拖拽位置
			if (!isnan(_lastTop)) {
				CGFloat clampedTop = fmin(fmax(_lastTop, self.minY), self.maxY);
				self.child.frame = CGRectOffset(self.child.frame, 0, clampedTop - self.child.frame.origin.y);
			}
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
	if (_cancellingGesture || !self.draggable || self.status == BottomSheetStatus::Settling) {
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

- (void)setDraggable:(BOOL)draggable {
	if (_draggable == draggable) return;
	_draggable = draggable;
	_cancellingGesture = YES;
	self.panGestureRecognizer.enabled = draggable;
	_cancellingGesture = NO;
	if (!draggable && self.status == BottomSheetStatus::Dragging) {
		[self settleToStatus:self.finalStatus withFling:YES];
	}
}

- (void)setPeekHeight:(CGFloat)peekHeight {
	_peekHeight = peekHeight;
	if (_isInitialRender) {
		return;
	}
	if (!CGRectEqualToRect(self.child.frame, CGRectZero)) {
		[self layoutChild];
	}
}

- (void)setStatus:(BottomSheetStatus)status {
	[self requestStatus:status requestId:_requestId];
}

- (void)requestStatus:(BottomSheetStatus)status requestId:(int32_t)requestId {
	BOOL sameTarget = self.finalStatus == status;
	if (sameTarget && _requestId == requestId && (_requestPending || self.status == status)) return;
	if (self.status == BottomSheetStatus::Dragging) {
		_cancellingGesture = YES;
		self.panGestureRecognizer.enabled = NO;
		self.panGestureRecognizer.enabled = self.draggable;
		_cancellingGesture = NO;
	}
	_requestId = requestId;
	_requestPending = YES;
	_eventSource = BottomSheetEventEmitter::OnStateChangedSource::Command;
	self.finalStatus = status;
	if (_isInitialRender || _initialMotionScheduled || !self.child) return;
	if (sameTarget && self.status == BottomSheetStatus::Settling) return;
	[self settleToStatus:status withFling:YES];
}

- (void)cancelMotion {
	_motionGeneration += 1;
	_initialMotionScheduled = NO;
	if (self.animator) {
		CGFloat currentTop = self.child.layer.presentationLayer ?
			self.child.layer.presentationLayer.frame.origin.y : _lastTop;
		[self.animator stopAnimation:YES];
		self.animator = nil;
		if (self.child && !isnan(currentTop)) {
			self.child.frame = CGRectOffset(self.child.frame, 0, currentTop - self.child.frame.origin.y);
			_lastTop = currentTop;
		}
	}
	[self stopWatchBottomSheetTransition];
	self.target.pagingEnabled = NO;
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
	if (self.animator) {
		// Retarget from the visible position, not the previous animation's model frame.
		CALayer *presentation = self.child.layer.presentationLayer;
		CGFloat currentTop = presentation ? presentation.frame.origin.y : self.child.frame.origin.y;
		[self.animator stopAnimation:YES];
		self.animator = nil;
		self.child.frame = CGRectOffset(self.child.frame, 0, currentTop - self.child.frame.origin.y);
	}

	self.finalStatus = status;
	NSUInteger generation = ++_motionGeneration;
	if (fabs(self.child.frame.origin.y - top) < 0.5) {
		[self stopWatchBottomSheetTransition];
		self.target.pagingEnabled = NO;
		self.child.frame = CGRectOffset(self.child.frame, 0, top - self.child.frame.origin.y);
		[self dispatchOnSlide:top];
		[self setStateInternal:status];
		return;
	}
	self.target.pagingEnabled = YES;
	[self setStateInternal:BottomSheetStatus::Settling];
	[self startWatchBottomSheetTransition];

	UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState | UIViewAnimationOptionCurveEaseOut;

	self.animator = [UIViewPropertyAnimator runningPropertyAnimatorWithDuration:0.3 delay:0 options:options animations:^{
		self.child.frame = CGRectOffset(self.child.frame, 0, top - self.child.frame.origin.y);
	} completion:^(UIViewAnimatingPosition finalPosition) {
		if (self->_motionGeneration != generation || finalPosition != UIViewAnimatingPositionEnd) return;
		self.target.pagingEnabled = NO;
		self.animator = nil;
		[self stopWatchBottomSheetTransition];
		[self setStateInternal:status];
	}];
}

- (void)setStateInternal:(BottomSheetStatus)status {
	if (_status == status && !_requestPending) {
		return;
	}
	_status = status;
	if (status == BottomSheetStatus::Dragging) {
		_eventSource = BottomSheetEventEmitter::OnStateChangedSource::Gesture;
		_requestPending = NO;
	}

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
		_requestPending = NO;
		[self dispatchOnStateChanged:status];
	}
}

- (void)dispatchOnSlide:(CGFloat)top {
	_lastTop = top;
	if (top < 0 || self.maxY == 0) {
		return;
	}
	// 传的是「实际 top - 布局 top」的差值，供 getContentOriginOffset 做 hit-test 校正
	if ([self.child respondsToSelector:@selector(updateContentOffset:)]) {
		CGFloat offsetY = top - _layoutContentTop;
		[(id)self.child updateContentOffset:offsetY];
	}
	[self emitSlide:top];
}

- (void)emitSlide:(CGFloat)top {
	CGFloat distance = self.maxY - self.minY;
	CGFloat progress = 1;
	if (distance > 0.5) {
		progress = fmax(0, fmin((top - self.minY) * 1.0f / distance, 1));
	}
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
		.state = [self convertStatus:status],
		.requestId = _requestId,
		.source = _eventSource
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
