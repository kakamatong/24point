import { UserGameRecord } from "@modules/UserGameRecord";
import FGUIPlayerInfoView from "@fgui/game10003PlayerInfo/FGUIPlayerInfoView";
import * as fgui from "fairygui-cc";
import { GameData } from "../../data/GameData";
import FGUICompHead from "@fgui/common/FGUICompHead";
import { ViewClass } from "@frameworks/Framework";
import { TruncateString, Logger } from "@frameworks/utils/Utils";

@ViewClass()
export class PlayerInfoView extends FGUIPlayerInfoView {
    private _userid: number = 0;
    private _cp: number = 0;
    show(data?: any): void {
        this._userid = data.userid;
        this._cp = data.cp ?? 0;
        this.updateUserInfo();
        this.UI_BG_MASK.onClick(this.onBtnClose, this);
    }

    updateUserInfo(): void {
        const player = GameData.instance.getPlayerByUserid(this._userid);
        if (!player) {
            return;
        }
        this.UI_TXT_NICKNAME.text = TruncateString(player?.nickname ?? "", 8);
        this.UI_TXT_USERID.text = `${this._userid}`;
        (this.UI_COMP_HEAD as FGUICompHead).UI_LOADER_HEAD.url = GameData.instance.getHeadurlByUserid(this._userid);
        this.UI_TXT_CP.text = `${this._cp}`;

        if (
            player.win !== undefined &&
            player.win !== null &&
            player.lose !== undefined &&
            player.lose !== null &&
            player.draw !== undefined &&
            player.draw !== null
        ) {
            this.UI_TXT_WIN.text = `${player.win}`;
            this.UI_TXT_LOSE.text = `${player.lose}`;
            this.UI_TXT_DRAW.text = `${player.draw}`;
            const rate = (player.win / (player.win + player.lose + player.draw)) * 100;
            this.UI_TXT_RATE.text = `${rate.toFixed(1)}%`;
        } else {
            void this.reqGameRecord();
        }
    }

    /**
     * @method reqGameRecord
     * @description 请求该玩家的游戏战绩并刷新胜/负/平显示
     * @private
     */
    private async reqGameRecord(): Promise<void> {
        try {
            const data = await UserGameRecord.instance.req(this._userid);
            const player = GameData.instance.getPlayerByUserid(this._userid);
            if (player) {
                player.win = data.win;
                player.lose = data.lose;
                player.draw = data.draw;
            }
            this.UI_TXT_WIN.text = `${data.win}`;
            this.UI_TXT_LOSE.text = `${data.lose}`;
            this.UI_TXT_DRAW.text = `${data.draw}`;
            const total = data.win + data.lose + data.draw;
            if (total) {
                const rate = (data.win / total) * 100;
                this.UI_TXT_RATE.text = `${rate.toFixed(1)}%`;
            } else {
                this.UI_TXT_RATE.text = `--`;
            }
        } catch (err) {
            Logger.warn("拉取玩家战绩失败:", err);
        }
    }

    onBtnClose(): void {
        PlayerInfoView.hideView();
    }
}
fgui.UIObjectFactory.setExtension(PlayerInfoView.URL, PlayerInfoView);
