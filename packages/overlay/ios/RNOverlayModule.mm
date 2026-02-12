#import "RNOverlayModule.h"
#import "RNOverlay.h"

#import <React/RCTLog.h>
#import <React-RuntimeApple/ReactCommon/RCTHost.h>
#import <React/RCTConversions.h>

NSString* genKey(NSString* moduleName, NSNumber* id) {
    return [NSString stringWithFormat:@"%@-%@", moduleName, id];
}

@interface RNOverlayModule ()

@property(nonatomic, strong) NSMutableDictionary *overlays;
@property(nonatomic, strong) RCTHost *host;

@end

@implementation RNOverlayModule


+ (BOOL)requiresMainQueueSetup {
	return YES;
}

- (dispatch_queue_t)methodQueue {
	return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE(OverlayHost)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeOverlaySpecJSI>(params);
}

- (instancetype)init {
    if (self = [super init]) {
        _overlays = [[NSMutableDictionary alloc] init];
    }
    return self;
}

- (instancetype)initWithHost:(RCTHost *)host {
	if (self = [super init]) {
		_overlays = [[NSMutableDictionary alloc] init];
		_host = host;
	}
	return self;
}

- (void)handleReload {
    for (NSString *key in self.overlays) {
        RNOverlay *overlay = self.overlays[key];
        [overlay hide];
    }
    [self.overlays removeAllObjects];
}

- (void)invalidate {
    [self handleReload];
}

- (void)show:(NSString *)moduleName options:(JS::NativeOverlay::OverlayOptions &)options {
	NSString* key = genKey(moduleName, @(options.overlayId()));
	RNOverlay *overlay = self.overlays[key];
	if (overlay != nil) {
		[overlay update];
		return;
	}

	overlay = [[RNOverlay alloc] initWithModuleName:moduleName host:self.host];
	self.overlays[key] = overlay;

	UIWindow *window = RCTKeyWindow();
	UIEdgeInsets safeAreaInsets = window.safeAreaInsets;
	NSDictionary* insets = @{
	  @"top" : @(safeAreaInsets.top),
	  @"right" : @(safeAreaInsets.right),
	  @"bottom" : @(safeAreaInsets.bottom),
	  @"left" : @(safeAreaInsets.left),
	};

	std::optional<bool> passThrough = options.passThroughTouches();
	NSDictionary *props = @{
		@"insets": insets,
		@"overlayId": @(options.overlayId()),
		@"passThroughTouches": @(passThrough.has_value() ? passThrough.value() : false)
	};
	[overlay show:props options:props];
}

- (void)hide:(NSString *)moduleName overlayId:(NSInteger)overlayId {
	NSString* key = genKey(moduleName, @(overlayId));
	RNOverlay *overlay = self.overlays[key];
	if (!overlay) {
		return;
	}
	[self.overlays removeObjectForKey:key];
	[overlay hide];
}

@end
