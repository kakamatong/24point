/**
 * @file Gamedata.ts
 * @description 游戏数据：管理游戏 10003 的游戏数据
 * @category 游戏 10003
 */

import { DEFAULT_HEADURL } from "@datacenter/InterfaceConfig";
import { GAME_PLAYER_INFO, ENUM_GAME_STEP, GAME_DATA } from "./InterfaceGameConfig";

/**
 * @interface RACE_PLAYER_PROGRESS
 * @description 竞速玩法单个玩家进度（对应 s2c.raceProgress.players 条目）
 */
export interface RACE_PLAYER_PROGRESS {
    /** 房间座位 */
    seat: number;
    /** 当前题号（1开始） */
    questionIndex: number;
    /** 已答对题数 */
    finishedCount: number;
    /** 达到当前进度用时(毫秒) */
    usedTimeMs: number;
    /** 0:答题中, 1:已完赛 */
    status: number;
}

/**
 * @class GameData
 * @description 游戏数据类，管理游戏 10003 的游戏数据，使用单例模式
 * @category 游戏 10003
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

    /** ===== 竞速玩法状态（playMode=1，仅好友房） ===== */
    /** 玩法模式：0普通/1竞速（privateInfo.playMode 或 raceQuestion 首包驱动） */
    private _playMode: number = 0;
    /** 竞速总题数 */
    private _raceTotalQuestions: number = 0;
    /** 我当前题号（1开始，0=未收到题目） */
    private _raceQuestionIndex: number = 0;
    /** 我已答对题数 */
    private _raceFinishedCount: number = 0;
    /** 我是否已完赛（答完全部题） */
    private _raceSelfFinished: boolean = false;
    /** 竞速是否已结束（收到 raceFinish） */
    private _raceEnded: boolean = false;
    /** 全员进度快照（key 为房间座位） */
    private _raceProgressMap: Map<number, RACE_PLAYER_PROGRESS> = new Map();

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
        this._playMode = 0;
        this._raceTotalQuestions = 0;
        this._raceQuestionIndex = 0;
        this._raceFinishedCount = 0;
        this._raceSelfFinished = false;
        this._raceEnded = false;
        this._raceProgressMap.clear();
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

    /** ===== 竞速玩法状态 ===== */

    /** 玩法模式：0普通/1竞速 */
    get playMode(): number {
        return this._playMode;
    }

    set playMode(mode: number) {
        this._playMode = mode;
    }

    /** 是否竞速模式 */
    isRaceMode(): boolean {
        return this._playMode === 1;
    }

    /** 竞速总题数 */
    get raceTotalQuestions(): number {
        return this._raceTotalQuestions;
    }

    set raceTotalQuestions(cnt: number) {
        this._raceTotalQuestions = cnt;
    }

    /** 我当前题号（1开始，0=未收到） */
    get raceQuestionIndex(): number {
        return this._raceQuestionIndex;
    }

    set raceQuestionIndex(index: number) {
        this._raceQuestionIndex = index;
    }

    /** 我已答对题数 */
    get raceFinishedCount(): number {
        return this._raceFinishedCount;
    }

    set raceFinishedCount(cnt: number) {
        this._raceFinishedCount = cnt;
    }

    /** 我是否已完赛 */
    get raceSelfFinished(): boolean {
        return this._raceSelfFinished;
    }

    set raceSelfFinished(flag: boolean) {
        this._raceSelfFinished = flag;
    }

    /** 竞速是否已结束 */
    get raceEnded(): boolean {
        return this._raceEnded;
    }

    set raceEnded(flag: boolean) {
        this._raceEnded = flag;
    }

    /**
     * @description 覆盖式刷新全员竞速进度快照（raceProgress 全量下发，天然重同步）
     * @param players 进度条目数组
     */
    setRaceProgress(players: RACE_PLAYER_PROGRESS[]): void {
        this._raceProgressMap.clear();
        for (const p of players ?? []) {
            if (p && p.seat) {
                this._raceProgressMap.set(p.seat, p);
            }
        }
    }

    /** 获取全员竞速进度 */
    get raceProgress(): RACE_PLAYER_PROGRESS[] {
        return Array.from(this._raceProgressMap.values());
    }

    /** 获取指定座位竞速进度 */
    getRaceProgressBySeat(seat: number): RACE_PLAYER_PROGRESS | null {
        return this._raceProgressMap.get(seat) ?? null;
    }

    /**
     * @description 竞速中且自己未完赛、竞速未结束才允许选牌/提交
     */
    canOperateRace(): boolean {
        return this.isRaceMode() && !this._raceEnded && !this._raceSelfFinished && this._raceQuestionIndex > 0;
    }
}
