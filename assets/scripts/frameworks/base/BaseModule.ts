/**
 * @file BaseModule.ts
 * @description 业务模块基类：提供单例托管与协议收发封装（回调式 reqXxx 与 RPC 式 callXxx）
 * @category 核心框架
 */

import { LobbySocketManager } from "../LobbySocketManager";
import { GameSocketManager } from "../GameSocketManager";

/**
 * @class BaseModule
 * @description 业务模块基类，统一收口大厅/游戏服的协议请求入口，使用受保护的单例托管
 * @category 核心框架
 */
export class BaseModule {
    private static _instances = new Map<Function, any>();

    protected constructor() {}

    /**
     * 父类不再推导 this，而是完全听从传入的参数。
     * @param ctor 构造函数 (Map 的 Key)
     * @returns T (直接返回你传入的泛型类型)
     */
    protected static _getInstance<T>(ctor: any): T {
        // 1. 如果 Map 里没有，就 new 一个
        if (!BaseModule._instances.has(ctor)) {
            // 这里的 new ctor() 需要 ctor 是 any 或者特定构造签名
            // 因为是 protected 构造函数，用 any 最省事且通用
            BaseModule._instances.set(ctor, new ctor());
        }

        // 2. 直接返回，类型就是你传进来的 T
        return BaseModule._instances.get(ctor);
    }

    /**
     * @method reqLobby
     * @description 回调式请求大厅服务器（不能 await；无响应协议也可安全使用）
     * @param {{ Name: string }} proto - 协议命名空间（如 SprotoUserData）
     * @param {any} data - 请求参数
     * @param {(data: any) => void} [callback] - 响应回调
     * @protected
     */
    protected reqLobby(proto: { Name: string }, data: any, callback?: (data: any) => void): void {
        LobbySocketManager.instance.sendToServer(proto, data, callback);
    }

    /**
     * @method reqGame
     * @description 回调式请求游戏服务器（不能 await；无响应协议也可安全使用）
     * @param {{ Name: string }} proto - 协议命名空间（如 SprotoSubmitAnswer）
     * @param {any} data - 请求参数
     * @param {(data: any) => void} [callback] - 响应回调
     * @protected
     */
    protected reqGame(proto: { Name: string }, data: any, callback?: (data: any) => void): void {
        GameSocketManager.instance.sendToServer(proto, data, callback);
    }

    /**
     * @method callLobby
     * @description RPC 方式请求大厅服务器：可直接 await 拿到响应体。
     *              仅适用于带 response 的协议；传输层失败（未连接/协议未加载/超时/断线）会 reject 一个 RpcError，
     *              业务失败仍以响应体 code/msg 正常 resolve
     * @param {{ Name: string }} proto - 协议命名空间（如 SprotoUserData）
     * @param {any} [data] - 请求参数
     * @param {number} [timeoutMs] - 超时时间(毫秒)，不传用默认值 SocketManager.RPC_TIMEOUT_MS，传 0 表示不超时
     * @returns {Promise<T>} 服务器响应体
     * @protected
     */
    protected callLobby<T = any>(proto: { Name: string }, data?: any, timeoutMs?: number): Promise<T> {
        return LobbySocketManager.instance.callToServer<T>(proto, data, timeoutMs);
    }

    /**
     * @method callGame
     * @description RPC 方式请求游戏服务器：可直接 await 拿到响应体，单机模式由 GameSocketManager 自动接管。
     *              仅适用于带 response 的协议；传输层失败（未连接/协议未加载/超时/断线）会 reject 一个 RpcError，
     *              业务失败仍以响应体 code/msg 正常 resolve
     * @param {{ Name: string }} proto - 协议命名空间（如 SprotoSubmitAnswer）
     * @param {any} [data] - 请求参数
     * @param {number} [timeoutMs] - 超时时间(毫秒)，不传用默认值 SocketManager.RPC_TIMEOUT_MS，传 0 表示不超时
     * @returns {Promise<T>} 服务器响应体
     * @protected
     */
    protected callGame<T = any>(proto: { Name: string }, data?: any, timeoutMs?: number): Promise<T> {
        return GameSocketManager.instance.callToServer<T>(proto, data, timeoutMs);
    }
}
