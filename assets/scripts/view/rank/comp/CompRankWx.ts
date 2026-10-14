/**
 * @file CompRankWx.ts
 * @description 微信好友排行榜面板：把开放数据域画布挂到 UI_LOADER_WX 控件上
 * @category 排行榜视图
 */

import * as fgui from "fairygui-cc";
import { Node } from "cc";
import FGUICompRankWx from "@fgui/rank/FGUICompRankWx";
import { ViewClass } from "@frameworks/Framework";
import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";
import { OpenDataView } from "@frameworks/utils/sdk/OpenDataView";
import { Logger } from "@frameworks/utils/Utils";
import { TipsView } from "@view/common/TipsView";

/**
 * @class CompRankWx
 * @description 微信好友排行榜面板，展示开放数据域（子域）绘制的好友榜
 * @category 排行榜视图
 */
@ViewClass()
export class CompRankWx extends FGUICompRankWx {
    /**
     * @property {OpenDataView | null} _openDataView - 开放数据域视图
     * @private
     */
    private _openDataView: OpenDataView | null = null;

    /**
     * @method show
     * @description 显示好友榜：挂载开放数据域画布并请求好友榜数据
     * @param {any} data - 预留参数（好友榜数据由子域自行拉取）
     */
    public show(data?: any): void {
        if (!MiniGameUtils.instance.isOpenDataSupported()) {
            Logger.warn("当前环境不支持开放数据域（需微信小游戏且基础库不低于 2.9.0）");
            return;
        }

        void this.enterWithAuth();
    }

    /**
     * @method enterWithAuth
     * @description 进入开放数据域前先检查微信关系链授权，通过后再挂载画布并请求好友榜数据
     * @private
     */
    private async enterWithAuth(): Promise<void> {
        /* 顺序：隐私协议授权 → 微信朋友信息授权 → 打开子域 */
        const privacyAllowed = await MiniGameUtils.instance.ensurePrivacyAuthorize();
        if (!privacyAllowed) {
            TipsView.showView({ content: "需要先同意《用户隐私保护指引》才能查看好友排行榜" });
            return;
        }

        const authorized = await MiniGameUtils.instance.ensureFriendAuth();
        if (!authorized) {
            /* 未授权：提示用户授权，不挂载画布（好友数据不可用） */
            TipsView.showView({ content: "需要授权「微信朋友信息」才能查看好友排行榜，请在授权设置中开启" });
            return;
        }

        this.ensureView();
        this._openDataView && this._openDataView.setMode("rank");
    }

    /**
     * @method hidePanel
     * @description 隐藏好友榜：销毁开放数据域视图，停止每帧上传
     */
    public hidePanel(): void {
        this.disposeView();
    }

    /**
     * @method onDestroy
     * @description 销毁时释放开放数据域视图
     * @protected
     */
    protected onDestroy(): void {
        this.disposeView();
        super.onDestroy();
    }

    /**
     * @method ensureView
     * @description 确保开放数据域视图已挂载到 UI_LOADER_WX 下
     * @private
     */
    private ensureView(): void {
        if (this._openDataView) {
            return;
        }

        const loaderNode = (this.UI_LOADER_WX as any).node as Node;
        if (!loaderNode) {
            Logger.error("UI_LOADER_WX 节点不存在，无法挂载开放数据域画布");
            return;
        }

        const width = this.UI_LOADER_WX.width || 587;
        const height = this.UI_LOADER_WX.height || 504;
        this._openDataView = OpenDataView.create(loaderNode, width, height);
    }

    /**
     * @method disposeView
     * @description 释放开放数据域视图
     * @private
     */
    private disposeView(): void {
        if (this._openDataView) {
            this._openDataView.dispose();
            this._openDataView = null;
        }
    }
}
fgui.UIObjectFactory.setExtension(CompRankWx.URL, CompRankWx);
