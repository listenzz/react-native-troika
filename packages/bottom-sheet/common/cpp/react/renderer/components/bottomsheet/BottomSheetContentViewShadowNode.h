#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/bottomsheet/BottomSheetContentViewState.h>
#include <react/renderer/components/bottomsheet/EventEmitters.h>
#include <react/renderer/components/bottomsheet/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

JSI_EXPORT extern const char BottomSheetContentViewComponentName[];

/*
 * ShadowNode for <BottomSheetContentView>. getContentOriginOffset returns
 * the view's top offset so that RN hit-testing uses the correct coordinates
 * when the parent BottomSheet has moved this content view.
 */
class JSI_EXPORT BottomSheetContentViewShadowNode final
    : public ConcreteViewShadowNode<
          BottomSheetContentViewComponentName,
          BottomSheetContentViewProps,
          ViewEventEmitter,
          BottomSheetContentViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  Point getContentOriginOffset(bool includeTransform) const override;
};

} // namespace react
} // namespace facebook
