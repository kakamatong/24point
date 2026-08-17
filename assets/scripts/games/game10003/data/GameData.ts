/**
 * @file Gamedata.ts
 * @description 游戏数据：管理游戏 10002 的游戏数据
 * @category 游戏 10002
 */

import { DEFAULT_HEADURL } from "@datacenter/InterfaceConfig";
import { GAME_PLAYER_INFO, ENUM_GAME_STEP, GAME_DATA } from "./InterfaceGameConfig";

/**
 * @class GameData
 * @description 游戏数据类，管理游戏 10002 的游戏数据，使用单例模式
 * @category 游戏 10002
 * @singleton 单例模式
 */
export class GameData {
    /** 所有玩家信息，key 为 userid */
    private _playerInfoMap: Map<number, GAME_PLAYER_INFO> = new Map();
    /** 服务器座位号到 userid 的映射，座位权威来源为 playerEnter/playerLeave */
    private _seatUseridMap: Map<number, number> = new Map();
    private _selfSeat: number = 1;
    private _maxPlayer = 2;
    private _gameStep: ENUM_GAME_STEP = ENUM_GAME_STEP.NONE;
    private _roomEnd: boolean = false;
    private _gameStart = false;
    private _isPrivateRoom = false;
    private _gameData: GAME_DATA | null = null;
    private _owner = 0;
    private _record: Array<any> = [];
    private _privateNowCnt: number = 0; // 第几局
    private _privateMaxCnt: number = 0; // 最大局数
    /** 是否是本地游戏 */
    private _isLocalGame: boolean = false;

    /**
     * @description 是否是闯关模式
     * @returns {boolean} 是否是闯关模式
     */
    private _isChallengeMode: boolean = false;

    /** 单例实例 */
    private static _instance: GameData;

    /**
     * @description 获取 GameData 单例实例
     * @returns GameData 单例实例
     */
    public static get instance(): GameData {
        if (!this._instance) {
            this._instance = new GameData();
        }
        return this._instance;
    }

    private constructor() {}

    /**
     * @description 初始化游戏数据
     */
    init() {
        this.gameStep = ENUM_GAME_STEP.NONE;
        this._playerInfoMap.clear();
        this._seatUseridMap.clear();
        this._selfSeat = 0;
        this.roomEnd = false;
        this.gameStart = false;
        this.isPrivateRoom = false;
        this.gameData = null;
        this._owner = 0;
        this._privateNowCnt = 0;
        this._isLocalGame = false;
        this._isChallengeMode = false;
    }

    get gameStep(): ENUM_GAME_STEP {
        return this._gameStep;
    }

    set gameStep(step: ENUM_GAME_STEP) {
        this._gameStep = step;
    }

    get maxPlayer(): number {
        return this._maxPlayer;
    }

    set maxPlayer(max: number) {
        this._maxPlayer = max;
    }

    getSelfSeat(): number {
        return this._selfSeat;
    }

    setSelfSeat(seat: number): void {
        this._selfSeat = seat;
    }

    /**
     * @description 设置玩家列表
     * @param list 玩家列表
     */
    set playerList(list: Array<GAME_PLAYER_INFO>) {
        this._playerInfoMap.clear();
        for (const player of list) {
            if (player && player.userid) {
                this._playerInfoMap.set(player.userid, player);
            }
        }
    }

    /**
     * @description 获取所有玩家列表
     * @returns 玩家列表
     */
    get playerList(): Array<GAME_PLAYER_INFO> {
        return Array.from(this._playerInfoMap.values());
    }

    /**
     * @description 添加玩家到列表
     * @param player 玩家信息
     */
    addPlayer(player: GAME_PLAYER_INFO): void {
        if (player && player.userid) {
            this._playerInfoMap.set(player.userid, player);
        }
    }

    /**
     * @description 设置玩家服务器座位号映射（座位权威入口，由 playerEnter 调用）
     * @param userid 玩家用户ID
     * @param svrSeat 服务器座位号
     */
    setSeatForUserid(userid: number, svrSeat: number): void {
        // 该玩家已有旧座位时先清除
        for (const [seat, uid] of this._seatUseridMap) {
            if (uid === userid && seat !== svrSeat) {
                this._seatUseridMap.delete(seat);
                break;
            }
        }
        this._seatUseridMap.set(svrSeat, userid);
    }

    /**
     * @description 根据用户ID获取服务器座位号
     * @param userid 玩家用户ID
     * @returns 服务器座位号，未知返回 0
     */
    getSeatByUserid(userid: number): number {
        for (const [seat, uid] of this._seatUseridMap) {
            if (uid === userid) {
                return seat;
            }
        }
        return 0;
    }

    /**
     * @description 根据服务器座位号移除玩家
     * @param svrSeat 服务器座位号
     */
    removePlayerBySeat(svrSeat: number): void {
        const userid = this._seatUseridMap.get(svrSeat);
        if (userid !== undefined) {
            this._playerInfoMap.delete(userid);
        }
        this._seatUseridMap.delete(svrSeat);
    }

    /**
     * @description 获取指定服务器座位的玩家头像
     * @param svrSeat 服务器座位号
     * @returns 头像 URL
     */
    getHeadurl(svrSeat: number): string {
        const player = this.getPlayerBySeat(svrSeat);
        if (!player || !player.headurl) {
            return DEFAULT_HEADURL;
        }
        return player.headurl;
    }

    getHeadurlByUserid(userid: number): string {
        const player = this.getPlayerByUserid(userid);
        if (!player || !player.headurl) {
            return DEFAULT_HEADURL;
        }
        return player.headurl;
    }

    getPlayerBySeat(seat: number): GAME_PLAYER_INFO | null {
        const userid = this._seatUseridMap.get(seat);
        if (userid === undefined) {
            return null;
        }
        return this._playerInfoMap.get(userid) || null;
    }

    getPlayerByUserid(userid: number): GAME_PLAYER_INFO | null {
        return this._playerInfoMap.get(userid) || null;
    }

    getPlayerCnt(): number {
        return this._playerInfoMap.size;
    }

    set roomEnd(end: boolean) {
        this._roomEnd = end;
    }

    get roomEnd(): boolean {
        return this._roomEnd;
    }

    set gameStart(start: boolean) {
        this._gameStart = start;
    }

    get gameStart(): boolean {
        return this._gameStart;
    }

    set isPrivateRoom(flag: boolean) {
        this._isPrivateRoom = flag;
    }

    get isPrivateRoom(): boolean {
        return this._isPrivateRoom;
    }

    set gameData(data: GAME_DATA | null) {
        this._gameData = data;
    }

    get gameData(): GAME_DATA | null {
        return this._gameData;
    }

    set owner(userid: number) {
        this._owner = userid;
    }

    get owner(): number {
        return this._owner;
    }

    set record(record: Array<any>) {
        this._record = record;
    }

    get record(): Array<any> {
        return this._record;
    }

    set privateNowCnt(cnt: number) {
        this._privateNowCnt = cnt;
    }

    get privateNowCnt(): number {
        return this._privateNowCnt;
    }

    set privateMaxCnt(cnt: number) {
        this._privateMaxCnt = cnt;
    }

    get privateMaxCnt(): number {
        return this._privateMaxCnt;
    }

    set isLocalGame(flag: boolean) {
        this._isLocalGame = flag;
    }

    get isLocalGame(): boolean {
        return this._isLocalGame;
    }

    set isChallengeMode(flag: boolean) {
        this._isChallengeMode = flag;
    }

    get isChallengeMode(): boolean {
        return this._isChallengeMode;
    }
}
