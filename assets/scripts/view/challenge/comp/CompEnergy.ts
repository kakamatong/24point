/**
 * @file CompEnergy.ts
 * @description 体力组件：展示体力数值和恢复倒计时，体力计算逻辑托管给 DataCenter
 * @category 挑战视图
 */

import FGUICompEnergy from "@fgui/challenge/FGUICompEnergy";
import { ViewClass, AddEventListener, RemoveEventListener } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { DataCenter } from "@datacenter/Datacenter";
import { EVENT_NAMES } from "@datacenter/CommonConfig";
import { UserEnergy } from "@modules/UserEnergy";
import { AdReward } from "@modules/AdReward";
import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";
import { REWORD_VIDEOAD_CODE } from "@frameworks/config/Config";
import { SoundManager } from "@frameworks/SoundManager";
import { PopMessageView } from "@view/common/PopMessageView";
import { TipsView } from "@view/common/TipsView";
import { LoadingView } from "@view/common/LoadingView";
import { ENUM_POP_MESSAGE_TYPE } from "@datacenter/InterfaceConfig";

/**
 * @class CompEnergy
 * @description 体力组件，负责体力数值展示和自动恢复逻辑
 *  - UI_TXT_TOTAL：显示 "当前体力/总体力"
 *  - UI_TXT_TIME：显示恢复下一点倒计时（mm:ss 格式）或"已满"
 *  - ctrl_showTime：控制倒计时显示/隐藏
 * @category 挑战视图
 */
@ViewClass()
export class CompEnergy extends FGUICompEnergy {
    /**
     * @property {(() => void) | null} _scheduleId - 计时器回调函数
     * @private
     */
    private _scheduleId: (() => void) | null = null;

    /**
     * @method onConstruct
     * @description 组件构建回调，初始化计时器、事件监听，拉取体力和广告奖励数据
     */
    onConstruct() {
        super.onConstruct();
        this._scheduleId = this.tick.bind(this);
        AddEventListener(EVENT_NAMES.USER_ENERGY, this.onUserEnergy, this);
        UserEnergy.instance.req();
        AdReward.instance.reqGetAdInfo(() => {}, 3);
        this.show();
    }

    /**
     * @method onDestroy
     * @description 组件销毁回调，清理事件监听和计时器
     */
    onDestroy() {
        RemoveEventListener(EVENT_NAMES.USER_ENERGY, this.onUserEnergy);
        this.stopTimer();
        super.onDestroy();
    }

    /**
     * @method show
     * @description 显示组件，刷新显示并启动计时器，注册自身点击事件（点击看广告领取体力）
     * @param {any} [data] - 传入数据（预留）
     */
    show(data?: any): void {
        this.refreshDisplay();
        this.startTimerIfNeeded();
        this.clearClick();
        this.onClick(this.onClickSelf.bind(this));
    }

    /**
     * @method onClickSelf
     * @description 点击体力组件，弹出看广告领取体力确认弹窗，弹窗内容展示今日剩余次数
     * @private
     */
    private onClickSelf(): void {
        const adRewardInfo = DataCenter.instance.getAdRewardInfo(3);
        if (!adRewardInfo) {
            TipsView.showView({ content: "广告奖励信息未加载" });
            return;
        }
        const leftCount = adRewardInfo.maxDailyRewardCount - adRewardInfo.currentRewardCount;
        const content = `看视频广告可以领取10体力，今日剩余${leftCount}次`;
        if (adRewardInfo.canReward) {
            PopMessageView.showView({
                title: "温馨提示",
                content: content,
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: this.playAdAndReceiveEnergy.bind(this),
            });
        } else {
            PopMessageView.showView({
                title: "温馨提示",
                content: content,
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: () => {
                    TipsView.showView({ content: "今日次数已用完，明天再来" });
                },
            });
        }
    }

    /**
     * @method playAdAndReceiveEnergy
     * @description 播放激励视频广告，广告成功后请求服务端领取体力奖励
     * @private
     */
    private playAdAndReceiveEnergy(): void {
        LoadingView.showView({ content: "载入中...", time: 12 });
        MiniGameUtils.instance.showRewardedVideoAd("adunit-51ac86a12a85009b", (code: number) => {
            LoadingView.hideView();
            // 广告关闭时恢复播放背景音乐
            SoundManager.instance.adCloseMusicPlay();
            if (code == REWORD_VIDEOAD_CODE.SUCCESS) {
                AdReward.instance.reqReceiveAdReward((success: boolean) => {
                    if (!success) {
                        TipsView.showView({ content: "领取体力失败" });
                        return;
                    }
                    UserEnergy.instance.req();
                    TipsView.showView({ content: "领取成功" });
                }, 3);
            } else if (code == REWORD_VIDEOAD_CODE.NOT_OVER) {
                TipsView.showView({ content: "看完视频才能获取奖励哦" });
            } else {
                TipsView.showView({ content: "视频广告播放失败" });
            }
        });
    }

    /**
     * @method onUserEnergy
     * @description 收到服务端 USER_ENERGY 事件，重置基准数据并刷新显示
     * @param {any} _data - 服务端下发的能量数据
     * @private
     */
    private onUserEnergy(_data: any): void {
        this.refreshDisplay();
        this.startTimerIfNeeded();
    }

    /**
     * @method startTimer
     * @description 启动 1 秒间隔的计时器
     * @private
     */
    private startTimer(): void {
        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
            this.schedule(this._scheduleId, 1);
        }
    }

    /**
     * @method stopTimer
     * @description 停止计时器
     * @private
     */
    private stopTimer(): void {
        if (this._scheduleId) {
            this.unschedule(this._scheduleId);
        }
    }

    /**
     * @method startTimerIfNeeded
     * @description 根据当前体力状态决定启动或停止计时器（已满则停止，未满则启动）
     * @private
     */
    private startTimerIfNeeded(): void {
        const state = DataCenter.instance.getCurrentEnergyState();
        if (state.isFull) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    /**
     * @method tick
     * @description 计时器回调（每秒），刷新显示并检测是否需要停止计时器
     * @private
     */
    private tick(): void {
        if (DataCenter.instance.getCurrentEnergyState().isFull) {
            this.stopTimer();
        }
        this.refreshDisplay();
    }

    /**
     * @method refreshDisplay
     * @description 刷新 UI 显示：体力数值、倒计时文本、控制器状态
     * @private
     */
    private refreshDisplay(): void {
        const state = DataCenter.instance.getCurrentEnergyState();

        if (this.UI_TXT_TOTAL) {
            this.UI_TXT_TOTAL.text = `${state.currentTotal}/${DataCenter.instance.userEnergy?.maxEnergy ?? 0}`;
        }

        if (this.UI_TXT_TIME) {
            this.UI_TXT_TIME.text = state.isFull ? "已满" : this._formatTime(state.timeLeft);
        }

        if (this.ctrl_showTime) {
            this.ctrl_showTime.selectedIndex = state.isFull ? 0 : 1;
        }
    }

    /**
     * @method _formatTime
     * @description 将秒数格式化为 "mm:ss" 格式的字符串
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     * @private
     */
    private _formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        const mm = m.toString().padStart(2, "0");
        const ss = s.toString().padStart(2, "0");
        return `${mm}:${ss}`;
    }
}

fgui.UIObjectFactory.setExtension(CompEnergy.URL, CompEnergy);
