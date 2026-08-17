import { ViewClass } from "@frameworks/Framework";
import FGUICompTimeLeft from "@fgui/game10002/FGUICompTimeLeft";
import * as fgui from "fairygui-cc";

/**
 * @class CompTimeLeft
 * @description 游戏剩余时间组件，显示倒计时进度条
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompTimeLeft extends FGUICompTimeLeft {
    /**
     * @property {number} _remainingTime
     * @description 剩余时间（秒）
     * @private
     */
    private _remainingTime: number = 0;

    /**
     * @property {number} _totalTime
     * @description 总时间（秒）
     * @private
     */
    private _totalTime: number = 0;

    /**
     * @property {number[]} _starTimes
     * @description 各星级对应的时间阈值（秒），长度为3，索引0/1/2对应1/2/3颗星
     * @private
     */
    private _starTimes: number[] = [];

    /**
     * @property {(() => void) | null} _scheduleId
     * @description 计时器ID
     * @private
     */
    private _scheduleId: (() => void) | null = null;

    protected onConstruct() {
        super.onConstruct();
        this._scheduleId = this.tick.bind(this);
    }

    /**
     * @method tick
     * @description 每秒更新一次倒计时
     * @private
     */
    tick() {
        if (this._remainingTime > 0) {
            this._remainingTime--;
            this.updateDisplay();
        } else {
            this.stop();
        }
    }

    /**
     * @method updateDisplay
     * @description 更新显示（进度条和文本）
     * @private
     */
    private updateDisplay(): void {
        // 更新时间文本
        if (this.UI_TXT_TIME_MSG) {
            this.UI_TXT_TIME_MSG.text = `${this._remainingTime}秒`;
        }

        // 更新进度条
        if (this.UI_IMG_BAR) {
            const progress = this._totalTime > 0 ? this._remainingTime / this._totalTime : 0;
            this.UI_IMG_BAR.fillAmount = progress;
        }

        // 更新警告状态
        if (this.ctrl_warn) {
            this.ctrl_warn.selectedIndex = this._remainingTime <= 15 ? 1 : 0;
        }
    }

    /**
     * @method _initStarMode
     * @description 初始化闯关限时模式的星星（设置标题和位置）
     * @private
     */
    private _initStarMode(): void {
        const stars = [this.UI_COMP_STAR_1, this.UI_COMP_STAR_2, this.UI_COMP_STAR_3];
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            if (!star || i >= this._starTimes.length) continue;
            star.title = `${this._starTimes[i]}s`;
        }
        this._updateStarPositions();
    }

    /**
     * @method _updateStarPositions
     * @description 根据各星星时间阈值占总时间的比例，动态调整星星在进度条上的位置（居中对齐）
     * @private
     */
    private _updateStarPositions(): void {
        if (!this.UI_IMG_BAR || this._totalTime <= 0) return;

        const barWidth = this.UI_IMG_BAR.width;
        const barX = this.UI_IMG_BAR.x;
        const stars = [this.UI_COMP_STAR_1, this.UI_COMP_STAR_2, this.UI_COMP_STAR_3];

        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            if (!star || i >= this._starTimes.length) continue;

            const ratio = Math.min(this._starTimes[i] / this._totalTime, 1);
            star.x = barX + ratio * barWidth - star.width / 2;
        }
    }

    /**
     * @method start
     * @description 开始倒计时
     * @param {number} remainingTime - 剩余时间（秒）
     * @param {number} totalTime - 总时间（秒）
     * @param {number} [mode=0] - 模式：0=普通倒计时，1=闯关限时模式
     * @param {number[]} [starTimes] - 闯关模式下各星级时间阈值（秒），长度为3，索引0/1/2对应1/2/3颗星
     */
    start(remainingTime: number, totalTime: number, mode: number = 0, starTimes?: number[]): void {
        this._remainingTime = remainingTime;
        this._totalTime = totalTime;

        if (mode === 1 && starTimes && starTimes.length >= 3) {
            this._starTimes = [...starTimes];
            if (this.ctrl_type) {
                this.ctrl_type.selectedIndex = 1;
            }
            this._initStarMode();
        } else {
            this._starTimes = [];
            if (this.ctrl_type) {
                this.ctrl_type.selectedIndex = 0;
            }
        }

        this.updateDisplay();

        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
            this.schedule(this._scheduleId, 1);
        }
    }

    /**
     * @method stop
     * @description 停止倒计时
     */
    stop(): void {
        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
        }
    }

    /**
     * @method reset
     * @description 重置组件
     */
    reset(): void {
        this.stop();
        this._totalTime = 0;
        this._starTimes = [];
        if (this.ctrl_type) {
            this.ctrl_type.selectedIndex = 0;
        }
        if (this.UI_IMG_BAR) {
            this.UI_IMG_BAR.fillAmount = 1;
        }
        if (this.UI_TXT_TIME_MSG) {
            this.UI_TXT_TIME_MSG.text = "";
        }
    }

    protected onEnable(): void {
        super.onEnable();
        if (this._remainingTime > 0 && this._scheduleId) {
            this.schedule(this._scheduleId, 1);
        }
    }

    protected onDisable(): void {
        super.onDisable();
        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
        }
    }
}
fgui.UIObjectFactory.setExtension(CompTimeLeft.URL, CompTimeLeft);
