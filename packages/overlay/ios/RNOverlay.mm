#import "RNOverlay.h"
#import "RNOverlayHostingView.h"

#import <ReactCommon/RCTHost.h>
#import <React/RCTUtils.h>

@interface RNOverlay ()

@property(nonatomic, weak) UIWindow *keyWindow;
@property(nonatomic, strong) RNOverlayHostingView *rootView;
@property(nonatomic, copy) NSString *moduleName;
@property(nonatomic, weak) RCTHost *rctHost;

@end

@implementation RNOverlay

- (instancetype)initWithModuleName:(NSString *)moduleName host:(RCTHost *)rctHost {
	if (self = [super init]) {
		_moduleName = moduleName;
		_rctHost = rctHost;
	}
	return self;
}

- (void)show:(NSDictionary *)props options:(NSDictionary *)options {
	RNOverlayHostingView *rctView = [self createReactRootView:props];
    rctView.passThroughTouches = [options[@"passThroughTouches"] boolValue];
    rctView.frame = [UIScreen mainScreen].bounds;
    self.rootView = rctView;

	UIWindow *keyWindow = RCTKeyWindow();
    [keyWindow addSubview:rctView];
}

- (void)hide {
    if (self.rootView) {
        [self.rootView removeFromSuperview];
        self.rootView = nil;
    }
}

- (void)update {
	UIWindow *keyWindow = RCTKeyWindow();
    if (keyWindow != self.keyWindow) {
        [self.rootView removeFromSuperview];
        [keyWindow addSubview:self.rootView];
        self.keyWindow = keyWindow;
    }
}

- (RNOverlayHostingView *)createReactRootView:(NSDictionary *)props {
	RCTFabricSurface *surface = [self.rctHost createSurfaceWithModuleName:self.moduleName initialProperties:props];
	RNOverlayHostingView *rootView = [[RNOverlayHostingView alloc] initWithSurface:(id)surface];
    return rootView;
}

@end
