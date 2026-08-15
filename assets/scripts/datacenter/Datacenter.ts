/**
 * @file Datacenter.ts
 * @description 数据中心：使用单例模式管理全局数据
 * @category 数据中心
 */

import { UserdataResponse, UserstatusResponse, UserenergyResponse } from "../../types/protocol/lobby/c2s";
import {
    LOGIN_INFO,
    USER_STATUS,
    LOCAL_KEY,
    DEFAULT_HEADURL,
    GAME_RECORD,
    LOGIN_TYPE,
    ENUM_CHANNEL_ID,
    ENUM_ENV,
    AD_REWARD_INFO,
} from "./InterfaceConfig";
import { sys } from "cc";

/**
 * @interface ENERGY_STATE
 * @description 能量状态计算结果
 */
export interface ENERGY_STATE {
    /** 是否已满 */
    isFull: boolean;
    /** 当前左体力值（基准 + 自动恢复） */
    currentLeft: number;
    /** 当前总体力（左体力 + 额外体力） */
    currentTotal: number;
    /** 距离下次恢复剩余秒数 */
    timeLeft: number;
}

/**
 * @class DataCenter
 * @description 数据中心，使用单例模式管理全局数据，包括用户信息、游戏数据、服务器地址等
 * @category 数据中心
 * @singleton 单例模式
 */
export class DataCenter {
    /**
     * @property {LOGIN_INFO | null} _loginInfo - 用户登录信息
     * @private
     */
    private _loginInfo: LOGIN_INFO | null = null;

    /**
     * @property {UserdataResponse | null} _userData - 用户数据
     * @private
     */
    private _userData: UserdataResponse | null = null;

    /**
     * @property {Array<{richType:number, richNums:number}>} _userRiches - 用户财富数据
     * @private
     */
    private _userRiches: Array<{ richType: number; richNums: number }> = [];

    /**
     * @property {UserenergyResponse | null} _userEnergy - 用户能量数据
     * @private
     */
    private _userEnergy: UserenergyResponse | null = null;

    /**
     * @property {UserstatusResponse | null} _userStatus - 用户状态信息
     * @private
     */
    private _userStatus: UserstatusResponse | null = null;

    /**
     * @property {any} _appConfig - 应用配置信息
     * @private
     */
    private _appConfig: any = null;

    /**
     * @property {string} _launchRoomid - 启动携带的roomid
     * @private
     */
    private _launchRoomid: number = 0;

    /**
     * @property {number} _gameid - 当前游戏ID
     * @private
     */
    private _gameid: number = 0;

    /**
     * @property {string} _roomid - 房间ID
     * @private
     */
    private _roomid: string = "";

    /**
     * @property {string} _gameAddr - 游戏服务器地址
     * @private
     */
    private _gameAddr: string = "";

    /**
     * 游戏网关url
     */
    private _gameGatewayUrl: string = "";

    /**
     * @property {number} _shortRoomid - 短房间ID
     * @private
     */
    private _shortRoomid: number = 0;

    /**
     * @property {Object.<string, string>} _authList - 认证服务器地址列表
     * @private
     */
    private _authList: { [key: string]: string } = {
        // 'gate1':'ws://192.168.1.140:9002',
        // 'gate2':'ws://192.168.1.140:9005',
    };

    /**
     * @property {Object.<string, string>} _gameAuthList - 游戏认证服务器地址列表
     * @private
     */
    private _gameAuthList: { [key: string]: string } = {
        // 'game1':'ws://192.168.1.140:9003',
        // 'game2':'ws://192.168.1.140:9006',
    };

    /**
     * @property {Object.<string, string>} _loginList - 登录服务器地址列表
     * @private
     */
    private _loginList: { [key: string]: string } = {
        // 'game1':'ws://192.168.1.140:9003',
        // 'game2':'ws://192.168.1.140:9006',
    };

    /**
     * @property {ENUM_CHANNEL_ID} _channelID - 当前渠道ID
     * @private
     */
    private _channelID: ENUM_CHANNEL_ID = ENUM_CHANNEL_ID.ACCOUNT;

    /**
     * @property {GAME_RECORD | null} _gameRecords - 游戏记录
     * @private
     */
    private _gameRecords: GAME_RECORD | null = null;

    /**
     * @property {boolean} _allreadyThirdLogin - 是否已完成第三方登录
     * @private
     */
    private _allreadyThirdLogin: boolean = false;

    /**
     * @property {Record<number, AD_REWARD_INFO>} _adRewardInfoMap - 广告奖励信息（按配置ID存储，支持并发管理）
     * @private
     */
    private _adRewardInfoMap: Record<number, AD_REWARD_INFO> = {};

    /**
     * @property {boolean} _shouldGotoChallenge - 从游戏场景返回后是否需要跳转到闯关页面
     * @private
     */
    private _shouldGotoChallenge: boolean = false;

    /**
     * @property {DataCenter} _instance - 单例实例
     * @private
     * @static
     */
    private static _instance: DataCenter;

    /**
     * @method instance
     * @description 获取DataCenter的单例实例
     * @static
     * @returns {DataCenter} DataCenter单例实例
     */
    public static get instance(): DataCenter {
        if (!this._instance) {
            this._instance = new DataCenter();
        }
        return this._instance;
    }

    /**
     * @constructor
     * @description 私有构造函数，初始化时从本地存储中加载登录信息
     * @private
     */
    private constructor() {
        const loginInfo = sys.localStorage.getItem(LOCAL_KEY.LOGIN_INFO);
        if (loginInfo) {
            this._loginInfo = JSON.parse(loginInfo);
        }
    }

    /**
     * @method appConfig
     * @description 设置应用配置信息
     * @param {any} config - 应用配置对象
     */
    set appConfig(config: any) {
        this._appConfig = config;
    }

    /**
     * @method appConfig
     * @description 获取应用配置信息
     * @returns {any} 应用配置对象
     */
    get appConfig() {
        return this._appConfig;
    }

    /**
     * @method setLoginInfo
     * @description 设置用户登录信息，并持久化到本地存储
     * @param {LOGIN_INFO} info - 登录信息对象
     */
    setLoginInfo(info: LOGIN_INFO) {
        this._loginInfo = info;
        sys.localStorage.setItem(LOCAL_KEY.LOGIN_INFO, JSON.stringify(info));
    }

    /**
     * @method getLoginInfo
     * @description 获取用户登录信息
     * @returns {LOGIN_INFO | null} 登录信息对象，未登录时返回null
     */
    getLoginInfo(): LOGIN_INFO | null {
        return this._loginInfo;
    }

    /**
     * @method addSubid
     * @description 增加登录信息的subid，传入则设置，未传入则自增1，并持久化到本地存储
     * @param {number} [subid] - 要设置的subid值，传入时直接设置
     */
    addSubid(subid?: number) {
        subid ? this._loginInfo && (this._loginInfo.subid = subid) : this._loginInfo && this._loginInfo.subid++;
        sys.localStorage.setItem(LOCAL_KEY.LOGIN_INFO, JSON.stringify(this._loginInfo));
    }

    /**
     * @method userid
     * @description 获取当前登录用户的ID
     * @returns {number} 用户ID，未登录时返回0
     */
    get userid(): number {
        return this._loginInfo?.userid ?? 0;
    }

    /**
     * @method userData
     * @description 设置用户数据
     * @param {UserdataResponse} data - 用户数据对象
     */
    set userData(data: UserdataResponse) {
        this._userData = data;
    }

    /**
     * @method userData
     * @description 获取用户数据
     * @returns {UserdataResponse | null} 用户数据对象，未获取时返回null
     */
    get userData(): UserdataResponse | null {
        return this._userData;
    }

    /**
     * @method headurl
     * @description 设置用户头像URL
     * @param {string} url - 头像URL
     */
    set headurl(url: string) {
        if (this._userData) {
            this._userData.headurl = url;
        }
    }

    /**
     * @method headurl
     * @description 获取用户头像URL，未设置时返回默认头像
     * @returns {string} 头像URL
     */
    get headurl(): string {
        if (!this._userData?.headurl) {
            return DEFAULT_HEADURL;
        } else {
            return this._userData?.headurl;
        }
    }

    /**
     * @method userRiches
     * @description 设置用户财富列表
     * @param {Array<{richType:number, richNums:number}>} data - 财富数据数组
     */
    set userRiches(data: Array<{ richType: number; richNums: number }>) {
        this._userRiches = data;
    }

    /**
     * @method userRiches
     * @description 获取用户财富列表
     * @returns {Array<{richType:number, richNums:number}>} 财富数据数组
     */
    get userRiches() {
        return this._userRiches;
    }

    /**
     * @method userEnergy
     * @description 设置用户能量数据
     * @param {UserenergyResponse} data - 能量数据
     */
    set userEnergy(data: UserenergyResponse) {
        this._userEnergy = data;
    }

    /**
     * @method userEnergy
     * @description 获取用户能量数据
     * @returns {UserenergyResponse | null} 能量数据
     */
    get userEnergy(): UserenergyResponse | null {
        return this._userEnergy;
    }

    /**
     * @method updateLeftEnergy
     * @description 更新左体力值（用于自动恢复计时器更新）
     * @param {number} value - 新的左体力值
     */
    updateLeftEnergy(value: number): void {
        if (this._userEnergy) {
            this._userEnergy.leftEnergy = value;
        }
    }

    /**
     * @method getCurrentEnergyState
     * @description 获取当前能量状态，根据服务端基准数据和经过时间自动计算恢复量，
     *              同时更新 _userEnergy.leftEnergy 为最新值（含自动恢复增量）
     * @returns {ENERGY_STATE} 能量状态对象
     */
    getCurrentEnergyState(): ENERGY_STATE {
        if (!this._userEnergy) {
            return { isFull: true, currentLeft: 0, currentTotal: 0, timeLeft: 0 };
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const recoverySecs = 3600 / this._userEnergy.rate;
        const elapsed = Math.max(0, nowSec - this._userEnergy.updateTime);
        const recovered = Math.floor(elapsed / recoverySecs);
        const currentLeft = Math.min(this._userEnergy.leftEnergy + recovered, this._userEnergy.maxEnergy);
        const currentTotal = currentLeft + (this._userEnergy.extraEnergy ?? 0);
        const isFull = currentTotal >= this._userEnergy.maxEnergy;

        let timeLeft = 0;
        if (!isFull) {
            const nextRecoverSec = this._userEnergy.updateTime + (recovered + 1) * recoverySecs;
            timeLeft = Math.max(0, nextRecoverSec - nowSec);
        }

        // 回写基准数据时必须同步推进 updateTime，否则每次调用都会把 recovered 重复累加到 leftEnergy（每次调用 +1/秒）
        if (recovered > 0) {
            this._userEnergy.updateTime += recovered * recoverySecs;
        }
        this._userEnergy.leftEnergy = currentLeft;

        return { isFull, currentLeft, currentTotal, timeLeft };
    }



    /**
     * @method addRichByType
     * @description 按类型增加财富数量
     * @param {number} type - 财富类型
     * @param {number} nums - 要增加的数量
     */
    addRichByType(type: number, nums: number) {
        const item = this._userRiches.find((rich) => rich.richType === type);
        item && (item.richNums += nums);
    }

    /**
     * @method updateRichByType
     * @description 按类型更新财富数量（直接覆盖）
     * @param {number} type - 财富类型
     * @param {number} nums - 新的数量
     */
    updateRichByType(type: number, nums: number) {
        const item = this._userRiches.find((rich) => rich.richType === type);
        item && (item.richNums = nums);
    }

    /**
     * @method getRichByType
     * @description 按类型获取财富数据
     * @param {number} type - 财富类型
     * @returns {{richType:number, richNums:number} | undefined} 财富数据，未找到时返回undefined
     */
    getRichByType(type: number): { richType: number; richNums: number } | undefined {
        return this._userRiches.find((rich) => rich.richType === type);
    }

    /**
     * @method userStatus
     * @description 设置用户状态信息
     * @param {UserstatusResponse} data - 用户状态对象
     */
    set userStatus(data: UserstatusResponse) {
        this._userStatus = data;
    }

    /**
     * @method userStatus
     * @description 获取用户状态信息
     * @returns {UserstatusResponse | null} 用户状态对象，未获取时返回null
     */
    get userStatus(): UserstatusResponse | null {
        return this._userStatus;
    }

    /**
     * @method gameid
     * @description 设置当前游戏ID
     * @param {number} id - 游戏ID
     */
    set gameid(id: number) {
        this._gameid = id;
    }

    /**
     * @method gameid
     * @description 获取当前游戏ID
     * @returns {number} 游戏ID
     */
    get gameid(): number {
        return this._gameid;
    }

    /**
     * @method roomid
     * @description 设置当前房间ID
     * @param {string} id - 房间ID
     */
    set roomid(id: string) {
        this._roomid = id;
    }

    /**
     * @method roomid
     * @description 获取当前房间ID
     * @returns {string} 房间ID
     */
    get roomid(): string {
        return this._roomid;
    }

    /**
     * @method gameAddr
     * @description 设置游戏服务器地址
     * @param {string} addr - 服务器地址
     */
    set gameAddr(addr: string) {
        this._gameAddr = addr;
    }

    /**
     * @method gameAddr
     * @description 获取游戏服务器地址
     * @returns {string} 游戏服务器地址
     */
    get gameAddr(): string {
        return this._gameAddr;
    }

    /**
     * @method gameGatewayUrl
     * @description 设置游戏网关地址
     */
    set gameGatewayUrl(url: string) {
        this._gameGatewayUrl = url;
    }

    /**
     * @method gameGatewayUrl
     * @description 获取游戏网关地址
     * @returns 游戏服务网关地址
     */
    get gameGatewayUrl() {
        return this._gameGatewayUrl;
    }

    /**
     * @method authList
     * @description 设置认证服务器地址列表
     * @param {Object.<string, string>} list - 认证服务器地址映射表
     */
    set authList(list: { [key: string]: string }) {
        this._authList = list;
    }

    /**
     * @method authList
     * @description 获取认证服务器地址列表
     * @returns {Object.<string, string>} 认证服务器地址映射表
     */
    get authList(): { [key: string]: string } {
        return this._authList;
    }

    /**
     * @method loginList
     * @description 设置登录服务器地址列表
     * @param {Object.<string, string>} list - 登录服务器地址映射表
     */
    set loginList(list: { [key: string]: string }) {
        this._loginList = list;
    }

    /**
     * @method loginList
     * @description 获取登录服务器地址列表
     * @returns {Object.<string, string>} 登录服务器地址映射表
     */
    get loginList(): { [key: string]: string } {
        return this._loginList;
    }

    /**
     * @method gameAuthList
     * @description 设置游戏认证服务器地址列表
     * @param {Object.<string, string>} list - 游戏认证服务器地址映射表
     */
    set gameAuthList(list: { [key: string]: string }) {
        this._gameAuthList = list;
    }

    /**
     * @method gameAuthList
     * @description 获取游戏认证服务器地址列表
     * @returns {Object.<string, string>} 游戏认证服务器地址映射表
     */
    get gameAuthList(): { [key: string]: string } {
        return this._gameAuthList;
    }

    /**
     * @method loginToken
     * @description 获取当前登录令牌
     * @returns {string} 登录令牌，未登录时返回空字符串
     */
    get loginToken(): string {
        return this._loginInfo?.token ?? "";
    }

    /**
     * @method subid
     * @description 获取当前登录的subid
     * @returns {number} subid值，未登录时返回0
     */
    get subid() {
        return this._loginInfo?.subid ?? 0;
    }

    /**
     * @method shortRoomid
     * @description 获取短房间ID
     * @returns {number} 短房间ID
     */
    get shortRoomid() {
        return this._shortRoomid;
    }

    /**
     * @method shortRoomid
     * @description 设置短房间ID
     * @param {number} id - 短房间ID
     */
    set shortRoomid(id: number) {
        this._shortRoomid = id;
    }

    /**
     * @method gameRecords
     * @description 设置游戏记录
     * @param {GAME_RECORD} data - 游戏记录数据
     */
    set gameRecords(data: GAME_RECORD) {
        this._gameRecords = data;
    }

    /**
     * @method gameRecords
     * @description 获取游戏记录
     * @returns {GAME_RECORD | null} 游戏记录数据，未获取时返回null
     */
    get gameRecords(): GAME_RECORD | null {
        return this._gameRecords;
    }

    /**
     * @method channelID
     * @description 设置当前渠道ID
     * @param {ENUM_CHANNEL_ID} id - 渠道ID枚举值
     */
    set channelID(id: ENUM_CHANNEL_ID) {
        this._channelID = id;
    }

    /**
     * @method channelID
     * @description 获取当前渠道ID
     * @returns {ENUM_CHANNEL_ID} 渠道ID枚举值
     */
    get channelID(): ENUM_CHANNEL_ID {
        return this._channelID;
    }

    /**
     * @method allreadyThirdLogin
     * @description 设置是否已完成第三方登录
     * @param {boolean} b - 是否已完成第三方登录
     */
    set allreadyThirdLogin(b: boolean) {
        this._allreadyThirdLogin = b;
    }

    /**
     * @method allreadyThirdLogin
     * @description 获取是否已完成第三方登录
     * @returns {boolean} 是否已完成第三方登录
     */
    get allreadyThirdLogin(): boolean {
        return this._allreadyThirdLogin;
    }

    /**
     * @method channelLoginType
     * @description 获取当前渠道的登录类型字符串
     * @returns {string} 渠道对应的登录类型名称
     */
    get channelLoginType(): string {
        return LOGIN_TYPE[this._channelID];
    }

    /**
     * @method isEnvDev
     * @description 判断当前是否为开发环境
     * @returns {boolean} 开发环境返回true，否则返回false
     */
    isEnvDev(): boolean {
        return this.appConfig.env === ENUM_ENV.DEV;
    }

    /**
     * @method isEnvProd
     * @description 判断当前是否为生产环境
     * @returns {boolean} 生产环境返回true，否则返回false
     */
    isEnvProd(): boolean {
        return this.appConfig.env === ENUM_ENV.PROD;
    }

    /**
     * @method launchRoomid
     * @description 获取启动时携带的房间ID
     * @returns {number} 房间ID
     */
    get launchRoomid(): number {
        return this._launchRoomid;
    }

    /**
     * @method launchRoomid
     * @description 设置启动时携带的房间ID
     * @param {number} id - 房间ID
     */
    set launchRoomid(id: number) {
        this._launchRoomid = id;
    }

    /**
     * @method setAdRewardInfo
     * @description 按配置ID设置广告奖励信息
     * @param {number} cfgId - 广告配置ID
     * @param {AD_REWARD_INFO} data - 广告奖励信息
     */
    setAdRewardInfo(cfgId: number, data: AD_REWARD_INFO): void {
        this._adRewardInfoMap[cfgId] = data;
    }

    /**
     * @method getAdRewardInfo
     * @description 按配置ID获取广告奖励信息
     * @param {number} cfgId - 广告配置ID
     * @returns {AD_REWARD_INFO | undefined} 广告奖励信息，未获取时返回undefined
     */
    getAdRewardInfo(cfgId: number): AD_REWARD_INFO | undefined {
        return this._adRewardInfoMap[cfgId];
    }

    /**
     * @property {boolean} shouldGotoChallenge - 从游戏场景返回后是否需要跳转到闯关页面
     */
    get shouldGotoChallenge(): boolean {
        return this._shouldGotoChallenge;
    }
    set shouldGotoChallenge(v: boolean) {
        this._shouldGotoChallenge = v;
    }
}
