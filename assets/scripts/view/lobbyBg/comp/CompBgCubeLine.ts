/**
 * @file CompBgCubeLine.ts
 * @description 大厅背景方块行组件：由 14 个 CompBgCube 组成，提供整行随机接口
 * @category 大厅背景
 */

import FGUICompBgCubeLine from "@fgui/lobbyBg/FGUICompBgCubeLine";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import { CompBgCube } from "./CompBgCube";

/**
 * @class CompBgCubeLine
 * @description 大厅背景方块行，包含 14 个方块（工厂注册后实际实例为 CompBgCube）
 * @category 大厅背景
 */
@PackageLoad(["lobbyBg"])
@ViewClass()
export class CompBgCubeLine extends FGUICompBgCubeLine {
    /** 本行的 14 个方块引用 @private */
    private _cubes: CompBgCube[] = [];

    onConstruct() {
        super.onConstruct();
        this._cubes = [
            this.UI_COMP_CUBE_0,
            this.UI_COMP_CUBE_1,
            this.UI_COMP_CUBE_2,
            this.UI_COMP_CUBE_3,
            this.UI_COMP_CUBE_4,
            this.UI_COMP_CUBE_5,
            this.UI_COMP_CUBE_6,
            this.UI_COMP_CUBE_7,
            this.UI_COMP_CUBE_8,
            this.UI_COMP_CUBE_9,
            this.UI_COMP_CUBE_10,
            this.UI_COMP_CUBE_11,
            this.UI_COMP_CUBE_12,
            this.UI_COMP_CUBE_13,
        ] as CompBgCube[];
    }

    /**
     * @method randomLine
     * @description 随机整行方块：遍历所有方块调用随机接口
     */
    randomLine(): void {
        for (const cube of this._cubes) {
            cube.randomIndex();
        }
    }
}
fgui.UIObjectFactory.setExtension(CompBgCubeLine.URL, CompBgCubeLine);
