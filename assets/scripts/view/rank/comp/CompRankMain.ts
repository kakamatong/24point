/**
 * @file CompRankMain.ts
 * @description 排行榜主面板：标题、关闭按钮、每日/微信页签切换与数据分发
 * @category 排行榜视图
 */

import * as fgui from "fairygui-cc";
import FGUICompRankMain from "@fgui/rank/FGUICompRankMain";
import { ViewClass } from "@frameworks/Framework";
import { Logger } from "@frameworks/utils/Utils";
import { RankView } from "../RankView";
import { RANK_DAY_DATA } from "../data/RankData";

/**
 * @enum ENUM_RANK_TAB
 * @description ctrl_day 控制器的页签下标
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
     * @description 构建完成：监听页签切换
     * @protected
     */
    protected onConstruct(): void {
        super.onConstruct();
        this.ctrl_day.onChanged(this.onTabChanged, this);
    }

    /**
     * @method show
     * @description 显示排行榜主面板：默认选中每日榜，并把数据交给每日榜面板
     * @param {RANK_DAY_DATA} data - 服务端排行榜数据
     */
    show(data?: RANK_DAY_DATA): void {
        this.ctrl_day.selectedIndex = ENUM_RANK_TAB.DAY;
        this.UI_COMP_DAY.show(data);
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
     * @description 页签切换回调：微信好友榜待接入开放数据域后在此展示
     * @private
     */
    private onTabChanged(): void {
        if (this.ctrl_day.selectedIndex == ENUM_RANK_TAB.WX) {
            // TODO 好友榜：CompRankWx 面板实现后在此展示（见 doc/开放数据域-好友排行榜技术方案.md）
            Logger.debug("切换到微信好友榜，好友榜面板待接入开放数据域");
        }
    }

    /**
     * @method onDestroy
     * @description 销毁时移除页签监听
     * @protected
     */
    protected onDestroy(): void {
        this.ctrl_day.offChanged(this.onTabChanged, this);
        super.onDestroy();
    }
}
fgui.UIObjectFactory.setExtension(CompRankMain.URL, CompRankMain);
