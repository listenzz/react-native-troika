#import "AppDelegate.h"

#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

#import <React/RCTLinkingManager.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLog.h>
#import <React/RCTDevMenu.h>

#import <HybridNavigation/HybridNavigation.h>
#import <RNOverlay/RNOverlayModule.h>

@interface ReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate

@property (weak, nonatomic) RCTRootViewFactory *rootViewFactory;

@end

@implementation ReactNativeDelegate

- (NSURL *)bundleURL {
#if DEBUG
	return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
	return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (Class)getModuleClassFromName:(const char *)name {
	NSString *moduleName = [NSString stringWithUTF8String: name];
	if ([moduleName isEqualToString:@"OverlayHost"]) {
		return [RNOverlayModule class];
	}
	return nil;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass {
	if ([moduleClass instancesRespondToSelector:@selector(initWithHost:)]) {
		return [[moduleClass alloc] initWithHost:self.rootViewFactory.reactHost];
	}
	// 返回 nil 使用默认初始化
	return nil;
}

@end

@interface AppDelegate () <HBDReactBridgeManagerDelegate>

@property (strong, nonatomic) RCTRootViewFactory *rootViewFactory;
@property (strong, nonatomic) id<RCTReactNativeFactoryDelegate> reactNativeDelegate;
@property (strong, nonatomic) RCTReactNativeFactory *reactNativeFactory;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    RCTSetLogThreshold(RCTLogLevelInfo);

	ReactNativeDelegate *delegate = [[ReactNativeDelegate alloc] init];
	RCTReactNativeFactory *factory = [[RCTReactNativeFactory alloc] initWithDelegate:delegate];
	delegate.dependencyProvider = [[RCTAppDependencyProvider alloc] init];
	delegate.rootViewFactory = factory.rootViewFactory;

	self.reactNativeDelegate = delegate;
	self.reactNativeFactory = factory;
	self.rootViewFactory = factory.rootViewFactory;

	[self.rootViewFactory initializeReactHostWithLaunchOptions:launchOptions bundleConfiguration:[RCTBundleConfiguration defaultConfiguration] devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];

	[[HBDReactBridgeManager get] installWithReactHost:self.rootViewFactory.reactHost];

    UIStoryboard *storyboard =  [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
    UIViewController *rootViewController = [storyboard instantiateInitialViewController];
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    self.window.windowLevel = UIWindowLevelStatusBar + 1;
    self.window.rootViewController = rootViewController;
    [self.window makeKeyAndVisible];
    return YES;
}

- (void)reactModuleRegisterDidCompleted:(HBDReactBridgeManager *)manager {

}

// iOS 9.x or newer
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
    return [RCTLinkingManager application:application openURL:url options:options];
}

@end
