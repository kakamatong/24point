/**
 * @file CompBgCube.ts
 * @description 大厅背景单个方块组件：提供随机图片索引接口
 * @category 大厅背景
 */

import FGUICompBgCube from "@fgui/lobbyBg/FGUICompBgCube";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";

/**
 * @class CompBgCube
 * @description 大厅背景单个方块，ctrl_img 控制器 index 0-21 对应 22 种图片
 * @category 大厅背景
 */
@PackageLoad(["lobbyBg"])
@ViewClass()
export class CompBgCube extends FGUICompBgCube {
    /**
     * @method randomIndex
     * @description 随机一个图片 index（0-21）
     */
    randomIndex(): void {
        this.ctrl_img.selectedIndex = Math.floor(Math.random() * 22);
    }
}
fgui.UIObjectFactory.setExtension(CompBgCube.URL, CompBgCube);
