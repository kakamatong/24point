/**
 * @file CompTimeLeft.ts
 * @description 算24点(10003)答题倒计时组件业务子类：接收 gameClock 剩余秒数并本地每秒递减显示，
 *              配合进度条(UI_IMG_BAR)与告警控制器(ctrl_warn)，剩余≤5秒进入告警抖动
 * @category 游戏 10003
 */

import FGUICompTimeLeft from "@fgui/game10003/FGUICompTimeLeft";
import * as fgui from "fairygui-cc";
import { ViewClass } from "@frameworks/Framework";

/**
 * @class CompTimeLeft
 * @description 答题倒计时组件：start 启动每秒递减，stop 停止；剩余时间展示在文本与水平时间条上
 * @category 游戏 10003
 */
@ViewClass()
export class CompTimeLeft extends FGUICompTimeLeft {
    /** 告警阈值（秒）：剩余时间 ≤ 该值时切换告警页（触发 act 抖动动画 + 变红） */
    private static readonly _WARN_SEC: number = 5;
    /** 本局总时长（秒），用于时间条比例，首次 start 时记录 */
    private _totalSec: number = 0;
    /** 剩余秒数 */
    private _remainSec: number = 0;
    /** 每秒调度回调 */
    private _scheid: (() => void) | null = null;

    /**
     * @description 组件构造：绑定每秒回调，初始复位告警页
     */
    onConstruct(): void {
        super.onConstruct();
        this._scheid = this.tick.bind(this);
        this.ctrl_warn.selectedIndex = 0;
        this.stopClock();
    }

    /**
     * @description 组件销毁：停止倒计时
     */
    protected onDestroy(): void {
        this.stopClock();
        super.onDestroy();
    }

    /**
     * @description 启动/刷新倒计时：从剩余秒数开始本地每秒递减（服务端仅在 PLAYING 开始推一次全量、
     *              断线重连补发剩余值，之后由客户端自行计时）
     * @param {number} remainSec - 剩余秒数（gameClock.time）
     */
    start(remainSec: number): void {
        this.stopClock();
        this._remainSec = Math.max(0, Math.floor(remainSec));
        // 首次(全量30)或更大的值更新总时长，重连剩余值不缩小比例基准
        if (this._remainSec > this._totalSec) {
            this._totalSec = this._remainSec;
        }
        this.refresh();
        this._scheid && this.schedule(this._scheid, 1);
    }

    /**
     * @description 停止倒计时并复位告警页
     */
    stopClock(): void {
        this._scheid && this.unschedule(this._scheid);
        this.ctrl_warn.selectedIndex = 0;
    }

    /**
     * @description 每秒回调：剩余减一并刷新显示，归零后停止
     * @private
     */
    private tick(): void {
        this._remainSec--;
        if (this._remainSec <= 0) {
            this._remainSec = 0;
            this.refresh();
            this.stopClock();
            return;
        }
        this.refresh();
    }

    /**
     * @description 刷新显示：剩余秒数文本、时间条填充比例、告警控制器（剩余≤5秒切告警页）
     * @private
     */
    private refresh(): void {
        this.UI_TXT_TIME_MSG.text = `${this._remainSec}秒`;
        if (this._totalSec > 0) {
            this.UI_IMG_BAR.fillAmount = Math.max(0, Math.min(1, this._remainSec / this._totalSec));
        }
        this.ctrl_warn.selectedIndex = this._remainSec <= CompTimeLeft._WARN_SEC ? 1 : 0;
    }
}
fgui.UIObjectFactory.setExtension(CompTimeLeft.URL, CompTimeLeft);
