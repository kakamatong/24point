// Auto-generated from sproto files
// Do not edit manually

/** 玩家信息结构 */
export interface PlayerInfo {
    userid: number;
    nickname: string;
    headurl: string;
    sex: number;
    province: string;
    city: string;
    ip: string;
    status: number;
    cp: number;
    ext: string;
}

/** 投票信息结构 */
export interface VoteInfo {
    userid: number;
    vote: number;
}

/** 私人房对战记录 */
export interface Record {
    index: number;
    startTime: number;
    endTime: number;
    round: number;
    ext: string;
}

/** 总结算信息 */
export interface TotalResultInfo {
    seat: number;
    userid: number;
    score: number;
    win: number;
    lose: number;
    draw: number;
    rank: number;
    ext: string;
}

/** 排名信息 */
export interface RankingInfo {
    seat: number;
    expression: string;
    usedTime: number;
    rank: number;
}

/** 分数信息 */
export interface ScoreInfo {
    seat: number;
    newScore: number;
    delta: number;
}

/** 服务器消息 - 请求参数 */
export interface SvrmsgRequest {
    type: string;
    data: string;
}

/** 房间信息 - 请求参数 */
export interface RoominfoRequest {
    gameid: number;
    roomid: number;
    playerids: number[];
    gameData: string;
    shortRoomid: number;
    owner: number;
}

/** 房间结束 - 请求参数 */
export interface RoomendRequest {
    code: number;
}

/** 玩家信息列表 - 请求参数 */
export interface PlayerinfosRequest {
    infos: PlayerInfo[];
}

/** 玩家加入 - 请求参数 */
export interface PlayerenterRequest {
    userid: number;
    seat: number;
}

/** 玩家状态更新 - 请求参数 */
export interface PlayerstatusupdateRequest {
    userid: number;
    status: number;
}

/** 玩家离开 - 请求参数 */
export interface PlayerleaveRequest {
    userid: number;
    seat: number;
}

/** 投票解散开始 - 请求参数 */
export interface VotedisbandstartRequest {
    voteId: number;
    initiator: number;
    reason: string;
    timeLeft: number;
    playerCount: number;
    needAgreeCount: number;
}

/** 投票状态更新 - 请求参数 */
export interface VotedisbandupdateRequest {
    voteId: number;
    votes: VoteInfo[];
    agreeCount: number;
    refuseCount: number;
    timeLeft: number;
}

/** 投票解散结果 - 请求参数 */
export interface VotedisbandresultRequest {
    voteId: number;
    result: number;
    reason: string;
    agreeCount: number;
    refuseCount: number;
    votes: VoteInfo[];
}

/** 游戏时钟 - 请求参数 */
export interface GameclockRequest {
    time: number;
    seat: number;
}

/** 私人房信息 - 请求参数 */
export interface PrivateinfoRequest {
    nowCnt: number;
    maxCnt: number;
    ext: string;
}

/** gameRecord 协议请求参数 - 请求参数 */
export interface GamerecordRequest {
    record: Record[];
}

/** 私人房总结算 - 请求参数 */
export interface TotalresultRequest {
    startTime: number;
    endTime: number;
    shortRoomid: number;
    roomid: number;
    owner: number;
    rule: string;
    playCnt: number;
    maxCnt: number;
    totalResultInfo: TotalResultInfo[];
}

/** 消息转发 - 请求参数 */
export interface ForwardmessageRequest {
    type: number;
    from: number;
    msg: string;
}

/** 游戏开始 - 请求参数 */
export interface GamestartRequest {
    roundNum: number;
    startTime: number;
    brelink: number;
}

/** 游戏阶段ID - 请求参数 */
export interface StepidRequest {
    step: number;
}

/** 发牌：本局4个数字 - 请求参数 */
export interface DealcardsRequest {
    roundNum: number;
    numbers: number[];
    timeLimit: number;
    startTime: number;
}

/** 提交结果广播（正确/错误都广播给所有玩家） - 请求参数 */
export interface AnswerresultRequest {
    seat: number;
    expression: string;
    correct: number;
    rank: number;
}

/** 游戏结束 - 请求参数 */
export interface GameendRequest {
    roundNum: number;
    endTime: number;
    endType: number;
    rankings: RankingInfo[];
    scores: ScoreInfo[];
}

/** 游戏重连恢复 - 请求参数 */
export interface GamerelinkRequest {
    startTime: number;
}

export namespace SprotoSvrMsg {
    export const Name = "svrMsg";
    export type Request = SvrmsgRequest;
    export type Response = undefined;  // svrMsg 协议没有响应参数
}

export namespace SprotoRoomInfo {
    export const Name = "roomInfo";
    export type Request = RoominfoRequest;
    export type Response = undefined;  // roomInfo 协议没有响应参数
}

export namespace SprotoRoomEnd {
    export const Name = "roomEnd";
    export type Request = RoomendRequest;
    export type Response = undefined;  // roomEnd 协议没有响应参数
}

export namespace SprotoPlayerInfos {
    export const Name = "playerInfos";
    export type Request = PlayerinfosRequest;
    export type Response = undefined;  // playerInfos 协议没有响应参数
}

export namespace SprotoPlayerEnter {
    export const Name = "playerEnter";
    export type Request = PlayerenterRequest;
    export type Response = undefined;  // playerEnter 协议没有响应参数
}

export namespace SprotoPlayerStatusUpdate {
    export const Name = "playerStatusUpdate";
    export type Request = PlayerstatusupdateRequest;
    export type Response = undefined;  // playerStatusUpdate 协议没有响应参数
}

export namespace SprotoPlayerLeave {
    export const Name = "playerLeave";
    export type Request = PlayerleaveRequest;
    export type Response = undefined;  // playerLeave 协议没有响应参数
}

export namespace SprotoVoteDisbandStart {
    export const Name = "voteDisbandStart";
    export type Request = VotedisbandstartRequest;
    export type Response = undefined;  // voteDisbandStart 协议没有响应参数
}

export namespace SprotoVoteDisbandUpdate {
    export const Name = "voteDisbandUpdate";
    export type Request = VotedisbandupdateRequest;
    export type Response = undefined;  // voteDisbandUpdate 协议没有响应参数
}

export namespace SprotoVoteDisbandResult {
    export const Name = "voteDisbandResult";
    export type Request = VotedisbandresultRequest;
    export type Response = undefined;  // voteDisbandResult 协议没有响应参数
}

export namespace SprotoGameClock {
    export const Name = "gameClock";
    export type Request = GameclockRequest;
    export type Response = undefined;  // gameClock 协议没有响应参数
}

export namespace SprotoPrivateInfo {
    export const Name = "privateInfo";
    export type Request = PrivateinfoRequest;
    export type Response = undefined;  // privateInfo 协议没有响应参数
}

export namespace SprotoGameRecord {
    export const Name = "gameRecord";
    export type Request = GamerecordRequest;
    export type Response = undefined;  // gameRecord 协议没有响应参数
}

export namespace SprotoTotalResult {
    export const Name = "totalResult";
    export type Request = TotalresultRequest;
    export type Response = undefined;  // totalResult 协议没有响应参数
}

export namespace SprotoForwardMessage {
    export const Name = "forwardMessage";
    export type Request = ForwardmessageRequest;
    export type Response = undefined;  // forwardMessage 协议没有响应参数
}

export namespace SprotoGameStart {
    export const Name = "gameStart";
    export type Request = GamestartRequest;
    export type Response = undefined;  // gameStart 协议没有响应参数
}

export namespace SprotoStepId {
    export const Name = "stepId";
    export type Request = StepidRequest;
    export type Response = undefined;  // stepId 协议没有响应参数
}

export namespace SprotoDealCards {
    export const Name = "dealCards";
    export type Request = DealcardsRequest;
    export type Response = undefined;  // dealCards 协议没有响应参数
}

export namespace SprotoAnswerResult {
    export const Name = "answerResult";
    export type Request = AnswerresultRequest;
    export type Response = undefined;  // answerResult 协议没有响应参数
}

export namespace SprotoGameEnd {
    export const Name = "gameEnd";
    export type Request = GameendRequest;
    export type Response = undefined;  // gameEnd 协议没有响应参数
}

export namespace SprotoGameRelink {
    export const Name = "gameRelink";
    export type Request = GamerelinkRequest;
    export type Response = undefined;  // gameRelink 协议没有响应参数
}
