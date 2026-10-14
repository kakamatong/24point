import { sys } from "cc";
import { DispatchEvent } from "../../Framework";
import { REWORD_VIDEOAD_CODE } from "../../config/Config";
import { FW_EVENT_NAMES } from "../../config/Config";
import { Logger } from "../Utils";

export class MiniGameUtils {
    /**
     * @property {string} SCOPE_FRIEND_INTERACTION
     * @description 关系链（好友数据）授权 scope，开放数据域好友榜/好友列表需要
     * @static
     */
    public static readonly SCOPE_FRIEND_INTERACTION = "scope.WxFriendInteraction";

    private _userInfoBtn: any | null = null;

    private _canvas: HTMLCanvasElement | null = null;

    /**
     * 视频广告list
     */
    private _rewardedVideoAdList: Record<string, any> = {};

    /**
     * 插屏广告list
     */
    private _interstitialAdList: Record<string, any> = {};

    /**
     * 视频广告回调函数
     */
    private _rewardedVideoAdCallBack: ((code: number) => void) | null = null;

    /**
     * @property {HTMLCanvasElement} _canvas - 画布
     * @private
     */
    private _canvasContext: CanvasRenderingContext2D | null = null;
    /**
     * @property {MiniGameUtils} _instance - 单例实例
     * @private
     * @static
     */
    private static _instance: MiniGameUtils;

    /**
     * @method instance
     * @description 获取MiniGameUtils的单例实例
     * @static
     * @returns {MiniGameUtils} MiniGameUtils单例实例
     */
    public static get instance(): MiniGameUtils {
        if (!this._instance) {
            this._instance = new MiniGameUtils();
        }
        return this._instance;
    }

    constructor() {
        this.init();
    }

    init() {
        if (this.isWeChatGame()) {
            wx &&
                wx.onShow((res: any) => {
                    Logger.log("App Show", res);
                    DispatchEvent(FW_EVENT_NAMES.ON_SHOW, res);
                });

            const key = "adunit-51ac86a12a85009b";
            this.createRewardedVideoAd(key);

            const key2 = "adunit-cfaba8598989ee54";
            this.createRewardedVideoAd(key2);
        }
    }

    isThirdPlatform(): boolean {
        return this.isWeChatGame();
    }

    isWeChatGame(): boolean {
        return sys.platform === sys.Platform.WECHAT_GAME;
    }

    request(url: string, method: string, headers: any, body: any): Promise<any> {
        if (this.isWeChatGame()) {
            return new Promise((resolve, reject) => {
                wx &&
                    wx.request({
                        url: url,
                        method: method,
                        header: headers,
                        data: body != null ? JSON.stringify(body) : undefined,
                        success: (res: any) => {
                            resolve(res.data);
                        },
                        fail: (res: any) => {
                            reject(res);
                        },
                    });
            });
        }

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: method,
                headers: headers,
                body: body != null ? JSON.stringify(body) : undefined,
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    resolve(data);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    login(data?: any, callBack?: (success: boolean, data?: any) => void) {
        if (this.isWeChatGame()) {
            wx &&
                wx.login({
                    timeout: 5000,
                    success: (data: any) => {
                        callBack && callBack(true, data.code);
                    },

                    fail: (errMsg: string, errno: number) => {
                        callBack && callBack(false, { errMsg: errMsg, errno: errno });
                    },
                });
        }
    }

    requirePrivacyAuthorize(callBack1: (success: boolean) => void, callBack2: (resolve: Function) => void) {
        if (this.isWeChatGame()) {
            wx &&
                wx.onNeedPrivacyAuthorization((resolve: any, eventInfo: any) => {
                    Logger.log("触发本次事件的接口是：" + eventInfo.referrer);
                    callBack2 && callBack2(resolve);
                });

            wx &&
                wx.requirePrivacyAuthorize({
                    success: () => {
                        callBack1 && callBack1(true);
                    },
                    fail: () => {
                        callBack1 && callBack1(false);
                    },
                });
        }
    }

    openPrivacyContract(data?: any) {
        if (this.isWeChatGame()) {
            wx &&
                wx.openPrivacyContract({
                    success: (res: any) => {
                        Logger.log("隐私协议成功打开");
                    },
                    fail: (res: any) => {
                        Logger.log("隐私协议打开失败");
                    },
                });
        }
    }

    getSystemInfoSync() {
        if (this.isWeChatGame()) {
            return wx && wx.getSystemInfoSync();
        } else {
            return { screenWidth: 0, screenHeight: 0 };
        }
    }

    /**
     * 获取窗口信息
     * @returns {any} 窗口信息对象
     */
    getWindowInfo(): any {
        if (this.isWeChatGame()) {
            return wx && wx.getWindowInfo();
        } else {
            // 非微信小游戏环境，返回默认值
            return {
                windowWidth: window.innerWidth || 0,
                windowHeight: window.innerHeight || 0,
                pixelRatio: 1,
                screenWidth: window.screen?.width || 0,
                screenHeight: window.screen?.height || 0,
                statusBarHeight: 0,
                safeArea: {
                    left: 0,
                    right: window.innerWidth || 0,
                    top: 0,
                    bottom: window.innerHeight || 0,
                    width: window.innerWidth || 0,
                    height: window.innerHeight || 0,
                },
            };
        }
    }

    /**
     * 获取顶部安全区域高度（状态栏高度）
     * @returns {number} 顶部安全区域高度，如果没有安全区域则返回0
     */
    getSafeAreaTopHeight(): number {
        const windowInfo = this.getWindowInfo();

        if (windowInfo.safeArea) {
            // 计算顶部安全区域高度 = safeArea.top
            return windowInfo.safeArea.top || 0;
        }

        return 0;
    }

    createUserInfoButton(data: any) {
        if (this.isWeChatGame()) {
            if (!this._userInfoBtn) {
                Logger.log("创建按钮");
                this._userInfoBtn =
                    wx &&
                    wx.createUserInfoButton({
                        type: "image",
                        image: "",
                        style: {
                            left: data.left,
                            top: data.top,
                            width: data.width,
                            height: data.height,
                            backgroundColor: "",
                            color: "",
                            textAlign: "center",
                            fontSize: 16,
                            borderRadius: 4,
                        },
                    });

                this._userInfoBtn.onTap((res: any) => {
                    Logger.log("用户点击了按钮");
                    if (res.userInfo) {
                        data.callBack && data.callBack(res.userInfo);
                    } else {
                        data.callBack && data.callBack(null);
                    }
                });
                this._userInfoBtn.show();
            }
        }
    }

    destroyUserInfoButton() {
        if (this._userInfoBtn) {
            this._userInfoBtn.destroy();
            this._userInfoBtn = null;
        }
    }

    /**
     * @method shareAppMessage
     * @description 主动拉起转发（进入选择通讯录界面）；定向分享给指定好友请走开放数据域 wx.shareMessageToFriend
     * @param {object} data 转发参数
     * @param {string} data.title 转发标题
     * @param {string} data.imageUrl 转发图片（本地图片路径；网络图片需先用 downloadFile 下载到本地）
     * @param {string} data.query 启动参数，格式 key1=val1&key2=val2
     * @param {string} [data.imageUrlId] 审核通过的转发图片编号（仅在自定义分享图被封禁时使用）
     * @param {boolean} [data.toCurrentGroup] 是否转发到当前群（仅从群工具栏打开的场景有效）
     */
    shareAppMessage(data: { title: string; imageUrl: string; query: string; imageUrlId?: string; toCurrentGroup?: boolean }): void {
        if (this.isWeChatGame()) {
            wx &&
                wx.shareAppMessage({
                    title: data.title,
                    imageUrl: data.imageUrl,
                    query: data.query,
                    imageUrlId: data.imageUrlId,
                    toCurrentGroup: data.toCurrentGroup,
                });
        }
    }

    /**
     * @method getOpenDataContext
     * @description 获取开放数据域（子域）上下文，是主域与子域通信的唯一入口
     * @returns {any | null} 开放数据域上下文；非微信小游戏环境返回 null
     */
    getOpenDataContext(): any | null {
        if (this.isWeChatGame()) {
            return wx && wx.getOpenDataContext();
        }
        return null;
    }

    /**
     * @method postMessageToOpenData
     * @description 向开放数据域（子域）发送消息
     * @param {any} message 消息体，约定包含 type 字段用于子域分发（如 type: "engine" 为引擎视口消息）
     */
    postMessageToOpenData(message: any): void {
        const openDataContext = this.getOpenDataContext();
        openDataContext && openDataContext.postMessage(message);
    }

    /**
     * @method setUserCloudStorage
     * @description 上报当前用户的托管数据（主域、子域均可调用），是好友排行榜的数据来源
     * @param {Array<{key: string; value: string}>} kvDataList 键值列表；每项 key+value 不超过 1KB，key 不超过 128 字节，单用户最多 128 项
     * @param {(success: boolean) => void} [callBack] 完成回调，true 表示上报成功
     */
    setUserCloudStorage(kvDataList: Array<{ key: string; value: string }>, callBack?: (success: boolean) => void): void {
        if (this.isWeChatGame()) {
            wx &&
                wx.setUserCloudStorage({
                    KVDataList: kvDataList,
                    success: () => {
                        callBack && callBack(true);
                    },
                    fail: (res: any) => {
                        Logger.error("托管数据上报失败", res);
                        callBack && callBack(false);
                    },
                });
        } else {
            callBack && callBack(true);
        }
    }

    /**
     * @method removeUserCloudStorage
     * @description 删除当前用户托管数据中指定字段的数据（主域、子域均可调用）
     * @param {string[]} keyList 需要删除的 key 列表
     * @param {(success: boolean) => void} [callBack] 完成回调
     */
    removeUserCloudStorage(keyList: string[], callBack?: (success: boolean) => void): void {
        if (this.isWeChatGame()) {
            wx &&
                wx.removeUserCloudStorage({
                    keyList: keyList,
                    success: () => {
                        callBack && callBack(true);
                    },
                    fail: (res: any) => {
                        Logger.error("托管数据删除失败", res);
                        callBack && callBack(false);
                    },
                });
        } else {
            callBack && callBack(true);
        }
    }

    /**
     * @method setMessageToFriendQuery
     * @description 设置子域定向分享（wx.shareMessageToFriend）卡片携带的 query，必须在游戏域调用
     * @param {number} scene 代表场景的数字，取值 0 - 50（接收方通过 shareMessageToFriendScene 读取）
     * @param {string} query 需要传递的字符串，长度不超过 128 字节；含 ? 与 & 等特殊符号需自行 encodeURIComponent
     * @returns {boolean} 是否设置成功
     */
    setMessageToFriendQuery(scene: number, query: string): boolean {
        if (this.isWeChatGame()) {
            return !!(wx && wx.setMessageToFriendQuery({ shareMessageToFriendScene: scene, query: query }));
        }
        return false;
    }

    /**
     * @method getShareEnterQuery
     * @description 解析「定向分享卡片」进入游戏的参数（冷启动与热启动均适用）
     * @returns {{scene: number; query: string} | null} 非定向分享进入时返回 null
     */
    getShareEnterQuery(): { scene: number; query: string } | null {
        const options = this.getEnterOptionsSync();
        const query = options && options.query;
        if (query && query.shareMessageToFriendScene !== undefined && query.query !== undefined) {
            return { scene: Number(query.shareMessageToFriendScene), query: String(query.query) };
        }
        return null;
    }

    /**
     * @method getEnterOptionsSync
     * @description 获取本次启动参数（含定向分享进入时的 shareMessageToFriendScene 与 query）
     * @returns {any} 启动参数对象
     */
    getEnterOptionsSync(): any {
        if (this.isWeChatGame()) {
            return (wx && wx.getEnterOptionsSync && wx.getEnterOptionsSync()) || (wx && wx.getLaunchOptionsSync && wx.getLaunchOptionsSync()) || {};
        }
        return {};
    }

    /**
     * @method downloadFile
     * @description 下载远程文件到本地（如分享图：定向分享的 imageUrl 不支持网络图片，需先下载再传本地路径给子域）
     * @param {string} url 远程文件地址
     * @returns {Promise<string>} 本地临时文件路径
     */
    downloadFile(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.isWeChatGame()) {
                resolve(url);
                return;
            }

            wx &&
                wx.downloadFile({
                    url: url,
                    success: (res: any) => {
                        if (res && res.statusCode === 200 && res.tempFilePath) {
                            resolve(res.tempFilePath);
                        } else {
                            reject(res);
                        }
                    },
                    fail: (res: any) => {
                        reject(res);
                    },
                });
        });
    }

    /**
     * @method showShareMenu
     * @description 显示转发菜单（需要群标识时需开启 shareTicket）
     * @param {boolean} [withShareTicket] 是否开启 shareTicket，默认 true
     */
    showShareMenu(withShareTicket: boolean = true): void {
        if (this.isWeChatGame()) {
            wx && wx.showShareMenu && wx.showShareMenu({ withShareTicket: withShareTicket });
        }
    }

    /**
     * @method checkSDKVersion
     * @description 判断当前基础库版本是否不低于指定版本
     * @param {string} minVersion 最低版本号，形如 "2.9.0"
     * @returns {boolean} true 表示满足
     */
    checkSDKVersion(minVersion: string): boolean {
        if (!this.isWeChatGame()) {
            return false;
        }

        const info = this.getSystemInfoSync();
        const current = (info && info.SDKVersion) || "0.0.0";
        const currentParts = String(current).split(".");
        const minParts = String(minVersion).split(".");
        const count = Math.max(currentParts.length, minParts.length);
        for (let i = 0; i < count; i++) {
            const a = Number(currentParts[i] || 0);
            const b = Number(minParts[i] || 0);
            if (a > b) {
                return true;
            }
            if (a < b) {
                return false;
            }
        }

        return true;
    }

    /**
     * @method isOpenDataSupported
     * @description 开放数据域能力（好友排行榜、定向邀请）是否可用；要求微信小游戏且基础库不低于 2.9.0
     * @returns {boolean} true 表示可用
     */
    isOpenDataSupported(): boolean {
        return this.isWeChatGame() && this.checkSDKVersion("2.9.0");
    }

    /**
     * @method authorizeScope
     * @description 请求用户授权指定 scope（如关系链 scope.WxFriendInteraction）
     * @param {string} scope 授权 scope
     * @returns {Promise<boolean>} 是否授权成功
     */
    authorizeScope(scope: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.isWeChatGame()) {
                resolve(false);
                return;
            }

            wx &&
                wx.authorize({
                    scope: scope,
                    success: () => {
                        resolve(true);
                    },
                    fail: (res: any) => {
                        Logger.error("授权失败", scope, res);
                        resolve(false);
                    },
                });
        });
    }

    /**
     * @method getAuthSetting
     * @description 查询用户授权状态表（authSetting：true 已授权、false 已拒绝、undefined 未决定）
     * @returns {Promise<Record<string, boolean | undefined>>} 授权状态表，失败返回空对象
     */
    getAuthSetting(): Promise<Record<string, boolean | undefined>> {
        return new Promise((resolve) => {
            if (!this.isWeChatGame()) {
                resolve({});
                return;
            }

            wx &&
                wx.getSetting({
                    success: (res: any) => {
                        resolve((res && res.authSetting) || {});
                    },
                    fail: () => {
                        resolve({});
                    },
                });
        });
    }

    /**
     * @method getSettingScopes
     * @description 查询用户已授权/拒绝的 scope 列表（保留旧接口，内部走 getAuthSetting）
     * @returns {Promise<Record<string, boolean | undefined>>} 授权状态表
     */
    getSettingScopes(): Promise<Record<string, boolean | undefined>> {
        return this.getAuthSetting();
    }

    /**
     * @method openSetting
     * @description 打开小程序/小游戏的授权设置页（需在用户点击后调用）
     * @returns {Promise<boolean>} 用户在设置页中是否已授权关系链 scope
     */
    openSetting(): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.isWeChatGame() || !wx.openSetting) {
                resolve(false);
                return;
            }

            wx.openSetting({
                success: (res: any) => {
                    const authSetting = (res && res.authSetting) || {};
                    resolve(authSetting[MiniGameUtils.SCOPE_FRIEND_INTERACTION] === true);
                },
                fail: (res: any) => {
                    Logger.warn("打开授权设置页失败", res);
                    resolve(false);
                },
            });
        });
    }

    /**
     * @method ensureFriendAuth
     * @description 进入开放数据域（好友榜/好友列表）前的授权检查。
     *              注意：关系链 scope（scope.WxFriendInteraction）**不能用 wx.authorize 主动申请**
     *              （wx.authorize 只接受 address/camera/record/userInfo 等有限 scope）；
     *              未决定时由子域首次调用 wx.getFriendCloudStorage 触发微信原生授权弹窗；
     *              已拒绝时引导用户到授权设置页手动开启。
     * @returns {Promise<boolean>} 当前是否可以继续进入开放数据域
     */
    async ensureFriendAuth(): Promise<boolean> {
        if (!this.isWeChatGame()) {
            return false;
        }

        const authSetting = await this.getAuthSetting();
        const state = authSetting[MiniGameUtils.SCOPE_FRIEND_INTERACTION];

        if (state === false) {
            /* 之前拒绝过：authorize 不再弹窗，只能引导用户去设置页手动开启 */
            return await this.openSetting();
        }

        /* true=已授权；undefined=未决定 → 由子域首次拉取好友数据时触发微信授权弹窗 */
        return true;
    }

    /**
     * 开放数据域（子域）专用接口备忘（不可在主域调用，需在 build-templates/openDataContext 内使用）：
     * - wx.getUserCloudStorage：读取自己的托管数据
     * - wx.getFriendCloudStorage：读取同玩好友的托管数据
     * - wx.getGroupCloudStorage：读取同群成员数据（需 shareTicket）
     * - wx.getPotentialFriendList：读取对游戏感兴趣但未玩的好友（基础库 2.9.0）
     * - wx.shareMessageToFriend：给指定好友（openId）定向分享（基础库 2.9.0）
     * - wx.modifyFriendInteractiveStorage：修改好友互动型托管数据（基础库 2.7.7）
     */
    getOpenDataOnlyApiHint(): string {
        return "openDataContext-only";
    }

    getLaunchOptionsSync(): any {
        if (this.isWeChatGame()) {
            return wx && wx.getLaunchOptionsSync();
        } else {
            return {};
        }
    }

    getCanvas(): HTMLCanvasElement | null {
        if (this.isWeChatGame()) {
            if (!this._canvas) {
                this._canvas = wx && wx.createCanvas();
            }
        } else {
            if (!this._canvas) {
                this._canvas = document.createElement("canvas");
            }
        }

        return this._canvas;
    }

    getCanvasContext(): CanvasRenderingContext2D | null {
        if (!this._canvasContext) {
            const canvas = this.getCanvas();
            this._canvasContext = canvas && canvas.getContext("2d");
        }

        return this._canvasContext;
    }

    createImage(): HTMLImageElement {
        if (this.isWeChatGame()) {
            return wx && wx.createImage();
        } else {
            return new Image();
        }
    }

    async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = this.createImage();
            image.crossOrigin = "anonymous";
            image.onload = () => {
                resolve(image);
            };
            image.onerror = (error) => {
                reject(error);
            };
            image.src = url;
        });
    }

    async makeCanvasImage(options: { filename: string; format?: "png" | "jpeg" | "webp"; quality?: number }): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.isWeChatGame()) {
                (this._canvas as any).toTempFilePath({
                    success: (res: any) => {
                        resolve(res.tempFilePath);
                    },
                });
            } else {
                this._canvas?.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Canvas 转换 Blob 失败"));
                            return;
                        }

                        try {
                            // 创建对象 URL
                            const objectURL = URL.createObjectURL(blob);

                            // 创建下载链接
                            const link = document.createElement("a");
                            link.href = objectURL;
                            link.download = `${options.filename}.${options.format ?? "jpeg"}`;
                            link.style.display = "none";

                            // 添加到文档并触发下载
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            // 返回对象 URL（可以当作临时本地地址使用）
                            resolve(objectURL);
                        } catch (error) {
                            reject(error);
                        }
                    },
                    `image/${options.format ?? "jpeg"}`,
                    options.quality ?? 1
                );
                /////
            }
        });
    }

    /**
     * 创建插屏广告
     * @param key
     * @returns
     */
    createInterstitialAd(key: string): any {
        if (this.isWeChatGame()) {
            return (
                wx &&
                wx.createInterstitialAd({
                    adUnitId: key,
                })
            );
        }
    }

    /**
     * 显示插屏广告
     * @param key
     */
    showInterstitialAd(key: string) {
        if (this.isWeChatGame()) {
            if (this._interstitialAdList[key]) {
                this._interstitialAdList[key].show().catch((error: any) => {
                    // 失败重试
                    Logger.error("插屏广告显示失败", error);
                });
            } else {
                this._interstitialAdList[key] = this.createInterstitialAd(key);
                this._interstitialAdList[key].show().catch((error: any) => {
                    // 失败重试
                    Logger.error("插屏广告显示失败", error);
                });
            }
        }
    }

    /**
     * 创建激励视频广告
     * @param key
     * @returns
     */
    createRewardedVideoAd(key: string): void {
        if (this.isWeChatGame()) {
            // 如果已经创建过该广告，则不再创建
            if (this._rewardedVideoAdList[key]) {
                return;
            }

            const ad =
                wx &&
                wx.createRewardedVideoAd({
                    adUnitId: key,
                });

            ad.onLoad(() => {
                Logger.log("激励视频 广告加载成功");
            });

            ad.onError((err) => {
                Logger.error("激励视频 广告加载错误", err);
                this._rewardedVideoAdCallBack && this._rewardedVideoAdCallBack(REWORD_VIDEOAD_CODE.FAIL);
                this._rewardedVideoAdCallBack = null;
            });

            ad.onClose((res) => {
                if (this._rewardedVideoAdCallBack) {
                    if ((res && res.isEnded) || res === undefined) {
                        Logger.log("激励视频 广告播放结束");
                        this._rewardedVideoAdCallBack(REWORD_VIDEOAD_CODE.SUCCESS);
                    } else {
                        Logger.log("激励视频 广告播放未结束");
                        this._rewardedVideoAdCallBack(REWORD_VIDEOAD_CODE.NOT_OVER);
                    }
                    this._rewardedVideoAdCallBack = null;
                }
            });

            this._rewardedVideoAdList[key] = ad;
        }
    }

    /**
     * 显示插屏广告
     * @param key
     */
    showRewardedVideoAd(key: string, callBack: (code: number) => void) {
        if (this.isWeChatGame()) {
            const ad = this._rewardedVideoAdList[key];
            if (!ad) {
                callBack(REWORD_VIDEOAD_CODE.NOT_KEY);
                return;
            }
            this.playRewardedVideoAd(ad, callBack);
        } else {
            setTimeout(() => {
                callBack(REWORD_VIDEOAD_CODE.SUCCESS);
            }, 3000);
        }
    }

    /**
     * 播放激励视频广告
     * @param ad
     * @param callBack
     */
    playRewardedVideoAd(ad: any, callBack: (code: number) => void) {
        this._rewardedVideoAdCallBack = callBack;
        ad.show().catch((error: any) => {
            Logger.error("激励视频 广告show错误", error);
            // this._rewardedVideoAdCallBack && this._rewardedVideoAdCallBack(REWORD_VIDEOAD_CODE.FAIL);
            // this._rewardedVideoAdCallBack = null;
        });
    }
}
