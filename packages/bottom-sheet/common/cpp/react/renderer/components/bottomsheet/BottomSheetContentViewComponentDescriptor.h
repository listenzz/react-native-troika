#pragma once

#include <react/renderer/components/bottomsheet/BottomSheetContentViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <BottomSheetContentView> component.
 */
class BottomSheetContentViewComponentDescriptor final
    : public ConcreteComponentDescriptor<BottomSheetContentViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace react
} // namespace facebook
