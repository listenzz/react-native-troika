#include <react/renderer/components/nestedscrollview/NestedScrollViewChildComponentDescriptor.h>
#include <react/renderer/components/nestedscrollview/NestedScrollViewComponentDescriptor.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/utils/ContextContainer.h>

#include <cstdio>
#include <cstdlib>
#include <limits>

using namespace facebook::react;
namespace yoga = facebook::yoga;

static int nextTag = 1;

static void check(bool condition, const char *message) {
	if (!condition) {
		std::fprintf(stderr, "FAIL: %s\n", message);
		std::exit(1);
	}
}

template <class Descriptor, class Props>
auto makeNode(Descriptor &descriptor, std::shared_ptr<Props> props) {
	auto family = descriptor.createFamily({nextTag++, 1, nullptr});
	auto state = descriptor.createInitialState(props, family);
	return std::static_pointer_cast<typename Descriptor::ConcreteShadowNode>(
		descriptor.createShadowNode({.props = props, .state = state}, family));
}

static auto childAt(const ShadowNode &node, size_t index) {
	return std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(node.getChildren().at(index));
}

int main() {
	auto context = std::make_shared<ContextContainer>();
	ComponentDescriptorParameters parameters{
		.eventDispatcher = {}, .contextContainer = context, .flavor = nullptr};
	RootComponentDescriptor rootDescriptor(parameters);
	ViewComponentDescriptor viewDescriptor(parameters);
	NestedScrollViewComponentDescriptor nestedDescriptor(parameters);
	NestedScrollViewChildComponentDescriptor childDescriptor(parameters);

	auto rootProps = std::make_shared<RootProps>();
	rootProps->layoutConstraints.minimumSize = {402, 657};
	rootProps->layoutConstraints.maximumSize = {402, 657};
	rootProps->layoutConstraints.layoutDirection = LayoutDirection::LeftToRight;
	rootProps->layoutContext.pointScaleFactor = 3;
	auto root = makeNode(rootDescriptor, rootProps);
	auto nestedProps = std::make_shared<NestedScrollViewProps>();
	nestedProps->yogaStyle.setFlex(yoga::FloatOptional(1));
	auto nested = makeNode(nestedDescriptor, nestedProps);
	auto headerProps = std::make_shared<ViewProps>();
	headerProps->yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(216));
	auto header = makeNode(viewDescriptor, headerProps);
	auto child = makeNode(childDescriptor, std::make_shared<NestedScrollViewChildProps>());
	auto pagerProps = std::make_shared<ViewProps>();
	pagerProps->yogaStyle.setFlex(yoga::FloatOptional(1));
	auto pager = makeNode(viewDescriptor, pagerProps);

	// Match PagerView's Yoga hierarchy, without loading its UIKit/SwiftUI host.
	for (int i = 0; i < 3; i++) {
		auto pageProps = std::make_shared<ViewProps>();
		pageProps->yogaStyle.setPositionType(yoga::PositionType::Absolute);
		for (auto edge : {yoga::Edge::Left, yoga::Edge::Top, yoga::Edge::Right, yoga::Edge::Bottom}) {
			pageProps->yogaStyle.setPosition(edge, yoga::StyleLength::points(0));
		}
		pager->appendChild(makeNode(viewDescriptor, pageProps));
	}
	child->appendChild(pager);
	nested->appendChild(header);
	nested->appendChild(child);
	root->appendChild(nested);
	root->layoutIfNeeded();
	root->sealRecursive();
	auto firstChild = childAt(*childAt(*root, 0), 1);
	check(firstChild->getLayoutMetrics().frame.size.height == 0, "initial flex child is zero");

	const auto family = nested->getFamilyShared();
	auto update = [&](const std::shared_ptr<RootShadowNode> &previous, double height, double offset = 0) {
		return std::static_pointer_cast<RootShadowNode>(previous->cloneTree(*family, [&](const ShadowNode &old) {
			auto oldState = std::static_pointer_cast<const NestedScrollViewShadowNode::ConcreteState>(old.getState());
			auto data = oldState->getData();
			data.contentHeight = height;
			data.contentOffsetY = offset;
			auto state = std::make_shared<NestedScrollViewShadowNode::ConcreteState>(
				std::make_shared<const NestedScrollViewState>(data), *oldState);
			return old.clone({.state = state});
		}));
	};

	auto resized = update(root, 601);
	auto newChild = childAt(*childAt(*resized, 0), 1);
	check(!resized->getIsLayoutClean(), "state height dirties ancestors");
	check(newChild.get() != firstChild.get(), "state update clones the sealed child");
	check(firstChild->getIsLayoutClean(), "old child remains clean");
	check(root->getIsLayoutClean(), "old root remains clean");
	resized->layoutIfNeeded();
	resized->sealRecursive();
	newChild = childAt(*childAt(*resized, 0), 1);
	check(newChild->getLayoutMetrics().frame.size.height == 601, "height becomes 601");
	auto newPager = childAt(*newChild, 0);
	check(newPager->getLayoutMetrics().frame.size.height == 601, "flex pager receives 601");
	for (int i = 0; i < 3; i++) {
		check(childAt(*newPager, i)->getLayoutMetrics().frame.size.height == 601, "each absolute page receives 601");
	}
	check(firstChild->getLayoutMetrics().frame.size.height == 0, "old committed layout unchanged");
	std::puts("PASS initial zero -> 601; three pages updated; old tree unchanged");

	auto scrolled = update(resized, 601, 80);
	check(scrolled->getIsLayoutClean(), "offset-only state does not dirty layout");
	check(childAt(*childAt(*scrolled, 0), 1).get() == newChild.get(), "offset-only update retains content child");
	scrolled->sealRecursive();
	std::puts("PASS offset-only update keeps content and layout cache");

	auto smaller = update(scrolled, 501);
	smaller->layoutIfNeeded();
	smaller->sealRecursive();
	check(childAt(*childAt(*smaller, 0), 1)->getLayoutMetrics().frame.size.height == 501, "subsequent resize applies");
	check(newChild->getLayoutMetrics().frame.size.height == 601, "resize preserves previous committed layout");
	check(childAt(*childAt(*childAt(*smaller, 0), 1), 0)->getFamilyShared() == newPager->getFamilyShared(),
		"pager retains identity after resize");
	std::puts("PASS 601 -> 501 resize preserves previous layout and pager identity");

	for (double height : {0.0, -1.0, std::numeric_limits<double>::quiet_NaN(), std::numeric_limits<double>::infinity()}) {
		auto invalid = update(smaller, height);
		check(invalid->getIsLayoutClean(), "invalid height skipped");
		check(childAt(*childAt(*invalid, 0), 1)->getLayoutMetrics().frame.size.height == 501,
			"invalid height retains usable layout");
	}
	std::puts("PASS zero, negative, NaN and infinite heights retain layout");
	return 0;
}
