#import "RNKeyboardInsetsView.h"
#import "RNKeyboardAutoHandler.h"
#import "RNKeyboardManualHandler.h"
#import "RNKeyboardStatusChangedEvent.h"
#import "RNKeyboardPositionChangedEvent.h"

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTScrollView.h>

#import <react/renderer/components/keyboardinsets/KeyboardInsetsViewComponentDescriptor.h>
#import <react/renderer/components/keyboardinsets/KeyboardInsetsViewShadowNode.h>
#import <react/renderer/components/keyboardinsets/EventEmitters.h>
#import <react/renderer/components/keyboardinsets/Props.h>
#import <react/renderer/components/keyboardinsets/RCTComponentViewHelpers.h>

static void
RCTSendStatusForNativeAnimations_DEPRECATED(NSInteger tag, BOOL shown, BOOL transitioning, CGFloat height) {
	RNKeyboardStatusChangedEvent *event =[[RNKeyboardStatusChangedEvent alloc] initWithReactTag:@(tag) shown:shown transitioning:transitioning height:height];
	NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:event, @"event", nil];
	[[NSNotificationCenter defaultCenter] postNotificationName:RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED
													  object:nil
													userInfo:userInfo];
}

static void
RCTSendPositionForNativeAnimations_DEPRECATED(NSInteger tag, CGFloat position) {
	RNKeyboardPositionChangedEvent *event =[[RNKeyboardPositionChangedEvent alloc] initWithReactTag:@(tag) position:@(position)];
	NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:event, @"event", nil];
	[[NSNotificationCenter defaultCenter] postNotificationName:RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED
													  object:nil
													userInfo:userInfo];
}

using namespace facebook::react;

@interface RNKeyboardInsetsView ()

@property(nonatomic, assign) KeyboardInsetsViewMode mode;


@end

@implementation RNKeyboardInsetsView {
    UIView *_focusView;

    CADisplayLink *_displayLink;
    UIView *_keyboardView;
    CGFloat _keyboardHeight;

    RNKeyboardAutoHandler *_autoHandler;
    RNKeyboardManualHandler *_manualHandler;

    std::shared_ptr<const KeyboardInsetsViewShadowNode::ConcreteState> _state;
}

// Needed because of this: https://github.com/facebook/react-native/pull/37274
+ (void)load {
	[super load];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
	return concreteComponentDescriptorProvider<KeyboardInsetsViewComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled {
	return NO;
}

- (instancetype)initWithFrame:(CGRect)frame {
	if (self = [super initWithFrame:frame]) {
		static const auto defaultProps = std::make_shared<const KeyboardInsetsViewProps>();
		_props = defaultProps;
	}
	return self;
}

- (void)updateState:(const facebook::react::State::Shared &)state oldState:(const facebook::react::State::Shared &)oldState {
	_state = std::static_pointer_cast<const KeyboardInsetsViewShadowNode::ConcreteState>(state);
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps {
	const auto &oldViewProps = static_cast<const KeyboardInsetsViewProps &>(*_props);
	const auto &newViewProps = static_cast<const KeyboardInsetsViewProps &>(*props);

	// `mode`
	if (newViewProps.mode != oldViewProps.mode) {
		self.mode = newViewProps.mode;
	}

	// `extraHeight`
	if (newViewProps.extraHeight != oldViewProps.extraHeight) {
		self.extraHeight = newViewProps.extraHeight;
	}

	// `explicitly`
	if (newViewProps.explicitly != oldViewProps.explicitly) {
		self.explicitly = newViewProps.explicitly;
	}

	[super updateProps:props oldProps:oldProps];
}

- (void)updateTranslationY:(CGFloat)translationY {
	if (!_state) {
		return;
	}
	_state->updateState(
		[translationY](const KeyboardInsetsViewShadowNode::ConcreteState::Data &oldData) -> KeyboardInsetsViewShadowNode::ConcreteState::SharedData {
			auto newData = oldData;
			newData.translationY = static_cast<double>(translationY);
			return std::make_shared<KeyboardInsetsViewShadowNode::ConcreteState::Data>(newData);
		});
}

- (const KeyboardInsetsViewEventEmitter &)eventEmitter {
	return static_cast<const KeyboardInsetsViewEventEmitter &>(*_eventEmitter);
}

- (void)dispatchKeyboardStatus:(KeyboardStatus)status {
	RCTSendStatusForNativeAnimations_DEPRECATED(self.tag, status.shown, status.transitioning, status.height);
	[self eventEmitter].onStatusChanged({
		.height = static_cast<Float>(status.height),
		.shown = static_cast<bool>(status.shown),
		.transitioning = static_cast<bool>(status.transitioning)
	});
}

- (void)dispatchKeyboardPosition:(CGFloat)position {
	RCTSendPositionForNativeAnimations_DEPRECATED(self.tag, position);
	[self eventEmitter].onPositionChanged({
		.position = static_cast<Float>(position)
	});
}

- (RNKeyboardAutoHandler *)autoHandler {
    if (!_autoHandler) {
        _autoHandler = [[RNKeyboardAutoHandler alloc] initWithKeyboardInsetsView:self];
    }
    return _autoHandler;
}

- (RNKeyboardManualHandler *)manualHandler {
    if (!_manualHandler) {
        _manualHandler = [[RNKeyboardManualHandler alloc] initWithKeyboardInsetsView:self];
    }
    return _manualHandler;
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
    if (!newWindow) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
        [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardDidShowNotification object:nil];
        [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
        [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardDidHideNotification object:nil];
        [self stopWatchKeyboardTransition];
    }
}

- (void)didMoveToWindow {
    if (self.window) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                     selector:@selector(keyboardWillShow:)
                                                         name:UIKeyboardWillShowNotification
                                                       object:nil];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                     selector:@selector(keyboardDidShow:)
                                                         name:UIKeyboardDidShowNotification
                                                       object:nil];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                     selector:@selector(keyboardWillHide:)
                                                         name:UIKeyboardWillHideNotification
                                                       object:nil];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                     selector:@selector(keyboardDidHide:)
                                                         name:UIKeyboardDidHideNotification
                                                       object:nil];
    }
}

- (void)keyboardWillShow:(NSNotification *)notification {
    UIView *focusView = [RNKeyboardInsetsView findFocusView:self];

    if (![self shouldHandleKeyboardTransition:focusView]) {
        return;
    }

    _focusView = focusView;
    _keyboardView = [RNKeyboardInsetsView findKeyboardView];

    NSDictionary *userInfo = [notification userInfo];
    CGRect keyboardRect = [[userInfo objectForKey:UIKeyboardFrameEndUserInfoKey] CGRectValue];
    CGFloat keyboardHeight = keyboardRect.size.height;

    _keyboardHeight = keyboardHeight;

    if ([self isAutoMode]) {
        [[self autoHandler] keyboardWillShow:focusView keyboardHeight:keyboardHeight];
    } else {
        [[self manualHandler] keyboardWillShow:focusView keyboardHeight:keyboardHeight];
    }

    RCTLogInfo(@"[KeyboardInsetsView] keyboardWillShow startWatchKeyboardTransition");
    [self startWatchKeyboardTransition];
}

- (void)keyboardDidShow:(NSNotification *)notification {
    if (![self shouldHandleKeyboardTransition:_focusView]) {
        return;
    }

    RCTLogInfo(@"[KeyboardInsetsView] keyboardDidShow stopWatchKeyboardTransition");
    [self stopWatchKeyboardTransition];

    if ([self isAutoMode]) {
        UIView *focusView = [RNKeyboardInsetsView findFocusView:self];
        if (focusView && focusView != _focusView) {
            RNKeyboardInsetsView *insetsView = [RNKeyboardInsetsView findClosetKeyboardInsetsView:focusView];
            if (insetsView != self) {
                focusView = nil;
            }
        }
        _focusView = focusView;
        [[self autoHandler] keyboardDidShow:focusView keyboardHeight:_keyboardHeight];
    } else {
        [[self manualHandler] keyboardDidShow:_focusView keyboardHeight:_keyboardHeight];
    }
}

- (void)keyboardWillHide:(NSNotification *)notification {
    if (![self shouldHandleKeyboardTransition:_focusView]) {
        return;
    }

    UIViewController *vc = [self reactViewController];
    if (vc.navigationController.transitionCoordinator) {
        // 防止回弹时键盘闪烁
        [_focusView reactBlur];
        return;
    }

    _keyboardView = [RNKeyboardInsetsView findKeyboardView];

    if ([self isAutoMode]) {
        [[self autoHandler] keyboardWillHide:_focusView keyboardHeight:_keyboardHeight];
    } else {
        [[self manualHandler] keyboardWillHide:_focusView keyboardHeight:_keyboardHeight];
    }

    RCTLogInfo(@"[KeyboardInsetsView] keyboardWillHide startWatchKeyboardTransition");
    [self startWatchKeyboardTransition];
}


- (void)keyboardDidHide:(NSNotification *)notification {
    UIView *focusView = _focusView;
    _focusView = nil;

    if (![self shouldHandleKeyboardTransition:focusView]) {
        return;
    }

    RCTLogInfo(@"[KeyboardInsetsView] keyboardDidHide stopWatchKeyboardTransition");
    [self stopWatchKeyboardTransition];

    if ([self isAutoMode]) {
        [[self autoHandler] keyboardDidHide:focusView keyboardHeight:_keyboardHeight];
    } else {
        [[self manualHandler] keyboardDidHide:focusView keyboardHeight:_keyboardHeight];
    }
}

- (BOOL)shouldHandleKeyboardTransition:(UIView *)focusView {
    if (focusView) {
        RNKeyboardInsetsView *closet = [RNKeyboardInsetsView findClosetKeyboardInsetsView:focusView];
            return closet == self;
    }
    return NO;
}


- (void)startWatchKeyboardTransition {
    [self stopWatchKeyboardTransition];
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(watchKeyboardTransition)];
    _displayLink.preferredFramesPerSecond = 120;
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)stopWatchKeyboardTransition {
    if(_displayLink){
        [_displayLink invalidate];
        _displayLink = nil;
    }
}

- (void)watchKeyboardTransition {
    if (_keyboardView == nil) {
        return;
    }

    CGFloat keyboardFrameY = [_keyboardView.layer presentationLayer].frame.origin.y;
    CGFloat keyboardWindowH = _keyboardView.window.bounds.size.height;
    [self handleKeyboardTransition:(keyboardWindowH - keyboardFrameY)];
}

- (void)handleKeyboardTransition:(CGFloat)position {
    if ([self isAutoMode]) {
        if (_focusView) {
            [[self autoHandler] handleKeyboardTransition:position];
        }
    } else {
        [[self manualHandler] handleKeyboardTransition:position];
    }
}

- (BOOL)isAutoMode {
	return self.mode == KeyboardInsetsViewMode::Auto;
}

BOOL hasAnyPrefix(NSArray<NSString *> *names, NSString *desc) {
	for (NSString *name : names) {
		if ([desc hasPrefix:name]) {
			return YES;
		}
	}
	return NO;
}

+ (UIView *)findKeyboardView {
    NSArray<UIWindow *> *windows = UIApplication.sharedApplication.windows;
    for (UIWindow *window in windows) {
        if (hasAnyPrefix(@[@"<UITextEffectsWindow"], window.description)) {
            for (UIView *subview in window.subviews) {
                if (hasAnyPrefix(@[@"<UITrackingWindowView", @"<UIInputSetContainerView"], subview.description)) {
                    for (UIView *hostView in subview.subviews) {
                        if (hasAnyPrefix(@[@"<UIKeyboardItemContainerView", @"<UIInputSetHostVie"], hostView.description)) {
                            return hostView;
                        }
                    }
                    break;
                }
            }
            break;
        }
    }
    return nil;
}

+ (UIView *)findFocusView:(UIView *)view {
    if ([view isFirstResponder]) {
        return view;
    }

    for (UIView *child in view.subviews) {
        UIView *focus = [self findFocusView:child];
        if (focus) {
            return focus;
        }
    }

    return nil;
}

+ (RNKeyboardInsetsView *)findClosetKeyboardInsetsView:(UIView *)view {
    if ([view isKindOfClass:[RNKeyboardInsetsView class]]) {
        return (RNKeyboardInsetsView *)view;
    }

    if (view.superview) {
        return [self findClosetKeyboardInsetsView:view.superview];
    }

    return nil;
}

@end
