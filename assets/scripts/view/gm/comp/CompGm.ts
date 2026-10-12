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
import { Logger } from "@frameworks/utils/Utils";

@PackageLoad([FGUI_PACKAGE.GM])
@ViewClass()
export class CompGm extends FGUICompGm {
    onBtnEnergyAdd(): void {
        void this.changeEnergy(1);
    }

    onBtnEnergyReduce(): void {
        void this.changeEnergy(-1);
    }

    /**
     * @method changeEnergy
     * @description 增减体力并打印结果（GM 调试用）
     * @param {number} change - 体力变化量
     * @private
     */
    private async changeEnergy(change: number): Promise<void> {
        try {
            const res = await UserEnergy.instance.changeReq(change);
            Logger.log(`体力变更 change=${change} code=${res?.code} leftEnergy=${res?.leftEnergy}`);
        } catch (err) {
            Logger.warn("体力变更失败:", err);
        }
    }

    onBtnClose(): void {
        GmView.hideView();
    }
}
fgui.UIObjectFactory.setExtension(CompGm.URL, CompGm);
