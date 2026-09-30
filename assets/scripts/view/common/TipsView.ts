/**
 * @file TipsView.ts
 * @description 提示视图：显示浮动的提示消息
 * @category 通用视图
 */

import { _decorator, AssetManager, assetManager } from "cc";
import FGUITipsView from "@fgui/common/FGUITipsView";
import FGUICompTips from "@fgui/common/FGUICompTips";
import * as fgui from "fairygui-cc";
import { ViewClass } from "@frameworks/Framework";
import { Logger } from "@frameworks/utils/Utils";
import { PackageManager } from "@frameworks/PackageManager";

/**
 * @class TipsView
 * @description 提示消息视图，显示浮动提示
 * @category 通用视图
 */
@ViewClass()
export class TipsView extends FGUITipsView {
    /** 提示列表 */
    private _tipList: FGUICompTips[] = [];

    /**
     * @description 显示提示视图
     * @param params 提示配置数据
     */
    public static showView(params?: any, callBack?: (b: boolean) => void): void {
        if (TipsView.instance) {
            TipsView.instance.createTip(params);
            return;
        }

        const createView = () => {
            const view = fgui.UIPackage.createObject("common", "TipsView") as TipsView;

            view.makeFullScreen();
            TipsView.instance = view;
            view.sortingOrder = 9999;
            fgui.GRoot.inst.addChild(view);
            view.createTip && view.createTip(params);
            view.show && view.show(params);
            callBack && callBack(true);
        };
        if (PackageManager.instance.hasPackage("fgui", this.packageName)) {
            createView();
            return;
        }

        PackageManager.instance
            .loadPackage("fgui", this.packageName)
            .then(() => {
                createView();
            })
            .catch((error) => {
                Logger.error("showView error", error);
                callBack && callBack(false);
                return;
            });
    }

    public static hideView(): void {
        TipsView.instance && TipsView.instance.dispose();
    }

    /**
     * @description 创建提示消息
     * @param data 提示数据
     */
    createTip(data: any) {
        const tip = fgui.UIPackage.createObject("common", "CompTips") as FGUICompTips;
        this._tipList.push(tip);
        tip.title.text = data.content;
        this.UI_LV_TIPS.addChild(tip);
        // 延迟0.1秒后开始动画，否则动画会不执行
        this.scheduleOnce(() => {
            fgui.GTween.to(1, 0, 1)
                .setDelay(2)
                .setTarget(tip, "alpha")
                .onComplete(() => {
                    tip && tip.dispose();
                    this._tipList = this._tipList.filter((t) => t !== tip);
                });
        }, 0.05);
    }

    /**
     * @description 销毁视图时的清理工作
     */
    protected onDestroy(): void {
        for (let tip of this._tipList) {
            fgui.GTween.kill(tip);
        }
        this._tipList = [];
        TipsView.instance = null;
    }
}
fgui.UIObjectFactory.setExtension(TipsView.URL, TipsView);
