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
     * @description 请求使用道具：发送道具使用请求到服务器，resp 作为临时闭包避免多次调用时回调覆盖
     * @param {number} itemId - 道具ID
     * @param {number} itemNums - 道具数量，默认为1
     * @param {(b:boolean, response?: SprotoLocalGameUseProps.Response)=>void} callBack - 回调函数
     */
    req(itemId: number, itemNums: number = 1, callBack?: (b: boolean, response?: SprotoLocalGameUseProps.Response) => void) {
        const param = { richType: itemId, richNums: itemNums };

        const resp = (result: SprotoLocalGameUseProps.Response) => {
            if (result && result.code === 1) {
                DataCenter.instance.updateRichByType(itemId, result.remainNums);
                Logger.log(LogColors.green(`本地游戏使用道具成功, 剩余: ${result.remainNums}`));
                callBack && callBack(true, result);
            } else {
                Logger.log(LogColors.red(`本地游戏使用道具失败: ${result?.msg || "未知错误"}`));
                callBack && callBack(false, result);
            }
        };

        if (LobbySocketManager.instance.isOpen()) {
            this.reqLobby(SprotoLocalGameUseProps, param, resp);
        } else {
            this.loginLobby((b: boolean) => {
                if (b) {
                    this.reqLobby(SprotoLocalGameUseProps, param, resp);
                } else {
                    Logger.log(LogColors.red("本地游戏使用道具失败: 大厅连接失败"));
                    callBack && callBack(false);
                }
            });
        }
    }

    /**
     * @method loginLobby
     * @description 登录游戏大厅
     * @param {function} callback - 登录回调函数
     * @private
     */
    private loginLobby(callback?: (b: boolean) => void): void {
        ConnectSvr.instance.checkAutoLogin(callback);
    }
}
