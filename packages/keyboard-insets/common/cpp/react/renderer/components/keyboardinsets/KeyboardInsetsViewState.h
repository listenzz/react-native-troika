#pragma once

#include <react/renderer/components/keyboardinsets/Props.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook {
namespace react {

/*
 * State for <KeyboardInsetsView> component.
 */
class JSI_EXPORT KeyboardInsetsViewState final {
 public:
  using Shared = std::shared_ptr<const KeyboardInsetsViewState>;

  KeyboardInsetsViewState() = default;

#ifdef ANDROID
  KeyboardInsetsViewState(
      KeyboardInsetsViewState const &previousState,
      folly::dynamic data) {
    translationY = data.getDefault("translationY", previousState.translationY)
                       .asDouble();
  }
#endif

  double translationY{};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

} // namespace react
} // namespace facebook
