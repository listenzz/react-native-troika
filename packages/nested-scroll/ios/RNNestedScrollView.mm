#import "RNNestedScrollView.h"
#import "RNNestedScrollViewHeader.h"

#import <react/renderer/components/nestedscrollview/NestedScrollViewComponentDescriptor.h>
#import <react/renderer/components/nestedscrollview/EventEmitters.h>
#import <react/renderer/components/nestedscrollview/Props.h>
#import <react/renderer/components/nestedscrollview/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTLog.h>
#import <React/RCTSurfaceView.h>

#define FLOAT_EPSILON 0.01

BOOL eq(float a, float b) {
	return fabs(a - b) < FLOAT_EPSILON;
}

BOOL gt(float a, float b) {
	return (a - b) > FLOAT_EPSILON;
}

BOOL lt(float a, float b) {
	return (b - a) > FLOAT_EPSILON;
}

#pragma mark - RNMainScrollView

using namespace facebook::react;

@interface RNMainScrollView : UIScrollView <UIGestureRecognizerDelegate>

@property(nonatomic, strong) UIScrollView *target;
@property(nonatomic, strong) UIView *scrollingChild;

@end

@implementation RNMainScrollView {
	__weak UIView *_reactRootView;
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
			[self cacheRootView];
			[self cancelRootViewTouches];
			return YES;
		}
		return NO;
	}
	return [super gestureRecognizerShouldBegin:gestureRecognizer];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch {
	if (gestureRecognizer != self.panGestureRecognizer) {
		return YES;
	}
	
	if (self.target) {
		[self.target removeObserver:self.superview forKeyPath:@"contentOffset"];
	}
	self.target = nil;
	
	UIView *touchView = touch.view;
   
	while (touchView != nil && [touchView isDescendantOfView:self.scrollingChild]) {
		if ([touchView isKindOfClass:[UIScrollView class]]) {
			UIScrollView *scrollView = (UIScrollView *)touchView;
			if (![self isHorizontal:scrollView]) {
				if (self.bounces) {
					scrollView.bounces = NO;
				}
				self.target = scrollView;
				[self.target addObserver:self.superview forKeyPath:@"contentOffset" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
				break;
			}
		}
		touchView = touchView.superview;
	}

	return YES;
}

- (void)willMoveToSuperview:(UIView *)superview {
	[super willMoveToSuperview:superview];
	if (superview == nil && self.target) {
		[self.target removeObserver:self.superview forKeyPath:@"contentOffset"];
		self.target = nil;
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

- (BOOL)isHorizontal:(UIScrollView *)scrollView {
	return scrollView.contentSize.width > self.frame.size.width;
}

@end

#pragma mark - RNNestedScrollView

@interface RNNestedScrollView () <UIScrollViewDelegate>

@property(nonatomic, strong) RNMainScrollView *main;
@property(nonatomic, strong) RNNestedScrollViewHeader *header;

@property(nonatomic, assign) CGFloat lastOffsetY;
@property(nonatomic, assign) BOOL nextReturn;

@end

@implementation RNNestedScrollView {
	NestedScrollViewShadowNode::ConcreteState::Shared _state;
	CGFloat _contentHeight;
}

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load {
	[super load];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
	return concreteComponentDescriptorProvider<NestedScrollViewComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled {
	return NO;
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		static const auto defaultProps = std::make_shared<const NestedScrollViewProps>();
		_props = defaultProps;
		_main = [[RNMainScrollView alloc] initWithFrame:CGRectZero];
		_main.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
		_main.delegate = self;
		_main.showsVerticalScrollIndicator = NO;
		_main.showsHorizontalScrollIndicator = NO;
		_main.scrollsToTop = NO;
		_main.delaysContentTouches = NO;
		_main.bounces = NO;
		if (@available(iOS 11.0, *)) {
			_main.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
		}
		if (@available(iOS 26.0, *)) {
			_main.topEdgeEffect.hidden = YES;
		}
		[self addSubview:_main];
		_contentHeight = 0;
	}
	return self;
}

- (void)dealloc {
	_main.delegate = nil;
	RCTLogInfo(@"RNNestedScrollView dealloc");
}

- (void)updateState:(const facebook::react::State::Shared &)state oldState:(const facebook::react::State::Shared &)oldState {
	_state = std::static_pointer_cast<NestedScrollViewShadowNode::ConcreteState const>(state);
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps {
	const auto &oldViewProps = static_cast<const NestedScrollViewProps &>(*_props);
	const auto &newViewProps = static_cast<const NestedScrollViewProps &>(*props);
	
	// `bounces`
	if (newViewProps.bounces != oldViewProps.bounces) {
		self.bounces = newViewProps.bounces;
	}
	
	[super updateProps:props oldProps:oldProps];
}

- (void)setBounces:(BOOL)bounces {
	self.main.bounces = bounces;
}

- (CGFloat)headerScrollRange {
	return [self.header maxScrollRange];
}

// main scrollView
- (void)scrollViewDidScroll:(UIScrollView *)main {
	CGFloat newOffset = main.contentOffset.y;
	CGFloat dy = _lastOffsetY - newOffset;
	
	UIScrollView *target = self.main.target;
	if (target == nil) {
		if (dy < 0 && gt(newOffset, [self headerScrollRange])) {
			main.contentOffset = CGPointMake(0, self.headerScrollRange);
			_lastOffsetY = main.contentOffset.y;
			return;
		}
		_lastOffsetY = main.contentOffset.y;
		return;
	}
	
	// 向下，main 下拉刷新
	if (dy > 0 && target.contentOffset.y < 0) {
		_lastOffsetY = newOffset;
		return;
	}
	
	// 向下，main 上拉加载释放
	if (dy > 0 && gt(_lastOffsetY, [self headerScrollRange])) {
		main.contentOffset = CGPointMake(0, fmax(newOffset, self.headerScrollRange));
		_lastOffsetY = main.contentOffset.y;
		return;
	}
	
	// 向下，target 可向下，main 保持不变
	if (dy > 0 && target.contentOffset.y > 0) {
		main.contentOffset = CGPointMake(0, _lastOffsetY);
		return;
	}
	
	// 向上，target 优先取消下拉刷新，main 保持不变
	if (dy < 0 && target.contentOffset.y < 0) {
		main.contentOffset = CGPointMake(0, _lastOffsetY);
		return;
	}
	
	// 向上，target 可向上，main 保持 sticky
	if (dy < 0 && gt(newOffset, [self headerScrollRange]) && lt(target.contentOffset.y, target.contentSize.height - target.frame.size.height)) {
		main.contentOffset = CGPointMake(0, self.headerScrollRange);
		_lastOffsetY = main.contentOffset.y;
		return;
	}
	
	_lastOffsetY = newOffset;
    [self _updateStateWithContentOffset];
}

- (void)_updateStateWithContentOffset {
	if (!_state) {
		return;
	}

	// 获取当前的滚动偏移量
	auto contentOffset = RCTPointFromCGPoint(_main.contentOffset);

	// 调用 C++ State 的 updateState 方法
	_state -> updateState(
	[contentOffset](const NestedScrollViewShadowNode::ConcreteState::Data &oldData) -> NestedScrollViewShadowNode::ConcreteState::SharedData {
		// 如果偏移量没变，则不更新
		if (oldData.contentOffsetY == contentOffset.y) {
			return nullptr;
		}
		auto newData = oldData;
		newData.contentOffsetY = contentOffset.y;
		return std::make_shared<const NestedScrollViewShadowNode::ConcreteState::Data>(newData);
	});
}

// target scrollView
- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(UIScrollView *)target change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context{
	if (_nextReturn) {
		_nextReturn = false;
		return;
	}
	
	if (![keyPath isEqualToString:@"contentOffset"]) {
		return;
	}
	
	UIScrollView *main = self.main;
	CGFloat newY = [change[@"new"] CGPointValue].y;
	CGFloat oldY = [change[@"old"] CGPointValue].y;
	CGFloat dy = oldY - newY;
	
	// 向上
	if (dy < 0) {
		// main 可向上，target 归位
		if (lt(main.contentOffset.y, self.headerScrollRange) && target.contentOffset.y > 0) {
			_nextReturn = true;
			target.contentOffset = CGPointMake(0, fmax(0, oldY));
			return;
		}
		
		if (main.bounces && gt(main.contentOffset.y, self.headerScrollRange) && gt(target.contentOffset.y, target.contentSize.height - target.frame.size.height)) {
			_nextReturn = true;
			target.contentOffset = CGPointMake(0,  target.contentSize.height - target.frame.size.height);
			return;
		}
	}
	
	//向下
	if (dy > 0) {
		// main 可向下，target 归位
		if((main.contentOffset.y > 0 || main.bounces) && target.contentOffset.y < 0){
			_nextReturn = true;
			target.contentOffset = CGPointMake(0, 0);
			return;
		}
		
		if (main.bounces && gt(main.contentOffset.y, self.headerScrollRange) && gt(oldY, target.contentSize.height - target.frame.size.height)) {
			_nextReturn = true;
			target.contentOffset = CGPointMake(0, oldY);
		}
	}
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
	if ([childComponentView isKindOfClass:[RNNestedScrollViewHeader class]]) {
		self.header = (RNNestedScrollViewHeader *)childComponentView;
	} else {
		self.main.scrollingChild = childComponentView;
	}
	
	[self.main addSubview:childComponentView];
	[self updateContentSizeIfNeeded];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
	[childComponentView removeFromSuperview];
}

- (void)setClipsToBounds:(BOOL)clipsToBounds {
	super.clipsToBounds = clipsToBounds;
	_main.clipsToBounds = clipsToBounds;
}

- (void)layoutSubviews {
	[super layoutSubviews];
	[self updateContentSizeIfNeeded];
}

- (void)updateContentSizeIfNeeded {
	CGSize contentSize = CGSizeMake(self.frame.size.width, self.frame.size.height + [self headerScrollRange]);
	if (_CGSizeValid(contentSize) && !CGSizeEqualToSize(_main.contentSize, contentSize)) {
		_main.contentSize = contentSize;
	}
	
	if (!_state) {
		return;
	}
	
	CGFloat contentHeight = self.frame.size.height - (self.header.frame.size.height -  [self headerScrollRange]);
	if (eq(_contentHeight, contentHeight) || contentHeight == 0) {
		return;
	}
	_contentHeight = contentHeight;
	
	_state->updateState(
		  [=](NestedScrollViewShadowNode::ConcreteState::Data const &oldData)
			  -> NestedScrollViewShadowNode::ConcreteState::SharedData {
			auto newData = oldData;
			newData.contentHeight = contentHeight;
			return std::make_shared<NestedScrollViewShadowNode::ConcreteState::Data const>(newData);
		  });
}

static BOOL _CGSizeValid(CGSize size) {
	return size.width > 0 && size.height > 0;
}

@end
