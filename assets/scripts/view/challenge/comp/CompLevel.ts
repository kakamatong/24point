/**
 * @file CompLevel.ts
 * @description 关卡组件：展示关卡状态、星级和名称
 * @category 闯关视图
 */

import FGUICompLevel from "@fgui/challenge/FGUICompLevel";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";

/** 关卡状态 */
export const enum LEVEL_STATUS {
    LOCKED = 0, // 锁住
    IN_PROGRESS = 1, // 未锁住进行中
    COMPLETED = 2, // 完成
    BOSS = 3, // 未锁住进行中（boss 关卡）
}

/** 星级状态 */
export const enum STAR_COUNT {
    HIDE = 0, // 不展示
    ONE = 1, // 1 星
    TWO = 2, // 2 星
    THREE = 3, // 3 星
}

@ViewClass()
export class CompLevel extends FGUICompLevel {
    onConstruct() {
        super.onConstruct();
    }

    /**
     * @method setStatus
     * @description 设置关卡状态（锁住 / 进行中 / 完成 / boss）
     * @param {number} index - ctrl_status 索引
     */
    setStatus(index: number): void {
        if (this.ctrl_status) {
            this.ctrl_status.selectedIndex = index;
        }
    }

    /**
     * @method setStars
     * @description 设置星级展示数量
     * @param {number} count - ctrl_stars 索引（0=隐藏, 1-3=星星数）
     */
    setStars(count: number): void {
        if (this.ctrl_stars) {
            this.ctrl_stars.selectedIndex = count;
        }
    }

    /**
     * @method setLevelName
     * @description 设置关卡名称文本
     * @param {string} text - 关卡名称
     */
    setLevelName(text: string): void {
        if (this.UI_TXT_INDEX) {
            this.UI_TXT_INDEX.text = text;
        }
    }
}

fgui.UIObjectFactory.setExtension(CompLevel.URL, CompLevel);
