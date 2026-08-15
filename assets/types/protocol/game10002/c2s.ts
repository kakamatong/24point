// Auto-generated from sproto files
// Do not edit manually

/** ============================================ */
export interface Point {
    row: number;
    col: number;
}

/** LineSegment 结构体定义 */
export interface LineSegment {
    start: Point;
    dest: Point;
}

/** 调用接口 - 请求参数 */
export interface CallRequest {
    moduleName: string;
    funcName: string;
    args: string;
}

/** 调用接口 - 响应参数 */
export interface CallResponse {
    code: number;
    msg: string;
    richNum: number;
}

/** 发送接口（无响应） - 请求参数 */
export interface SendRequest {
    moduleName: string;
    funcName: string;
    args: string;
}

/** 客户端准备就绪 - 请求参数 */
export interface ClientreadyRequest {
    ready: number;
}

/** 游戏准备 - 请求参数 */
export interface GamereadyRequest {
    ready: number;
}

/** 游戏准备 - 响应参数 */
export interface GamereadyResponse {
    code: number;
    msg: string;
}

/** 房主开始游戏 - 响应参数 */
export interface OwnerstartgameResponse {
    code: number;
    msg: string;
    notReadyUserids: number[];
}

/** 离开房间 - 响应参数 */
export interface LeaveroomResponse {
    code: number;
    msg: string;
}

/** 发起投票解散 - 请求参数 */
export interface VotedisbandroomRequest {
    reason: string;
}

/** 发起投票解散 - 响应参数 */
export interface VotedisbandroomResponse {
    code: number;
    msg: string;
}

/** 投票解散响应 - 请求参数 */
export interface VotedisbandresponseRequest {
    voteId: number;
    agree: number;
}

/** 投票解散响应 - 响应参数 */
export interface VotedisbandresponseResponse {
    code: number;
    msg: string;
}

/** 消息转发 - 请求参数 */
export interface ForwardmessageRequest {
    type: number;
    to: number[];
    msg: string;
}

/** 消息转发 - 响应参数 */
export interface ForwardmessageResponse {
    code: number;
    msg: string;
}

/** 使用聊天 - 请求参数 */
export interface ChatuseRequest {
    id: number;
    ext: string;
}

/** 使用聊天 - 响应参数 */
export interface ChatuseResponse {
    code: number;
    richNum: number;
    msg: string;
}

/** 点击消除方块 - 请求参数 */
export interface ClicktilesRequest {
    row1: number;
    col1: number;
    row2: number;
    col2: number;
}

/** 点击消除方块 - 响应参数 */
export interface ClicktilesResponse {
    code: number;
    msg: string;
    eliminated: number;
    remaining: number;
}

/** 道具使用 (预留) - 请求参数 */
export interface UseitemRequest {
    itemId: number;
}

/** 道具使用 (预留) - 响应参数 */
export interface UseitemResponse {
    code: number;
    msg: string;
    richNum: number;
}

export namespace SprotoCall {
    export const Name = "call";
    export type Request = CallRequest;
    export type Response = CallResponse;
}

export namespace SprotoSend {
    export const Name = "send";
    export type Request = SendRequest;
    export type Response = undefined;  // send 协议没有响应参数
}

export namespace SprotoClientReady {
    export const Name = "clientReady";
    export type Request = ClientreadyRequest;
    export type Response = undefined;  // clientReady 协议没有响应参数
}

export namespace SprotoGameReady {
    export const Name = "gameReady";
    export type Request = GamereadyRequest;
    export type Response = GamereadyResponse;
}

export namespace SprotoOwnerStartGame {
    export const Name = "ownerStartGame";
    export type Request = undefined;  // ownerStartGame 协议没有请求参数
    export type Response = OwnerstartgameResponse;
}

export namespace SprotoLeaveRoom {
    export const Name = "leaveRoom";
    export type Request = undefined;  // leaveRoom 协议没有请求参数
    export type Response = LeaveroomResponse;
}

export namespace SprotoVoteDisbandRoom {
    export const Name = "voteDisbandRoom";
    export type Request = VotedisbandroomRequest;
    export type Response = VotedisbandroomResponse;
}

export namespace SprotoVoteDisbandResponse {
    export const Name = "voteDisbandResponse";
    export type Request = VotedisbandresponseRequest;
    export type Response = VotedisbandresponseResponse;
}

export namespace SprotoForwardMessage {
    export const Name = "forwardMessage";
    export type Request = ForwardmessageRequest;
    export type Response = ForwardmessageResponse;
}

export namespace SprotoChatUse {
    export const Name = "chatUse";
    export type Request = ChatuseRequest;
    export type Response = ChatuseResponse;
}

export namespace SprotoClickTiles {
    export const Name = "clickTiles";
    export type Request = ClicktilesRequest;
    export type Response = ClicktilesResponse;
}

export namespace SprotoUseItem {
    export const Name = "useItem";
    export type Request = UseitemRequest;
    export type Response = UseitemResponse;
}
