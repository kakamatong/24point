import { _decorator, Component } from "cc";
import * as fgui from "fairygui-cc";
import { GameView } from "../games/game10003/view/game/GameView";
import { SoundManager } from "@frameworks/SoundManager";
import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";
import { GmView } from "@view/gm/GmView";
import { DataCenter } from "@datacenter/Datacenter";
import { FGUI_PACKAGE } from "@datacenter/PackageConfig";
const { ccclass } = _decorator;

@ccclass("GameScene")
export class GameScene extends Component {
    start() {
        this.initView();
    }

    initView() {
        fgui.GRoot.create();
        GameView.showView();

        // 加载背景音乐
        SoundManager.instance.init(); // 切场景必须init
        SoundManager.instance.playSoundMusic("game10003/gamebg");

        // 加载GM按钮
        if (DataCenter.instance.isEnvDev()) {
            this.initGM();
        }
    }

    initGM() {
        PackageManager.instance
            .loadPackages("fgui", [FGUI_PACKAGE.COMMON, FGUI_PACKAGE.GM])
            .then(() => {
                const gm = fgui.UIPackage.createObject(FGUI_PACKAGE.GM, "BtnGm") as fgui.GButton;
                if (!gm) {
                    Logger.error("create gm error");
                    return;
                }
                gm.onClick(() => {
                    GmView.showView();
                });
                gm.sortingOrder = 1000;
                fgui.GRoot.inst.addChild(gm);
            })
            .catch((error) => {
                Logger.error("initGM error", error);
                return;
            });
    }
}
