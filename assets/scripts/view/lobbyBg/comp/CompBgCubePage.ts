/**
 * @file CompBgCubePage.ts
 * @description 大厅背景方块页动画：26 条方块行自上而下循环移动，回卷到顶部时重新随机
 * @category 大厅背景
 */

import { director } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompBgCubePage from "@fgui/lobbyBg/FGUICompBgCubePage";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { CompBgCubeLine } from "./CompBgCubeLine";

/**
 * @class CompBgCubePage
 * @description 大厅背景动画主体，驱动 26 条方块行匀速下移并无缝循环回卷
 * @category 大厅背景
 */
@PackageLoad(["lobbyBg"])
@ViewClass()
export class CompBgCubePage extends FGUICompBgCubePage {
    /** 移动速度（px/s），可动态修改以配置动效快慢 */
    public static ANIM_SPEED: number = 10;

    /** 全部方块行引用 @private */
    private _lines: CompBgCubeLine[] = [];

    /** 顶部行的初始 y（编辑器布局的最小值） @private */
    private _topY: number = 0;

    /** 行间距（编辑器布局相邻行的最小差值，运行时动态推导） @private */
    private _pitch: number = 0;

    /** 回卷阈值：行移动到该位置视为移出屏幕底部 @private */
    private _wrapY: number = 0;

    /** 一个循环周期的总跨度（行数 × 行间距） @private */
    private _span: number = 0;

    /** 动画运行标记 @private */
    private _running: boolean = false;

    onConstruct() {
        super.onConstruct();
        this._lines = [
            this.UI_COMP_CUBE_LINE_0,
            this.UI_COMP_CUBE_LINE_1,
            this.UI_COMP_CUBE_LINE_2,
            this.UI_COMP_CUBE_LINE_3,
            this.UI_COMP_CUBE_LINE_4,
            this.UI_COMP_CUBE_LINE_5,
            this.UI_COMP_CUBE_LINE_6,
            this.UI_COMP_CUBE_LINE_7,
            this.UI_COMP_CUBE_LINE_8,
            this.UI_COMP_CUBE_LINE_9,
            this.UI_COMP_CUBE_LINE_10,
            this.UI_COMP_CUBE_LINE_11,
            this.UI_COMP_CUBE_LINE_12,
            this.UI_COMP_CUBE_LINE_13,
            this.UI_COMP_CUBE_LINE_14,
            this.UI_COMP_CUBE_LINE_15,
            this.UI_COMP_CUBE_LINE_16,
            this.UI_COMP_CUBE_LINE_17,
            this.UI_COMP_CUBE_LINE_18,
            this.UI_COMP_CUBE_LINE_19,
            this.UI_COMP_CUBE_LINE_20,
            this.UI_COMP_CUBE_LINE_21,
            this.UI_COMP_CUBE_LINE_22,
            this.UI_COMP_CUBE_LINE_23,
            this.UI_COMP_CUBE_LINE_24,
            this.UI_COMP_CUBE_LINE_25,
        ] as CompBgCubeLine[];
        const ys = this._lines.map((line) => line.y).sort((a, b) => a - b);
        this._topY = ys[0];
        let minGap = Number.POSITIVE_INFINITY;
        for (let i = 1; i < ys.length; i++) {
            minGap = Math.min(minGap, ys[i] - ys[i - 1]);
        }
        this._pitch = minGap;
        this._span = this._lines.length * this._pitch;
        this._wrapY = this._topY + this._span;
        this.randomAll();
    }

    /**
     * @method startAnimation
     * @description 启动下移动画
     */
    startAnimation(): void {
        this._running = true;
    }

    /**
     * @method stopAnimation
     * @description 停止下移动画
     */
    stopAnimation(): void {
        this._running = false;
    }

    /**
     * @method randomAll
     * @description 随机所有方块行（初始画面与手动触发用）
     * @private
     */
    private randomAll(): void {
        for (const line of this._lines) {
            line.randomLine();
        }
    }

    /**
     * @method onUpdate
     * @description 每帧驱动方块行下移，移出屏幕底部后回卷到顶部并重新随机
     * @private
     */
    protected onUpdate(): void {
        super.onUpdate();
        if (!this._running) {
            return;
        }
        const dt = director.getDeltaTime();
        for (const line of this._lines) {
            line.y += CompBgCubePage.ANIM_SPEED * dt;
            if (line.y >= this._wrapY) {
                line.y -= this._span;
                line.randomLine();
            }
        }
    }
}
fgui.UIObjectFactory.setExtension(CompBgCubePage.URL, CompBgCubePage);
