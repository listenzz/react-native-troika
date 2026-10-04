import { FLING_VELOCITY_DP, PAGER_PEEK, resolveTargetPage, snapOffset } from '../swipePagerGesture';

const PAGE_WIDTH = 350;
const PAGE_COUNT = 2;
// 距离阈值随 SNAP_DISTANCE_RATIO 联动（0.45 × 350 = 157.5），用例取 ±160（翻）/ ±100（不翻）。
const DISTANCE_FLIP = 160;
const DISTANCE_STAY = 100;

describe('snapOffset', () => {
    it('第 0 页停靠在原点', () => {
        expect(snapOffset(0, PAGE_WIDTH)).toBe(0);
    });

    it('第 1 页停靠步长 = 页宽 − PEEK（重叠步长模型）', () => {
        expect(snapOffset(1, PAGE_WIDTH)).toBe(PAGE_WIDTH - PAGER_PEEK);
    });

    it('peek 可配', () => {
        expect(snapOffset(1, PAGE_WIDTH, 30)).toBe(PAGE_WIDTH - 30);
    });

    it.each([375, 393, 430])('首页 %spt 宽时两张卡停靠后各露出相邻卡 21pt', screenWidth => {
        const inset = 12;
        const gap = 12;
        const cardWidth = screenWidth - PAGER_PEEK - inset * 2;
        const secondCardLeft = inset + cardWidth + gap;
        expect(screenWidth - secondCardLeft).toBe(21);

        const offset = snapOffset(1, cardWidth, PAGER_PEEK, gap);
        expect(secondCardLeft - offset).toBe(33);
        expect(inset + cardWidth - offset).toBe(21);
        expect(screenWidth - (secondCardLeft - offset + cardWidth)).toBe(12);
    });
});

describe('resolveTargetPage', () => {
    const base = {
        pageCount: PAGE_COUNT,
        pageWidth: PAGE_WIDTH,
    };

    it('位移超过距离阈值 → 向拖动方向翻页', () => {
        expect(resolveTargetPage({ ...base, pageIndex: 0, translationX: -DISTANCE_FLIP, velocityX: 0 })).toBe(1);
        expect(resolveTargetPage({ ...base, pageIndex: 1, translationX: DISTANCE_FLIP, velocityX: 0 })).toBe(0);
    });

    it('位移不足但速度超过阈值（dp/s × pixelRatio）→ 短滑快甩也翻页', () => {
        // 阈值 FLING_VELOCITY_DP × 3
        expect(
            resolveTargetPage({
                ...base,
                pageIndex: 0,
                translationX: -50,
                velocityX: -(FLING_VELOCITY_DP * 3 * 2),
                pixelRatio: 3,
            })
        ).toBe(1);
        expect(
            resolveTargetPage({
                ...base,
                pageIndex: 1,
                translationX: 50,
                velocityX: FLING_VELOCITY_DP * 3 * 2,
                pixelRatio: 3,
            })
        ).toBe(0);
    });

    it('位移与速度都不足 → 留在当前页（回弹）', () => {
        expect(
            resolveTargetPage({
                ...base,
                pageIndex: 0,
                translationX: -DISTANCE_STAY,
                velocityX: -(FLING_VELOCITY_DP * 3 * 0.9),
                pixelRatio: 3,
            })
        ).toBe(0);
    });

    it('位移为 0 时方向回退用速度符号', () => {
        expect(
            resolveTargetPage({
                ...base,
                pageIndex: 0,
                translationX: 0,
                velocityX: -(FLING_VELOCITY_DP * 6),
                pixelRatio: 3,
            })
        ).toBe(1);
        expect(
            resolveTargetPage({
                ...base,
                pageIndex: 1,
                translationX: 0,
                velocityX: FLING_VELOCITY_DP * 6,
                pixelRatio: 3,
            })
        ).toBe(0);
    });

    it('位移与速度方向相反时以位移为准（拖动方向决定翻页）', () => {
        expect(
            resolveTargetPage({ ...base, pageIndex: 0, translationX: -DISTANCE_FLIP, velocityX: 2000, pixelRatio: 3 })
        ).toBe(1);
        expect(
            resolveTargetPage({ ...base, pageIndex: 1, translationX: DISTANCE_FLIP, velocityX: -2000, pixelRatio: 3 })
        ).toBe(0);
    });

    it('目标页 clamp 在 [0, pageCount - 1]（首尾页不越界）', () => {
        expect(resolveTargetPage({ ...base, pageIndex: 0, translationX: DISTANCE_FLIP + 40, velocityX: 0 })).toBe(0);
        expect(resolveTargetPage({ ...base, pageIndex: 1, translationX: -(DISTANCE_FLIP + 40), velocityX: 0 })).toBe(1);
    });

    it('pixelRatio 缺省按 1（速度阈值即 FLING_VELOCITY_DP px/s 量级）', () => {
        expect(resolveTargetPage({ ...base, pageIndex: 0, translationX: -50, velocityX: -(FLING_VELOCITY_DP * 2) })).toBe(1);
        expect(resolveTargetPage({ ...base, pageIndex: 0, translationX: -50, velocityX: -(FLING_VELOCITY_DP * 0.5) })).toBe(0);
    });
});
