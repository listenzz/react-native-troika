#import <UIKit/UIKit.h>

typedef void(^RNWheelPickerItemSelected)(NSInteger index);

@interface RNWheelPicker : UIPickerView

@property (nonatomic, copy) NSArray<NSString *> *items;
@property (nonatomic, assign) NSInteger selectedIndex;

@property (nonatomic, strong) UIColor *textColorCenter;
@property (nonatomic, strong) UIColor *textColorOut;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, assign) NSTextAlignment textAlign;
@property (nonatomic, assign) CGFloat itemHeight;
@property (nonatomic, assign) BOOL cyclic;

@property (nonatomic, copy) RNWheelPickerItemSelected onItemSelected;

@end
