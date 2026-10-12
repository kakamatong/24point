/**
 * @file RevokeAccount.ts
 * @description 账号注销模块：处理账号注销和取消注销请求
 * @category 网络请求模块
 */

import { DataCenter } from "@datacenter/Datacenter";
import { SprotoRevokeAcc, SprotoCancelRevokeAcc } from "../../types/protocol/lobby/c2s";
import { BaseModule } from "@frameworks/base/BaseModule";

/**
 * @class RevokeAccount
 * @description 账号注销管理类，负责账号注销和取消注销操作
 * @category 网络请求模块
 */
export class RevokeAccount extends BaseModule {
    static get instance(): RevokeAccount {
        return this._getInstance<RevokeAccount>(RevokeAccount);
    }

    /**
     * @method reqRevokeAccount
     * @description 请求账号注销
     * @returns {Promise<SprotoRevokeAcc.Response>} 服务器返回的注销结果（code：1申请成功/2注销流程中/3注销完成/其它失败）
     */
    async reqRevokeAccount(): Promise<SprotoRevokeAcc.Response> {
        const loginInfo = DataCenter.instance.getLoginInfo();
        return this.callLobby<SprotoRevokeAcc.Response>(SprotoRevokeAcc, { loginType: loginInfo?.loginType });
    }

    /**
     * @method reqCancelRevokeAccount
     * @description 请求取消账号注销
     * @returns {Promise<SprotoCancelRevokeAcc.Response>} 服务器返回的取消注销结果（code：1成功）
     */
    async reqCancelRevokeAccount(): Promise<SprotoCancelRevokeAcc.Response> {
        const loginInfo = DataCenter.instance.getLoginInfo();
        return this.callLobby<SprotoCancelRevokeAcc.Response>(SprotoCancelRevokeAcc, { userid: loginInfo?.loginType });
    }
}
