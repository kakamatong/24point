/**
 * @file CompFireFlower.ts
 * @description 礼花筒组件：提供播放动画接口，先播放 UI_COMP_BUCKET 飞行动画并监听 fly 帧事件，收到帧事件后显示并播放 UI_COMP_RIBBONS 丝带动画，桶身动画播放结束后隐藏整个组件
 * @category 游戏组件
 */

import * as fgui from "fairygui-cc";
import { Logger } from "@frameworks/utils/Utils";
import { ViewClass } from "@frameworks/Framework";
import FGUICompFireFlower from "@fgui/game10003Result/FGUICompFireFlower";

/** UI_COMP_BUCKET 转场中飞行动画的帧事件标签 */
const FRAME_EVENT_FLY = "fly";

/**
 * @class CompFireFlower
 * @description 礼花筒组件业务逻辑
 * @category 游戏组件
 */
@ViewClass()
export class CompFireFlower extends FGUICompFireFlower {
    /**
     * @property {fgui.Transition | null} _bucketTransition - 桶身（UI_COMP_BUCKET）的 act 转场
     * @private
     */
    private _bucketTransition: fgui.Transition | null = null;

    /**
     * @property {fgui.Transition | null} _ribbonsTransition - 丝带（UI_COMP_RIBBONS）的 act 转场
     * @private
     */
    private _ribbonsTransition: fgui.Transition | null = null;

    /**
     * @property {boolean} _playing - 是否正在播放
     * @private
     */
    private _playing: boolean = false;

    /**
     * @property {boolean} _ribbonsStarted - 本次播放中丝带是否已开始，防止 fly 帧事件重复触发
     * @private
     */
    private _ribbonsStarted: boolean = false;

    /**
     * @property {(() => void) | null} _onComplete - 本次播放结束后的回调
     * @private
     */
    private _onComplete: (() => void) | null = null;

    /**
     * @property {boolean} playing - 是否正在播放动画
     */
    public get playing(): boolean {
        return this._playing;
    }

    /**
     * @method onConstruct
     * @description 构造完成时缓存子件转场，并复位到初始隐藏状态
     * @private
     */
    protected onConstruct(): void {
        super.onConstruct();
        this._bucketTransition = this.UI_COMP_BUCKET.getTransition("act");
        this._ribbonsTransition = this.UI_COMP_RIBBONS.getTransition("act");
        this.resetToHide();
    }

    /**
     * @method onDestroy
     * @description 销毁时停止转场并解绑帧事件，避免回调泄漏
     * @private
     */
    protected onDestroy(): void {
        this._playing = false;
        this._onComplete = null;
        this._bucketTransition?.stop();
        this._ribbonsTransition?.stop();
        this.unbindFrameEvent();
        super.onDestroy();
    }

    /**
     * @method play
     * @description 播放礼花筒动画：播放 UI_COMP_BUCKET 动画并监听 fly 帧事件，收到帧事件后显示并播放 UI_COMP_RIBBONS 动画，桶身动画播放结束后隐藏整个组件
     * @param {() => void} onComplete - 动画播放结束（组件隐藏）后的回调
     */
    public play(onComplete?: () => void): void {
        // 重复播放：先复位上一次的转场、帧事件与回调，避免状态叠加
        if (this._playing) {
            this.resetToHide();
        }
        this._playing = true;
        this._ribbonsStarted = false;
        this._onComplete = onComplete ?? null;
        this.visible = true;
        this.UI_COMP_RIBBONS.visible = false;

        const bucket = this._bucketTransition;
        if (!bucket) {
            Logger.warn("CompFireFlower: UI_COMP_BUCKET 缺少 act 转场，直接结束");
            this.finish();
            return;
        }
        this.unbindFrameEvent();
        bucket.setHook(FRAME_EVENT_FLY, this.onBucketFly.bind(this));
        bucket.play(this.onBucketPlayEnd.bind(this));
    }

    /**
     * @method stop
     * @description 中止播放并复位（不触发播放结束回调）
     */
    public stop(): void {
        this.resetToHide();
    }

    /**
     * @method resetToHide
     * @description 复位到初始隐藏状态：停止转场、解绑帧事件、隐藏丝带与组件自身
     * @private
     */
    private resetToHide(): void {
        this._playing = false;
        this._ribbonsStarted = false;
        this._onComplete = null;
        this._bucketTransition?.stop();
        this._ribbonsTransition?.stop();
        this.unbindFrameEvent();
        this.UI_COMP_RIBBONS.visible = false;
        this.visible = false;
    }

    /**
     * @method onBucketFly
     * @description 桶身飞行动画帧事件回调：显示并播放丝带动画
     * @private
     */
    private onBucketFly(): void {
        if (!this._playing || this._ribbonsStarted) {
            return;
        }
        this._ribbonsStarted = true;
        this.UI_COMP_RIBBONS.visible = true;
        this._ribbonsTransition?.play();
    }

    /**
     * @method onBucketPlayEnd
     * @description 桶身动画播放结束回调
     * @private
     */
    private onBucketPlayEnd(): void {
        this.finish();
    }

    /**
     * @method finish
     * @description 播放收尾：隐藏整个组件、复位丝带并触发结束回调
     * @private
     */
    private finish(): void {
        const callback = this._onComplete;
        this._playing = false;
        this._ribbonsStarted = false;
        this._onComplete = null;
        this.unbindFrameEvent();
        this._ribbonsTransition?.stop();
        this.UI_COMP_RIBBONS.visible = false;
        this.visible = false;
        if (callback) {
            callback();
        }
    }

    /**
     * @method unbindFrameEvent
     * @description 解绑桶身转场的帧事件钩子
     * @private
     */
    private unbindFrameEvent(): void {
        this._bucketTransition?.clearHooks();
    }
}
fgui.UIObjectFactory.setExtension(CompFireFlower.URL, CompFireFlower);
