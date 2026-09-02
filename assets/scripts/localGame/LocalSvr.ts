/**
 * @file LocalSvr.ts
 * @description 算24点(10003)本地游戏模拟服务器（单机模式）：
 *              接管 GameSocketManager 本地模式下的协议收发，按服务端 game10003 logic.lua / room.lua /
 *              privateRoom.lua 的推送顺序与字段模拟联网游戏核心协议流程（进场推送、单局回合机
 *              START→PLAYING→END、提交判定、计分收尾），算法口径与联网模式完全一致
 * @category 本地单机
 */

import { AddEventListener, DispatchEvent, RemoveEventListener } from "@frameworks/Framework";
import { Logger } from "@frameworks/utils/Utils";
import { MAIN_GAME_ID } from "@datacenter/InterfaceConfig";
import { DataCenter } from "@datacenter/Datacenter";
import { validate } from "@game10003/logic/Expression";
import { deal } from "@game10003/logic/Solver";
import { GAME_STEP, END_TYPE, PLAYER_STATUS, STEP_TIME_LEN, DEFAULT_ROUND_TIME, NUMBER_RANGE } from "@game10003/logic/GameRoundConfig";
import {
    SprotoClientReady,
    SprotoGameReady,
    SprotoLeaveRoom,
    SprotoOwnerStartGame,
    SprotoVoteDisbandRoom,
    SprotoVoteDisbandResponse,
    SprotoForwardMessage,
    SprotoSubmitAnswer,
} from "../../types/protocol/game10003/c2s";
import {
    SprotoRoomInfo,
    SprotoPlayerInfos,
    SprotoPlayerEnter,
    SprotoGameStart,
    SprotoStepId,
    SprotoDealCards,
    SprotoGameClock,
    SprotoAnswerResult,
    SprotoGameEnd,
} from "../../types/protocol/game10003/s2c";

/**
 * @interface PLAYER_ROUND_PROGRESS
 * @description 单局玩家进度（对齐 logic.lua playerProgress 结构，单机只有座位1一名玩家）
 */
interface PLAYER_ROUND_PROGRESS {
    /** 座位号（单机恒为1） */
    seat: number;
    /** 是否已答对 */
    finished: boolean;
    /** 答对提交时间(ms) */
    submitTime: number;
    /** 答对算式 */
    expression: string;
    /** 排名（答对=1） */
    rank: number;
    /** 答对用时(ms)，未答对为 -1 */
    usedTime: number;
}

/**
 * @class LocalSvr
 * @description 本地游戏模拟服务器单例：C2S 监听/响应分发 + S2C 推送模拟（进场、单局回合机、结束收尾），
 *              回合机与计分口径对齐服务端 10003（logic.lua:77-198 阶段管理、310-427 提交与结束、
 *              490-511 秒级 tick 判定阶段超时；scoring.lua:84-110 私人房计分 playerCnt=1 形态）
 * @category 本地单机
 * @singleton 单例模式
 */
export class LocalSvr {
    /** 本机玩家座位号（逻辑座位与房间座位均为1，logic2room[1]=1） */
    private static readonly SELF_SEAT: number = 1;
    /** 回合机 tick 间隔（毫秒），对齐 room.lua:438 的 100ms 驱动 */
    private static readonly TICK_INTERVAL_MS: number = 100;
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

    // ============ 单局回合机状态（对齐 logic.lua） ============
    /** 当前局序号（场会话内从1递增；clientReady 重置场会话） */
    private _roundNum: number = 0;
    /** 场/关累计局分（对应私人房 totalScores[seat]，playerCnt=1 形态） */
    private _accumScore: number = 0;
    /** 本局4个发牌数字 */
    private _dealNumbers: number[] = [];
    /** 发牌推送时刻(ms)，用于 usedTime 计算（logic.lua:139-142） */
    private _dealStartMs: number = 0;
    /** 本局答题时限(秒)，开局时按模式配置确定（dealCards.timeLimit） */
    private _roundTimeLimit: number = DEFAULT_ROUND_TIME;
    /** 本局开始时间(epoch秒)（gameStart.startTime） */
    private _startTime: number = 0;
    /** 当前阶段ID */
    private _stepId: GAME_STEP = GAME_STEP.NONE;
    /** 阶段开始时间(epoch秒)，用于秒级超时判定 */
    private _stepBeginSec: number = 0;
    /** 本局结束类型 */
    private _endType: END_TYPE = END_TYPE.NONE;
    /** 本局玩家进度（座位1） */
    private _progress: PLAYER_ROUND_PROGRESS = LocalSvr.createProgress();
    /** 回合机 tick 定时器 */
    private _tickTimer: any = null;

    /**
     * @constructor
     * @description 私有构造函数（单例）
     */
    private constructor() {}

    /**
     * 启动本地服务器：注册所有 C2S 协议监听并启动回合机 tick
     */
    start(): void {
        // 先清理旧监听与定时器，确保多次调用不累积
        this.destroy();

        AddEventListener(SprotoClientReady.Name, this.onClientReady, this);
        AddEventListener(SprotoSubmitAnswer.Name, this.onSubmitAnswer, this);
        AddEventListener(SprotoGameReady.Name, this.onGameReady, this);
        AddEventListener(SprotoLeaveRoom.Name, this.onLeaveRoom, this);
        AddEventListener(SprotoOwnerStartGame.Name, this.onOwnerStartGame, this);
        AddEventListener(SprotoVoteDisbandRoom.Name, this.onVoteDisbandRoom, this);
        AddEventListener(SprotoVoteDisbandResponse.Name, this.onVoteDisbandResponse, this);
        AddEventListener(SprotoForwardMessage.Name, this.onForwardMessage, this);

        this._startTick();
    }

    /**
     * 销毁本地服务器：移除所有 C2S 监听并停止全部定时器
     */
    destroy(): void {
        RemoveEventListener(SprotoClientReady.Name, this.onClientReady);
        RemoveEventListener(SprotoSubmitAnswer.Name, this.onSubmitAnswer);
        RemoveEventListener(SprotoGameReady.Name, this.onGameReady);
        RemoveEventListener(SprotoLeaveRoom.Name, this.onLeaveRoom);
        RemoveEventListener(SprotoOwnerStartGame.Name, this.onOwnerStartGame);
        RemoveEventListener(SprotoVoteDisbandRoom.Name, this.onVoteDisbandRoom);
        RemoveEventListener(SprotoVoteDisbandResponse.Name, this.onVoteDisbandResponse);
        RemoveEventListener(SprotoForwardMessage.Name, this.onForwardMessage);

        this._stopTick();
    }

    /** 分发响应事件（"resp" + 协议名，供 GameSocketManager 本地分支的 c2s 回调使用） */
    dispatchEventResp(eventName: string, data?: any): void {
        DispatchEvent("resp" + eventName, data);
    }

    /** 分发广播事件（协议名，模拟服务器 S2C 推送） */
    dispatchEvent(eventName: string, data?: any): void {
        DispatchEvent(eventName, data);
    }

    // ============================================
    // C2S 协议处理
    // ============================================

    /**
     * 客户端就绪 → 重置场状态并推送进场与开局序列
     * 说明：每次 clientReady 视为一场新会话（重置 roundNum/累计分/时钟等跨场残留，避免串场）；
     *       单机模式一局结束即停，由 UI"再来一局"再次发 clientReady 开下一局
     */
    onClientReady(): void {
        this._resetSession();
        Logger.log("[LocalSvr] clientReady 进场，开始第1局");

        // 进场推送（顺序严格对齐 privateRoom.lua clientReady 流程：roomInfo→playerInfos→playerEnter）
        this.dispatchRoomInfo();
        this.dispatchSelfPlayerInfo();
        this.startStepGame();
    }

    /**
     * 提交算式：本地独立重校验（不信任客户端预校验），对齐 logic.lua:310-374
     * @param data 提交请求（expression 为算式字符串）
     */
    onSubmitAnswer(data: SprotoSubmitAnswer.Request): void {
        const exprStr = data && data.expression ? data.expression : "";

        // 三态错误之一：不在答题阶段
        if (this._stepId !== GAME_STEP.PLAYING) {
            this.dispatchEventResp(SprotoSubmitAnswer.Name, { code: 0, msg: "当前不在答题阶段", rank: 0 });
            return;
        }
        // 三态错误之二：玩家不在本局游戏中（单机座位恒在局内，防御性保留）
        if (!this._progress) {
            this.dispatchEventResp(SprotoSubmitAnswer.Name, { code: 0, msg: "玩家不在本局游戏中", rank: 0 });
            return;
        }
        // 三态错误之三：本局已答对，不能重复提交
        if (this._progress.finished) {
            this.dispatchEventResp(SprotoSubmitAnswer.Name, { code: 0, msg: "本局已答对，不能重复提交", rank: 0 });
            return;
        }

        // 校验：结果等于24且恰好使用本局发牌数字各一次（用本局 numbers，与服务端同口径）
        const checked = validate(exprStr, this._dealNumbers);
        if (!checked.ok) {
            Logger.log(`[LocalSvr] 提交错误: ${checked.msg}`);
            // 错误也广播 answerResult（correct=0）
            this.dispatchEvent(SprotoAnswerResult.Name, {
                seat: LocalSvr.SELF_SEAT,
                expression: exprStr,
                correct: 0,
                rank: 0,
            });
            this.dispatchEventResp(SprotoSubmitAnswer.Name, { code: 0, msg: checked.msg || "算式错误", rank: 0 });
            return;
        }

        // 答对：锁定本局，记录进度与用时
        const nowMs = Date.now();
        const progress = this._progress;
        progress.finished = true;
        progress.submitTime = nowMs;
        progress.expression = exprStr;
        progress.rank = 1;
        progress.usedTime = Math.max(0, nowMs - this._dealStartMs);
        this._endType = END_TYPE.WIN;

        // 广播正确提交
        this.dispatchEvent(SprotoAnswerResult.Name, {
            seat: LocalSvr.SELF_SEAT,
            expression: exprStr,
            correct: 1,
            rank: 1,
        });

        // 第一人答对直接结束本局：stopStep(PLAYING) → startStep(END)（推送 stepId{3} + gameEnd）
        this._startStep(GAME_STEP.END);

        // 响应在收尾推送之后返回（对齐 logic.lua 答对路径：广播→结束流程→return 响应）
        this.dispatchEventResp(SprotoSubmitAnswer.Name, { code: 1, msg: "回答正确", rank: 1 });
    }

    /**
     * 游戏准备请求（占位：单机无准备概念，直接成功）
     */
    onGameReady(_data: any): void {
        this.dispatchEventResp(SprotoGameReady.Name, { code: 1, msg: "" });
    }

    /**
     * 离开房间请求（占位：单机退出走场景切换，不依赖此协议）
     */
    onLeaveRoom(_data: any): void {
        this.dispatchEventResp(SprotoLeaveRoom.Name, { code: 1, msg: "" });
    }

    /**
     * 房主开始游戏请求（占位：非私人房拒绝，对齐 room.lua ownerStartGame 服务端同款文案）
     */
    onOwnerStartGame(_data: any): void {
        this.dispatchEventResp(SprotoOwnerStartGame.Name, { code: 0, msg: "非私人房间", notReadyUserids: [] });
    }

    /**
     * 发起投票解散请求（占位：非私人房拒绝）
     */
    onVoteDisbandRoom(_data: any): void {
        this.dispatchEventResp(SprotoVoteDisbandRoom.Name, { code: 0, msg: "非私人房间不支持投票解散" });
    }

    /**
     * 投票解散响应（占位：非私人房拒绝）
     */
    onVoteDisbandResponse(_data: any): void {
        this.dispatchEventResp(SprotoVoteDisbandResponse.Name, { code: 0, msg: "非私人房间不支持投票解散" });
    }

    /**
     * 消息转发请求（占位：单机默认无转发对象，直接成功）
     */
    onForwardMessage(_data: any): void {
        this.dispatchEventResp(SprotoForwardMessage.Name, { code: 1, msg: "success" });
    }

    // ============================================
    // 进场推送（§8.1）
    // ============================================

    /**
     * 下发房间信息：座位序 [自己]（本地单机只推自己一个玩家）
     */
    dispatchRoomInfo(): void {
        const dc = DataCenter.instance;
        this.dispatchEvent(SprotoRoomInfo.Name, {
            gameid: MAIN_GAME_ID,
            roomid: 0,
            playerids: [dc.userid],
            gameData: JSON.stringify({ robots: [], rule: "{}" }),
            shortRoomid: 0,
            owner: dc.userid,
        });
    }

    /**
     * 下发本地玩家的用户信息（playerInfos + playerEnter，状态置 PLAYING）
     * 与 10002 先例 dispatchSelfPlayerInfo 一致；必须 playerInfos 在前、playerEnter 在后
     * （playerEnter 是客户端座位映射的权威入口，先存玩家信息后建座位）
     */
    dispatchSelfPlayerInfo(): void {
        const dc = DataCenter.instance;
        const userData = dc.userData;

        // 构造玩家信息（字段与 s2c.ts PlayerInfo 一致）
        const playerInfo = {
            userid: dc.userid,
            nickname: userData?.nickname ?? "",
            headurl: dc.headurl,
            sex: userData?.sex ?? 0,
            province: userData?.province ?? "",
            city: userData?.city ?? "",
            ip: userData?.ip ?? "",
            status: PLAYER_STATUS.PLAYING,
            cp: 0,
            ext: "",
        };

        this.dispatchEvent(SprotoPlayerInfos.Name, { infos: [playerInfo] });
        this.dispatchEvent(SprotoPlayerEnter.Name, { userid: dc.userid, seat: LocalSvr.SELF_SEAT });
    }

    // ============================================
    // 单局回合机（§8.2/§8.3，对齐 logic.lua）
    // ============================================

    /**
     * 开始一局游戏：推送 gameStart → stepId{1} → dealCards 序列
     * 由 clientReady（单机每局开始）调用
     */
    startStepGame(): void {
        if (this._stepId !== GAME_STEP.NONE) {
            Logger.warn("[LocalSvr] 当前已有进行中的局，忽略 startStepGame");
            return;
        }
        this._startRound();
    }

    /**
     * 开启新一局：重置单局状态并发局（单机固定参数：30秒时限、1-9数字范围）
     * @private
     */
    private _startRound(): void {
        this._roundNum++;
        this._resetRoundState();

        // 本局答题时限固定 30 秒（config.lua ROUND_TIME）
        this._roundTimeLimit = DEFAULT_ROUND_TIME;

        // 本局开始时间（epoch秒）
        this._startTime = Math.floor(Date.now() / 1000);

        Logger.log(`[LocalSvr] 第${this._roundNum}局开始，时限${this._roundTimeLimit}秒，数字范围${NUMBER_RANGE.MIN}-${NUMBER_RANGE.MAX}`);

        // 开局推送：gameStart → stepId{1}（内部发牌）
        this.dispatchEvent(SprotoGameStart.Name, {
            roundNum: this._roundNum,
            startTime: this._startTime,
            brelink: 0,
        });
        this._startStep(GAME_STEP.START);
    }

    /**
     * 开始一个阶段：打点阶段开始时刻并推送 stepId，随后执行该阶段的进入动作
     * @param step 阶段ID
     * @private
     */
    private _startStep(step: GAME_STEP): void {
        this._stepBeginSec = Math.floor(Date.now() / 1000);
        this._stepId = step;

        this.dispatchEvent(SprotoStepId.Name, { step: step });

        if (step === GAME_STEP.START) {
            this._startStepStart();
        } else if (step === GAME_STEP.PLAYING) {
            this._startStepPlaying();
        } else if (step === GAME_STEP.END) {
            this._startStepEnd();
        }
    }

    /**
     * START 阶段进入动作：发牌并推送 dealCards（dealStartMs 此刻打点，供 usedTime 计算）
     * @private
     */
    private _startStepStart(): void {
        // 保证可解的4个数字（solver.deal 内部可解校验 + 预置兜底），范围 1-9
        this._dealNumbers = deal(NUMBER_RANGE.MIN, NUMBER_RANGE.MAX);
        this._dealStartMs = Date.now();

        this.dispatchEvent(SprotoDealCards.Name, {
            roundNum: this._roundNum,
            numbers: this._dealNumbers.slice(),
            timeLimit: this._roundTimeLimit,
            startTime: this._startTime,
        });
    }

    /**
     * PLAYING 阶段进入动作：推送一次 gameClock 倒计时（time=本局时限, seat=0）
     * 注：线上只在 PLAYING 开始时推一次，结束/超时不再推 time:0（以 logic.lua 为准）
     * @private
     */
    private _startStepPlaying(): void {
        this.dispatchEvent(SprotoGameClock.Name, { time: this._roundTimeLimit, seat: 0 });
    }

    /**
     * END 阶段进入动作：组装 rankings/scores 推送 gameEnd（对齐 logic.lua:376-427），
     * 推送后内部回 NONE（对齐 stopStepEnd：logic.lua:194-197）
     * @private
     */
    private _startStepEnd(): void {
        const progress = this._progress;
        const endTime = Math.floor(Date.now() / 1000);

        // 组装本局排名：答对者 rank>0（带算式/用时），未答对 usedTime=-1/rank=0/expression=""
        const rankings = [
            progress.finished
                ? { seat: LocalSvr.SELF_SEAT, expression: progress.expression, usedTime: progress.usedTime, rank: progress.rank }
                : { seat: LocalSvr.SELF_SEAT, expression: "", usedTime: -1, rank: 0 },
        ];

        // 计分：私人房 playerCnt=1 口径（scoring.lua:84-110）：答对 1 分、未答对 0 分，newScore=场/关累计
        const delta = progress.finished ? 1 : 0;
        this._accumScore += delta;
        const scores = [{ seat: LocalSvr.SELF_SEAT, newScore: this._accumScore, delta: delta }];

        Logger.log(`[LocalSvr] 第${this._roundNum}局结束 endType=${this._endType} 本局delta=${delta} 累计=${this._accumScore}`);

        this.dispatchEvent(SprotoGameEnd.Name, {
            roundNum: this._roundNum,
            endTime: endTime,
            endType: this._endType,
            rankings: rankings,
            scores: scores,
        });

        // END 阶段收尾：内部回 NONE（不推送）
        this._stepId = GAME_STEP.NONE;
        this._stepBeginSec = 0;
    }

    // ============================================
    // 回合机 tick（秒级阶段超时判定，对齐 logic.lua:490-511）
    // ============================================

    /**
     * 启动回合机 tick（100ms），复刻服务端 logicHandler.update 的阶段推进
     * @private
     */
    private _startTick(): void {
        this._stopTick();
        this._tickTimer = setInterval(() => {
            this._update();
        }, LocalSvr.TICK_INTERVAL_MS);
    }

    /**
     * 停止回合机 tick
     * @private
     */
    private _stopTick(): void {
        if (this._tickTimer) {
            clearInterval(this._tickTimer);
            this._tickTimer = null;
        }
    }

    /**
     * tick 推进：START/PLAYING 阶段按 epoch 秒差判定超时（对齐 logic.lua update 的 os.time 口径）
     * @private
     */
    private _update(): void {
        const step = this._stepId;
        if (step !== GAME_STEP.START && step !== GAME_STEP.PLAYING) {
            return;
        }
        const elapsedSec = Math.floor(Date.now() / 1000) - this._stepBeginSec;
        if (elapsedSec >= this._getStepTimeLen(step)) {
            this._onStepTimeout(step);
        }
    }

    /**
     * 获取指定阶段时长（秒）：START 固定1秒（configLogic.lua:18-23），PLAYING 取本局时限
     * @param step 阶段ID
     * @returns 阶段时长（秒）
     * @private
     */
    private _getStepTimeLen(step: GAME_STEP): number {
        if (step === GAME_STEP.START) {
            return STEP_TIME_LEN[GAME_STEP.START];
        }
        if (step === GAME_STEP.PLAYING) {
            return this._roundTimeLimit;
        }
        return 0;
    }

    /**
     * 阶段超时处理：START 超时 → 进入 PLAYING；PLAYING 超时 → 置超时收尾并进入 END
     * @param step 超时的阶段ID
     * @private
     */
    private _onStepTimeout(step: GAME_STEP): void {
        if (step === GAME_STEP.START) {
            // 停 START 进入 PLAYING（推送 stepId{2} + gameClock）
            this._startStep(GAME_STEP.PLAYING);
        } else if (step === GAME_STEP.PLAYING) {
            Logger.log("[LocalSvr] 答题超时，无人答对，本局结束");
            this._endType = END_TYPE.TIMEOUT;
            this._startStep(GAME_STEP.END);
        }
    }

    // ============================================
    // 状态重置
    // ============================================

    /**
     * 重置场会话状态（跨场残留清零：局序号/累计分/本局数字/阶段/时钟）
     * @private
     */
    private _resetSession(): void {
        this._roundNum = 0;
        this._accumScore = 0;
        this._resetRoundState();
    }

    /**
     * 重置单局状态（每局开局调用）
     * @private
     */
    private _resetRoundState(): void {
        this._dealNumbers = [];
        this._dealStartMs = 0;
        this._roundTimeLimit = DEFAULT_ROUND_TIME;
        this._startTime = 0;
        this._stepId = GAME_STEP.NONE;
        this._stepBeginSec = 0;
        this._endType = END_TYPE.NONE;
        this._progress = LocalSvr.createProgress();
    }

    /**
     * 创建空的本局玩家进度（座位1，未答对）
     * @returns 初始进度对象
     * @private
     */
    private static createProgress(): PLAYER_ROUND_PROGRESS {
        return {
            seat: LocalSvr.SELF_SEAT,
            finished: false,
            submitTime: 0,
            expression: "",
            rank: 0,
            usedTime: -1,
        };
    }
}
