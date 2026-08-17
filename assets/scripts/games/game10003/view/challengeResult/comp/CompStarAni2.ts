/**
 * @file CompStarAni2.ts
 * @description 星星动画组件2
 * @category 游戏 10002 - 连连看
 */

import { ViewClass } from "@frameworks/Framework";
import FGUICompStarAni2 from "@fgui/gameChallengeResult/FGUICompStarAni2";
import * as fgui from "fairygui-cc";

/**
 * @class CompStarAni2
 * @description 星星动画组件2，继承自 FGUI 自动生成的 FGUICompStarAni2
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompStarAni2 extends FGUICompStarAni2 {
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

fgui.UIObjectFactory.setExtension(CompStarAni2.URL, CompStarAni2);
