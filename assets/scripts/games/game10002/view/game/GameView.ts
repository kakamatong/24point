import FGUIGameView from "@fgui/game10002/FGUIGameView";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
/**
 * 游戏视图 - 只处理背景显示
 */
@ViewClass()
@PackageLoad(["resFruit", "props", "gameCommon"])
export class GameView extends FGUIGameView {}

fgui.UIObjectFactory.setExtension(GameView.URL, GameView);
