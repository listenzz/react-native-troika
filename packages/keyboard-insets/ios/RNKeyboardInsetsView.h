#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RNKeyboardHandler <NSObject>

- (void)keyboardWillShow:(UIView *)focusView keyboardHeight:(CGFloat)keyboardHeight;
- (void)keyboardDidShow:(UIView *)focusView keyboardHeight:(CGFloat)keyboardHeight;
- (void)keyboardWillHide:(UIView *)focusView keyboardHeight:(CGFloat)keyboardHeight;
- (void)keyboardDidHide:(UIView *)focusView keyboardHeight:(CGFloat)keyboardHeight;
- (void)handleKeyboardTransition:(CGFloat)position;

@end

typedef struct {
	CGFloat height;
	BOOL shown;
	BOOL transitioning;
} KeyboardStatus;

@interface RNKeyboardInsetsView : RCTViewComponentView

@property(nonatomic, assign) CGFloat extraHeight;
@property(nonatomic, assign) BOOL explicitly;

- (void)dispatchKeyboardStatus:(KeyboardStatus)status;
- (void)dispatchKeyboardPosition:(CGFloat)position;

/** Updates Fabric state so getContentOriginOffset corrects hit-testing. Call when transform.ty changes. */
- (void)updateTranslationY:(CGFloat)translationY;

@end


NS_ASSUME_NONNULL_END
