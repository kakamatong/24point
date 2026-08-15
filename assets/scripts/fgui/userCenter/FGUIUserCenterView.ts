/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompBtnSound from "./FGUICompBtnSound";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUIUserCenterView extends fgui.GComponent {

	public UI_COMP_HEAD:fgui.GComponent;
	public UI_TXT_NICKNAME:fgui.GTextField;
	public UI_TXT_USERID:fgui.GTextField;
	public UI_BTN_WECHAT:fgui.GButton;
	public UI_TXT_WIN:fgui.GTextField;
	public UI_TXT_LOSE:fgui.GTextField;
	public UI_TXT_DRAW:fgui.GTextField;
	public UI_TXT_RATE:fgui.GTextField;
	public UI_BTN_CLOSE:fgui.GButton;
	public UI_BTN_BGMUSIC:FGUICompBtnSound;
	public UI_BTN_EFFECT:FGUICompBtnSound;
	public UI_TXT_CP:fgui.GTextField;
	public UI_BTN_DEL_ACC:fgui.GButton;
	public UI_TXT_TITLE:fgui.GTextField;
	public static URL:string = "ui://1zcuqn2bp4e40";

	public static packageName:string = "userCenter";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUIUserCenterView.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("userCenter", "UserCenterView") as FGUIUserCenterView;

			view.makeFullScreen();
			FGUIUserCenterView.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUIUserCenterView.instance = null;
	}
	public static hideView():void {
		FGUIUserCenterView.instance && FGUIUserCenterView.instance.dispose();
	}

	show(data?:any):void{};

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

	public static createInstance():FGUIUserCenterView {
		return <FGUIUserCenterView>(fgui.UIPackage.createObject("userCenter", "UserCenterView"));
	}

	protected onConstruct():void {
		this.UI_COMP_HEAD = <fgui.GComponent>(this.getChildAt(3));
		this.UI_TXT_NICKNAME = <fgui.GTextField>(this.getChildAt(4));
		this.UI_TXT_USERID = <fgui.GTextField>(this.getChildAt(5));
		this.UI_BTN_WECHAT = <fgui.GButton>(this.getChildAt(6));
		this.UI_BTN_WECHAT.onClick(this.onBtnWechat, this);
		this.UI_TXT_WIN = <fgui.GTextField>(this.getChildAt(11));
		this.UI_TXT_LOSE = <fgui.GTextField>(this.getChildAt(12));
		this.UI_TXT_DRAW = <fgui.GTextField>(this.getChildAt(13));
		this.UI_TXT_RATE = <fgui.GTextField>(this.getChildAt(14));
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(15));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_BTN_BGMUSIC = <FGUICompBtnSound>(this.getChildAt(18));
		this.UI_BTN_BGMUSIC.onClick(this.onBtnBgmusic, this);
		this.UI_BTN_EFFECT = <FGUICompBtnSound>(this.getChildAt(19));
		this.UI_BTN_EFFECT.onClick(this.onBtnEffect, this);
		this.UI_TXT_CP = <fgui.GTextField>(this.getChildAt(20));
		this.UI_BTN_DEL_ACC = <fgui.GButton>(this.getChildAt(21));
		this.UI_BTN_DEL_ACC.onClick(this.onBtnDelAcc, this);
		this.UI_TXT_TITLE = <fgui.GTextField>(this.getChildAt(22));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnWechat():void{};
	onBtnClose():void{};
	onBtnBgmusic():void{};
	onBtnEffect():void{};
	onBtnDelAcc():void{};
}
fgui.UIObjectFactory.setExtension(FGUIUserCenterView.URL, FGUIUserCenterView);