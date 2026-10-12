/**
 * @file UserData.ts
 * @description 用户数据模块：处理用户数据的请求、更新和响应
 * @category 网络请求模块
 */

import { DataCenter } from "@datacenter/Datacenter";
import { DispatchEvent } from "@frameworks/Framework";
import { SprotoUpdateUserNameAndHeadurl, SprotoUserData } from "../../types/protocol/lobby/c2s";
import { EVENT_NAMES } from "@datacenter/CommonConfig";
import { BaseModule } from "@frameworks/base/BaseModule";

/**
 * @class UserData
 * @description 用户数据管理类，负责用户数据的请求和响应处理
 * @category 网络请求模块
 */
export class UserData extends BaseModule {
    static get instance(): UserData {
        return this._getInstance<UserData>(UserData);
    }

    /**
     * @method req
     * @description 请求用户数据：await 直接拿到响应，同时更新数据中心并派发事件
     * @returns {Promise<SprotoUserData.Response>} 服务器返回的用户数据
     */
    async req(): Promise<SprotoUserData.Response> {
        const data = await this.callLobby<SprotoUserData.Response>(SprotoUserData, { userid: DataCenter.instance.userid });
        DataCenter.instance.userData = data;
        DispatchEvent(EVENT_NAMES.USER_DATA, data);
        return data;
    }

    /**
     * @method updateUserNameAndHeadurl
     * @description 更新用户昵称和头像
     * @param {string} nickname - 用户昵称
     * @param {string} headurl - 头像地址
     * @returns {Promise<SprotoUpdateUserNameAndHeadurl.Response>} 服务器返回的更新结果
     */
    async updateUserNameAndHeadurl(nickname: string, headurl: string): Promise<SprotoUpdateUserNameAndHeadurl.Response> {
        return this.callLobby<SprotoUpdateUserNameAndHeadurl.Response>(SprotoUpdateUserNameAndHeadurl, { nickname: nickname, headurl: headurl });
    }
}
