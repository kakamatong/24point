/**
 * @file GameRoundConfig.ts
 * @description 算24点(10003)单局回合配置常量：游戏阶段/阶段时长/结束类型/玩家状态/目标值/发牌数/数字范围等，
 *              数值来源为服务端 game10003 configLogic.lua 与 config.lua（逐项标注），单机 LocalSvr 与 Solver 共用
 * @category 游戏 10003
 */

/**
 * @enum GAME_STEP
 * @description 游戏阶段枚举（来源：configLogic.lua config.GAME_STEP；gameEnd 的 stepId 推送值即此值）
 */
export enum GAME_STEP {
    /** 无阶段 */
    NONE = 0,
    /** 开始阶段：1秒，本阶段发牌 */
    START = 1,
    /** 答题阶段：玩家提交算式，第一个答对者直接结束本局 */
    PLAYING = 2,
    /** 结算阶段 */
    END = 3,
}

/**
 * @enum END_TYPE
 * @description 本局结束类型（来源：configLogic.lua config.END_TYPE；gameEnd.endType 字段取值）
 */
export enum END_TYPE {
    /** 无 */
    NONE = 0,
    /** 有人答对，本局正常结束 */
    WIN = 1,
    /** 超时无人答对 */
    TIMEOUT = 2,
    /** 房间解散（单机不产生，保留与服务端枚举对齐） */
    DISBAND = 4,
}

/**
 * @enum PLAYER_STATUS
 * @description 玩家状态（来源：configLogic.lua config.PLAYER_STATUS；
 *              与客户端 games/game10003/data/InterfaceGameConfig.ts PLAYER_STATUS 前5档取值一致）
 */
export enum PLAYER_STATUS {
    /** 加载中 */
    LOADING = 1,
    /** 离线 */
    OFFLINE = 2,
    /** 在线 */
    ONLINE = 3,
    /** 游戏中 */
    PLAYING = 4,
    /** 已准备 */
    READY = 5,
    /** 已完成（本局答对后置，服务端状态机使用） */
    FINISHED = 6,
}

/**
 * @property {number} TARGET_VALUE - 目标值（来源：configLogic.lua config.TARGET_VALUE = 24）
 */
export const TARGET_VALUE: number = 24;

/**
 * @property {number} DEAL_COUNT - 每局发牌数量（来源：configLogic.lua config.DEAL_COUNT = 4）
 */
export const DEAL_COUNT: number = 4;

/**
 * @property {number} DEFAULT_ROUND_TIME - 每局答题时限默认30秒（来源：config.lua config.ROUND_TIME = 30；
 *              即 PLAYING 阶段时长，logic.lua:233-238 开局时按 rule.maxTime 覆盖）
 */
export const DEFAULT_ROUND_TIME: number = 30;

/**
 * @property {Record<number, number>} STEP_TIME_LEN - 各阶段时长（秒，来源：configLogic.lua config.STEP_TIME_LEN；
 *              START=1 固定；PLAYING 此处为默认值30，单局实际时限在开局时按 rule.maxTime 覆盖；END=0 不触发超时）
 */
export const STEP_TIME_LEN: Record<number, number> = {
    [GAME_STEP.START]: 1,
    [GAME_STEP.PLAYING]: DEFAULT_ROUND_TIME,
    [GAME_STEP.END]: 0,
};

/**
 * @property {Record<string, number>} NUMBER_RANGE - 发牌数字范围（来源：config.lua config.NUMBER_RANGE，MIN=1 MAX=9）
 */
export const NUMBER_RANGE: { MIN: number; MAX: number } = {
    MIN: 1,
    MAX: 9,
};
