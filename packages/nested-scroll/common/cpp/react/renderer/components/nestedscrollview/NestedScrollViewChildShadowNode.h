#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/nestedscrollview/EventEmitters.h>
#include <react/renderer/components/nestedscrollview/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/StateData.h>


namespace facebook {
namespace react {

JSI_EXPORT extern const char NestedScrollViewChildComponentName[];

using NestedScrollViewChildState = StateData;

/*
 * `ShadowNode` for <NestedScrollViewChild> component.
 */
class JSI_EXPORT NestedScrollViewChildShadowNode final
    : public ConcreteViewShadowNode<
          NestedScrollViewChildComponentName,
          NestedScrollViewChildProps,
          ViewEventEmitter,
          NestedScrollViewChildState> {
  	using ConcreteViewShadowNode::ConcreteViewShadowNode;

public:
	bool hasContentHeight(float contentHeight) const;
  	void adjustLayoutWithState(float contentHeight);
};

} // namespace react
} // namespace facebook
