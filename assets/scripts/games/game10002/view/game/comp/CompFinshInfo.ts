import { ViewClass } from "@frameworks/Framework";
import FGUICompFinshInfo from "@fgui/game10002/FGUICompFinshInfo";
import * as fgui from "fairygui-cc";

/**
 * @class CompFinshInfo
 * @description 游戏完成信息组件，显示自己的排名和用时
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompFinshInfo extends FGUICompFinshInfo {
    /**
     * @method showFinishInfo
     * @description 显示完成信息
     * @param {number} rank - 排名
     * @param {number} usedTime - 用时（毫秒）
     */
    showFinishInfo(rank: number, usedTime: number): void {
        // 更新排名文本
        if (this.UI_TXT_RANK) {
            this.UI_TXT_RANK.text = rank.toString();
        }

        // 更新时间文本（毫秒转秒，保留三位小数）
        if (this.UI_TXT_TIME) {
            const timeInSeconds = (usedTime / 1000).toFixed(3);
            this.UI_TXT_TIME.text = `${timeInSeconds}秒`;
        }
    }

    /**
     * @method hide
     * @description 隐藏组件
     */
    hide(): void {
        this.visible = false;
    }

    /**
     * @method reset
     * @description 重置组件
     */
    reset(): void {
        if (this.UI_TXT_RANK) {
            this.UI_TXT_RANK.text = "";
        }
        if (this.UI_TXT_TIME) {
            this.UI_TXT_TIME.text = "";
        }
    }
}
fgui.UIObjectFactory.setExtension(CompFinshInfo.URL, CompFinshInfo);
