#pragma once

#include <react/renderer/components/bottomsheet/Props.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook {
namespace react {

/*
 * State for <BottomSheetContentView> component. contentOffset is the offset
 * (actual top - layout top) of this view. Used by getContentOriginOffset
 * so that hit-testing uses the correct content origin when the sheet moves the view.
 */
class JSI_EXPORT BottomSheetContentViewState final {
 public:
  using Shared = std::shared_ptr<const BottomSheetContentViewState>;

  BottomSheetContentViewState() = default;

#ifdef ANDROID
  BottomSheetContentViewState(
      BottomSheetContentViewState const &previousState,
      folly::dynamic data) {
    contentOffset = data.getDefault("contentOffset", previousState.contentOffset).asDouble();
  }
#endif

  double contentOffset{};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const { return MapBufferBuilder::EMPTY(); }
#endif
};

} // namespace react
} // namespace facebook
