import FGUIResultView from "@fgui/game10003Result/FGUIResultView";
import * as fgui from "fairygui-cc";
import { GameData } from "../../data/GameData";
import { SoundManager } from "@frameworks/SoundManager";
import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import FGUICompResultInfo from "@fgui/game10003Result/FGUICompResultInfo";
import FGUICompHead from "@fgui/common/FGUICompHead";
import FGUICompMedal from "@fgui/gameCommon/FGUICompMedal";
import { DataCenter } from "@datacenter/Datacenter";
import { TruncateString } from "@frameworks/utils/Utils";

@ViewClass()
@PackageLoad(["gameCommon"])
export class ResultView extends FGUIResultView {
    private _continueFunc: (() => void) | null = null;
    private _scoreData: Array<{
        userid: number;
        usedTime: number;
        rank: number;
        eliminated: number;
        nickname: string;
        headurl: string;
        score: number;
        maxComb: number;
        totalScore: number;
    }> = [];
    show(data?: any) {
        const flag = 1;
        this.ctrl_flag.selectedIndex = flag;
        if (flag === 1) {
            SoundManager.instance.playSoundEffect("game10003/win");
        } else if (flag === 0) {
            SoundManager.instance.playSoundEffect("game10003/lose");
        }

        this._continueFunc = data?.continueFunc;
        this.act.play(() => {
            MiniGameUtils.instance.showInterstitialAd("adunit-60af440d294b0df5");
        });

        if (data.scores && data.scores.length > 0) {
            this._scoreData = data.scores;
            this.UI_LV_GAME_INFO.itemRenderer = this.itemRenderer.bind(this);
            this.UI_LV_GAME_INFO.numItems = this._scoreData.length;
        }

        if (GameData.instance.roomEnd && GameData.instance.isPrivateRoom) {
            this.ctrl_btn.selectedIndex = 1;
        }
    }

    itemRenderer(index: number, item: fgui.GObject) {
        const data = this._scoreData[index];
        const node = item as FGUICompResultInfo;
        const head = node.UI_COMP_HEAD as FGUICompHead;
        head.UI_LOADER_HEAD.url = data.headurl;
        node.UI_TXT_NICKNAME.text = TruncateString(data.nickname, 8);
        const score = data.score ?? 0;
        const totalScore = data.totalScore ?? 0;
        node.UI_TXT_SCORE.text = score > 0 ? `+${score}` : score.toString();
        node.UI_TXT_TOTALSCORE.text = totalScore.toString();
        if (score >= 0) {
            node.ctrl_color.selectedIndex = 0;
        } else {
            node.ctrl_color.selectedIndex = 1;
        }
        if (data.usedTime > 0) {
            const timeInSeconds = (data.usedTime / 1000).toFixed(3);
            node.UI_TXT_USE_TIME.text = `${timeInSeconds}秒`;
            node.ctrl_uncomp.selectedIndex = 0;
            const medal = node.UI_COMP_MEDAL as FGUICompMedal;
            medal.ctrl_rank.selectedIndex = data.rank;
        } else {
            node.ctrl_uncomp.selectedIndex = 1;
            node.UI_TXT_USE_TIME.text = "未完成";
        }
        node.UI_TXT_MAX_COMB.text = data.maxComb?.toString() ?? "0";

        const selfid = DataCenter.instance.userid;
        if (data.userid === selfid) {
            node.ctrl_self.selectedIndex = 1;
        }
    }

    onBtnBack(): void {
        ResultView.hideView();
    }

    onBtnCon(): void {
        this._continueFunc && this._continueFunc();
        ResultView.hideView();
    }
}
fgui.UIObjectFactory.setExtension(ResultView.URL, ResultView);
