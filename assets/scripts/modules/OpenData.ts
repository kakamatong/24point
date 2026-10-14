/**
 * @file OpenData.ts
 * @description 开放数据域业务模块：托管数据（好友榜分数 = 匹配模式总积分）上报
 * @category 网络请求模块
 */

import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";
import { Logger } from "@frameworks/utils/Utils";

/**
 * @constant OPEN_DATA_KEY_SCORE
 * @description 托管数据 key：好友榜总分（匹配模式总积分）
 */
export const OPEN_DATA_KEY_SCORE = "score";

/**
 * @class OpenData
 * @description 开放数据域业务模块：把匹配模式总积分托管到微信（好友排行榜的数据来源）
 * @category 网络请求模块
 */
export class OpenData {
    /**
     * @property {OpenData | null} _instance - 单例实例
     * @private
     * @static
     */
    private static _instance: OpenData | null = null;

    /**
     * @method instance
     * @description 获取 OpenData 的单例实例
     * @returns {OpenData} OpenData 单例实例
     * @static
     */
    public static get instance(): OpenData {
        if (!this._instance) {
            this._instance = new OpenData();
        }
        return this._instance;
    }

    /**
     * @method setScore
     * @description 上报好友榜分数（匹配模式总积分）：每次设置都直接写入微信托管数据，
     *              **不做本地缓存去重**，保证微信侧数据与当前积分一致（变大变小都更新）
     * @param {number} score 最新匹配模式总积分
     * @param {(ok: boolean) => void} [callBack] 完成回调
     */
    public setScore(score: number, callBack?: (ok: boolean) => void): void {
        if (!MiniGameUtils.instance.isOpenDataSupported()) {
            callBack && callBack(false);
            return;
        }

        if (!Number.isFinite(score)) {
            callBack && callBack(false);
            return;
        }

        const value = Math.max(0, Math.floor(score));
        MiniGameUtils.instance.setUserCloudStorage([{ key: OPEN_DATA_KEY_SCORE, value: String(value) }], (ok: boolean) => {
            if (!ok) {
                Logger.warn("好友榜分数上报失败：", value);
            }
            callBack && callBack(ok);
        });
    }
}
