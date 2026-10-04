#include "NestedScrollViewChildShadowNode.h"

#include <react/renderer/components/view/conversions.h>

namespace facebook {
namespace react {

using namespace yoga;

extern const char NestedScrollViewChildComponentName[] = "NestedScrollViewChild";

bool NestedScrollViewChildShadowNode::hasContentHeight(float contentHeight) const {
	const auto height = yoga::StyleSizeLength::points(contentHeight);
	const auto &style = yogaNode_.style();
	return style.minDimension(yoga::Dimension::Height) == height &&
		style.maxDimension(yoga::Dimension::Height) == height;
}

void NestedScrollViewChildShadowNode::adjustLayoutWithState(float contentHeight) {
#ifndef ANDROID
	ensureUnsealed();
#endif

	yoga::Style adjustedStyle = getConcreteProps().yogaStyle;
	adjustedStyle.setMaxDimension(
		yoga::Dimension::Height, yoga::StyleSizeLength::points(contentHeight));
	adjustedStyle.setMinDimension(
		yoga::Dimension::Height, yoga::StyleSizeLength::points(contentHeight));

	auto currentStyle = yogaNode_.style();
	if (adjustedStyle.maxDimension(yoga::Dimension::Height) != currentStyle.maxDimension(yoga::Dimension::Height) ||
		adjustedStyle.minDimension(yoga::Dimension::Height) != currentStyle.minDimension(yoga::Dimension::Height)) {
		yogaNode_.setStyle(adjustedStyle);
		yogaNode_.setDirty(true);
	}
}

} // namespace react
} // namespace facebook
