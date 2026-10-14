/**
 * @file RankData.ts
 * @description 排行榜数据：定义服务端排行榜的下发结构、列表项字段与列表解析方法
 * @category 排行榜视图
 */

import { Logger } from "@frameworks/utils/Utils";

/**
 * @constant RANK_NO_ENTRY
 * @description 未上榜的名次值（服务端约定）
 */
export const RANK_NO_ENTRY = 999999;

/**
 * @interface RANK_ITEM_DATA
 * @description 排行榜列表项数据，名次由客户端按列表顺序补全
 */
export interface RANK_ITEM_DATA {
    /** 名次（从 1 开始，客户端补全） */
    rank?: string | number;
    /** 玩家昵称 */
    nickname?: string;
    /** 分数 */
    score?: number;
}

/**
 * @interface RANK_DAY_DATA
 * @description 每日排行榜数据（服务端 gameRank/getRankList 下发）
 */
export interface RANK_DAY_DATA {
    /** 排行榜列表 JSON 字符串 */
    rankList?: string;
    /** 自己的名次（从 0 开始，RANK_NO_ENTRY 表示未上榜） */
    rank?: number;
}

/**
 * @method ParseRankList
 * @description 解析服务端下发的排行榜列表字符串，解析失败或格式异常时返回空列表
 * @param {string} rankList - 排行榜列表 JSON 字符串
 * @returns {RANK_ITEM_DATA[]} 排行榜列表数据
 */
export function ParseRankList(rankList?: string): RANK_ITEM_DATA[] {
    if (!rankList) {
        return [];
    }
    try {
        const list = JSON.parse(rankList);
        return Array.isArray(list) ? (list as RANK_ITEM_DATA[]) : [];
    } catch (error) {
        Logger.error("排行榜列表解析失败：", error);
        return [];
    }
}
