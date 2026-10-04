// SwipePager 的纯逻辑（几何/翻页判定，零框架依赖，可 jest 直测）。
// 几何包含卡片之间的间距：页宽 P、停靠步长 P + pageGap − peek。

/** 相邻页露出宽度默认值（px）：peek 硬需求的现状口径。 */
export const PAGER_PEEK = 21;

/** 翻页距离阈值：拖动位移超过页宽该比例即翻页（与速度阈值满足其一）。 */
export const SNAP_DISTANCE_RATIO = 0.45;

/** 翻页速度阈值（dp/s）：短距离快甩即使位移不足也翻页（对齐 pager-view 的 distance-OR-velocity 判定）。 */
export const FLING_VELOCITY_DP = 180;

/** 拖出首/尾页边缘时的阻尼系数：越界位移按该比例跟手，松手回弹。 */
export const EDGE_RESISTANCE = 0.25;

/** Pan 方向判定阈值（pt）：超过后锁定主方向，纵向交还父容器（不干扰子控件点击/纵向手势）。 */
export const PAGER_SWIPE_SLOP = 12;

/** 与 Bottom Sheet 使用同一主方向规则；斜滑不能因纵向分量超过阈值而误判。 */
export function resolvePagerAxis(dx: number, dy: number, slop = PAGER_SWIPE_SLOP) {
    'worklet';
    const x = Math.abs(dx);
    const y = Math.abs(dy);
    if (Math.max(x, y) <= slop) return 'pending';
    return x > y ? 'horizontal' : 'vertical';
}

/** 第 index 页停靠时行容器需要平移的距离（正值语义，实际 transform 取负）。 */
export function snapOffset(
    index: number,
    pageWidth: number,
    peek: number = PAGER_PEEK,
    pageGap = 0
): number {
    return index * (pageWidth + pageGap - peek);
}

export interface ResolveTargetPageArgs {
    /** 手势起始所在页。 */
    pageIndex: number;
    /** 总页数（目标页 clamp 边界）。 */
    pageCount: number;
    /** 松手时横向位移（px，向左为负）。 */
    translationX: number;
    /** 松手时横向速度（px/s，向左为负）。 */
    velocityX: number;
    /** 单页宽度（px）。 */
    pageWidth: number;
    /** 屏幕密度换算系数（PixelRatio.get()），速度阈值 dp/s → px/s。 */
    pixelRatio?: number;
}

/**
 * 松手翻页判定（pager-view 同款 distance-OR-velocity 模型）：
 * 位移过阈值或速度过阈值（满足其一）即向拖动方向翻页，否则留在当前页。
 * 方向以拖动位移为准（位移为 0 时回退用速度方向）；目标页 clamp 在 [0, pageCount - 1]。
 */
export function resolveTargetPage({
    pageIndex,
    pageCount,
    translationX,
    velocityX,
    pageWidth,
    pixelRatio = 1,
}: ResolveTargetPageArgs): number {
    const distanceThreshold = SNAP_DISTANCE_RATIO * pageWidth;
    const velocityThreshold = FLING_VELOCITY_DP * pixelRatio;
    const moved = Math.abs(translationX) >= distanceThreshold;
    const flung = Math.abs(velocityX) >= velocityThreshold;
    if (!moved && !flung) {
        return pageIndex;
    }
    const direction = -(Math.sign(translationX) || Math.sign(velocityX));
    const target = pageIndex + direction;
    return Math.min(pageCount - 1, Math.max(0, target));
}
