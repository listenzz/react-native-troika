#include "BottomSheetContentViewState.h"

namespace facebook {
namespace react {

#ifdef ANDROID
folly::dynamic BottomSheetContentViewState::getDynamic() const {
  folly::dynamic data = folly::dynamic::object();
  data["contentOffset"] = contentOffset;
  return data;
}
#endif

} // namespace react
} // namespace facebook
