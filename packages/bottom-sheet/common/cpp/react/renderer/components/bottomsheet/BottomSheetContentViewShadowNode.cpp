#include "BottomSheetContentViewShadowNode.h"

namespace facebook {
namespace react {

extern const char BottomSheetContentViewComponentName[] = "BottomSheetContentView";

Point BottomSheetContentViewShadowNode::getContentOriginOffset(bool includeTransform) const {
  auto stateData = getStateData();
  auto contentOffset = stateData.contentOffset;

  return {
      .x = 0,
      .y = static_cast<Float>(contentOffset),
  };
}

} // namespace react
} // namespace facebook
