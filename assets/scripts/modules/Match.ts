/**
 * @file Match.ts
 * @description 游戏匹配模块：处理游戏匹配和匹配退出操作
 * @category 网络请求模块
 */

import { LogColors } from "@frameworks/Framework";
import { UserStatus } from "./UserStatus";
import { SprotoMatchJoin, SprotoMatchLeave } from "../../types/protocol/lobby/c2s";
import { BaseModule } from "@frameworks/base/BaseModule";
import { MAIN_GAME_ID } from "@datacenter/InterfaceConfig";
import { Logger } from "@frameworks/utils/Utils";
import { LobbySocketManager } from "@frameworks/LobbySocketManager";
import { ConnectSvr } from "./ConnectSvr";

/**
 * @class Match
 * @description 游戏匹配管理类，负责处理游戏匹配逻辑，使用单例模式
 * @category 网络请求模块
 * @singleton 单例模式
 */
export class Match extends BaseModule {
    static get instance(): Match {
        return this._getInstance<Match>(Match);
    }

    /**
     * @method req
     * @description 请求游戏匹配：未连接大厅时先自动登录，登录失败返回 null（等价于原回调 false 且无数据）
     * @param {number} [type=0] - 匹配类型（预留参数，当前服务端按 queueid 区分）
     * @returns {Promise<SprotoMatchJoin.Response | null>} 服务器返回的匹配结果；未发起请求时返回 null
     */
    async req(type = 0): Promise<SprotoMatchJoin.Response | null> {
        if (!LobbySocketManager.instance.isOpen()) {
            const ok = await this.loginLobby();
            if (!ok) {
                Logger.warn("匹配失败：大厅连接不可用");
                return null;
            }
        }

        const result = await this.callLobby<SprotoMatchJoin.Response>(SprotoMatchJoin, { gameid: MAIN_GAME_ID, queueid: 1 });
        // 匹配会改变用户状态，无论成败都刷新一次
        this.refreshUserStatus();

        if (result && result.code == 1) {
            Logger.log(LogColors.green(result.msg));
        } else {
            result && Logger.log(LogColors.red(result.msg));
        }
        return result;
    }

    /**
     * @method reqLeave
     * @description 请求退出匹配
     * @returns {Promise<SprotoMatchLeave.Response>} 服务器返回的退出匹配结果（业务成败看 code）
     */
    async reqLeave(): Promise<SprotoMatchLeave.Response> {
        const result = await this.callLobby<SprotoMatchLeave.Response>(SprotoMatchLeave, { gameid: MAIN_GAME_ID, queueid: 1 });
        this.refreshUserStatus();
        return result;
    }

    /**
     * @method loginLobby
     * @description 登录游戏大厅（把 ConnectSvr 的回调式自动登录包装为 Promise）
     * @returns {Promise<boolean>} 是否登录成功
     * @protected
     */
    protected loginLobby(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            ConnectSvr.instance.checkAutoLogin((b: boolean) => {
                resolve(b);
            });
        });
    }

    /**
     * @method refreshUserStatus
     * @description 刷新用户状态（失败只告警，不阻断匹配主流程）
     * @private
     */
    private refreshUserStatus(): void {
        UserStatus.instance.req().catch((err) => Logger.warn("刷新用户状态失败:", err));
    }
}
