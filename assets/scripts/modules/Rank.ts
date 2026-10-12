/**
 * @file Rank.ts
 * @description 排行榜模块：处理排行榜数据的请求
 * @category 网络请求模块
 */

import { LogColors } from "@frameworks/Framework";
import { SprotoCallActivityFunc } from "../../types/protocol/lobby/c2s";
import { BaseModule } from "@frameworks/base/BaseModule";
import { MAIN_GAME_ID } from "@datacenter/InterfaceConfig";
import { Logger } from "@frameworks/utils/Utils";

/**
 * @class Rank
 * @description 排行榜管理类，负责请求排行榜数据
 * @category 网络请求模块
 */
export class Rank extends BaseModule {
    static get instance(): Rank {
        return this._getInstance<Rank>(Rank);
    }

    /**
     * @method req
     * @description 请求排行榜数据：服务端 result 为 JSON 字符串，内部解析后返回
     * @returns {Promise<any | null>} 成功返回排行榜业务数据；服务端报错或业务失败返回 null
     */
    async req(): Promise<any | null> {
        const result = await this.callLobby<SprotoCallActivityFunc.Response>(SprotoCallActivityFunc, {
            moduleName: "gameRank",
            funcName: "getRankList",
            args: JSON.stringify({ gameid: MAIN_GAME_ID }),
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
