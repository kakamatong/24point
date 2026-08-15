import FGUITotalResultView from "@fgui/game10002Result/FGUITotalResultView";
import * as fgui from "fairygui-cc";
import { GameData } from "../../data/GameData";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import { ChangeScene, PackageLoad, ViewClass } from "@frameworks/Framework";
import { TruncateString } from "@frameworks/utils/Utils";
import { SprotoTotalResult } from "../../../../../types/protocol/game10002/s2c";
import FGUICompTotalResultInfo from "@fgui/game10002Result/FGUICompTotalResultInfo";
import FGUICompMedal from "@fgui/gameCommon/FGUICompMedal";

@ViewClass()
@PackageLoad(["gameCommon"])
export class TotalResultView extends FGUITotalResultView {
    private _data: any | null = null;
    show(data?: SprotoTotalResult.Request) {
        this.UI_LV_INFO.itemRenderer = this.itemRenderer.bind(this);
        this._data = data;
        if (this._data) {
            if (this._data.totalResultInfo && this._data.totalResultInfo.length > 0) {
                this.UI_LV_INFO.numItems = this._data.totalResultInfo.length;
            }
        }
    }

    itemRenderer(index: number, item: fgui.GObject) {
        const dataItem = this._data?.totalResultInfo[index];
        if (dataItem) {
            const player = GameData.instance.getPlayerByUserid(dataItem.userid);
            const node = item as FGUICompTotalResultInfo;
            node.UI_TXT_NICKNAME.text = TruncateString(player?.nickname ?? "", 8);
            node.UI_TXT_ID.text = `${dataItem.userid}`;
            node.UI_TXT_SCORE.text = `${dataItem.score}`;
            const headurl = GameData.instance.getHeadurlByUserid(dataItem.userid);
            const headNode = node.UI_COMP_HEAD.getChild("UI_LOADER_HEAD") as fgui.GLoader;
            headNode.url = headurl;

            const medal = node.UI_COMP_MEDAL as FGUICompMedal;
            medal.ctrl_rank.selectedIndex = dataItem.rank;
        }
    }

    onBtnBack(): void {
        TotalResultView.hideView();
    }

    onBtnExit(): void {
        if (GameSocketManager.instance.isOpen()) {
            GameSocketManager.instance.close();
        }
        ChangeScene("LobbyScene");
    }
}
fgui.UIObjectFactory.setExtension(TotalResultView.URL, TotalResultView);
