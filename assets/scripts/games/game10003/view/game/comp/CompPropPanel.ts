import { RICH_TYPE } from "@datacenter/InterfaceConfig";
import FGUICompPropPanel from "@fgui/game10002/FGUICompPropPanel";
import { ViewClass } from "@frameworks/Framework";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import * as fgui from "fairygui-cc";
import { SprotoUseItem } from "../../../../../../types/protocol/game10002/c2s";
import { Logger } from "@frameworks/utils/Utils";
import { DataCenter } from "@datacenter/Datacenter";
import { TipsView } from "@view/common/TipsView";
import { GameData } from "../../../data/GameData";
import { LocalGameUseProps } from "@modules/LocalGameUseProps";
import { SprotoLocalGameUseProps } from "../../../../../../types/protocol/lobby/c2s";

@ViewClass()
export class CompPropPanel extends FGUICompPropPanel {
    protected onConstruct(): void {
        super.onConstruct();
        this.init();
    }

    /**
     * 初始化
     */
    init(): void {
        const upSetNums = DataCenter.instance.getRichByType(RICH_TYPE.UPSET);
        this.showNums(this.UI_BTN_UPSET, upSetNums?.richNums || 0);

        const autoRemoveNums = DataCenter.instance.getRichByType(RICH_TYPE.AUTO_REMOVE);
        this.showNums(this.UI_BTN_AUTO_REMOVE, autoRemoveNums?.richNums || 0);
    }

    showNums(obj: fgui.GComponent, nums: number): void {
        if (obj) {
            obj.getChild("UI_TXT_NUM").text = `X ${nums}`;
        }
    }
    /**
     * @method isLocalGame
     * @description 判断当前是否为本地游戏（单机游戏或闯关模式）
     * @returns {boolean} true=本地游戏，false=在线游戏
     */
    private isLocalGame(): boolean {
        return GameData.instance.isLocalGame || GameData.instance.isChallengeMode;
    }

    /**
     * 使用道具
     * @param itemId 道具ID (1:重排, 2:提示, 3:加时等)
     */
    sendUseItem(itemId: number, callBack?: (b: boolean, response: SprotoUseItem.Response) => void): void {
        GameSocketManager.instance.sendToServer(
            SprotoUseItem,
            {
                itemId: itemId,
            },
            (response: SprotoUseItem.Response) => {
                if (response && response.code === 1) {
                    callBack && callBack(true, response);
                    Logger.log("使用道具成功:", itemId);
                } else {
                    callBack && callBack(false, response);
                    Logger.error("使用道具失败:", response?.msg || "未知错误");
                    TipsView.showView({ content: response.msg });
                }
            }
        );
    }

    checkPropEnough(itemId: number): boolean {
        const richData = DataCenter.instance.getRichByType(itemId);
        if (!richData || !richData.richNums || richData.richNums <= 0) {
            return false;
        }
        return true;
    }

    useLocalGameProp(itemId: number, callBack?: (b: boolean, response: SprotoLocalGameUseProps.Response) => void): void {
        if (!this.isLocalGame()) {
            Logger.warn("非本地游戏无法使用本地道具");
            return;
        }

        if (!this.checkPropEnough(itemId)) {
            TipsView.showView({ content: "道具数量不足" });
            return;
        }

        LocalGameUseProps.instance.req(itemId, 1, (b, response) => {
            if (b) {
                callBack && callBack(true, response);
                Logger.log("本地游戏使用道具成功:", itemId);
            } else {
                callBack && callBack(false, response);
                Logger.error("本地游戏使用道具失败:", response?.msg || "未知错误");
                TipsView.showView({ content: response.msg });
            }
        });
    }

    /**
     * 使用道具: 打乱
     */
    onBtnUpset(): void {
        Logger.log("使用道具: 打乱");
        if (this.isLocalGame()) {
            this.useLocalGameProp(RICH_TYPE.UPSET, (b, response) => {
                if (b) {
                    // todo: 本地游戏打乱后需要重置地图数据
                    this.sendUseItem(RICH_TYPE.UPSET); // 同步使用道具接口，减少本地游戏和在线游戏的差异
                    this.init();
                }
            });
            return;
        }
        const callBack = (b: boolean, response: SprotoUseItem.Response) => {
            if (b) {
                DataCenter.instance.updateRichByType(RICH_TYPE.UPSET, response.richNum);
                this.init();
            }
        };
        this.sendUseItem(RICH_TYPE.UPSET, callBack);
    }

    onBtnAutoRemove(): void {
        Logger.log("使用道具: 自动移除");
        if (this.isLocalGame()) {
            this.useLocalGameProp(RICH_TYPE.AUTO_REMOVE, (b, response) => {
                if (b) {
                    // todo: 本地游戏自动移除后需要重置地图数据
                    this.sendUseItem(RICH_TYPE.AUTO_REMOVE); // 同步使用道具接口，减少本地游戏和在线游戏的差异
                    this.init();
                }
            });
            return;
        }
        const callBack = (b: boolean, response: SprotoUseItem.Response) => {
            if (b) {
                DataCenter.instance.updateRichByType(RICH_TYPE.AUTO_REMOVE, response.richNum);
                this.init();
            }
        };
        this.sendUseItem(RICH_TYPE.AUTO_REMOVE, callBack);
    }
}
fgui.UIObjectFactory.setExtension(CompPropPanel.URL, CompPropPanel);
