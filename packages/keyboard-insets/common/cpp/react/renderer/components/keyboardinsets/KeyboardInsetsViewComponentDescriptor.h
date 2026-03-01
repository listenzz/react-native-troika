#pragma once

#include <react/renderer/components/keyboardinsets/KeyboardInsetsViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <KeyboardInsetsView> component.
 */
class KeyboardInsetsViewComponentDescriptor final
    : public ConcreteComponentDescriptor<KeyboardInsetsViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace react
} // namespace facebook
