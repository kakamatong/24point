/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompCtrl from "./FGUICompCtrl";
import FGUICompPirvateInfo from "./FGUICompPirvateInfo";
import FGUICompPlayers from "./FGUICompPlayers";
import FGUICompPlayerHead from "./FGUICompPlayerHead";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompGameMain extends fgui.GComponent {
    public ctrl_roomtype: fgui.Controller;
    public UI_COMP_CTRL: FGUICompCtrl;
    public UI_BTN_INVITE: fgui.GButton;
    public UI_BTN_START_GAME: fgui.GButton;
    public UI_BTN_READY: fgui.GButton;
    public UI_COMP_PRIVITE_INFO: FGUICompPirvateInfo;
    public UI_COMP_PLAYERS: FGUICompPlayers;
    public UI_COMP_SELFPLAYER: FGUICompPlayerHead;
    public UI_COMP_SELF_MEDAL: fgui.GComponent;
    public UI_TXT_PROGRESS: fgui.GTextField;
    public static URL: string = "ui://2zsfe53xh3uk1d";

    public static packageName: string = "game10003";

    public static instance: any | null = null;

    public enableAnimation: boolean = false;

    public static showView(params?: any, callBack?: (b: boolean) => void): void {
        if (FGUICompGameMain.instance) {
            console.log("allready show");
            callBack && callBack(false);
            return;
        }
        PackageManager.instance
            .loadPackage("fgui", this.packageName)
            .then(() => {
                const view = fgui.UIPackage.createObject("game10003", "CompGameMain") as FGUICompGameMain;

                view.makeFullScreen();
                FGUICompGameMain.instance = view;
                fgui.GRoot.inst.addChild(view);
                view.show && view.show(params);
                callBack && callBack(true);
            })
            .catch((error) => {
                Logger.error("showView error", error);
                callBack && callBack(false);
                return;
            });
    }

    protected onDestroy(): void {
        super.onDestroy();
        FGUICompGameMain.instance = null;
    }
    public static hideView(): void {
        FGUICompGameMain.instance && FGUICompGameMain.instance.dispose();
    }

    show(data?: any): void {}

    enterAnimation(): void {
        fgui.GTween.to2(0, 0, 1, 1, 0.3)
            .setTarget(this)
            .setEase(fgui.EaseType.BackOut)
            .onUpdate((tween) => {
                this.setScale(tween.value.x, tween.value.y);
            });
    }

    hideAnimation(onComplete?: () => void): void {
        fgui.GTween.to2(1, 1, 0, 0, 0.3)
            .setTarget(this)
            .setEase(fgui.EaseType.BackIn)
            .onUpdate((tween) => {
                this.setScale(tween.value.x, tween.value.y);
            })
            .onComplete(() => {
                onComplete && onComplete();
            });
    }

    public static createInstance(): FGUICompGameMain {
        return <FGUICompGameMain>fgui.UIPackage.createObject("game10003", "CompGameMain");
    }

    protected onConstruct(): void {
        this.ctrl_roomtype = this.getControllerAt(0);
        this.UI_COMP_CTRL = <FGUICompCtrl>this.getChildAt(1);
        this.UI_BTN_INVITE = <fgui.GButton>this.getChildAt(2);
        this.UI_BTN_INVITE.onClick(this.onBtnInvite, this);
        this.UI_BTN_START_GAME = <fgui.GButton>this.getChildAt(3);
        this.UI_BTN_START_GAME.onClick(this.onBtnStartGame, this);
        this.UI_BTN_READY = <fgui.GButton>this.getChildAt(4);
        this.UI_BTN_READY.onClick(this.onBtnReady, this);
        this.UI_COMP_PRIVITE_INFO = <FGUICompPirvateInfo>this.getChildAt(6);
        this.UI_COMP_PLAYERS = <FGUICompPlayers>this.getChildAt(7);
        this.UI_COMP_SELFPLAYER = <FGUICompPlayerHead>this.getChildAt(8);
        this.UI_COMP_SELF_MEDAL = <fgui.GComponent>this.getChildAt(9);
        this.UI_TXT_PROGRESS = <fgui.GTextField>this.getChildAt(11);
        if (this.enableAnimation) this.enterAnimation();
    }
    scheduleOnce(callback: () => void, delay: number): void {}
    unscheduleAllCallbacks(): void {}
    unschedule(callback: () => void): void {}
    schedule(callback: () => void, interval: number): void {}
    onBtnInvite(): void {}
    onBtnStartGame(): void {}
    onBtnReady(): void {}
}
fgui.UIObjectFactory.setExtension(FGUICompGameMain.URL, FGUICompGameMain);
