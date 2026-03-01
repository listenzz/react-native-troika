#include "KeyboardInsetsViewState.h"

namespace facebook {
namespace react {

#ifdef ANDROID

folly::dynamic KeyboardInsetsViewState::getDynamic() const {
  folly::dynamic data = folly::dynamic::object();
  data["translationY"] = translationY;
  return data;
}
#endif

} // namespace react
} // namespace facebook
