/**
 * @file CompRankDay.ts
 * @description 每日排行榜面板：渲染排行榜列表与自己的名次
 * @category 排行榜视图
 */

import * as fgui from "fairygui-cc";
import FGUICompRankDay from "@fgui/rank/FGUICompRankDay";
import { ViewClass } from "@frameworks/Framework";
import { CompRankInfo } from "./CompRankInfo";
import { ParseRankList, RANK_DAY_DATA, RANK_ITEM_DATA, RANK_NO_ENTRY } from "../data/RankData";

/**
 * @class CompRankDay
 * @description 每日排行榜面板，负责每日榜列表渲染与自己的名次展示
 * @category 排行榜视图
 */
@ViewClass()
export class CompRankDay extends FGUICompRankDay {
    /**
     * @property {RANK_ITEM_DATA[]} _rankList - 解析后的排行榜列表数据
     * @private
     */
    private _rankList: RANK_ITEM_DATA[] = [];

    /**
     * @method show
     * @description 显示每日排行榜：解析列表数据并刷新自己的名次
     * @param {RANK_DAY_DATA} data - 服务端排行榜数据
     */
    show(data?: RANK_DAY_DATA): void {
        this._rankList = ParseRankList(data?.rankList);
        this.UI_LV_RANK.itemRenderer = this.itemRenderer.bind(this);
        this.UI_LV_RANK.numItems = this._rankList.length;
        this.refreshSelfRank(data?.rank);
    }

    /**
     * @method refreshSelfRank
     * @description 刷新自己的名次文本，未上榜显示「未上榜」
     * @param {number} rank - 自己的名次（从 0 开始，RANK_NO_ENTRY 表示未上榜）
     * @private
     */
    private refreshSelfRank(rank?: number): void {
        const selfRank = rank ?? RANK_NO_ENTRY;
        this.UI_TXT_SELF_RANK.text = selfRank == RANK_NO_ENTRY ? "未上榜" : `${selfRank + 1}`;
    }

    /**
     * @method itemRenderer
     * @description 列表项渲染：名次按列表顺序补全后交给排名单元格展示
     * @param {number} index - 列表索引
     * @param {fgui.GObject} item - 列表项对象
     * @private
     */
    private itemRenderer(index: number, item: fgui.GObject): void {
        const itemData = this._rankList[index];
        if (!itemData) {
            return;
        }
        (item as CompRankInfo).show({ ...itemData, rank: `${index + 1}` });
    }
}
fgui.UIObjectFactory.setExtension(CompRankDay.URL, CompRankDay);
