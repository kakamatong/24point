/**
 * @file LobbyView.ts
 * @description 大厅视图：游戏主大厅界面
 * @category 大厅视图
 */

import FGUILobbyView from "@fgui/lobby/FGUILobbyView";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import "../lobbyBg/CompLobbyBg";
import { FGUI_PACKAGE } from "@datacenter/PackageConfig";

/**
 * @class LobbyView
 * @description 大厅视图，游戏主界面
 * @category 大厅视图
 */
@PackageLoad([FGUI_PACKAGE.COMMON, FGUI_PACKAGE.PROPS, FGUI_PACKAGE.LOBBY_BG])
@ViewClass()
export class LobbyView extends FGUILobbyView {}
// 继承出来的对象，必须重写
fgui.UIObjectFactory.setExtension(LobbyView.URL, LobbyView);
