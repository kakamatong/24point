/**
 * @file BagView.ts
 * @description 背包视图：背包主界面
 * @category 背包视图
 */

import FGUIBagView from "@fgui/bag/FGUIBagView";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";

/**
 * @class BagView
 * @description 背包视图，展示用户背包物品
 * @category 背包视图
 */
@PackageLoad(["common", "props", "bag"])
@ViewClass()
export class BagView extends FGUIBagView {}
// 继承出来的对象，必须重写
fgui.UIObjectFactory.setExtension(BagView.URL, BagView);
