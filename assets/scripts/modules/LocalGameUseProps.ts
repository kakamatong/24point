/**
 * @file LocalGameUseProps.ts
 * @description 本地游戏道具模块：处理本地游戏中使用道具的请求
 * @category 网络请求模块
 */

import { DataCenter } from "@datacenter/Datacenter";
import { LogColors } from "@frameworks/Framework";
import { Logger } from "@frameworks/utils/Utils";
import { BaseModule } from "@frameworks/base/BaseModule";
import { LobbySocketManager } from "@frameworks/LobbySocketManager";
import { SprotoLocalGameUseProps } from "../../types/protocol/lobby/c2s";
import { ConnectSvr } from "./ConnectSvr";

/**
 * @class LocalGameUseProps
 * @description 本地游戏道具管理类，负责处理本地游戏中使用道具的逻辑，使用单例模式
 * @category 网络请求模块
 * @singleton 单例模式
 */
export class LocalGameUseProps extends BaseModule {
    static get instance(): LocalGameUseProps {
        return this._getInstance<LocalGameUseProps>(LocalGameUseProps);
    }

    /**
     * @method req
     * @description 请求使用道具：未连接大厅时先自动登录，登录失败返回 null
     * @param {number} itemId - 道具ID
     * @param {number} [itemNums=1] - 道具数量
     * @returns {Promise<SprotoLocalGameUseProps.Response | null>} 服务端返回的使用结果（业务成败看 code）；未发起请求时返回 null
     */
    async req(itemId: number, itemNums: number = 1): Promise<SprotoLocalGameUseProps.Response | null> {
        const param = { richType: itemId, richNums: itemNums };

        if (!LobbySocketManager.instance.isOpen()) {
            const ok = await this.loginLobby();
            if (!ok) {
                Logger.log(LogColors.red("本地游戏使用道具失败: 大厅连接失败"));
                return null;
            }
        }

        const result = await this.callLobby<SprotoLocalGameUseProps.Response>(SprotoLocalGameUseProps, param);
        if (result && result.code === 1) {
            DataCenter.instance.updateRichByType(itemId, result.remainNums);
            Logger.log(LogColors.green(`本地游戏使用道具成功, 剩余: ${result.remainNums}`));
        } else {
            Logger.log(LogColors.red(`本地游戏使用道具失败: ${result?.msg || "未知错误"}`));
        }
        return result;
    }

    /**
     * @method loginLobby
     * @description 登录游戏大厅（把 ConnectSvr 的回调式自动登录包装为 Promise）
     * @returns {Promise<boolean>} 是否登录成功
     * @private
     */
    private loginLobby(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            ConnectSvr.instance.checkAutoLogin((b: boolean) => {
                resolve(b);
            });
        });
    }
}
