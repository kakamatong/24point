import { _decorator, Component, sys, resources, JsonAsset, DynamicAtlasManager, macro } from "cc";
import * as fgui from "fairygui-cc";
import { DataCenter } from "@datacenter/Datacenter";
import { LobbyView } from "@view/lobby/LobbyView";
import { ENUM_CHANNEL_ID, LOCAL_KEY } from "@datacenter/InterfaceConfig";
import { LoginView } from "@view/login/LoginView";
import { SoundManager } from "@frameworks/SoundManager";
import { Logger } from "@frameworks/utils/Utils";
import { PackageManager } from "@frameworks/PackageManager";
import { GmView } from "@view/gm/GmView";
const { ccclass } = _decorator;
// 开启动态合批，减少drawcall，但是内存占用会增加
macro.CLEANUP_IMAGE_CACHE = false;
DynamicAtlasManager.instance.enabled = true;
DynamicAtlasManager.instance.maxFrameSize = 1024;
@ccclass("LobbyScreen")
export class LobbyScreen extends Component {
    start() {
        resources.load("appConfig/appConfig", (err, data: JsonAsset) => {
            if (!err) {
                DataCenter.instance.appConfig = data?.json;
                // 开发环境处理
                if (DataCenter.instance.isEnvDev()) {
                    DataCenter.instance.appConfig.authList = DataCenter.instance.appConfig.authList_dev;
                    DataCenter.instance.appConfig.webUrl = DataCenter.instance.appConfig.webUrl_dev;
                    this.initGM();
                }

                DataCenter.instance.channelID = DataCenter.instance.appConfig.channelID ?? ENUM_CHANNEL_ID.ACCOUNT;
            }
        });
        this.initView();
        Logger.log("LobbyScreen");
    }

    initView() {
        fgui.GRoot.create();
        // 加载common包
        const agree = sys.localStorage.getItem(LOCAL_KEY.AGREE_PRIVACY) ?? 0;
        if (agree) {
            LobbyView.showView();
        } else {
            LoginView.showView();
        }

        // 加载背景音乐
        SoundManager.instance.init(); // 切场景必须init
        SoundManager.instance.playSoundMusic("lobby/bg");
    }

    initGM() {
        PackageManager.instance
            .loadPackages("fgui", ["common", "gm"])
            .then(() => {
                const gm = fgui.UIPackage.createObject("gm", "BtnGm") as fgui.GButton;
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
