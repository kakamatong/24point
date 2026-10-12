/**
 * @file SocketManager.ts
 * @description Socket 管理器基类：提供 Socket 连接和消息处理的基础功能
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
 * @description 等待服务端响应的 RPC 请求（callToServer 内部使用）
 */
interface PENDING_RPC {
    /** 协议名（用于日志与错误描述） */
    protoName: string;
    /** 成功回调 */
    resolve: (data: any) => void;
    /** 失败回调 */
    reject: (error: RpcError) => void;
    /** 超时定时器 */
    timer: ReturnType<typeof setTimeout> | null;
}

/**
 * @class SocketManager
 * @implements {handleSocketMessage}
 * @description Socket管理器基类，负责Socket的初始化、协议加载、消息处理等功能
 * @category 核心框架
 */
export class SocketManager implements handleSocketMessage {
    /**
     * @property {number} RPC_TIMEOUT_MS - callToServer 默认超时时间（毫秒）
     * @readonly
     */
    public static readonly RPC_TIMEOUT_MS: number = 10000;

    /**
     * @property {string} _name - 管理器名称
     * @protected
     */
    protected _name: string = "SocketManager";

    /**
     * @property {Socket | null} _socket - Socket实例
     * @private
     */
    private _socket: Socket | null = null;

    /**
     * @property {any} _request - 请求对象，用于打包消息
     * @private
     */
    private _request: any;

    /**
     * @property {any} _client - 客户端协议对象
     * @private
     */
    private _client: any;

    /**
     * @property {boolean} _bloaded - 协议是否已加载
     * @private
     */
    private _bloaded = false;

    /**
     * @property {boolean} _isopen - 连接是否已打开
     * @private
     */
    private _isopen = false;

    /**
     * @property {number} _session - 会话数字，用于区分不同的请求
     * @private
     */
    private _session = 0;

    /**
     * @property {ReturnType<typeof setInterval> | null} _timeid - 心跳定时器ID
     * @private
     */
    private _timeid: ReturnType<typeof setInterval> | null = null;

    /**
     * @property {Map<number, (data: any) => void>} _callBacks - 回调函数表，按 session 索引存储
     * @description 使用 Map 而非稀疏数组：响应到达即删除，避免长期持有回调造成内存增长；
     *              重连时清空，避免 session 号复用命中上一次连接的旧回调（串包）
     * @private
     */
    private _callBacks: Map<number, (data: any) => void> = new Map();

    /**
     * @property {Set<PENDING_RPC>} _pendingRpcs - 等待服务端响应的 RPC 请求集合（callToServer 专用）
     * @private
     */
    private _pendingRpcs: Set<PENDING_RPC> = new Set();

    /**
     * @property {((result: boolean) => void) | null} _callBackLink - 连接状态回调函数
     * @protected
     */
    protected _callBackLink: ((result: boolean) => void) | null = null;

    /**
     * @property {Map<string, (data: any) => void> | null} _onServerListen - 服务器消息监听器映射表
     * @private
     */
    private _onServerListen: Map<string, (data: any) => void> | null = null;

    /**
     * @constructor
     * @description 初始化SocketManager实例
     */
    constructor() {
        this._onServerListen = new Map<string, (data: any) => void>();
    }

    /**
     * @method start
     * @description 启动Socket连接
     * @param {string} url - WebSocket连接URL
     * @param {string | string[]} [header] - 连接头信息
     * @param {(result: boolean) => void} [callBack] - 连接结果回调函数
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
     * @description 关闭Socket连接
     */
    close() {
        if (this._socket) {
            this._socket.close();
        }
    }

    /**
     * @method initSocket
     * @description 初始化Socket实例
     * @param {string} url - WebSocket连接URL
     * @param {string | string[]} [header] - 连接头信息
     * @returns {Socket} 初始化的Socket实例
     */
    initSocket(url: string, header?: string | string[]) {
        this._session = 0;
        this._isopen = false;
        // 重连：清空上一次连接遗留的回调，避免 session 号复用串包
        this._callBacks.clear();
        const _socket = new Socket();
        _socket.init(url, header);
        _socket.setHandleMessage(this);
        return _socket;
    }

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
            // 必须先读取服务端协议
            bundle.load(protocolPath + "s2c", (err, asset: TextAsset) => {
                Logger.log("loadAsset error", err);

                const txt = asset.nativeAsset;
                const buffer = protoParse.parse(txt, {});
                const serverSproto = new Sproto(buffer);
                this._client = serverSproto?.host("package");

                // 然后读取客户端协议
                bundle.load(protocolPath + "c2s", (err, asset: TextAsset) => {
                    Logger.log("loadAsset error", err);

                    const txt = asset.nativeAsset;
                    const buffer = protoParse.parse(txt, {});
                    const clientSproto = new Sproto(buffer);
                    this._request = this._client.attach(clientSproto);
                    this._bloaded = true;
                    callBack && callBack();
                });
            });
        });
    }

    isOpen() {
        return this._isopen;
    }

    sendHeartBeat() {}

    startHeartBeat() {
        // 每10秒发送一次心跳
        if (this._timeid) {
            clearInterval(this._timeid);
        }
        this._timeid = setInterval(() => {
            this.sendHeartBeat();
        }, 10000);
    }

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
     *              注意：仅适用于「带 response」的协议；无响应协议（如 clientReady/send）请继续用 sendToServer，
     *              否则会一直等到超时
     * @param {{ Name: string }} proto - 协议命名空间（只取 Name，如 SprotoSubmitAnswer）
     * @param {any} [data] - 请求参数
     * @param {number} [timeoutMs] - 超时时间(毫秒)，默认 SocketManager.RPC_TIMEOUT_MS；传 0 表示不超时
     * @returns {Promise<T>} 服务器响应体；业务失败以响应体 code/msg 正常返回，不走 reject
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
     * @description 发送前可用性检查；本地单机模式由子类重写为恒可发送
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
     * @description 拒绝所有等待中的 RPC 请求（连接关闭时调用），避免调用方干等超时
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

    // type
    // _session
    // result
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
                // 回调
                this.onSvrMsg(data.name, data.request);
            }
        }
    }

    onSvrMsg(name: string, data: any) {
        if (this._onServerListen) {
            const callBack = this._onServerListen.get(name);
            callBack && callBack(data);
        }
    }

    // 增加服务器广播监听
    addServerListen(proto: { Name: string }, callBack: (data: any) => void) {
        const name = proto.Name;

        if (!this._onServerListen) {
            this._onServerListen = new Map<string, (data: any) => void>();
        }

        this._onServerListen.set(name, callBack);
    }

    // 移除服务器广播监听
    removeServerListen(proto: { Name: string }) {
        const name = proto.Name;
        if (this._onServerListen) {
            this._onServerListen.delete(name);
        }
    }

    // 连接成功
    agentReady(data: any) {
        this._callBackLink && this._callBackLink(true);
        this._callBackLink = null;
    }

    onOpen(event: any) {
        Logger.log(this._name + " onOpen", event);
        this._isopen = true;
    }

    onMessage(message: Uint8Array) {
        //log('SocketManager onMessage', message);
        const response = this._client.dispatch(message);
        const logMsg = `[${response.type}][${response.session}] `;
        Logger.log(LogColors.yellow(this._name + " onMessage "), logMsg, response);
        this.dispatchMessage(response);
    }

    onClose(event: any) {
        Logger.warn(this._name + " onClose", event);
        this._isopen = false;
        // 断线：一次性拒绝所有等待中的 RPC 请求，避免调用方干等超时
        this.rejectAllPendingRpcs();
        this._callBackLink && this._callBackLink(false);
        this._callBackLink = null;
    }

    onError(event: any) {
        Logger.error(this._name + " onError", event);
    }
}
