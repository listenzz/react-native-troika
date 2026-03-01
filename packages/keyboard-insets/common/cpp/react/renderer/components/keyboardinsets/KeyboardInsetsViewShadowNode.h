#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/keyboardinsets/EventEmitters.h>
#include <react/renderer/components/keyboardinsets/Props.h>
#include <react/renderer/components/keyboardinsets/KeyboardInsetsViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

JSI_EXPORT extern const char KeyboardInsetsViewComponentName[];

/*
 * ShadowNode for <KeyboardInsetsView> component.
 */
class JSI_EXPORT KeyboardInsetsViewShadowNode final
    : public ConcreteViewShadowNode<
          KeyboardInsetsViewComponentName,
          KeyboardInsetsViewProps,
          ViewEventEmitter,
          KeyboardInsetsViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  Point getContentOriginOffset(bool includeTransform) const override;
};

} // namespace react
} // namespace facebook
