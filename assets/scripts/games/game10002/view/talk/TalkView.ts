import FGUICompItem from "@fgui/game10002Talk/FGUICompItem";
import FGUITalkView from "@fgui/game10002Talk/FGUITalkView";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import { TALK_LIST, FORWARD_MESSAGE_TYPE } from "../../view/talk/TalkConfig";
import { SprotoForwardMessage } from "../../../../../types/protocol/game10002/c2s";
import * as fgui from "fairygui-cc";
import { Logger } from "@frameworks/utils/Utils";

@PackageLoad(["props"])
@ViewClass()
export class TalkView extends FGUITalkView {
    show(data?: any) {
        this.initUI();
    }

    initUI() {
        this.UI_COMP_MAIN.UI_LIST_TALK.itemRenderer = this.itemRenderer.bind(this);
        this.UI_COMP_MAIN.UI_LIST_TALK.numItems = TALK_LIST.length;
        this.onClick(this.onBtnClose, this);
    }

    itemRenderer(index: number, obj: fgui.GObject) {
        const data = TALK_LIST[index];
        const node = obj as FGUICompItem;
        node.UI_TXT_TALK.text = data.msg;

        node.onClick(() => {
            this.sendTalk(data.id);
        }, this);
    }

    /**
     * 发送聊天
     * @param id 聊天id
     * @returns void
     */
    sendTalk(id: number) {
        if (!GameSocketManager.instance.isOpen()) {
            Logger.warn("游戏连接已断开，无法发送聊天");
            return;
        }
        // 使用 forwardMessage 发送聊天消息
        GameSocketManager.instance.sendToServer(
            SprotoForwardMessage,
            {
                type: FORWARD_MESSAGE_TYPE.TALK,
                to: [], // 空数组表示发送给所有人
                msg: JSON.stringify({ id: id }),
            },
            (data: SprotoForwardMessage.Response) => {
                if (data.code !== 0) {
                    Logger.warn("发送聊天失败:", data.msg);
                }
            }
        );
    }

    /**
     * 关闭聊天
     * @returns void
     */
    onBtnClose() {
        if (this.in.playing) {
            return;
        }

        if (this.out.playing) {
            return;
        }

        this.out.play(() => {
            TalkView.hideView();
        });
    }
}

fgui.UIObjectFactory.setExtension(TalkView.URL, TalkView);
