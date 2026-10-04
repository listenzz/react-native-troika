#!/usr/bin/env python3
"""Run the Fabric regression against a previously built iOS Simulator app.

Requires the repository's CocoaPods build with prebuilt React frameworks.
Uses the pod's C++ compiler flags and libraries; does not boot a simulator or
launch the demo UI. Pass the ID of an already booted simulator explicitly.
"""

import argparse
from pathlib import Path
import shlex
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--derived-data", required=True, type=Path)
    parser.add_argument("--device", required=True)
    parser.add_argument("--arch", choices=("arm64", "x86_64"), default="arm64")
    parser.add_argument("--configuration", default="Debug")
    parser.add_argument("--deployment-target", default="16.4")
    args = parser.parse_args()

    test_dir = Path(__file__).resolve().parent
    repo = test_dir.parents[3]
    build = args.derived_data.resolve() / "Build"
    variant = f"{args.configuration}-iphonesimulator"
    products = build / "Products" / variant
    objects = (build / "Intermediates.noindex/Pods.build" / variant /
               "RNNestedScrollView.build/Objects-normal" / args.arch)
    response = None
    for candidate in sorted(objects.glob("*common-args.resp")):
        flags = shlex.split(candidate.read_text())
        if "-std=c++20" in flags and "-fobjc-arc" not in flags:
            response = flags
            break
    if response is None:
        parser.error(f"No C++ build flags in {objects}; build the simulator app first")

    libraries = [products / "RNNestedScrollView/libRNNestedScrollView.a",
                 products / "ReactCodegen/libReactCodegen.a"]
    for library in libraries:
        if not library.is_file():
            parser.error(f"Missing {library}; build the simulator app first")
    native_sources = repo / "packages/nested-scroll/common/cpp"
    if any(p.stat().st_mtime > libraries[0].stat().st_mtime
           for p in native_sources.rglob("*") if p.suffix in (".h", ".cpp")):
        parser.error("Native sources are newer than the library; rebuild the simulator app")

    sdk = subprocess.check_output(
        ["xcrun", "--sdk", "iphonesimulator", "--show-sdk-path"], text=True).strip()
    with tempfile.TemporaryDirectory(prefix="nested-scroll-fabric-") as output:
        binary = Path(output) / "regression"
        command = ["xcrun", "clang++", "-target",
                   f"{args.arch}-apple-ios{args.deployment_target}-simulator",
                   "-isysroot", sdk, *response, "-DRCT_NEW_ARCH_ENABLED=1",
                   str(test_dir / "layout-regression.cpp"), *map(str, libraries)]
        for framework in ("React", "ReactNativeDependencies", "hermesvm", "Foundation", "UIKit"):
            command += ["-framework", framework]
        for relative in ("React-Core-prebuilt", "ReactNativeDependencies", "hermes-engine/Pre-built"):
            command += ["-Wl,-rpath," + str(products / "XCFrameworkIntermediates" / relative)]
        command += ["-o", str(binary)]
        subprocess.run(command, cwd=repo / "ios/Pods", check=True)
        subprocess.run(["codesign", "--force", "--sign", "-", str(binary)], check=True)
        subprocess.run(["xcrun", "simctl", "spawn", args.device, str(binary)], check=True)


if __name__ == "__main__":
    main()
