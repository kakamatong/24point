// Auto-generated from sproto files
// Do not edit manually

/** 奖励通知 */
export interface AwardNotice {
    id: number;
    userid: number;
    status: number;
    awardMessage: string;
    create_at: string;
}

/** ChallengeLevelData 结构体定义 */
export interface ChallengeLevelData {
    chapter: number;
    level: number;
    isGet: number;
    stars: number;
    scoreMax: number;
    challengeCount: number;
}

/** 调用接口 - 请求参数 */
export interface CallRequest {
    serverName: string;
    moduleName: string;
    funcName: string;
    args: string;
}

/** 调用接口 - 响应参数 */
export interface CallResponse {
    code: number;
    result: string;
}

/** 用户数据 - 请求参数 */
export interface UserdataRequest {
    userid: number;
}

/** 用户数据 - 响应参数 */
export interface UserdataResponse {
    nickname: string;
    headurl: string;
    sex: number;
    province: string;
    city: string;
    ip: string;
    ext: string;
}

/** 用户财富 - 响应参数 */
export interface UserrichesResponse {
    richType: number[];
    richNums: number[];
}

/** 用户状态 - 请求参数 */
export interface UserstatusRequest {
    userid: number;
}

/** 用户状态 - 响应参数 */
export interface UserstatusResponse {
    status: number;
    gameid: number;
    shortRoomid: number;
    roomid: string;
    addr: string;
    gatewayUrl: string;
}

/** 加入匹配 - 请求参数 */
export interface MatchjoinRequest {
    gameid: number;
    queueid: number;
}

/** 加入匹配 - 响应参数 */
export interface MatchjoinResponse {
    code: number;
    msg: string;
    gameid: number;
    shortRoomid: number;
    roomid: string;
    addr: string;
    gatewayUrl: string;
}

/** 退出匹配 - 请求参数 */
export interface MatchleaveRequest {
    gameid: number;
    queueid: number;
}

/** 退出匹配 - 响应参数 */
export interface MatchleaveResponse {
    code: number;
    msg: string;
}

/** 匹配确认 - 请求参数 */
export interface MatchonsureRequest {
    id: number;
    sure: boolean;
}

/** 匹配确认 - 响应参数 */
export interface MatchonsureResponse {
    code: number;
    msg: string;
}

/** 调用活动接口 - 请求参数 */
export interface CallactivityfuncRequest {
    moduleName: string;
    funcName: string;
    args: string;
}

/** 调用活动接口 - 响应参数 */
export interface CallactivityfuncResponse {
    code: number;
    result: string;
}

/** 开启测试模式 - 请求参数 */
export interface MatchteststartRequest {
    code: number;
}

/** 开启测试模式 - 响应参数 */
export interface MatchteststartResponse {
    code: number;
    msg: string;
}

/** 关闭测试模式 - 请求参数 */
export interface MatchteststopRequest {
    code: number;
}

/** 关闭测试模式 - 响应参数 */
export interface MatchteststopResponse {
    code: number;
    msg: string;
}

/** 获取奖励通知 - 请求参数 */
export interface GetawardnoticeRequest {
    userid: number;
}

/** 获取奖励通知 - 响应参数 */
export interface GetawardnoticeResponse {
    list: AwardNotice[];
}

/** 设置奖励通知已读 - 请求参数 */
export interface SetawardnoticereadRequest {
    id: number;
}

/** 加入私有房间 - 请求参数 */
export interface JoinprivateroomRequest {
    shortRoomid: number;
}

/** 加入私有房间 - 响应参数 */
export interface JoinprivateroomResponse {
    code: number;
    msg: string;
    gameid: number;
    roomid: string;
    addr: string;
    rule: string;
    shortRoomid: number;
    gatewayUrl: string;
}

/** 创建私有房间 - 请求参数 */
export interface CreateprivateroomRequest {
    gameid: number;
    rule: string;
}

/** 创建私有房间 - 响应参数 */
export interface CreateprivateroomResponse {
    code: number;
    msg: string;
    gameid: number;
    shortRoomid: number;
    roomid: string;
    addr: string;
    rule: string;
    gatewayUrl: string;
}

/** 获取用户游戏记录 - 请求参数 */
export interface UsergamerecordRequest {
    userid: number;
    gameid: number;
}

/** 获取用户游戏记录 - 响应参数 */
export interface UsergamerecordResponse {
    gameid: number;
    win: number;
    lose: number;
    draw: number;
}

/** 更新昵称和头像 - 请求参数 */
export interface UpdateusernameandheadurlRequest {
    nickname: string;
    headurl: string;
}

/** 更新昵称和头像 - 响应参数 */
export interface UpdateusernameandheadurlResponse {
    code: number;
}

/** 注销 - 请求参数 */
export interface RevokeaccRequest {
    loginType: string;
}

/** 注销 - 响应参数 */
export interface RevokeaccResponse {
    code: number;
    msg: string;
}

/** 取消注销 - 请求参数 */
export interface CancelrevokeaccRequest {
    loginType: string;
}

/** 取消注销 - 响应参数 */
export interface CancelrevokeaccResponse {
    code: number;
    msg: string;
}

/** 本地游戏使用道具 - 请求参数 */
export interface LocalgameusepropsRequest {
    richType: number;
    richNums: number;
}

/** 本地游戏使用道具 - 响应参数 */
export interface LocalgameusepropsResponse {
    code: number;
    msg: string;
    remainNums: number;
}

/** 获取用户能量 - 响应参数 */
export interface UserenergyResponse {
    leftEnergy: number;
    extraEnergy: number;
    maxEnergy: number;
    updateTime: number;
    rate: number;
}

/** 增减用户能量 - 请求参数 */
export interface UserenergychangeRequest {
    change: number;
    type: number;
    strData: string;
}

/** 增减用户能量 - 响应参数 */
export interface UserenergychangeResponse {
    code: number;
    msg: string;
    leftEnergy: number;
    extraEnergy: number;
    maxEnergy: number;
    updateTime: number;
    rate: number;
}

/** 获取章节关卡数据 - 请求参数 */
export interface GetchallengechapterdataRequest {
    chapter: number;
}

/** 获取章节关卡数据 - 响应参数 */
export interface GetchallengechapterdataResponse {
    chapter: number;
    list: ChallengeLevelData[];
}

/** 更新关卡数据 - 请求参数 */
export interface UpdatechallengeleveldataRequest {
    chapter: number;
    level: number;
    score: number;
    stars: number;
    nextChapter: number;
    nextLevel: number;
}

/** 更新关卡数据 - 响应参数 */
export interface UpdatechallengeleveldataResponse {
    code: number;
}

/** 获取当前章节关卡数据 - 响应参数 */
export interface GetcurchallengechapterdataResponse {
    curChapter: number;
    curLevel: number;
    list: ChallengeLevelData[];
}

export namespace SprotoCall {
    export const Name = "call";
    export type Request = CallRequest;
    export type Response = CallResponse;
}

export namespace SprotoUserData {
    export const Name = "userData";
    export type Request = UserdataRequest;
    export type Response = UserdataResponse;
}

export namespace SprotoUserRiches {
    export const Name = "userRiches";
    export type Request = undefined;  // userRiches 协议没有请求参数
    export type Response = UserrichesResponse;
}

export namespace SprotoUserStatus {
    export const Name = "userStatus";
    export type Request = UserstatusRequest;
    export type Response = UserstatusResponse;
}

export namespace SprotoMatchJoin {
    export const Name = "matchJoin";
    export type Request = MatchjoinRequest;
    export type Response = MatchjoinResponse;
}

export namespace SprotoMatchLeave {
    export const Name = "matchLeave";
    export type Request = MatchleaveRequest;
    export type Response = MatchleaveResponse;
}

export namespace SprotoMatchOnSure {
    export const Name = "matchOnSure";
    export type Request = MatchonsureRequest;
    export type Response = MatchonsureResponse;
}

export namespace SprotoCallActivityFunc {
    export const Name = "callActivityFunc";
    export type Request = CallactivityfuncRequest;
    export type Response = CallactivityfuncResponse;
}

export namespace SprotoMatchTestStart {
    export const Name = "matchTestStart";
    export type Request = MatchteststartRequest;
    export type Response = MatchteststartResponse;
}

export namespace SprotoMatchTestStop {
    export const Name = "matchTestStop";
    export type Request = MatchteststopRequest;
    export type Response = MatchteststopResponse;
}

export namespace SprotoGetAwardNotice {
    export const Name = "getAwardNotice";
    export type Request = GetawardnoticeRequest;
    export type Response = GetawardnoticeResponse;
}

export namespace SprotoSetAwardNoticeRead {
    export const Name = "setAwardNoticeRead";
    export type Request = SetawardnoticereadRequest;
    export type Response = undefined;  // setAwardNoticeRead 协议没有响应参数
}

export namespace SprotoJoinPrivateRoom {
    export const Name = "joinPrivateRoom";
    export type Request = JoinprivateroomRequest;
    export type Response = JoinprivateroomResponse;
}

export namespace SprotoCreatePrivateRoom {
    export const Name = "createPrivateRoom";
    export type Request = CreateprivateroomRequest;
    export type Response = CreateprivateroomResponse;
}

export namespace SprotoUserGameRecord {
    export const Name = "userGameRecord";
    export type Request = UsergamerecordRequest;
    export type Response = UsergamerecordResponse;
}

export namespace SprotoUpdateUserNameAndHeadurl {
    export const Name = "updateUserNameAndHeadurl";
    export type Request = UpdateusernameandheadurlRequest;
    export type Response = UpdateusernameandheadurlResponse;
}

export namespace SprotoRevokeAcc {
    export const Name = "revokeAcc";
    export type Request = RevokeaccRequest;
    export type Response = RevokeaccResponse;
}

export namespace SprotoCancelRevokeAcc {
    export const Name = "cancelRevokeAcc";
    export type Request = CancelrevokeaccRequest;
    export type Response = CancelrevokeaccResponse;
}

export namespace SprotoLocalGameUseProps {
    export const Name = "localGameUseProps";
    export type Request = LocalgameusepropsRequest;
    export type Response = LocalgameusepropsResponse;
}

export namespace SprotoUserEnergy {
    export const Name = "userEnergy";
    export type Request = undefined;  // userEnergy 协议没有请求参数
    export type Response = UserenergyResponse;
}

export namespace SprotoUserEnergyChange {
    export const Name = "userEnergyChange";
    export type Request = UserenergychangeRequest;
    export type Response = UserenergychangeResponse;
}

export namespace SprotoGetChallengeChapterData {
    export const Name = "getChallengeChapterData";
    export type Request = GetchallengechapterdataRequest;
    export type Response = GetchallengechapterdataResponse;
}

export namespace SprotoUpdateChallengeLevelData {
    export const Name = "updateChallengeLevelData";
    export type Request = UpdatechallengeleveldataRequest;
    export type Response = UpdatechallengeleveldataResponse;
}

export namespace SprotoGetCurChallengeChapterData {
    export const Name = "getCurChallengeChapterData";
    export type Request = undefined;  // getCurChallengeChapterData 协议没有请求参数
    export type Response = GetcurchallengechapterdataResponse;
}
