/**
 * @file Auth.ts
 * @description 认证模块：处理用户登录认证
 * @category 网络请求模块
 */

import CryptoJS from "crypto-js";
import { DataCenter } from "@datacenter/Datacenter";
import { LogColors } from "@frameworks/Framework";
import { LobbySocketManager } from "@frameworks/LobbySocketManager";
import { UserData } from "./UserData";
import { UserRiches } from "./UserRiches";
import { UserStatus } from "./UserStatus";
import { CustomDESEncryptStr, Logger } from "@frameworks/utils/Utils";
import { AwardNotices } from "./AwardNotices";
import { BaseModule } from "@frameworks/base/BaseModule";

/**
 * @class Auth
 * @description 用户认证管理类，负责处理用户登录认证，使用单例模式
 * @category 网络请求模块
 * @singleton 单例模式
 */
export class Auth extends BaseModule {
    static get instance(): Auth {
        return this._getInstance<Auth>(Auth);
    }

    /** 认证请求时间戳 */
    private _time: number = 0;
    /** 认证回调函数 */
    private _callBack: ((b: boolean) => void) | null = null;

    /**
     * @description 请求用户认证
     * @param callBack 回调函数
     */
    req(callBack?: (b: boolean) => void) {
        if (callBack) {
            this._callBack = callBack;
        }
        LobbySocketManager.instance.loadProtocol("lobby", () => {
            const loginInfo = DataCenter.instance.getLoginInfo();
            const loginData = {
                device: "pc",
                version: "0.0.1",
                channel: "account",
                subid: loginInfo?.subid ?? "",
                time: Date.now(),
                username: loginInfo?.username ?? "",
            };
            let str = JSON.stringify(loginData);
            const secret = CryptoJS.enc.Hex.parse(loginInfo?.token ?? "");
            const token = CustomDESEncryptStr(str, secret);
            const urlToken = encodeURIComponent(token);
            const params = `ver=1&userid=${loginInfo?.userid ?? ""}&token=${urlToken}`;
            const authList = DataCenter.instance.authList;
            const addr = authList[loginInfo?.server ?? ""];

            const url = `${addr}?${params}`;
            // for(let i = 0; i < 200; i++){
            //     const s =new SocketManager()
            //     s.start(url, undefined, this.resp.bind(this))
            // }
            this._time = Date.now();
            Logger.log("auth url:", url);
            LobbySocketManager.instance.start(url, undefined, this.resp.bind(this));
        });
    }

    /**
     * @description 处理认证响应
     * @param success 认证是否成功
     */
    resp(success: boolean) {
        const dt = Date.now() - this._time;
        Logger.log("auth time:", dt / 1000);
        if (success) {
            DataCenter.instance.addSubid();
            Logger.log(LogColors.green("认证成功"));
            // 登录成功后并发拉取基础数据
            this.loadBaseData();

            this._callBack && this._callBack(true);
        } else {
            Logger.log("auth fail");
            this._callBack && this._callBack(false);
        }
    }

    /**
     * @method loadBaseData
     * @description 并发拉取登录后的基础数据（用户信息/财富/状态/奖励通知），
     *              单个失败只告警，不阻断登录流程
     * @private
     */
    private loadBaseData(): void {
        const onError = (name: string) => (err: any) => Logger.warn(`登录后拉取${name}失败:`, err);
        UserData.instance.req().catch(onError("用户信息"));
        UserRiches.instance.req().catch(onError("用户财富"));
        UserStatus.instance.req().catch(onError("用户状态"));
        AwardNotices.instance.req().catch(onError("奖励通知"));
    }
}
