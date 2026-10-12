/**
 * @file SocketManager.ts
 * @description Socket 管理器基类：负责协议表加载（sproto）、二进制编解码、请求-响应配对、
 *              服务端广播分发与连接状态维护，并向业务层提供回调式 sendToServer 与 RPC 式 callToServer 两套收发接口。
 *
 * 收发链路：
 * · 发送：业务 → sendToServer / callToServer → _request(协议名, 数据, session) 编码 → Socket 二进制发送
 * · 接收：Socket → onMessage → _client.dispatch 解码 → dispatchMessage 分流：
 *     - RESPONSE：按 session 命中 _callBacks，回调式请求触发回调、RPC 式请求 resolve
 *     - REQUEST ：服务端推送，agentReady 表示连接就绪，其余按协议名派发给广播监听
 *
 * 关键约定：
 * · 协议表先加载 s2c（其中定义了 .package 包头结构，用它 host 出 _client），再加载 c2s 并 attach 出 _request；
 * · 「连接成功」以服务端下发 agentReady 为准，而非 WebSocket 的 onopen（游戏服没有 agent，由子类在 onOpen 中直接触发）；
 * · 无 response 的协议只能用 sendToServer，用 callToServer 会一直等到超时。
 * @category 核心框架
 */

import { Socket } from "./socket/Socket";
import { assetManager, TextAsset } from "cc";
import { handleSocketMessage } from "./config/Config";
import { LogColors } from "./Framework";
import * as protoParse from "./sproto/sproto-parser";
import { Sproto } from "./sproto/sproto";
import { Logger } from "./utils/Utils";

/**
 * @enum ENUM_RPC_ERROR
 * @description RPC 传输层错误码（区别于服务端返回的业务 code）
 * @category 核心框架
 */
export enum ENUM_RPC_ERROR {
    /** 连接未就绪 */
    NOT_CONNECTED = 1,
    /** 协议表未加载完成 */
    PROTOCOL_NOT_LOADED = 2,
    /** 等待响应超时 */
    TIMEOUT = 3,
    /** 等待响应期间连接断开 */
    DISCONNECTED = 4,
}

/**
 * @class RpcError
 * @description RPC 传输层错误：只表示「没拿到服务端响应」；业务失败仍以响应体的 code/msg 正常返回
 * @category 核心框架
 * @extends Error
 */
export class RpcError extends Error {
    /**
     * @property {ENUM_RPC_ERROR} code - 传输层错误码
     */
    public code: ENUM_RPC_ERROR;

    /**
     * @property {string} protoName - 出错的协议名
     */
    public protoName: string;

    /**
     * @constructor
     * @description 构造 RPC 传输层错误
     * @param {ENUM_RPC_ERROR} code - 传输层错误码
     * @param {string} protoName - 出错的协议名
     * @param {string} message - 错误描述
     */
    constructor(code: ENUM_RPC_ERROR, protoName: string, message: string) {
        super(message);
        this.name = "RpcError";
        this.code = code;
        this.protoName = protoName;
    }
}

/**
 * @interface PENDING_RPC
 * @description 等待服务端响应的 RPC 请求（callToServer 内部使用），一个实例对应一次 await
 */
interface PENDING_RPC {
    /** 协议名（用于日志与错误描述） */
    protoName: string;
    /** Promise 的成功回调 */
    resolve: (data: any) => void;
    /** Promise 的失败回调 */
    reject: (error: RpcError) => void;
    /** 超时定时器句柄（未设置超时时为 null） */
    timer: ReturnType<typeof setTimeout> | null;
}

/**
 * @class SocketManager
 * @implements {handleSocketMessage}
 * @description Socket 管理器基类，封装 Socket 连接、协议表加载、请求-响应配对（session）与服务端广播分发。
 *              本身不直接对外使用，由大厅服与游戏服各自继承为单例。
 * @category 核心框架
 * @see LobbySocketManager 大厅服单例实现，断线时派发 socketDisconnect 事件
 * @see GameSocketManager 游戏服单例实现，支持不建连接的本地单机模式
 */
export class SocketManager implements handleSocketMessage {
    /**
     * @property {number} RPC_TIMEOUT_MS - callToServer 默认超时时间（毫秒）
     * @default 10000
     * @readonly
     */
    public static readonly RPC_TIMEOUT_MS: number = 10000;

    /**
     * @property {string} _name - 管理器名称，仅用于日志前缀，由子类覆盖
     * @protected
     */
    protected _name: string = "SocketManager";

    /**
     * @property {Socket | null} _socket - 底层 WebSocket 封装实例
     * @private
     */
    private _socket: Socket | null = null;

    /**
     * @property {any} _request - c2s 协议的发包闭包，由 _client.attach(c2sSproto) 生成
     * @description 调用签名 (协议名, 请求数据, session) => Uint8Array，内部完成包头与请求体的 sproto 编码和打包；
     *              为 undefined 表示协议表尚未加载完成，此时不能发送
     * @private
     */
    private _request: any;

    /**
     * @property {any} _client - s2c 协议表的 Host 实例（以服务端协议视角编解码）
     * @description 由 serverSproto.host("package") 生成，负责解包头（type/session）、解服务端推送的请求体、
     *              按 session 反查并解码响应体；其 attach(c2sSproto) 提供发包能力
     * @private
     */
    private _client: any;

    /**
     * @property {boolean} _bloaded - 协议表是否已加载完成
     * @description 只有 s2c（host）与 c2s（attach）都读取成功后才置为 true，loadProtocol 用它做去重
     * @private
     */
    private _bloaded = false;

    /**
     * @property {boolean} _isopen - 底层 WebSocket 连接是否已打开
     * @description 由 onOpen / onClose / initSocket 维护；它只代表 socket 已连接，
     *              「业务可用」还需等 agentReady（见 _callBackLink）
     * @private
     */
    private _isopen = false;

    /**
     * @property {number} _session - 请求会话号，用于把响应配回发起方
     * @description 每次 sendToServer 自增（从 1 开始），随包头一起发送；initSocket 重连时归零
     * @private
     */
    private _session = 0;

    /**
     * @property {ReturnType<typeof setInterval> | null} _timeid - 心跳定时器句柄
     * @private
     */
    private _timeid: ReturnType<typeof setInterval> | null = null;

    /**
     * @property {Map<number, (data: any) => void>} _callBacks - 回调函数表，按 session 索引存储
     * @description 同时服务回调式与 RPC 式请求；使用 Map 而非稀疏数组：响应到达即删除，避免长期持有回调造成内存增长；
     *              重连时清空，避免 session 号复用命中上一次连接的旧回调（串包）
     * @private
     */
    private _callBacks: Map<number, (data: any) => void> = new Map();

    /**
     * @property {Set<PENDING_RPC>} _pendingRpcs - 等待服务端响应的 RPC 请求集合（callToServer 专用）
     * @description 与 _callBacks 并存：这里额外持有 reject 与超时定时器，可按协议名整体拒绝（断线时）
     * @private
     */
    private _pendingRpcs: Set<PENDING_RPC> = new Set();

    /**
     * @property {((result: boolean) => void) | null} _callBackLink - 连接结果回调函数
     * @description 由 start 传入，在 agentReady（成功）或 onClose（失败）时触发一次后置空
     * @protected
     */
    protected _callBackLink: ((result: boolean) => void) | null = null;

    /**
     * @property {Map<string, (data: any) => void> | null} _onServerListen - 服务端推送监听表：协议名 → 处理函数
     * @description 每个协议名只保存一个处理函数，同名重复 addServerListen 会覆盖前一个
     * @private
     */
    private _onServerListen: Map<string, (data: any) => void> | null = null;

    /**
     * @constructor
     * @description 初始化实例，为每个管理器创建独立的推送监听表（避免多个管理器之间串消息）
     */
    constructor() {
        this._onServerListen = new Map<string, (data: any) => void>();
    }

    /**
     * @method start
     * @description 启动 Socket 连接：先关闭旧连接，再按 url 建立新连接
     * @param {string} url - WebSocket连接URL（userid/token 等认证参数通过 query 携带）
     * @param {string | string[]} [header] - 连接头信息
     * @param {(result: boolean) => void} [callBack] - 连接结果回调；由服务端 agentReady 推送触发（成功）
     *                  或连接关闭触发（失败），并非 WebSocket 的 onopen
     */
    start(url: string, header?: string | string[], callBack?: (result: boolean) => void) {
        if (this._socket) {
            this._socket.close();
        }

        if (callBack) {
            this._callBackLink = callBack;
        }

        this._socket = this.initSocket(url, header);
    }

    /**
     * @method close
     * @description 主动关闭连接；随后的 onClose 会拒绝所有等待中的 RPC 请求并回调连接失败
     */
    close() {
        if (this._socket) {
            this._socket.close();
        }
    }

    /**
     * @method initSocket
     * @description 创建并初始化新的 Socket 实例，同时把上一次连接的残留状态清零
     * @param {string} url - WebSocket连接URL
     * @param {string | string[]} [header] - 连接头信息
     * @returns {Socket} 已注册消息处理器的 Socket 实例
     */
    initSocket(url: string, header?: string | string[]) {
        // 重连：会话语义完全重置
        this._session = 0;
        this._isopen = false;
        // 重连：清空上一次连接遗留的回调，避免 session 号复用串包
        this._callBacks.clear();
        const _socket = new Socket();
        _socket.init(url, header);
        _socket.setHandleMessage(this);
        return _socket;
    }

    /**
     * @method loadProtocol
     * @description 加载指定模块的 sproto 协议表：从 protocol bundle 读取 s2c / c2s 两个 TextAsset 并编译。
     *              顺序不可颠倒——s2c 里定义了 .package 包头结构，先用它 host 出 _client（负责解包头与推送），
     *              再用 c2s attach 出 _request（负责发包，同时登记 c2s 侧 response 类型供解响应体使用）。
     *              已加载过则直接回调，不重复加载
     * @param {string} path - 协议目录名，如 "lobby"、"game10003"
     * @param {() => void} callBack - 加载完成回调；当前实现中 bunde/asset 加载失败只打日志、既不回调也不抛错
     */
    loadProtocol(path: string, callBack: () => void) {
        if (this._bloaded) {
            callBack && callBack();
            return;
        }
        const bundle = assetManager.loadBundle("protocol", (err, bundle) => {
            if (err) {
                Logger.log("loadBundle error", err);
                return;
            }
            const protocolPath = path + "/";
            // 必须先读取服务端协议（其中包含 .package 包头定义，_client 依赖它）
            bundle.load(protocolPath + "s2c", (err, asset: TextAsset) => {
                Logger.log("loadAsset error", err);

                const txt = asset.nativeAsset;
                const buffer = protoParse.parse(txt, {});
                const serverSproto = new Sproto(buffer);
                this._client = serverSproto?.host("package");

                // 然后读取客户端协议，attach 出可用的发包闭包
                bundle.load(protocolPath + "c2s", (err, asset: TextAsset) => {
                    Logger.log("loadAsset error", err);

                    const txt = asset.nativeAsset;
                    const buffer = protoParse.parse(txt, {});
                    const clientSproto = new Sproto(buffer);
                    this._request = this._client.attach(clientSproto);
                    // s2c 与 c2s 都就绪后才算加载完成
                    this._bloaded = true;
                    callBack && callBack();
                });
            });
        });
    }

    /**
     * @method isOpen
     * @description 查询底层 WebSocket 是否已打开
     * @returns {boolean} 已打开返回 true；注意它不代表业务已就绪（业务就绪以 agentReady 为准）
     */
    isOpen() {
        return this._isopen;
    }

    /**
     * @method sendHeartBeat
     * @description 发送心跳包（占位空实现）：具体心跳协议由子类按各自服务端约定实现
     */
    sendHeartBeat() {}

    /**
     * @method startHeartBeat
     * @description 启动 10 秒一次的心跳定时器；重复调用会先清掉旧定时器
     * @remarks 当前工程没有任何地方调用它，且 sendHeartBeat 为空实现，等于心跳保活尚未启用
     */
    startHeartBeat() {
        // 每10秒发送一次心跳
        if (this._timeid) {
            clearInterval(this._timeid);
        }
        this._timeid = setInterval(() => {
            this.sendHeartBeat();
        }, 10000);
    }

    /**
     * @method sendToServer
     * @description 回调式发送请求：分配 session 并登记回调，收到同 session 的响应后回调一次（随后回调即被移除）。
     *              无 response 的协议用它；协议表未加载时只打日志、不发送（回调永远不会触发），
     *              需要失败感知请改用 callToServer
     * @param {{ Name: string }} xy - 协议命名空间（只取 Name，如 SprotoSubmitAnswer）
     * @param {any} data - 请求数据
     * @param {(data: any) => void} [callBack] - 响应回调；业务失败同样会回调，由调用方判断响应体 code
     */
    sendToServer(xy: { Name: string }, data: any, callBack?: (data: any) => void) {
        const xyname = xy.Name;
        this._session++;
        if (callBack) {
            this._callBacks.set(this._session, callBack);
        }
        const logMsg = `[${xyname}][${this._session}]`;
        Logger.log(LogColors.blue(this._name + " sendToServer "), logMsg, data);
        this._request && this.sendMessage(this._request(xyname, data, this._session));
    }

    /**
     * @method sendMessage
     * @description 把已编码的二进制数据交给 Socket 发送；连接未就绪时只告警并丢弃该包
     * @param {any} message - _request 编码后的二进制数据
     */
    sendMessage(message: any) {
        if (this._isopen) {
            this._socket && this._socket.sendMessage(message);
        } else {
            Logger.warn(LogColors.red("_socket 未连接"));
        }
    }

    /**
     * @method callToServer
     * @description RPC 方式请求服务器：返回 Promise，可直接 await 拿到响应体。
     *              内部复用 sendToServer 收发链路，因此子类（如 GameSocketManager 的本地单机模式）
     *              重写 sendToServer 后同样适用。
     *
     *              错误约定：
     *              · 业务失败（服务端返回 code != 成功码）正常 resolve，由调用方判断响应体；
     *              · 传输层失败（未连接 / 协议未加载 / 超时 / 等待中断线）reject 一个 RpcError，
     *                调用方必须 catch，否则会产生未处理的 Promise 拒绝。
     *
     *              注意：仅适用于「带 response」的协议；无响应协议（如 clientReady/send）请继续用 sendToServer，
     *              否则会一直等到超时
     * @param {{ Name: string }} proto - 协议命名空间（只取 Name，如 SprotoSubmitAnswer）
     * @param {any} [data] - 请求参数
     * @param {number} [timeoutMs] - 超时时间(毫秒)，默认 SocketManager.RPC_TIMEOUT_MS；传 0 表示不超时
     * @returns {Promise<T>} 服务器响应体
     * @throws {RpcError} 传输层失败时通过 Promise reject 抛出
     * @example
     * const resp = await GameSocketManager.instance.callToServer<SprotoSubmitAnswer.Response>(SprotoSubmitAnswer, { expression: "8/((3-8)/3)" });
     */
    public callToServer<T = any>(proto: { Name: string }, data?: any, timeoutMs: number = SocketManager.RPC_TIMEOUT_MS): Promise<T> {
        const protoName = proto.Name;

        // 发送前检查：未连接/协议未加载立即失败，避免调用方白等一个超时周期
        const checkError = this.checkSendable(protoName);
        if (checkError) {
            return Promise.reject(checkError);
        }

        return new Promise<T>((resolve, reject) => {
            const rpc: PENDING_RPC = {
                protoName: protoName,
                resolve: resolve,
                reject: reject,
                timer: null,
            };

            if (timeoutMs > 0) {
                rpc.timer = setTimeout(() => {
                    // 超时：先从等待表移除再 reject，迟到的响应会被安全丢弃
                    if (this._pendingRpcs.delete(rpc)) {
                        reject(new RpcError(ENUM_RPC_ERROR.TIMEOUT, protoName, `请求超时(${timeoutMs}ms)：${protoName}`));
                    }
                }, timeoutMs);
            }

            this._pendingRpcs.add(rpc);

            // 回调由 sendToServer 登记进 _callBacks，收到响应时在此收口
            this.sendToServer(proto, data, (response: any) => {
                if (!this._pendingRpcs.delete(rpc)) {
                    // 已超时或已断线：丢弃迟到响应
                    return;
                }
                rpc.timer && clearTimeout(rpc.timer);
                resolve(response as T);
            });
        });
    }

    /**
     * @method checkSendable
     * @description 发送前可用性检查：依次校验协议表与连接状态；本地单机模式由子类重写为恒可发送
     * @param {string} protoName - 协议名（用于错误描述）
     * @returns {RpcError | null} 可发送返回 null，否则返回应拒绝的错误
     * @protected
     */
    protected checkSendable(protoName: string): RpcError | null {
        if (!this._request) {
            return new RpcError(ENUM_RPC_ERROR.PROTOCOL_NOT_LOADED, protoName, `协议未加载，无法请求：${protoName}`);
        }
        if (!this._isopen) {
            return new RpcError(ENUM_RPC_ERROR.NOT_CONNECTED, protoName, `连接未就绪，无法请求：${protoName}`);
        }
        return null;
    }

    /**
     * @method rejectAllPendingRpcs
     * @description 拒绝所有等待中的 RPC 请求（连接关闭时调用），并清空定时器，避免调用方干等超时
     * @private
     */
    private rejectAllPendingRpcs() {
        if (this._pendingRpcs.size === 0) {
            return;
        }
        this._pendingRpcs.forEach((rpc) => {
            rpc.timer && clearTimeout(rpc.timer);
            rpc.reject(new RpcError(ENUM_RPC_ERROR.DISCONNECTED, rpc.protoName, `连接已断开：${rpc.protoName}`));
        });
        this._pendingRpcs.clear();
    }

    /**
     * @method dispatchMessage
     * @description 分发一条已解码的协议消息（_client.dispatch 的结果），按类型走三条分支：
     *              · RESPONSE：按 session 命中回调表，命中后先删除再回调（回调式与 RPC 式在此统一收口）；
     *                找不到对应 session 说明是超时/断线后的迟到响应，直接忽略
     *              · REQUEST + name 为 agentReady：连接就绪，走 agentReady 流程
     *              · REQUEST + 其它 name：服务端广播，按协议名派发给 addServerListen 注册的处理函数
     * @remarks dispatch 阶段虽为带 session 的服务端请求生成了应答函数（data.response），但客户端当前并未使用，即不会回包
     * @param {any} data - 解码结果 { type, name, session, request, response }
     */
    dispatchMessage(data: any) {
        if (data.type == "RESPONSE") {
            const result = data.response;
            const callBack = this._callBacks.get(data.session);
            if (callBack) {
                // 响应即消费：先删除再回调，避免重连后 session 号复用误触发旧回调
                this._callBacks.delete(data.session);
                callBack(result);
            }
        } else if (data.type == "REQUEST") {
            if (data.name == "agentReady") {
                this.agentReady(data.request);
            } else {
                // 服务端广播：按协议名查找监听
                this.onSvrMsg(data.name, data.request);
            }
        }
    }

    /**
     * @method onSvrMsg
     * @description 按协议名查找并调用服务端广播监听；未注册该协议时静默忽略
     * @param {string} name - 协议名（服务端推送，不带 session）
     * @param {any} data - 已解码的推送数据
     */
    onSvrMsg(name: string, data: any) {
        if (this._onServerListen) {
            const callBack = this._onServerListen.get(name);
            callBack && callBack(data);
        }
    }

    /**
     * @method addServerListen
     * @description 增加服务端广播监听（S2C 推送，如 roomInfo、playerInfos、dealCards 等）
     * @param {{ Name: string }} proto - 协议命名空间（只取 Name）
     * @param {(data: any) => void} callBack - 推送处理函数
     * @remarks 同一协议名只保留最后一个监听，重复注册会覆盖；View 中请在 onDestroy 里配对调用 removeServerListen
     */
    addServerListen(proto: { Name: string }, callBack: (data: any) => void) {
        const name = proto.Name;

        if (!this._onServerListen) {
            this._onServerListen = new Map<string, (data: any) => void>();
        }

        this._onServerListen.set(name, callBack);
    }

    /**
     * @method removeServerListen
     * @description 移除服务端广播监听
     * @param {{ Name: string }} proto - 协议命名空间（只取 Name）
     */
    removeServerListen(proto: { Name: string }) {
        const name = proto.Name;
        if (this._onServerListen) {
            this._onServerListen.delete(name);
        }
    }

    /**
     * @method agentReady
     * @description 连接就绪收口：大厅服服务端下发 agentReady 推送后走到这里，游戏服无 agent 则由子类在 onOpen 中直接调用。
     *              把 start 传入的连接回调置为成功并清空引用，保证只回调一次
     * @param {any} data - agentReady 推送体（游戏服直接传 null）
     */
    agentReady(data: any) {
        this._callBackLink && this._callBackLink(true);
        this._callBackLink = null;
    }

    /**
     * @method onOpen
     * @description Socket 连接打开回调（handleSocketMessage 接口实现）：仅标记底层连接可用，
     *              业务连接结果仍以 agentReady 为准
     * @param {any} event - 连接打开事件
     */
    onOpen(event: any) {
        Logger.log(this._name + " onOpen", event);
        this._isopen = true;
    }

    /**
     * @method onMessage
     * @description Socket 收到二进制数据回调（handleSocketMessage 接口实现）：
     *              交给 _client 解包头与消息体，再交由 dispatchMessage 分流
     * @param {Uint8Array} message - 服务端原始二进制数据
     */
    onMessage(message: Uint8Array) {
        const response = this._client.dispatch(message);
        const logMsg = `[${response.type}][${response.session}] `;
        Logger.log(LogColors.yellow(this._name + " onMessage "), logMsg, response);
        this.dispatchMessage(response);
    }

    /**
     * @method onClose
     * @description Socket 连接关闭回调（handleSocketMessage 接口实现）：标记连接不可用、
     *              拒绝全部等待中的 RPC 请求（避免调用方干等超时），并把连接回调置为失败
     * @param {any} event - 关闭事件（含 code / reason）
     */
    onClose(event: any) {
        Logger.warn(this._name + " onClose", event);
        this._isopen = false;
        // 断线：一次性拒绝所有等待中的 RPC 请求，避免调用方干等超时
        this.rejectAllPendingRpcs();
        this._callBackLink && this._callBackLink(false);
        this._callBackLink = null;
    }

    /**
     * @method onError
     * @description Socket 错误回调（handleSocketMessage 接口实现）：当前仅记录日志，不做重连
     * @param {any} event - 错误事件
     */
    onError(event: any) {
        Logger.error(this._name + " onError", event);
    }
}
