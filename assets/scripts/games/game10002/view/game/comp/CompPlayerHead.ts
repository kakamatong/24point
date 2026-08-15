import FGUICompPlayerHead from "@fgui/game10002/FGUICompPlayerHead";
import { GameData } from "../../../data/GameData";
import { PlayerInfoView } from "../../playerInfo/PlayerInfoView";
import { CompTalk } from "./CompTalk";
import { ViewClass } from "@frameworks/Framework";
import { GAME_PLAYER_INFO, PLAYER_STATUS } from "../../../data/InterfaceGameConfig";
import FGUICompHead from "@fgui/common/FGUICompHead";
import { TruncateString } from "@frameworks/utils/Utils";
import * as fgui from "fairygui-cc";
/**
 * @class CompPlayerHead
 * @description 玩家头像组件，封装玩家信息展示的所有逻辑
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompPlayerHead extends FGUICompPlayerHead {
    public svrSeat: number = 0;

    protected onConstruct() {
        super.onConstruct();
        this.initUI();
    }

    /**
     * @method initUI
     * @description 初始化UI事件监听
     * @private
     */
    private initUI(): void {
        this.UI_COMP_HEAD.onClick(this.onHeadClick, this);
    }

    /**
     * @method onHeadClick
     * @description 头像点击事件处理
     * @private
     */
    private onHeadClick(): void {
        const player = GameData.instance.getPlayerBySeat(this.svrSeat);
        if (player) {
            PlayerInfoView.showView({ userid: player.userid, cp: player.cp });
        }
    }

    /**
     * @method setSvrSeat
     * @description 设置服务器座位号
     * @param {number} seat - 服务器座位号
     */
    setSvrSeat(seat: number): void {
        this.svrSeat = seat;
    }

    /**
     * @method updatePlayerInfo
     * @description 更新玩家信息展示
     * @param {GAME_PLAYER_INFO} player - 玩家信息
     * @param {boolean} isSelf - 是否是自己
     * @param {string} headurl - 头像URL
     */
    updatePlayerInfo(player: GAME_PLAYER_INFO, isSelf: boolean, headurl: string): void {
        // 设置昵称
        this.UI_TXT_NICKNAME.text = TruncateString(player.nickname ?? "", 8);

        // 设置头像
        const head = this.UI_COMP_HEAD as FGUICompHead;
        head.UI_LOADER_HEAD.url = headurl;

        // 非自己时显示离线状态和可见性
        if (!isSelf) {
            this.updateOfflineStatus(player.status);
            this.visible = true;
        }

        // 根据状态显示准备标识
        if (player.status === PLAYER_STATUS.READY) {
            this.showSignReady(true);
        } else {
            this.showSignReady(false);
        }
    }

    /**
     * @method updateOfflineStatus
     * @description 更新离线状态显示
     * @param {number} status - 玩家状态
     */
    updateOfflineStatus(status: number): void {
        // PLAYER_STATUS.OFFLINE = 0
        this.UI_COMP_OFFLINE.visible = status === 0;
    }

    /**
     * @method showMsg
     * @description 显示聊天消息
     * @param {string} msg - 消息内容
     */
    showMsg(msg: string): void {
        (this.UI_COMP_TALK as CompTalk).talkMsg = msg;
    }

    /**
     * @method showSignReady
     * @description 显示或隐藏准备标识
     * @param {boolean} bshow - 是否显示
     */
    showSignReady(bshow: boolean): void {
        this.UI_IMG_SIGN_READY.visible = bshow;
    }

    /**
     * @method hide
     * @description 隐藏整个组件
     */
    hide(): void {
        this.visible = false;
    }

    /**
     * @method reset
     * @description 重置组件状态
     */
    reset(): void {
        this.showSignReady(false);
        this.UI_COMP_OFFLINE.visible = false;
    }
}
fgui.UIObjectFactory.setExtension(CompPlayerHead.URL, CompPlayerHead);
