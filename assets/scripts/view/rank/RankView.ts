/**
 * @file RankView.ts
 * @description 排行榜视图入口：全屏遮罩 + 排行榜主面板
 * @category 排行榜视图
 */

import * as fgui from "fairygui-cc";
import FGUIRankView from "@fgui/rank/FGUIRankView";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { FGUI_PACKAGE } from "@datacenter/PackageConfig";
import { RANK_DAY_DATA } from "./data/RankData";

/**
 * @class RankView
 * @description 排行榜视图，负责把服务端排行榜数据交给主面板 CompRankMain 展示
 * @category 排行榜视图
 */
@PackageLoad([FGUI_PACKAGE.COMMON])
@ViewClass()
export class RankView extends FGUIRankView {
    /**
     * @method show
     * @description 显示排行榜视图
     * @param {RANK_DAY_DATA} data - 服务端排行榜数据
     */
    show(data?: RANK_DAY_DATA): void {
        this.UI_COMP_MAIN.show(data);
    }
}
fgui.UIObjectFactory.setExtension(RankView.URL, RankView);
