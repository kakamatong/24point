/**
 * @file CompRankMain.ts
 * @description 排行榜主面板：标题、关闭按钮、每日/好友页签切换与数据分发
 * @category 排行榜视图
 */

import * as fgui from "fairygui-cc";
import FGUICompRankMain from "@fgui/rank/FGUICompRankMain";
import { ViewClass } from "@frameworks/Framework";
import { RankView } from "../RankView";
import { RANK_DAY_DATA } from "../data/RankData";

/**
 * @enum ENUM_RANK_TAB
 * @description 页签控制器的页签下标
 */
enum ENUM_RANK_TAB {
    /** 每日排行榜 */
    DAY = 0,
    /** 微信好友榜 */
    WX = 1,
}

/**
 * @class CompRankMain
 * @description 排行榜主面板，负责关闭整个视图、页签切换与把数据分发给各页签面板
 * @category 排行榜视图
 */
@ViewClass()
export class CompRankMain extends FGUICompRankMain {
    /**
     * @method onConstruct
     * @description 构建完成：监听页签切换（面板显示/隐藏由 FGUI 控制器负责）
     * @protected
     */
    protected onConstruct(): void {
        super.onConstruct();
        const ctrl = this.getTabController();
        ctrl && ctrl.onChanged(this.onTabChanged, this);
    }

    /**
     * @method show
     * @description 显示排行榜主面板：默认选中每日榜，并把数据交给每日榜面板
     * @param {RANK_DAY_DATA} data - 服务端排行榜数据
     */
    show(data?: RANK_DAY_DATA): void {
        const ctrl = this.getTabController();
        ctrl && (ctrl.selectedIndex = ENUM_RANK_TAB.DAY);
        this.UI_COMP_DAY.show(data);
        /* 释放可能存在的开放数据域视图，避免后台持续上传纹理 */
        this.UI_COMP_WX.hidePanel();
    }

    /**
     * @method onBtnClose
     * @description 关闭按钮：关闭整个排行榜视图
     */
    onBtnClose(): void {
        RankView.hideView();
    }

    /**
     * @method onTabChanged
     * @description 页签切换回调：切到好友榜时挂载开放数据域画布，切回时释放
     * @private
     */
    private onTabChanged(): void {
        const ctrl = this.getTabController();
        const isWxTab = ctrl ? ctrl.selectedIndex == ENUM_RANK_TAB.WX : false;
        if (isWxTab) {
            this.UI_COMP_WX.show();
        } else {
            this.UI_COMP_WX.hidePanel();
        }
    }

    /**
     * @method getTabController
     * @description 获取页签控制器（控制器名以 FGUI 为准：ctrl_type，兼容旧名 ctrl_day）
     * @returns {fgui.Controller | null} 页签控制器
     * @private
     */
    private getTabController(): fgui.Controller | null {
        return (this.getController("ctrl_type") || this.getController("ctrl_day") || null) as fgui.Controller | null;
    }

    /**
     * @method onDestroy
     * @description 销毁时移除页签监听并释放开放数据域视图
     * @protected
     */
    protected onDestroy(): void {
        const ctrl = this.getTabController();
        ctrl && ctrl.offChanged(this.onTabChanged, this);
        this.UI_COMP_WX.hidePanel();
        super.onDestroy();
    }
}
fgui.UIObjectFactory.setExtension(CompRankMain.URL, CompRankMain);
