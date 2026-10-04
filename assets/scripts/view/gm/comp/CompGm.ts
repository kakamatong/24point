/**
 * @file CompGm.ts
 * @description GM控制台组件：提供测试用功能（体力增减等）
 * @category GM视图
 */

import FGUICompGm from "@fgui/gm/FGUICompGm";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { UserEnergy } from "@modules/UserEnergy";
import { GmView } from "../GmView";
import { FGUI_PACKAGE } from "@datacenter/PackageConfig";

@PackageLoad([FGUI_PACKAGE.GM])
@ViewClass()
export class CompGm extends FGUICompGm {
    onBtnEnergyAdd(): void {
        UserEnergy.instance.changeReq(1);
    }

    onBtnEnergyReduce(): void {
        UserEnergy.instance.changeReq(-1);
    }

    onBtnClose(): void {
        GmView.hideView();
    }
}
fgui.UIObjectFactory.setExtension(CompGm.URL, CompGm);
