/**
 * @file UserGameRecord.ts
 * @description 用户游戏记录模块：处理用户游戏战绩的请求
 * @category 网络请求模块
 */

import { DataCenter } from "@datacenter/Datacenter";
import { MAIN_GAME_ID } from "@datacenter/InterfaceConfig";
import { SprotoUserGameRecord } from "../../types/protocol/lobby/c2s";
import { BaseModule } from "@frameworks/base/BaseModule";

/**
 * @class UserGameRecord
 * @description 用户游戏记录管理类，负责用户游戏战绩的请求和响应处理
 * @category 网络请求模块
 */
export class UserGameRecord extends BaseModule {
    static get instance(): UserGameRecord {
        return this._getInstance<UserGameRecord>(UserGameRecord);
    }

    /**
     * @method req
     * @description 请求用户游戏战绩：await 直接拿到战绩数据（胜/负/平），同时写入数据中心
     * @param {number} [userid] - 目标用户ID，不传则查自己
     * @returns {Promise<SprotoUserGameRecord.Response>} 服务器返回的战绩数据
     */
    async req(userid?: number): Promise<SprotoUserGameRecord.Response> {
        const data = await this.callLobby<SprotoUserGameRecord.Response>(SprotoUserGameRecord, {
            userid: userid || DataCenter.instance.userid,
            gameid: MAIN_GAME_ID,
        });
        DataCenter.instance.gameRecords = data;
        return data;
    }
}
