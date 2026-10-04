#include "NestedScrollViewShadowNode.h"

#include <cmath>

#include <react/renderer/components/view/conversions.h>

#include <react/renderer/components/nestedscrollview/NestedScrollViewContentShadowNode.h>
#include <react/renderer/components/nestedscrollview/NestedScrollViewChildShadowNode.h>

namespace facebook {
namespace react {

using namespace yoga;

extern const char NestedScrollViewComponentName[] = "NestedScrollView";

void NestedScrollViewShadowNode::adjustLayoutWithState() {
	ensureUnsealed();

	auto state =
      std::static_pointer_cast<const NestedScrollViewShadowNode::ConcreteState>(
          getState());

	// Check if state is valid
	if (!state) {
		return;
	}

  	auto stateData = state->getData();
	auto contentHeight = stateData.contentHeight;
	auto headerHeight = stateData.headerHeight;
	auto parentNodeHeight = headerHeight + contentHeight;

	// Validate height values
	if (parentNodeHeight <= 0) {
		return;
	}

	auto nodes = getLayoutableChildNodes();

#ifdef ANDROID
	if (nodes.empty()) {
		return;
	}
	
	auto contentShadowNode = static_cast<NestedScrollViewContentShadowNode *>(nodes.at(0));
	auto adjusted = contentShadowNode->adjustLayoutWithState(parentNodeHeight);
	if (adjusted) {
		yogaNode_.setDirty(true);
	}

	auto childNodes = contentShadowNode->getLayoutableChildNodes();
	if (childNodes.size() != 2) {
		return;
	}

	auto childShadowNode = static_cast<NestedScrollViewChildShadowNode *>(childNodes.at(1));
	childShadowNode->adjustLayoutWithState(contentHeight);
	
#else
	if (nodes.size() != 2) {
		return;
	}

	auto childShadowNode = dynamic_cast<NestedScrollViewChildShadowNode *>(nodes.at(1));
	if (!childShadowNode || !std::isfinite(contentHeight) || contentHeight <= 0 ||
		childShadowNode->hasContentHeight(contentHeight)) {
		return;
	}

	// State-only clones share sealed children with the previous committed tree.
	// Adjust an owned clone so neither its style nor its dirty flag leaks back.
	auto adjustedChild = std::static_pointer_cast<NestedScrollViewChildShadowNode>(
		childShadowNode->clone({}));
	adjustedChild->adjustLayoutWithState(contentHeight);
	replaceChild(*childShadowNode, adjustedChild);

	// Dirtying the child alone does not invalidate this node's Yoga cache.
	// Ancestor clones will propagate this flag through updateYogaChildren().
	dirtyLayout();
#endif
	
}

Point NestedScrollViewShadowNode::getContentOriginOffset(bool includeTransform) const {
	auto stateData = getStateData();
    auto contentOffsetY = stateData.contentOffsetY;

    return {
        .x  = 0,
        .y = static_cast<Float>(-contentOffsetY)
    };
}

} // namespace react
} // namespace facebook
