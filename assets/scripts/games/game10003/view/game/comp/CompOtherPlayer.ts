import FGUICompOtherPlayer from "@fgui/game10003/FGUICompOtherPlayer";
import { CompPlayerHead } from "./CompPlayerHead";
import { ViewClass } from "@frameworks/Framework";
import { GAME_PLAYER_INFO } from "../../../data/InterfaceGameConfig";
import * as fgui from "fairygui-cc";
import { Logger } from "@frameworks/utils/Utils";

/**
 * @typedef PlayerCompleteStatus
 * @description 玩家完成状态类型
 * @category 游戏 10002 - 连连看
 */
export type PlayerCompleteStatus = "playing" | "completed" | "incomplete";

/**
 * @constant PLAYER_STATUS_MAP
 * @description 玩家状态到控制器索引的映射
 * @category 游戏 10002 - 连连看
 */
export const PLAYER_STATUS_MAP: Record<PlayerCompleteStatus, number> = {
    "playing": 0, // 进行中
    "completed": 1, // 完成
    "incomplete": 2, // 未完成
};

/**
 * @class CompOtherPlayer
 * @description 其他玩家组件，包含头像和小地图预览
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompOtherPlayer extends FGUICompOtherPlayer {
    /**
     * @property {CompPlayerHead} _compHead
     * @description 头像组件
     * @private
     */
    private _compHead: CompPlayerHead;

    /**
     * @property {number} _svrSeat
     * @description 服务器座位号
     * @private
     */
    private _svrSeat: number = 0;

    /**
     * @method onConstruct
     * @description 组件构造完成时的初始化
     */
    protected onConstruct(): void {
        super.onConstruct();
        this._initComponents();
    }

    /**
     * @method _initComponents
     * @description 初始化子组件
     * @private
     */
    private _initComponents(): void {
        // 获取头像组件
        this._compHead = this.UI_COMP_HEAD as CompPlayerHead;
    }

    /**
     * @method setSvrSeat
     * @description 设置服务器座位号
     * @param {number} svrSeat - 服务器座位号
     */
    setSvrSeat(svrSeat: number): void {
        this._svrSeat = svrSeat;
        if (this._compHead) {
            this._compHead.setSvrSeat(svrSeat);
        }
    }

    /**
     * @method getSvrSeat
     * @description 获取服务器座位号
     * @returns {number} 服务器座位号
     */
    getSvrSeat(): number {
        return this._svrSeat;
    }

    /**
     * @method updatePlayerInfo
     * @description 更新玩家信息
     * @param {GAME_PLAYER_INFO} player - 玩家信息
     * @param {string} headurl - 头像URL
     */
    updatePlayerInfo(player: GAME_PLAYER_INFO, headurl: string): void {
        if (this._compHead) {
            // 其他玩家不是你自己
            this._compHead.updatePlayerInfo(player, false, headurl);
        }
    }

    /**
     * @method show
     * @description 显示组件
     */
    show(): void {
        this.visible = true;
    }

    /**
     * @method hide
     * @description 隐藏组件
     */
    hide(): void {
        this.visible = false;
    }

    /**
     * @method setCompleteStatus
     * @description 设置完成状态
     * @param {PlayerCompleteStatus} status - 状态：playing=进行中(0), completed=完成(1), incomplete=未完成(2)
     */
    setCompleteStatus(status: PlayerCompleteStatus): void {
        this.ctrl_bComplate.selectedIndex = PLAYER_STATUS_MAP[status];
    }

    /**
     * @method setComplete
     * @description 设置完成状态（兼容旧接口）
     * @param {boolean} completed - 是否已完成
     */
    setComplete(completed: boolean): void {
        this.setCompleteStatus(completed ? "completed" : "playing");
    }

    /**
     * @method setIncomplete
     * @description 设置未完成状态
     */
    setIncomplete(): void {
        this.ctrl_bComplate.selectedIndex = 2;
    }

    /**
     * @method getCompleteStatus
     * @description 获取完成状态
     * @returns {number} 0=进行中, 1=完成, 2=未完成
     */
    getCompleteStatus(): number {
        return this.ctrl_bComplate.selectedIndex;
    }

    /**
     * @method isComplete
     * @description 获取是否已完成
     * @returns {boolean} 是否已完成
     */
    isComplete(): boolean {
        return this.ctrl_bComplate.selectedIndex === 1;
    }

    /**
     * @method setRank
     * @description 设置名次显示
     * @param {number} rank - 名次，0表示不显示，1-6表示名次
     */
    setRank(rank: number): void {
        const ctrl = this.UI_COMP_MEDAL.getController("ctrl_rank");
        if (!ctrl) {
            Logger.warn("奖牌控制器未初始化");
            return;
        }
        // 限制名次范围在0-6之间
        const safeRank = Math.max(0, Math.min(6, rank));
        ctrl.selectedIndex = safeRank;
    }

    /**
     * @method getRank
     * @description 获取当前名次
     * @returns {number} 当前名次，0表示未显示
     */
    getRank(): number {
        const ctrl = this.UI_COMP_MEDAL.getController("ctrl_rank");
        if (!ctrl) {
            Logger.warn("奖牌控制器未初始化");
            return 0;
        }
        return ctrl.selectedIndex;
    }

    /**
     * @method reset
     * @description 重置组件状态
     */
    reset(): void {
        if (this._compHead) {
            this._compHead.reset();
        }
        this.setCompleteStatus("playing");
        this.setRank(0);
    }

    /**
     * @method getHeadComponent
     * @description 获取头像组件
     * @returns {CompPlayerHead} 头像组件
     */
    getHeadComponent(): CompPlayerHead {
        return this._compHead;
    }
}
fgui.UIObjectFactory.setExtension(CompOtherPlayer.URL, CompOtherPlayer);
