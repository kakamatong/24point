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
 * @constant STORAGE_KEY_SCORE
 * @description 本地缓存 key：最近一次已上报的分数（用于去重，避免重复写入）
 */
const STORAGE_KEY_SCORE = "openDataScore";

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
     * @property {boolean} _uploading - 是否正在上报，避免并发重复写入
     * @private
     */
    private _uploading: boolean = false;

    /**
     * @property {number} _pendingScore - 上报途中收到的最新分数，待当前完成后补写
     * @private
     */
    private _pendingScore: number | null = null;

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
     * @description 上报好友榜分数（匹配模式总积分）：与上次上报值不同即更新，变大变小都写
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

        const value = Math.floor(score);
        if (value === this.getLocalScore()) {
            /* 与上次上报值一致，无需重复写入 */
            callBack && callBack(true);
            return;
        }

        if (this._uploading) {
            /* 正在上报：记下最新值，待本次完成后补写，避免并发丢失 */
            this._pendingScore = value;
            callBack && callBack(false);
            return;
        }

        this.writeScore(value, callBack);
    }

    /**
     * @method writeScore
     * @description 真正写入托管数据，完成后若有挂起的新值则继续写入
     * @param {number} score 分数
     * @param {(ok: boolean) => void} [callBack] 完成回调
     * @private
     */
    private writeScore(score: number, callBack?: (ok: boolean) => void): void {
        this._uploading = true;
        MiniGameUtils.instance.setUserCloudStorage([{ key: OPEN_DATA_KEY_SCORE, value: String(score) }], (ok: boolean) => {
            this._uploading = false;
            if (ok) {
                this.setLocalScore(score);
            } else {
                Logger.warn("好友榜分数上报失败：", score);
            }
            callBack && callBack(ok);

            if (this._pendingScore !== null) {
                const next = this._pendingScore;
                this._pendingScore = null;
                if (next !== this.getLocalScore()) {
                    this.writeScore(next);
                }
            }
        });
    }

    /**
     * @method getLocalScore
     * @description 读取本地最近一次已上报的分数
     * @returns {number} 已上报分数，无记录返回 0
     * @private
     */
    private getLocalScore(): number {
        if (!MiniGameUtils.instance.isWeChatGame()) {
            return 0;
        }
        const value = wx && wx.getStorageSync && wx.getStorageSync(STORAGE_KEY_SCORE);
        return Number(value) || 0;
    }

    /**
     * @method setLocalScore
     * @description 记录最近一次已上报的分数
     * @param {number} score 已上报分数
     * @private
     */
    private setLocalScore(score: number): void {
        if (!MiniGameUtils.instance.isWeChatGame()) {
            return;
        }
        wx && wx.setStorageSync && wx.setStorageSync(STORAGE_KEY_SCORE, score);
    }
}
