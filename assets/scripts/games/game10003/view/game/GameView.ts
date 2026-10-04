/**
 * @file GameView.ts
 * @description 游戏视图入口，加载主界面业务扩展后创建界面
 */
import "@game10003/view/game/comp/CompGameMain";
import FGUIGameView from "@fgui/game10003/FGUIGameView";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { FGUI_PACKAGE } from "@datacenter/PackageConfig";
/**
 * 游戏视图 - 只处理背景显示
 */
@ViewClass()
@PackageLoad([FGUI_PACKAGE.LOBBY_BG, FGUI_PACKAGE.PROPS, FGUI_PACKAGE.GAME_COMMON])
export class GameView extends FGUIGameView {}

fgui.UIObjectFactory.setExtension(GameView.URL, GameView);
