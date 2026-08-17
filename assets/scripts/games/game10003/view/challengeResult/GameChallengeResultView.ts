/**
 * @file GameChallengeResultView.ts
 * @description 挑战赛胜利视图
 * @category 游戏 10002 - 连连看
 */

import FGUIGameChallengeResultView from "@fgui/gameChallengeResult/FGUIGameChallengeResultView";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { CompResultData } from "./comp/CompResult";

/**
 * @class GameChallengeResultView
 * @description 挑战赛胜利视图，继承自 FGUI 自动生成的 FGUIGameChallengeResultView
 * @category 游戏 10002 - 连连看
 */
@PackageLoad(["gameCommon", "gameChallengeResult"])
@ViewClass()
export class GameChallengeResultView extends FGUIGameChallengeResultView {
    show(data?: CompResultData): void {
        super.show(data);
        this.UI_COMP_MAIN.show(data);
    }
}

fgui.UIObjectFactory.setExtension(GameChallengeResultView.URL, GameChallengeResultView);
