/**
 * @file CompStarAni3.ts
 * @description 星星动画组件3
 * @category 游戏 10002 - 连连看
 */

import { ViewClass } from "@frameworks/Framework";
import FGUICompStarAni3 from "@fgui/gameChallengeResult/FGUICompStarAni3";
import * as fgui from "fairygui-cc";

/**
 * @class CompStarAni3
 * @description 星星动画组件3，继承自 FGUI 自动生成的 FGUICompStarAni3
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompStarAni3 extends FGUICompStarAni3 {
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

fgui.UIObjectFactory.setExtension(CompStarAni3.URL, CompStarAni3);
