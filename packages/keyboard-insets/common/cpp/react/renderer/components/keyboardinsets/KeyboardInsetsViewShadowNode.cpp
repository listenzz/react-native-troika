#include "KeyboardInsetsViewShadowNode.h"

namespace facebook {
namespace react {

extern const char KeyboardInsetsViewComponentName[] = "KeyboardInsetsView";

Point KeyboardInsetsViewShadowNode::getContentOriginOffset(
    bool includeTransform) const {
  auto stateData = getStateData();
  auto translationY = stateData.translationY;

  return {
      .x = 0,
      .y = static_cast<Float>(translationY),
  };
}

} // namespace react
} // namespace facebook
