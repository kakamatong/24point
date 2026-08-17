/**
 * @file CompResult.ts
 * @description 闯关胜利子组件
 * @category 游戏 10002 - 连连看
 */

import { ChangeScene, ViewClass } from "@frameworks/Framework";
import FGUICompResult from "@fgui/gameChallengeResult/FGUICompResult";
import * as fgui from "fairygui-cc";
import { CompStarAni } from "./CompStarAni";
import { GameChallengeResultView } from "../GameChallengeResultView";
import { SoundManager } from "@frameworks/SoundManager";
import { ChallengeData } from "@datacenter/ChallengeData";
import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";

export type CompResultData = {
    score: number; // 得分
    time: number; // 用时
    pass: boolean; // 是否通关
    stars: number; // 获得星星数
    chapter: number; // 当前章节
    level: number; // 当前关卡
};

/**
 * @class CompResult
 * @description 闯关胜利子组件，继承自 FGUI 自动生成的 FGUICompResult
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompResult extends FGUICompResult {
    private _data?: CompResultData;
    onConstruct(): void {
        super.onConstruct();
        SoundManager.instance.playSoundEffect("game10002/win");
        //this.initUI();
    }

    show(data?: CompResultData): void {
        super.show();
        this._data = data;
        this.initUI();
    }

    /**
     * 播放星星动画
     * @param number 星星数量
     */
    playStar(number: number): void {
        const actNode = this.UI_COMP_STAR as CompStarAni;
        actNode.play(number, () => {
            console.log("All stars animation completed.");
        });
    }

    initUI(): void {
        if (!this._data) return;
        this.UI_TXT_SCORE.text = `得分:${this._data.score}`;
        this.UI_TXT_TIME.text = `用时:${this._data.time}秒`;
        if (this._data.pass) {
            this.ctrl_result.selectedIndex = 1;
            this.playStar(this._data.stars);
        } else {
            this.ctrl_result.selectedIndex = 0;
        }
        MiniGameUtils.instance.showInterstitialAd("adunit-60af440d294b0df5");
    }

    onBtnNext(): void {
        if (!this._data) return;
        const next = ChallengeData.instance.getNextLevel(this._data.chapter, this._data.level);
        ChallengeData.instance.pendingDirectChapter = next.chapter;
        ChallengeData.instance.pendingDirectLevel = next.level;
        GameChallengeResultView.hideView();
        ChangeScene("LobbyScene");
    }

    onBtnReplay(): void {
        if (!this._data) return;
        ChallengeData.instance.pendingDirectChapter = this._data.chapter;
        ChallengeData.instance.pendingDirectLevel = this._data.level;
        GameChallengeResultView.hideView();
        ChangeScene("LobbyScene");
    }
}

fgui.UIObjectFactory.setExtension(CompResult.URL, CompResult);
