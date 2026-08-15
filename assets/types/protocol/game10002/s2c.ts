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
    outhand: number[];
    win: number;
    startTime: number;
    endTime: number;
    round: number;
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

/** 坐标结构 */
export interface Point {
    row: number;
    col: number;
}

/** 线段结构（路径） */
export interface LineSegment {
    start: Point;
    dest: Point;
}

/** 游戏结束 */
export interface RankingInfo {
    seat: number;
    usedTime: number;
    eliminated: number;
    rank: number;
    maxCombo: number;
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

/** 聊天消息 - 请求参数 */
export interface TalkRequest {
    from: number;
    id: number;
}

/** 游戏开始 - 请求参数 */
export interface GamestartRequest {
    roundNum: number;
    startTime: number;
    brelink: number;
}

/** 游戏阶段ID (参考10001) - 请求参数 */
export interface StepidRequest {
    step: number;
}

/** 方块消除成功通知 - 请求参数 */
export interface TilesremovedRequest {
    code: number;
    p1: Point;
    p2: Point;
    lines: LineSegment[];
    eliminated: number;
    remaining: number;
    seat: number;
    score: number;
    totalScore: number;
}

/** 玩家完成游戏 - 请求参数 */
export interface PlayerfinishedRequest {
    seat: number;
    usedTime: number;
    rank: number;
}

/** gameEnd 协议请求参数 - 请求参数 */
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

/** 道具效果通知 (预留) - 请求参数 */
export interface ItemeffectRequest {
    seat: number;
    itemId: number;
    effect: string;
}

/** 游戏进度更新 (广播给所有人看其他人的进度) - 请求参数 */
export interface ProgressupdateRequest {
    seat: number;
    eliminated: number;
    remaining: number;
    percentage: number;
    finished: number;
    usedTime: number;
}

/** 地图数据 - 请求参数 */
export interface MapdataRequest {
    mapData: string;
    totalBlocks: number;
    seat: number;
    col: number;
    row: number;
}

/** 游戏逻辑信息 - 请求参数 */
export interface LogicinfoRequest {
    playerCnt: number;
    playingStepTime: number;
    ext: string;
}

/** 地图打乱/重新生成通知 - 请求参数 */
export interface MapshuffledRequest {
    seat: number;
    reason: number;
}

/** 连击成功通知 - 请求参数 */
export interface CombosuccessRequest {
    seat: number;
    comboCount: number;
    comboTime: number;
    comboDuration: number;
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

export namespace SprotoTalk {
    export const Name = "talk";
    export type Request = TalkRequest;
    export type Response = undefined;  // talk 协议没有响应参数
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

export namespace SprotoTilesRemoved {
    export const Name = "tilesRemoved";
    export type Request = TilesremovedRequest;
    export type Response = undefined;  // tilesRemoved 协议没有响应参数
}

export namespace SprotoPlayerFinished {
    export const Name = "playerFinished";
    export type Request = PlayerfinishedRequest;
    export type Response = undefined;  // playerFinished 协议没有响应参数
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

export namespace SprotoItemEffect {
    export const Name = "itemEffect";
    export type Request = ItemeffectRequest;
    export type Response = undefined;  // itemEffect 协议没有响应参数
}

export namespace SprotoProgressUpdate {
    export const Name = "progressUpdate";
    export type Request = ProgressupdateRequest;
    export type Response = undefined;  // progressUpdate 协议没有响应参数
}

export namespace SprotoMapData {
    export const Name = "mapData";
    export type Request = MapdataRequest;
    export type Response = undefined;  // mapData 协议没有响应参数
}

export namespace SprotoLogicInfo {
    export const Name = "logicInfo";
    export type Request = LogicinfoRequest;
    export type Response = undefined;  // logicInfo 协议没有响应参数
}

export namespace SprotoMapShuffled {
    export const Name = "mapShuffled";
    export type Request = MapshuffledRequest;
    export type Response = undefined;  // mapShuffled 协议没有响应参数
}

export namespace SprotoComboSuccess {
    export const Name = "comboSuccess";
    export type Request = CombosuccessRequest;
    export type Response = undefined;  // comboSuccess 协议没有响应参数
}
