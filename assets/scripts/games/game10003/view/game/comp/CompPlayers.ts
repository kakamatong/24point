import FGUICompPlayers from "@fgui/game10002/FGUICompPlayers";
import { CompOtherPlayer } from "./CompOtherPlayer";
import { ViewClass } from "@frameworks/Framework";
import { GAME_PLAYER_INFO } from "../../../data/InterfaceGameConfig";
import { Point, LineSegment } from "../../../logic/TileMapData";
import * as fgui from "fairygui-cc";
import { Logger } from "@frameworks/utils/Utils";

/**
 * @class CompPlayers
 * @description 其他玩家列表管理组件
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompPlayers extends FGUICompPlayers {
    /**
     * @property {Map<number, CompOtherPlayer>} _playerMap
     * @description 服务器座位号到其他玩家组件的映射
     * @private
     */
    private _playerMap: Map<number, CompOtherPlayer> = new Map();

    /**
     * @method onConstruct
     * @description 组件构造完成时的初始化
     */
    protected onConstruct(): void {
        super.onConstruct();
        this._initList();
    }

    /**
     * @method _initList
     * @description 初始化列表
     * @private
     */
    private _initList(): void {
        // 设置列表项渲染器
        this.UI_LIST_OTHER_PLAYERS.itemRenderer = this._renderListItem.bind(this);
    }

    /**
     * @method _renderListItem
     * @description 列表项渲染函数
     * @param {number} index - 索引
     * @param {fgui.GObject} obj - 列表项对象
     * @private
     */
    private _renderListItem(index: number, obj: fgui.GObject): void {
        // 列表项已经是 CompOtherPlayer 类型
        const otherPlayer = obj as CompOtherPlayer;
        if (!otherPlayer) {
            Logger.error(`列表项 ${index} 不是 CompOtherPlayer 类型`);
            return;
        }
    }

    /**
     * @method addOtherPlayer
     * @description 添加其他玩家
     * @param {number} svrSeat - 服务器座位号
     * @param {GAME_PLAYER_INFO} player - 玩家信息
     * @param {string} headurl - 头像URL
     * @returns {CompOtherPlayer} 创建的其他玩家组件
     */
    addOtherPlayer(svrSeat: number, player: GAME_PLAYER_INFO, headurl: string): CompOtherPlayer {
        // 检查是否已存在
        if (this._playerMap.has(svrSeat)) {
            Logger.warn(`服务器座位 ${svrSeat} 的玩家已存在，更新信息`);
            const existingPlayer = this._playerMap.get(svrSeat)!;
            existingPlayer.updatePlayerInfo(player, headurl);
            return existingPlayer;
        }

        // 添加新的列表项
        const index = this.UI_LIST_OTHER_PLAYERS.numChildren;
        this.UI_LIST_OTHER_PLAYERS.addItemFromPool();

        // 获取刚添加的列表项
        const listItem = this.UI_LIST_OTHER_PLAYERS.getChildAt(index) as CompOtherPlayer;
        if (!listItem) {
            Logger.error(`无法获取列表项 ${index}`);
            return null;
        }

        // 设置服务器座位号并更新信息
        listItem.setSvrSeat(svrSeat);
        listItem.updatePlayerInfo(player, headurl);
        listItem.show();

        // 保存到映射表
        this._playerMap.set(svrSeat, listItem);

        Logger.log(`添加其他玩家，服务器座位: ${svrSeat}, 列表索引: ${index}`);
        return listItem;
    }

    /**
     * @method removeOtherPlayer
     * @description 移除其他玩家
     * @param {number} svrSeat - 服务器座位号
     */
    removeOtherPlayer(svrSeat: number): void {
        const otherPlayer = this._playerMap.get(svrSeat);
        if (!otherPlayer) {
            Logger.warn(`服务器座位 ${svrSeat} 的玩家不存在`);
            return;
        }

        // 找到列表中的索引
        const index = this.UI_LIST_OTHER_PLAYERS.getChildIndex(otherPlayer);
        if (index >= 0) {
            // 从列表中移除
            this.UI_LIST_OTHER_PLAYERS.removeChildAt(index);
        }

        // 重置并清理
        otherPlayer.reset();

        // 从映射表中移除
        this._playerMap.delete(svrSeat);

        Logger.log(`移除其他玩家，服务器座位: ${svrSeat}`);
    }

    /**
     * @method getOtherPlayer
     * @description 获取其他玩家组件
     * @param {number} svrSeat - 服务器座位号
     * @returns {CompOtherPlayer | null} 其他玩家组件，不存在返回 null
     */
    getOtherPlayer(svrSeat: number): CompOtherPlayer | null {
        return this._playerMap.get(svrSeat) || null;
    }

    /**
     * @method updateOtherPlayerHead
     * @description 更新其他玩家头像
     * @param {number} svrSeat - 服务器座位号
     * @param {GAME_PLAYER_INFO} player - 玩家信息
     * @param {string} headurl - 头像URL
     */
    updateOtherPlayerHead(svrSeat: number, player: GAME_PLAYER_INFO, headurl: string): void {
        const otherPlayer = this._playerMap.get(svrSeat);
        if (otherPlayer) {
            otherPlayer.updatePlayerInfo(player, headurl);
        } else {
            // 如果不存在则创建
            this.addOtherPlayer(svrSeat, player, headurl);
        }
    }

    /**
     * @method updateOtherPlayerMap
     * @description 更新其他玩家地图
     * @param {number} svrSeat - 服务器座位号
     * @param {number[][]} mapData - 地图数据
     * @param {string} resPath - 资源路径
     */
    updateOtherPlayerMap(svrSeat: number, mapData: number[][], resPath: string = "resFruit"): void {
        const otherPlayer = this._playerMap.get(svrSeat);
        if (otherPlayer) {
            otherPlayer.updateMap(mapData, resPath);
        } else {
            Logger.warn(`服务器座位 ${svrSeat} 的玩家不存在，无法更新地图`);
        }
    }

    /**
     * @method removeOtherPlayerTiles
     * @description 移除其他玩家的方块（其他玩家消除时调用）
     * @param {number} svrSeat - 服务器座位号
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @param {LineSegment[]} lines - 连接路径，用于显示连线动画
     */
    removeOtherPlayerTiles(svrSeat: number, p1: Point, p2: Point, lines?: LineSegment[]): void {
        const otherPlayer = this._playerMap.get(svrSeat);
        if (otherPlayer) {
            otherPlayer.removeTiles(p1, p2, lines);
        } else {
            Logger.warn(`服务器座位 ${svrSeat} 的玩家不存在，无法移除方块`);
        }
    }

    /**
     * @method setOtherPlayerComplete
     * @description 设置其他玩家的完成状态
     * @param {number} svrSeat - 服务器座位号
     * @param {boolean} completed - 是否已完成
     */
    setOtherPlayerComplete(svrSeat: number, completed: boolean): void {
        const otherPlayer = this._playerMap.get(svrSeat);
        if (otherPlayer) {
            otherPlayer.setComplete(completed);
        } else {
            Logger.warn(`服务器座位 ${svrSeat} 的玩家不存在，无法设置完成状态`);
        }
    }

    /**
     * @method setOtherPlayerRank
     * @description 设置其他玩家的名次
     * @param {number} svrSeat - 服务器座位号
     * @param {number} rank - 名次，0表示不显示，1-6表示名次
     */
    setOtherPlayerRank(svrSeat: number, rank: number): void {
        const otherPlayer = this._playerMap.get(svrSeat);
        if (otherPlayer) {
            otherPlayer.setRank(rank);
        } else {
            Logger.warn(`服务器座位 ${svrSeat} 的玩家不存在，无法设置名次`);
        }
    }

    /**
     * @method setOtherPlayerIncomplete
     * @description 设置其他玩家为未完成状态
     * @param {number} svrSeat - 服务器座位号
     */
    setOtherPlayerIncomplete(svrSeat: number): void {
        const otherPlayer = this._playerMap.get(svrSeat);
        if (otherPlayer) {
            otherPlayer.setIncomplete();
        } else {
            Logger.warn(`服务器座位 ${svrSeat} 的玩家不存在，无法设置未完成状态`);
        }
    }

    /**
     * @method setAllPlayersIncomplete
     * @description 设置所有未完成玩家为未完成状态
     * @param {number[]} completedSeats - 已完成玩家的服务器座位号列表
     */
    setAllPlayersIncomplete(completedSeats: number[]): void {
        for (const [svrSeat, otherPlayer] of this._playerMap) {
            // 如果该玩家不在已完成列表中，设置为未完成
            const player = otherPlayer as any;
            if (player && player.getCompleteStatus() !== 1) {
                otherPlayer.setIncomplete();
            }
        }
    }

    /**
     * @method resetAllPlayers
     * @description 重置所有其他玩家状态（不清空列表，用于私人房下一局）
     */
    resetAllPlayers(): void {
        // 重置所有玩家状态（完成状态、名次等标签）
        for (const [svrSeat, otherPlayer] of this._playerMap) {
            otherPlayer.reset();
        }
        Logger.log("重置所有其他玩家状态");
    }

    /**
     * @method clear
     * @description 清空所有其他玩家
     */
    clear(): void {
        // 重置所有玩家
        for (const [svrSeat, otherPlayer] of this._playerMap) {
            otherPlayer.reset();
        }

        // 清空映射表
        this._playerMap.clear();

        // 清空列表
        this.UI_LIST_OTHER_PLAYERS.removeChildrenToPool();

        Logger.log("清空所有其他玩家");
    }

    /**
     * @method getAllPlayers
     * @description 获取所有其他玩家组件
     * @returns {CompOtherPlayer[]} 其他玩家组件数组
     */
    getAllPlayers(): CompOtherPlayer[] {
        return Array.from(this._playerMap.values());
    }

    /**
     * @method hasPlayer
     * @description 检查是否存在指定座位的玩家
     * @param {number} svrSeat - 服务器座位号
     * @returns {boolean} 是否存在
     */
    hasPlayer(svrSeat: number): boolean {
        return this._playerMap.has(svrSeat);
    }
}
fgui.UIObjectFactory.setExtension(CompPlayers.URL, CompPlayers);
