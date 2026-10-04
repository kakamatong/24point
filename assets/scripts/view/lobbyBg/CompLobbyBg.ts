/**
 * @file CompLobbyBg.ts
 * @description 大厅背景入口组件：负责启动方块页动画
 * @category 大厅背景
 */

import * as fgui from "fairygui-cc";
import FGUICompLobbyBg from "@fgui/lobbyBg/FGUICompLobbyBg";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { FGUI_PACKAGE } from "@datacenter/PackageConfig";

/**
 * @class CompLobbyBg
 * @description 大厅背景入口，控制背景动画的启停
 * @category 大厅背景
 */
@PackageLoad([FGUI_PACKAGE.LOBBY_BG])
@ViewClass()
export class CompLobbyBg extends FGUICompLobbyBg {
    onConstruct() {
        super.onConstruct();
    }
}
fgui.UIObjectFactory.setExtension(CompLobbyBg.URL, CompLobbyBg);
