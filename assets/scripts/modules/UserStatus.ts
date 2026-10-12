/**
 * @file UserStatus.ts
 * @description 用户状态模块：处理用户状态数据的请求和响应
 * @category 网络请求模块
 */

import { DataCenter } from "@datacenter/Datacenter";
import { DispatchEvent } from "@frameworks/Framework";
import { SprotoUserStatus } from "../../types/protocol/lobby/c2s";
import { EVENT_NAMES } from "@datacenter/CommonConfig";
import { BaseModule } from "@frameworks/base/BaseModule";

/**
 * @class UserStatus
 * @description 用户状态管理类，负责请求和更新用户状态数据
 * @category 网络请求模块
 */
export class UserStatus extends BaseModule {
    static get instance(): UserStatus {
        return this._getInstance<UserStatus>(UserStatus);
    }

    /**
     * @method req
     * @description 请求用户状态数据：await 直接拿到响应，同时更新数据中心并派发事件；
     *              调用方不关心结果时请用 `.catch()` 兜住传输层异常
     * @returns {Promise<SprotoUserStatus.Response>} 服务器返回的用户状态数据
     */
    async req(): Promise<SprotoUserStatus.Response> {
        const data = await this.callLobby<SprotoUserStatus.Response>(SprotoUserStatus, { userid: DataCenter.instance.userid });
        DataCenter.instance.userStatus = data;
        DispatchEvent(EVENT_NAMES.USER_STATUS, data);
        return data;
    }
}
