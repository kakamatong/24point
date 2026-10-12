/**
 * @file AdReward.ts
 * @description 广告奖励模块：处理每日看广告领奖的相关请求
 * @category 网络请求模块
 */

import { SprotoCallActivityFunc } from "../../types/protocol/lobby/c2s";
import { LogColors } from "@frameworks/Framework";
import { DataCenter } from "@datacenter/Datacenter";
import { AD_RECEIVE_REWARD_RESULT } from "@datacenter/InterfaceConfig";
import { BaseModule } from "@frameworks/base/BaseModule";
import { Logger } from "@frameworks/utils/Utils";

/**
 * @class AdReward
 * @description 广告奖励管理类，负责请求广告信息、领取广告奖励
 * @category 网络请求模块
 */
export class AdReward extends BaseModule {
    static get instance(): AdReward {
        return this._getInstance<AdReward>(AdReward);
    }

    /**
     * @method reqGetAdInfo
     * @description 请求每日看广告领奖信息，成功时按响应回带的配置ID存入数据中心
     * @param {number} [cfgId=2] - 广告配置ID（2=大厅道具奖励，3=体力奖励）
     * @returns {Promise<any | null>} 成功返回广告信息；失败返回 null
     */
    async reqGetAdInfo(cfgId: number = 2): Promise<any | null> {
        const res = await this.callAdFunc("getAdInfo", cfgId);
        if (res) {
            DataCenter.instance.setAdRewardInfo(res.cfgId, res);
        }
        return res;
    }

    /**
     * @method reqReceiveAdReward
     * @description 领取看广告奖励，成功时按响应回带的配置ID维护对应数据的次数
     * @param {number} [cfgId=2] - 广告配置ID（2=大厅道具奖励，3=体力奖励）
     * @returns {Promise<any | null>} 成功返回领取结果（reward/noticeid）；失败返回 null
     */
    async reqReceiveAdReward(cfgId: number = 2): Promise<any | null> {
        const res = await this.callAdFunc("getAdReward", cfgId);
        if (res) {
            const rewardRes = res as AD_RECEIVE_REWARD_RESULT;
            const adRewardInfo = DataCenter.instance.getAdRewardInfo(rewardRes.cfgId);
            if (adRewardInfo) {
                adRewardInfo.currentRewardCount = rewardRes.currentRewardCount;
                adRewardInfo.canReward = rewardRes.currentRewardCount < rewardRes.maxDailyRewardCount;
            }
        }
        return res;
    }

    /**
     * @method callAdFunc
     * @description 统一调用 ad 活动接口并解析 result JSON（两个接口共用，替代原两套回调）
     * @param {string} funcName - 活动函数名
     * @param {number} cfgId - 广告配置ID
     * @returns {Promise<any | null>} 成功返回业务数据，服务端报错或业务失败返回 null
     * @private
     */
    private async callAdFunc(funcName: string, cfgId: number): Promise<any | null> {
        const result = await this.callLobby<SprotoCallActivityFunc.Response>(SprotoCallActivityFunc, {
            moduleName: "ad",
            funcName: funcName,
            args: JSON.stringify({ cfgId: cfgId }),
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
