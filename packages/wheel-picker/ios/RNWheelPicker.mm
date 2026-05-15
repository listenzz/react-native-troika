#import "RNWheelPicker.h"

@interface RNWheelPicker() <UIPickerViewDataSource, UIPickerViewDelegate>
@end

@implementation RNWheelPicker

- (instancetype)initWithFrame:(CGRect)frame {
    if ((self = [super initWithFrame:frame])) {
        _font = [UIFont systemFontOfSize:14];
        _textAlign = NSTextAlignmentCenter;
        _itemHeight = 36;
        _textColorOut = [UIColor blackColor];
        _textColorCenter = [UIColor blackColor];
        _cyclic = NO;
        self.delegate = self;
        self.dataSource = self;
    }
    return self;
}

- (void)layoutSubviews {
	[super layoutSubviews];
	NSArray<UIView *> *subviews = self.subviews;
	for (NSUInteger i = 0; i < subviews.count; i++) {
		if (i != 0) {
			UIView *curtain = [subviews objectAtIndex:i];
			curtain.hidden = YES;
		}
	}
}

- (void)setItems:(NSArray<NSString *> *)items {
    _items = [items copy];
    [self reloadAllComponents];
    [self selectSelectedIndexAnimated:NO];
    [self setNeedsLayout];
}

- (void)setItemHeight:(CGFloat)itemHeight {
    _itemHeight = itemHeight;
    [self setNeedsLayout];
}

- (void)setFont:(UIFont *)font {
    _font = font;
    [self setNeedsLayout];
}

- (void)setSelectedIndex:(NSInteger)selectedIndex {
    if (_selectedIndex != selectedIndex) {
        _selectedIndex = selectedIndex;
        [self selectSelectedIndexAnimated:NO];
    }
}

- (void)setCyclic:(BOOL)cyclic {
    if (_cyclic != cyclic) {
        _cyclic = cyclic;
        [self reloadAllComponents];
        [self selectSelectedIndexAnimated:NO];
    }
}

- (BOOL)isCyclicEnabled {
    return _cyclic && _items.count > 1;
}

- (NSInteger)numberOfRows {
    if ([self isCyclicEnabled]) {
        return _items.count * 1000;
    }
    return _items.count;
}

- (NSInteger)logicalIndexForRow:(NSInteger)row {
    if (_items.count == 0) {
        return 0;
    }

    NSInteger index = row % (NSInteger)_items.count;
    return index < 0 ? index + (NSInteger)_items.count : index;
}

- (NSInteger)rowForSelectedIndex:(NSInteger)selectedIndex {
    if (_items.count == 0) {
        return 0;
    }

    NSInteger index = MIN(MAX(selectedIndex, 0), (NSInteger)_items.count - 1);
    if (![self isCyclicEnabled]) {
        return index;
    }

    NSInteger middleRow = [self numberOfRows] / 2;
    NSInteger middleGroupStart = middleRow - [self logicalIndexForRow:middleRow];
    return middleGroupStart + index;
}

- (void)selectSelectedIndexAnimated:(BOOL)animated {
    if (_items.count == 0) {
        return;
    }

    NSInteger row = [self rowForSelectedIndex:_selectedIndex];
    dispatch_async(dispatch_get_main_queue(), ^{
        [self selectRow:row inComponent:0 animated:animated];
    });
}

#pragma mark - UIPickerViewDataSource protocol

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView {
    return 1;
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView
numberOfRowsInComponent:(__unused NSInteger)component {
    return [self numberOfRows];
}

#pragma mark - UIPickerViewDelegate methods

- (NSString *)pickerView:(__unused UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(__unused NSInteger)component {
    return _items[[self logicalIndexForRow:row]];
}

- (CGFloat)pickerView:(__unused UIPickerView *)pickerView rowHeightForComponent:(NSInteger)__unused component {
    return _itemHeight;
}

- (UIView *)pickerView:(UIPickerView *)pickerView
            viewForRow:(NSInteger)row
          forComponent:(NSInteger)component
           reusingView:(UILabel *)label {
    if (!label) {
        label = [[UILabel alloc] initWithFrame:(CGRect){
            CGPointZero,
            {
                [pickerView rowSizeForComponent:component].width,
                [pickerView rowSizeForComponent:component].height,
            }
        }];
    }

    label.font = _font;
    label.textColor = _textColorOut;
    label.textAlignment = _textAlign;
    label.text = [self pickerView:pickerView titleForRow:row forComponent:component];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        UILabel *label = (UILabel *)[pickerView viewForRow:row forComponent:component];
        label.textColor = self->_textColorCenter;
    });

    return label;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row inComponent:(__unused NSInteger)component {
    NSInteger selectedIndex = [self logicalIndexForRow:row];
    _selectedIndex = selectedIndex;
    if (_onItemSelected && _items.count > (NSUInteger)selectedIndex) {
		_onItemSelected(selectedIndex);
    }
}

@end
