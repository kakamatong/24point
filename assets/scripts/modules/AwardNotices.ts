/**
 * @file AwardNotices.ts
 * @description 奖励通知模块：处理奖励通知的获取和标记已读
 * @category 网络请求模块
 */

import { DataCenter } from "@datacenter/Datacenter";
import { SprotoGetAwardNotice, SprotoSetAwardNoticeRead } from "../../types/protocol/lobby/c2s";
import { BaseModule } from "@frameworks/base/BaseModule";
import { Logger } from "@frameworks/utils/Utils";

/**
 * @class AwardNotices
 * @description 奖励通知管理类，负责获取奖励通知和标记已读
 * @category 网络请求模块
 */
export class AwardNotices extends BaseModule {
    static get instance(): AwardNotices {
        return this._getInstance<AwardNotices>(AwardNotices);
    }

    /**
     * @method req
     * @description 请求获取奖励通知
     * @returns {Promise<SprotoGetAwardNotice.Response>} 服务器返回的奖励通知数据
     */
    async req(): Promise<SprotoGetAwardNotice.Response> {
        const data = await this.callLobby<SprotoGetAwardNotice.Response>(SprotoGetAwardNotice, { userid: DataCenter.instance.userid });
        // 这是未通知到的奖励，可以一个一个通知，或者合并通知
        data && data.list && Logger.log(data.list);
        return data;
    }

    /**
     * @method reqRead
     * @description 标记奖励通知为已读
     * @param {number} id - 奖励通知ID
     */
    reqRead(id: number): void {
        // setAwardNoticeRead 协议无 response，await 会一直等到超时，保持回调式发送
        this.reqLobby(SprotoSetAwardNoticeRead, { id: id });
    }
}
