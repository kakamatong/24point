import { AddEventListener, DispatchEvent, RemoveEventListener } from "@frameworks/Framework";
import { Logger } from "@frameworks/utils/Utils";
import {
    SprotoGameStart,
    SprotoMapData,
    SprotoTilesRemoved,
    SprotoPlayerFinished,
    SprotoGameEnd,
    SprotoProgressUpdate,
    SprotoItemEffect,
    SprotoLogicInfo,
    SprotoComboSuccess,
    SprotoMapShuffled,
    SprotoPlayerInfos,
    SprotoPlayerEnter,
    SprotoStepId,
    SprotoRoomInfo,
    SprotoGameClock,
} from "../../types/protocol/game10002/s2c";
import {
    SprotoClickTiles,
    SprotoUseItem,
    SprotoGameReady,
    SprotoLeaveRoom,
    SprotoOwnerStartGame,
    SprotoClientReady,
} from "../../types/protocol/game10002/c2s";
import { MAIN_GAME_ID, RICH_TYPE } from "@datacenter/InterfaceConfig";
import { DataCenter } from "@datacenter/Datacenter";
import { generateRandomMap, generateFromDesign } from "./mapGenerator";
import { MAP_LEVEL_CONFIG, CHALLENGE_LEVEL_TYPE, CHALLENGE_END_TYPE } from "@datacenter/ChallengeData";
import { shiftMap, SHIFT_DIR } from "../games/game10003/logic/TileMapData";

/**
 * @enum LOCAL_SVR_MODE
 * @description 本地服务器运行模式
 */
export enum LOCAL_SVR_MODE {
    /** 单机模式：随机生成地图 */
    STANDALONE = 0,
    /** 闯关模式：使用外部传入的关卡配置 */
    CHALLENGE = 1,
}

/**
 * @class LocalSvr
 * @description 本地游戏模拟服务器，接管 GameSocketManager 在本地模式下的协议收发，
 *              模拟联网游戏的核心协议流程（方块消除、道具使用、游戏结束等）
 */
export class LocalSvr {
    /** 障碍物判定阈值（值 >= 100 为障碍物，不可通过也不可消除） */
    private static readonly DECORATION_VALUE = 100;
    /** 每次消除一对的基础分（可在此处调整） */
    private static readonly SCORE_PER_PAIR: number = 1;

    /** 单例实例 */
    private static _instance: LocalSvr;

    /**
     * 获取 LocalSvr 单例
     */
    public static get instance(): LocalSvr {
        if (!this._instance) {
            this._instance = new LocalSvr();
        }
        return this._instance;
    }

    /** 服务器端维护的地图数据 */
    private _map: number[][] = [];
    /** 地图行数 */
    private _rows: number = 16;
    /** 地图列数 */
    private _cols: number = 10;
    /** 初始总方块数 */
    private _totalBlocks: number = 0;
    /** 已消除方块数 */
    private _eliminated: number = 0;
    /** 游戏开始时间戳 */
    private _startTime: number = 0;
    /** 当前回合数 */
    private _roundNum: number = 0;
    /** 连击计数（0 基：首对为 0，窗口内连续消除 +1，中断后从 0 重新计算） */
    private _comboCount: number = 0;
    /** 上次消除时间戳（用于连击判定） */
    private _lastRemoveTime: number = 0;
    /** 连击时间窗口（毫秒） */
    private readonly COMBO_WINDOW: number = 3000;
    /** 本局总分（每次开始对局重置） */
    private _totalScore: number = 0;

    /** 当前运行模式 */
    private _mode: LOCAL_SVR_MODE = LOCAL_SVR_MODE.STANDALONE;
    /** 闯关模式下的关卡配置 */
    private _challengeConfig: MAP_LEVEL_CONFIG | null = null;
    /** 消除后方块移动方向（SHIFT_DIR 枚举值，0=关闭，每局从地图配置读取） */
    private _shiftDir: number = SHIFT_DIR.OFF;
    /** 消除后方块移动的最边边位置（默认 2，每局从地图配置读取） */
    private _shiftEdge: number = 2;

    /**
     * 判断当前是否为闯关模式
     */
    isChallengeMode(): boolean {
        return this._mode === LOCAL_SVR_MODE.CHALLENGE;
    }

    /**
     * 设置运行模式
     * @param mode 运行模式
     */
    setMode(mode: LOCAL_SVR_MODE): void {
        this._mode = mode;
    }

    /**
     * 设置闯关模式的关卡配置
     * @param config 关卡配置
     */
    setChallengeConfig(config: MAP_LEVEL_CONFIG): void {
        this._challengeConfig = config;
    }

    /** 记录初始可填充位置（用于重新填入时只填充到有效位置） */
    private _validPositions: { row: number; col: number }[] = [];

    /** 当前地图的总时间（秒），从 mapConfig 读取 */
    private _totalTime: number = 0;
    /** 剩余时间（秒） */
    private _remainTime: number = 0;
    /** 服务器端时钟定时器 */
    private _clockTimer: any = null;
    /** 本次游戏是否因超时结束 */
    private _isTimeout: boolean = false;

    constructor() {}

    /**
     * 启动本地服务器，注册所有 C2S 协议监听
     */
    start(): void {
        // 先清理旧监听，确保多次调用不累积
        this.destroy();

        AddEventListener(SprotoClientReady.Name, this.onClientReady, this);
        AddEventListener(SprotoClickTiles.Name, this.onClickTiles, this);
        AddEventListener(SprotoUseItem.Name, this.onUseItem, this);
        AddEventListener(SprotoGameReady.Name, this.onGameReady, this);
        AddEventListener(SprotoLeaveRoom.Name, this.onLeaveRoom, this);
        AddEventListener(SprotoOwnerStartGame.Name, this.onOwnerStartGame, this);
    }

    /**
     * 销毁本地服务器，移除所有监听
     */
    destroy(): void {
        RemoveEventListener(SprotoClientReady.Name, this.onClientReady);
        RemoveEventListener(SprotoClickTiles.Name, this.onClickTiles);
        RemoveEventListener(SprotoUseItem.Name, this.onUseItem);
        RemoveEventListener(SprotoGameReady.Name, this.onGameReady);
        RemoveEventListener(SprotoLeaveRoom.Name, this.onLeaveRoom);
        RemoveEventListener(SprotoOwnerStartGame.Name, this.onOwnerStartGame);
        this._stopClock();
    }

    /** 分发响应事件（"resp" + 协议名，供 GameSocketManager 的回调使用） */
    dispatchEventResp(eventName: string, data?: any): void {
        DispatchEvent("resp" + eventName, data);
    }

    /** 分发广播事件（协议名，模拟服务器推送） */
    dispatchEvent(eventName: string, data?: any): void {
        DispatchEvent(eventName, data);
    }

    // ============================================
    // C2S 协议处理
    // ============================================

    /**
     * 客户端就绪 → 开始游戏
     */
    onClientReady(): void {
        this.startStepGame();
    }

    /**
     * 方块消除请求
     * 本地模式不做合法性校验，直接放行
     */
    onClickTiles(data: SprotoClickTiles.Request): void {
        const { row1, col1, row2, col2 } = data;
        const selfSeat = 1;

        // 更新服务器端地图
        this._map[row1][col1] = 0;
        this._map[row2][col2] = 0;
        this._eliminated += 2;

        const remaining = this._totalBlocks - this._eliminated;
        const now = Date.now();

        // 连击判定（0 基：首对为 0，窗口内连续消除 +1，中断后从 0 重新计算）
        if (this._lastRemoveTime > 0 && now - this._lastRemoveTime < this.COMBO_WINDOW) {
            this._comboCount++;
        } else {
            this._comboCount = 0;
        }
        this._lastRemoveTime = now;

        // 算分：本次得分 = 基础分 + 当前连击数
        const gainedScore = LocalSvr.SCORE_PER_PAIR + this._comboCount;
        this._totalScore += gainedScore;

        // 发送 clickTiles 响应
        this.dispatchEventResp(SprotoClickTiles.Name, {
            code: 1,
            msg: "",
            eliminated: this._eliminated,
            remaining: remaining,
            score: gainedScore,
            totalScore: this._totalScore,
        });

        // 广播方块消除通知
        const lines = this._buildConnectionLines(row1, col1, row2, col2);
        this.dispatchEvent(SprotoTilesRemoved.Name, {
            code: 1,
            p1: { row: row1, col: col1 },
            p2: { row: row2, col: col2 },
            lines: lines,
            eliminated: this._eliminated,
            remaining: remaining,
            seat: selfSeat,
            score: gainedScore,
            totalScore: this._totalScore,
        });

        // 广播进度更新
        const percentage = this._totalBlocks > 0 ? Math.round((this._eliminated / this._totalBlocks) * 100) : 0;
        this.dispatchEvent(SprotoProgressUpdate.Name, {
            seat: selfSeat,
            eliminated: this._eliminated,
            remaining: remaining,
            percentage: percentage,
            finished: remaining === 0 ? 1 : 0,
            usedTime: now - this._startTime,
            score: gainedScore,
            totalScore: this._totalScore,
        });

        // 连击通知（0 基连击 >= 1 即产生连击，下发 0 基值）
        if (this._comboCount >= 1) {
            this.dispatchEvent(SprotoComboSuccess.Name, {
                seat: selfSeat,
                comboCount: this._comboCount,
                comboTime: now,
                comboDuration: this.COMBO_WINDOW,
            });
        }

        // 消除后将剩余方块向指定方向移动（与客户端逻辑一致，客户端消除后自行移动，不额外通知）
        // 注意：连线 lines 已在移动前的地图上计算完成，移动不影响连线展示
        shiftMap(this._map, this._shiftDir, this._shiftEdge);

        // 检查地图是否还有可消除对（在移动后的地图上判断），没有则自动打乱，打乱后不再移动
        if (remaining > 0 && !this._hasValidPair()) {
            const didShuffle = this._ensureSolvable();
            if (didShuffle) {
                this.dispatchEvent(SprotoMapShuffled.Name, { seat: 1, reason: 1 });
            }
            this._dispatchMapData();
        }

        // 检查游戏结束
        if (remaining <= 0) {
            this.onGameFinished();
        }
    }

    /**
     * 道具使用请求
     */
    onUseItem(data: SprotoUseItem.Request): void {
        const { itemId } = data;

        switch (itemId) {
            case RICH_TYPE.UPSET:
                this.handleUpset(itemId);
                break;
            case RICH_TYPE.AUTO_REMOVE:
                this.handleAutoRemove(itemId);
                break;
            default:
                // 未知道具，返回成功但不做处理
                this.dispatchEventResp(SprotoUseItem.Name, { code: 1, msg: "", richNum: 0 });
                break;
        }
    }

    /**
     * 游戏准备请求
     */
    onGameReady(_data: any): void {
        this.dispatchEventResp(SprotoGameReady.Name, { code: 1, msg: "" });
    }

    /**
     * 离开房间请求
     */
    onLeaveRoom(_data: any): void {
        this.dispatchEventResp(SprotoLeaveRoom.Name, { code: 1, msg: "" });
    }

    /**
     * 房主开始游戏请求
     */
    onOwnerStartGame(_data: any): void {
        this.dispatchEventResp(SprotoOwnerStartGame.Name, { code: 1, msg: "", notReadyUserids: [] });
    }

    // ============================================
    // 游戏流程
    // ============================================

    /**
     * 开始一局游戏
     */
    startStepGame(): void {
        this._startTime = Date.now();
        this._roundNum++;
        this._eliminated = 0;
        this._comboCount = 0;
        this._lastRemoveTime = 0;
        this._totalScore = 0;

        this.dispatchRoomInfo();
        this.dispatchEvent(SprotoGameStart.Name, {});
        this.dispatchEvent(SprotoStepId.Name, { step: 2 });

        // 下发自己的用户信息
        this.dispatchSelfPlayerInfo();

        // 生成地图并下发 mapData（内部会设置 shiftDir/shiftEdge）
        this.randomMap();

        // 下发游戏逻辑信息（含方块移动配置，需在 randomMap 之后取到配置）
        this.dispatchEvent(SprotoLogicInfo.Name, {
            playerCnt: 1,
            playingStepTime: 0,
            ext: JSON.stringify({ shiftDir: this._shiftDir, shiftEdge: this._shiftEdge }),
        });
    }

    /**
     * 下发本地玩家的用户信息（playerInfos + playerEnter）
     */
    dispatchSelfPlayerInfo(): void {
        const dc = DataCenter.instance;
        const userData = dc.userData;
        const selfSeat = 1;

        // 构造 PlayerInfo
        const playerInfo = {
            userid: dc.userid,
            nickname: userData?.nickname ?? "",
            headurl: dc.headurl,
            sex: userData?.sex ?? 0,
            province: userData?.province ?? "",
            city: userData?.city ?? "",
            ip: userData?.ip ?? "",
            status: 0,
            cp: 0,
            ext: "",
        };

        // 广播玩家信息列表
        this.dispatchEvent(SprotoPlayerInfos.Name, { infos: [playerInfo] });

        // 广播玩家进入
        this.dispatchEvent(SprotoPlayerEnter.Name, { userid: dc.userid, seat: selfSeat });
    }

    /**
     * 下发房间信息（本地模式在每局开始时发送）
     * gameData 中的 itemEnabled 控制道具是否可用
     */
    dispatchRoomInfo(): void {
        const dc = DataCenter.instance;
        const gameData = JSON.stringify({
            itemEnabled: true,
        });

        this.dispatchEvent(SprotoRoomInfo.Name, {
            gameid: MAIN_GAME_ID,
            roomid: 0,
            playerids: [dc.userid],
            gameData: gameData,
            shortRoomid: 0,
            owner: dc.userid,
        });
    }

    /**
     * 生成地图并广播
     * 闯关模式：使用关卡配置的地图模板 + 图标类型数生成
     * 单机模式：从配置表随机选取设计生成
     */
    randomMap(): void {
        let map: number[][] = [];
        let totalTime = 0;

        if (this._mode === LOCAL_SVR_MODE.CHALLENGE && this._challengeConfig) {
            const cfg = this._challengeConfig;
            totalTime = cfg.totalTime || 0;
            map = generateFromDesign(cfg.map, cfg.map.length, cfg.map[0].length, cfg.iconTypes);
            // 读取关卡配置的方块移动配置（缺省关闭）
            this._shiftDir = cfg.shiftDir ?? SHIFT_DIR.OFF;
            this._shiftEdge = cfg.shiftEdge ?? 2;
        } else {
            const result = generateRandomMap();
            map = result.map;
            totalTime = result.design.totalTime || 0;
            // 读取设计模板的方块移动配置（缺省关闭）
            this._shiftDir = result.design.shiftDir ?? SHIFT_DIR.OFF;
            this._shiftEdge = result.design.shiftEdge ?? 2;
        }

        // 保存当前地图的总时间
        this._totalTime = totalTime;

        // 扩展为 16×10，底部 6 行补零（超出地图设计范围默认隐藏）
        const mapLength = map ? map.length : 0;
        for (let row = mapLength; row < this._rows; row++) {
            map[row] = new Array(this._cols).fill(0);
        }

        // 保存到服务器端状态
        this._map = map;

        // 统计可消除方块总数并记录有效位置（排除障碍物：值 >= 100）
        this._validPositions = [];
        let totalBlocks = 0;
        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const val = map[row][col];
                if (val > 0 && val < LocalSvr.DECORATION_VALUE) {
                    totalBlocks++;
                    this._validPositions.push({ row, col });
                }
            }
        }
        this._totalBlocks = totalBlocks;

        // 确保初始地图可消除，不可消除则自动打乱
        const didShuffle = this._ensureSolvable();
        if (didShuffle) {
            this.dispatchEvent(SprotoMapShuffled.Name, { seat: 1, reason: 1 });
        }
        this._dispatchMapData();

        // 启动时钟
        this._startClock();
    }

    /**
     * 根据剩余时间计算闯关星星数量
     * @returns 星星数 0-3
     */
    private _calculateStars(): number {
        if (!this._challengeConfig?.starTime || this._challengeConfig.starTime.length < 3) return 0;
        const starTime = this._challengeConfig.starTime;
        if (this._remainTime >= starTime[2]) return 3;
        if (this._remainTime >= starTime[1]) return 2;
        if (this._remainTime >= starTime[0]) return 1;
        return 0;
    }

    /**
     * 游戏完成处理
     */
    onGameFinished(): void {
        // 停止时钟
        this._stopClock();
        // TOTAL_TIME>0 时才下发时钟归零，隐藏客户端倒计时
        if (this._totalTime > 0) {
            this.dispatchEvent(SprotoGameClock.Name, { time: 0, seat: 1 });
        }

        const usedTime = Date.now() - this._startTime;
        const selfSeat = 1;

        let endType = 1;
        let rank = 1;

        if (this._mode === LOCAL_SVR_MODE.CHALLENGE && this._challengeConfig) {
            if (this._isTimeout) {
                endType = CHALLENGE_END_TYPE.FAIL;
                rank = 0;
            } else {
                const cfg = this._challengeConfig;
                const targetScore = cfg.targetScore ?? 0;
                if (cfg.type === CHALLENGE_LEVEL_TYPE.SCORING && this._totalScore < targetScore) {
                    endType = CHALLENGE_END_TYPE.FAIL;
                    rank = 0;
                } else {
                    endType = CHALLENGE_END_TYPE.SUCCESS;
                    rank = this._calculateStars();
                }
            }
        }

        // 下发游戏步骤 = END
        this.dispatchEvent(SprotoStepId.Name, { step: 3 });

        // 广播玩家完成
        this.dispatchEvent(SprotoPlayerFinished.Name, {
            seat: selfSeat,
            usedTime: usedTime,
            rank: rank,
        });

        // 广播游戏结束
        this.dispatchEvent(SprotoGameEnd.Name, {
            roundNum: this._roundNum,
            endTime: Date.now(),
            endType: endType,
            rankings: [
                {
                    seat: selfSeat,
                    usedTime: usedTime,
                    eliminated: this._eliminated,
                    rank: rank,
                    maxCombo: this._comboCount,
                },
            ],
            scores: [
                {
                    seat: selfSeat,
                    newScore: this._totalScore,
                    delta: this._totalScore,
                },
            ],
        });
    }

    // ============================================
    // 道具处理
    // ============================================

    /**
     * 处理打乱道具：收集剩余方块 → 随机重排 → 确保可解 → 下发新地图
     */
    handleUpset(itemId: number): void {
        this._shuffleRemainingTiles();
        this._ensureSolvable();

        const richNum = DataCenter.instance.getRichByType(itemId)?.richNums ?? 0;

        this.dispatchEventResp(SprotoUseItem.Name, { code: 1, msg: "", richNum: richNum });

        this.dispatchEvent(SprotoItemEffect.Name, {
            seat: 1,
            itemId: itemId,
            effect: "shuffle",
        });

        this.dispatchEvent(SprotoMapShuffled.Name, {
            seat: 1,
            reason: 1,
        });

        this._dispatchMapData();
    }

    /**
     * 处理自动消除道具：找到两个同类型且可连接的方块 → 直接消除
     */
    handleAutoRemove(itemId: number): void {
        const selfSeat = 1;

        let found: { row1: number; col1: number; row2: number; col2: number } | null = null;

        for (let row = 0; row < this._rows && !found; row++) {
            for (let col = 0; col < this._cols && !found; col++) {
                const type = this._map[row][col];
                if (type <= 0 || type >= LocalSvr.DECORATION_VALUE) continue;

                for (let r2 = row; r2 < this._rows && !found; r2++) {
                    const startCol = r2 === row ? col + 1 : 0;
                    for (let c2 = startCol; c2 < this._cols && !found; c2++) {
                        if (this._map[r2][c2] === type && this._canConnect(row, col, r2, c2)) {
                            found = { row1: row, col1: col, row2: r2, col2: c2 };
                        }
                    }
                }
            }
        }

        if (found) {
            const richNum = DataCenter.instance.getRichByType(itemId)?.richNums ?? 0;

            this.dispatchEventResp(SprotoUseItem.Name, { code: 1, msg: "", richNum: richNum });

            this.dispatchEvent(SprotoItemEffect.Name, {
                seat: selfSeat,
                itemId: itemId,
                effect: "autoRemove",
            });

            this.onClickTiles({ row1: found.row1, col1: found.col1, row2: found.row2, col2: found.col2 });
        } else {
            this.dispatchEventResp(SprotoUseItem.Name, { code: 0, msg: "没有可消除的方块对", richNum: 0 });
        }
    }

    // ============================================
    // 路径判定（独立实现，不依赖游戏区 PathFinder）
    // ============================================

    /**
     * 判断指定位置是否可通过（空格）
     * 越界不可通过，值为 0 可通过
     */
    private _isPassable(row: number, col: number): boolean {
        if (row < 0 || row >= this._rows || col < 0 || col >= this._cols) return false;
        return this._map[row][col] === 0;
    }

    /**
     * 判断同行或同列两点之间的直线是否全空（不含端点）
     */
    private _isLineClear(r1: number, c1: number, r2: number, c2: number): boolean {
        if (r1 === r2) {
            const minC = Math.min(c1, c2);
            const maxC = Math.max(c1, c2);
            for (let c = minC + 1; c < maxC; c++) {
                if (!this._isPassable(r1, c)) return false;
            }
            return true;
        }
        if (c1 === c2) {
            const minR = Math.min(r1, r2);
            const maxR = Math.max(r1, r2);
            for (let r = minR + 1; r < maxR; r++) {
                if (!this._isPassable(r, c1)) return false;
            }
            return true;
        }
        return false;
    }

    /**
     * 0 拐连接：同行或同列且直线全空
     */
    private _canConnect0Turn(r1: number, c1: number, r2: number, c2: number): boolean {
        if (r1 !== r2 && c1 !== c2) return false;
        return this._isLineClear(r1, c1, r2, c2);
    }

    /**
     * 1 拐连接：L 形，拐角处必须可通过
     */
    private _canConnect1Turn(r1: number, c1: number, r2: number, c2: number): boolean {
        if (this._isPassable(r1, c2) && this._isLineClear(r1, c1, r1, c2) && this._isLineClear(r1, c2, r2, c2)) return true;
        if (this._isPassable(r2, c1) && this._isLineClear(r1, c1, r2, c1) && this._isLineClear(r2, c1, r2, c2)) return true;
        return false;
    }

    /**
     * 2 拐连接：Z/U 形，扫描所有行和列找两个拐点
     */
    private _canConnect2Turn(r1: number, c1: number, r2: number, c2: number): boolean {
        // 扫描所有行：在列 c1 拐第一次，在列 c2 拐第二次
        for (let r = 0; r < this._rows; r++) {
            if (
                this._isPassable(r, c1) &&
                this._isPassable(r, c2) &&
                this._isLineClear(r1, c1, r, c1) &&
                this._isLineClear(r, c1, r, c2) &&
                this._isLineClear(r, c2, r2, c2)
            )
                return true;
        }
        // 扫描所有列：在行 r1 拐第一次，在行 r2 拐第二次
        for (let c = 0; c < this._cols; c++) {
            if (
                this._isPassable(r1, c) &&
                this._isPassable(r2, c) &&
                this._isLineClear(r1, c1, r1, c) &&
                this._isLineClear(r1, c, r2, c) &&
                this._isLineClear(r2, c, r2, c2)
            )
                return true;
        }
        return false;
    }

    /**
     * 判断两个位置是否可以连接（最多 2 拐）
     */
    private _canConnect(r1: number, c1: number, r2: number, c2: number): boolean {
        return this._canConnect0Turn(r1, c1, r2, c2) || this._canConnect1Turn(r1, c1, r2, c2) || this._canConnect2Turn(r1, c1, r2, c2);
    }

    /**
     * 构建两点之间的连接路径线段（用于 tilesRemoved 的 lines 字段）
     * @returns LineSegment 数组，按顺序从 p1 连到 p2
     */
    private _buildConnectionLines(
        r1: number,
        c1: number,
        r2: number,
        c2: number
    ): { start: { row: number; col: number }; dest: { row: number; col: number } }[] {
        const p = (r: number, c: number) => ({ row: r, col: c });

        // 0 拐：直线直连
        if (this._canConnect0Turn(r1, c1, r2, c2)) {
            return [{ start: p(r1, c1), dest: p(r2, c2) }];
        }

        // 1 拐：L 形，拐角 (r1,c2) 或 (r2,c1)
        if (this._isPassable(r1, c2) && this._isLineClear(r1, c1, r1, c2) && this._isLineClear(r1, c2, r2, c2)) {
            return [
                { start: p(r1, c1), dest: p(r1, c2) },
                { start: p(r1, c2), dest: p(r2, c2) },
            ];
        }
        if (this._isPassable(r2, c1) && this._isLineClear(r1, c1, r2, c1) && this._isLineClear(r2, c1, r2, c2)) {
            return [
                { start: p(r1, c1), dest: p(r2, c1) },
                { start: p(r2, c1), dest: p(r2, c2) },
            ];
        }

        // 2 拐：扫描行列找两个拐点
        for (let r = 0; r < this._rows; r++) {
            if (
                this._isPassable(r, c1) &&
                this._isPassable(r, c2) &&
                this._isLineClear(r1, c1, r, c1) &&
                this._isLineClear(r, c1, r, c2) &&
                this._isLineClear(r, c2, r2, c2)
            ) {
                return [
                    { start: p(r1, c1), dest: p(r, c1) },
                    { start: p(r, c1), dest: p(r, c2) },
                    { start: p(r, c2), dest: p(r2, c2) },
                ];
            }
        }
        for (let c = 0; c < this._cols; c++) {
            if (
                this._isPassable(r1, c) &&
                this._isPassable(r2, c) &&
                this._isLineClear(r1, c1, r1, c) &&
                this._isLineClear(r1, c, r2, c) &&
                this._isLineClear(r2, c, r2, c2)
            ) {
                return [
                    { start: p(r1, c1), dest: p(r1, c) },
                    { start: p(r1, c), dest: p(r2, c) },
                    { start: p(r2, c), dest: p(r2, c2) },
                ];
            }
        }

        return [];
    }

    // ============================================
    // 地图分析与自动打乱
    // ============================================

    /**
     * 判断当前地图是否存在至少一对可消除的方块
     */
    private _hasValidPair(): boolean {
        for (let r1 = 0; r1 < this._rows; r1++) {
            for (let c1 = 0; c1 < this._cols; c1++) {
                const v1 = this._map[r1][c1];
                if (v1 <= 0 || v1 >= LocalSvr.DECORATION_VALUE) continue;

                for (let r2 = r1; r2 < this._rows; r2++) {
                    const startC = r2 === r1 ? c1 + 1 : 0;
                    for (let c2 = startC; c2 < this._cols; c2++) {
                        if (this._map[r2][c2] === v1 && this._canConnect(r1, c1, r2, c2)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * 收集剩余方块值 → 洗牌 → 按原位置重新填入
     * 全图扫描收集：方块移动后可能已不在初始填充位（_validPositions），
     * 洗牌在移动后的地图上进行，方块在原位置就地随机排列
     */
    private _shuffleRemainingTiles(): void {
        // 收集所有剩余方块的值及所在位置
        const tiles: number[] = [];
        const positions: { row: number; col: number }[] = [];
        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const val = this._map[row][col];
                if (val > 0 && val < LocalSvr.DECORATION_VALUE) {
                    tiles.push(val);
                    positions.push({ row, col });
                }
            }
        }

        // Fisher-Yates 洗牌
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        // 重新填入原来的方块位置
        for (let i = 0; i < positions.length; i++) {
            const { row, col } = positions[i];
            this._map[row][col] = tiles[i];
        }
    }

    /**
     * 自动打乱直到出现可消除对（最多 100 次），返回是否发生了洗牌
     */
    private _ensureSolvable(): boolean {
        let attempts = 0;
        const maxAttempts = 100;
        let shuffled = false;

        while (!this._hasValidPair() && attempts < maxAttempts) {
            this._shuffleRemainingTiles();
            attempts++;
            shuffled = true;
        }

        return shuffled;
    }

    // ============================================
    // 时钟管理
    // ============================================

    /**
     * 启动服务器端时钟，每秒检查是否超时
     * 超时后强制结束游戏
     * TOTAL_TIME=0 表示不需要倒计时
     */
    private _startClock(): void {
        this._stopClock();
        this._remainTime = this._totalTime;
        this._isTimeout = false;

        // TOTAL_TIME=0 表示不需要倒计时，不下发协议
        if (this._totalTime <= 0) {
            return;
        }

        // 下发初始时钟，触发客户端显示倒计时
        this.dispatchEvent(SprotoGameClock.Name, { time: this._remainTime, seat: 1 });

        this._clockTimer = setInterval(() => {
            this._remainTime--;

            if (this._remainTime <= 0) {
                this._remainTime = 0;
                this._stopClock();
                this._onTimeout();
            }
        }, 1000);
    }

    /**
     * 停止服务器端时钟
     */
    private _stopClock(): void {
        if (this._clockTimer) {
            clearInterval(this._clockTimer);
            this._clockTimer = null;
        }
    }

    /**
     * 超时处理：强制结束游戏
     */
    private _onTimeout(): void {
        Logger.log("[LocalSvr] 游戏超时，强制结束");
        this._isTimeout = true;
        this.dispatchEvent(SprotoGameClock.Name, { time: 0, seat: 1 });
        this.onGameFinished();
    }

    /**
     * 下发当前地图数据给客户端
     */
    private _dispatchMapData(): void {
        const strMap = JSON.stringify(this._map);
        this.dispatchEvent(SprotoMapData.Name, {
            mapData: strMap,
            totalBlocks: this._totalBlocks,
            seat: 1,
            row: this._rows,
            col: this._cols,
        });
    }
}
