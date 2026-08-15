/**
 * @file CompStarAni1.ts
 * @description 星星动画组件1
 * @category 游戏 10002 - 连连看
 */

import { ViewClass } from "@frameworks/Framework";
import FGUICompStarAni1 from "@fgui/gameChallengeResult/FGUICompStarAni1";
import * as fgui from "fairygui-cc";

/**
 * @class CompStarAni1
 * @description 星星动画组件1，继承自 FGUI 自动生成的 FGUICompStarAni1
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompStarAni1 extends FGUICompStarAni1 {
    play(onComplete?: () => void): void {
        this.ctrl_get.selectedIndex = 1;
        this.UI_COMP_BIG.act.play(() => {
            onComplete && onComplete();
        });

        this.UI_COMP_BIG.act.setHook("time1", () => {
            this.UI_COMP_SMALL.act.play(() => {});
        });
    }
}

fgui.UIObjectFactory.setExtension(CompStarAni1.URL, CompStarAni1);
