/**
 * @file CompFireFlower.ts
 * @description 礼花筒组件：提供播放动画接口，先播放 UI_COMP_BUCKET 飞行动画并监听 fly 帧事件，收到帧事件后播放 UI_COMP_RIBBONS 的 spine 丝带动画，丝带动画播放结束后隐藏整个组件
 * @category 游戏组件
 */

import { sp } from "cc";
import * as fgui from "fairygui-cc";
import { Logger, SpinePlay } from "@frameworks/utils/Utils";
import { ViewClass } from "@frameworks/Framework";
import FGUICompFireFlower from "@fgui/gameCommon/FGUICompFireFlower";

/** UI_COMP_BUCKET 转场中飞行动画的帧事件标签 */
const FRAME_EVENT_FLY = "fly";

/** UI_COMP_RIBBONS 播放的 spine 动画名称 */
const SPINE_ANIMATION_RIBBONS = "idle";

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
     * @property {boolean} _playing - 是否正在播放
     * @private
     */
    private _playing: boolean = false;

    /**
     * @property {boolean} _ribbonsPlaying - 本轮丝带 spine 是否已开始播放，决定收尾时机由 spine 完成回调驱动
     * @private
     */
    private _ribbonsPlaying: boolean = false;

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
        this.resetToHide();
    }

    /**
     * @method onDestroy
     * @description 销毁时停止桶身转场、停止丝带骨骼动画并解绑帧事件，避免回调泄漏
     * @private
     */
    protected onDestroy(): void {
        this._playing = false;
        this._ribbonsPlaying = false;
        this._onComplete = null;
        this._bucketTransition?.stop();
        this.unbindFrameEvent();
        this.stopRibbons();
        super.onDestroy();
    }

    /**
     * @method play
     * @description 播放礼花筒动画：播放 UI_COMP_BUCKET 动画并监听 fly 帧事件，收到帧事件后播放 UI_COMP_RIBBONS 的 spine 动画，spine 动画播放结束后隐藏整个组件
     * @param {() => void} onComplete - 动画播放结束（组件隐藏）后的回调
     */
    public play(onComplete?: () => void): void {
        // 重复播放：先复位上一次的转场、帧事件与回调，避免状态叠加
        if (this._playing) {
            this.resetToHide();
        }
        this._playing = true;
        this._ribbonsPlaying = false;
        this._onComplete = onComplete ?? null;
        this.visible = true;
        this.stopRibbons();

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
     * @description 复位到初始隐藏状态：停止桶身转场、停止丝带骨骼动画、解绑帧事件、隐藏丝带与组件自身
     * @private
     */
    private resetToHide(): void {
        this._playing = false;
        this._ribbonsPlaying = false;
        this._onComplete = null;
        this._bucketTransition?.stop();
        this.unbindFrameEvent();
        this.stopRibbons();
        this.visible = false;
    }

    /**
     * @method onBucketFly
     * @description 桶身飞行动画帧事件回调：播放丝带的 spine 动画，由 spine 完成回调驱动收尾
     * @private
     */
    private onBucketFly(): void {
        if (!this._playing || this._ribbonsPlaying) {
            return;
        }
        this._ribbonsPlaying = this.playRibbons();
    }

    /**
     * @method onBucketPlayEnd
     * @description 桶身动画播放结束回调：丝带 spine 已开始播放时等它播完再收尾，未开始（如骨骼资源未就绪）则由这里直接收尾
     * @private
     */
    private onBucketPlayEnd(): void {
        if (!this._ribbonsPlaying) {
            this.finish();
        }
    }

    /**
     * @method playRibbons
     * @description 显示 UI_COMP_RIBBONS 并从第 0 帧播放 spine 丝带动画，动画播完由 onRibbonsPlayEnd 收尾
     * @returns {boolean} 是否成功开始播放（骨骼资源未就绪时返回 false，由桶身动画结束兜底收尾）
     * @private
     */
    private playRibbons(): boolean {
        const ribbons = this.UI_COMP_RIBBONS;
        const skeleton = ribbons?.content as sp.Skeleton | null;
        if (!ribbons || !skeleton) {
            Logger.warn("CompFireFlower: UI_COMP_RIBBONS 骨骼资源未就绪，跳过丝带动画");
            return false;
        }
        ribbons.visible = true;
        // 包内该 loader3D 初始为 playing=false（暂停在首帧），这里显式恢复播放，保证动画能正常推进到完成回调
        ribbons.loop = false;
        ribbons.playing = true;
        SpinePlay(ribbons, SPINE_ANIMATION_RIBBONS, false, this.onRibbonsPlayEnd.bind(this));
        return true;
    }

    /**
     * @method onRibbonsPlayEnd
     * @description 丝带 spine 动画播放结束回调：隐藏整个组件并触发播放结束回调
     * @private
     */
    private onRibbonsPlayEnd(): void {
        this.finish();
    }

    /**
     * @method finish
     * @description 播放收尾：隐藏丝带与整个组件并触发结束回调（只做无副作用收尾，可在骨骼完成回调内安全调用）
     * @private
     */
    private finish(): void {
        const callback = this._onComplete;
        this._playing = false;
        this._ribbonsPlaying = false;
        this._onComplete = null;
        this.unbindFrameEvent();
        this.hideRibbons();
        this.visible = false;
        if (callback) {
            callback();
        }
    }

    /**
     * @method hideRibbons
     * @description 隐藏丝带并摘掉骨骼完成监听：不操作动画轨道，因此可以安全地在 Spine 的完成回调中调用
     * @private
     */
    private hideRibbons(): void {
        const ribbons = this.UI_COMP_RIBBONS;
        if (!ribbons) {
            return;
        }
        ribbons.visible = false;
    }

    /**
     * @method stopRibbons
     * @description 停止丝带骨骼动画并隐藏：清空动画轨道保证下一次播放从头开始（会打断 Spine 自身的轨道遍历，禁止在完成回调内调用）
     * @private
     */
    private stopRibbons(): void {
        const ribbons = this.UI_COMP_RIBBONS;
        if (!ribbons) {
            return;
        }
        (ribbons.content as sp.Skeleton | null)?.clearTracks();
        this.hideRibbons();
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
