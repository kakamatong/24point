/**
 * @file CompStarAni.ts
 * @description 星星动画组件
 * @category 游戏 10002 - 连连看
 */

import { ViewClass } from "@frameworks/Framework";
import FGUICompStarAni from "@fgui/gameChallengeResult/FGUICompStarAni";
import * as fgui from "fairygui-cc";
import { CompStarAni1 } from "./CompStarAni1";
import { CompStarAni2 } from "./CompStarAni2";
import { CompStarAni3 } from "./CompStarAni3";

/**
 * @class CompStarAni
 * @description 星星动画组件，继承自 FGUI 自动生成的 FGUICompStarAni
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompStarAni extends FGUICompStarAni {
    play(num: number, onComplete?: () => void): void {
        const dt = 0.2; // 每颗星星的延迟时间
        for (let i = 1; i <= num; i++) {
            const delay = (i - 1) * dt;
            this.scheduleOnce(() => {
                if (i === 1) {
                    this.playStar1(i === num ? onComplete : undefined);
                } else if (i === 2) {
                    this.playStar2(i === num ? onComplete : undefined);
                } else if (i === 3) {
                    this.playStar3(i === num ? onComplete : undefined);
                }
            }, delay);
        }
    }

    playStar1(onComplete?: () => void): void {
        const actNode = this.UI_COMP_STAR_1 as CompStarAni1;
        actNode.play(() => {
            onComplete && onComplete();
        });
    }

    playStar2(onComplete?: () => void): void {
        const actNode = this.UI_COMP_STAR_2 as CompStarAni2;
        actNode.play(() => {
            onComplete && onComplete();
        });
    }

    playStar3(onComplete?: () => void): void {
        const actNode = this.UI_COMP_STAR_3 as CompStarAni3;
        actNode.play(() => {
            onComplete && onComplete();
        });
    }
}

fgui.UIObjectFactory.setExtension(CompStarAni.URL, CompStarAni);
