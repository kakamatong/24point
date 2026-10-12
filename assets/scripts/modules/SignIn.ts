/**
 * @file SignIn.ts
 * @description 签到模块：处理签到数据请求、签到和补签操作
 * @category 网络请求模块
 */

import { SprotoCallActivityFunc } from "../../types/protocol/lobby/c2s";
import { LogColors } from "@frameworks/Framework";
import { BaseModule } from "@frameworks/base/BaseModule";
import { Logger } from "@frameworks/utils/Utils";

/** 签到活动配置ID */
const SIGN_IN_CFG_ID = 2;

/**
 * @class SignIn
 * @description 签到管理类，负责请求签到数据、执行签到和补签操作
 * @category 网络请求模块
 */
export class SignIn extends BaseModule {
    static get instance(): SignIn {
        return this._getInstance<SignIn>(SignIn);
    }

    /**
     * @method reqSignData
     * @description 请求签到数据
     * @returns {Promise<any | null>} 成功返回签到业务数据（signInConfig/signStatus/signInIndex）；失败返回 null
     */
    async reqSignData(): Promise<any | null> {
        return this.callSignInFunc("getSignInInfo", {});
    }

    /**
     * @method reqSignIn
     * @description 执行签到
     * @param {number} mult - 是否翻倍（0=普通签到，1=多倍签到）
     * @returns {Promise<any | null>} 成功返回签到结果（status/awards/noticeid）；失败返回 null
     */
    async reqSignIn(mult: number): Promise<any | null> {
        return this.callSignInFunc("signIn", { mult: mult, cfgId: SIGN_IN_CFG_ID });
    }

    /**
     * @method reqFillSignIn
     * @description 补签
     * @param {number} index - 补签天数
     * @returns {Promise<any | null>} 成功返回补签结果（status/awards/noticeid）；失败返回 null
     */
    async reqFillSignIn(index: number): Promise<any | null> {
        return this.callSignInFunc("fillSignIn", { index: index, cfgId: SIGN_IN_CFG_ID });
    }

    /**
     * @method callSignInFunc
     * @description 统一调用 daySignIn 活动接口并解析 result JSON（三个接口共用，替代原三套回调）
     * @param {string} funcName - 活动函数名
     * @param {any} args - 业务参数
     * @returns {Promise<any | null>} 成功返回业务数据，服务端报错或业务失败返回 null
     * @private
     */
    private async callSignInFunc(funcName: string, args: any): Promise<any | null> {
        const result = await this.callLobby<SprotoCallActivityFunc.Response>(SprotoCallActivityFunc, {
            moduleName: "daySignIn",
            funcName: funcName,
            args: JSON.stringify(args),
        });
        if (!result || result.code != 1) {
            return null;
        }
        const res = JSON.parse(result.result);
        if (res && res.error) {
            Logger.log(LogColors.red(res.error));
            return null;
        }
        return res;
    }
}
