require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNKeyboardInsets"
  s.version      = package["version"]
  s.summary      = package["description"]

  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/github-account/keyboard-insets.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}", "common/cpp/**/*.{cpp,h}"
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/common/cpp\""
  }

  install_modules_dependencies(s)
end
