/**
 * @file GmView.ts
 * @description GM视图入口
 * @category GM视图
 */

import FGUIGmView from "@fgui/gm/FGUIGmView";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";

@PackageLoad(["gm"])
@ViewClass()
export class GmView extends FGUIGmView {}
fgui.UIObjectFactory.setExtension(GmView.URL, GmView);
