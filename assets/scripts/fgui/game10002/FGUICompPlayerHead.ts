/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompOffline from "./FGUICompOffline";
import FGUICompTalk from "./FGUICompTalk";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompPlayerHead extends fgui.GComponent {

	public ctrl_roomtype:fgui.Controller;
	public UI_COMP_HEAD:fgui.GComponent;
	public UI_COMP_OFFLINE:FGUICompOffline;
	public UI_COMP_TALK:FGUICompTalk;
	public UI_TXT_NICKNAME:fgui.GTextField;
	public UI_IMG_SIGN_READY:fgui.GImage;
	public static URL:string = "ui://2zsfe53xgk14j";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompPlayerHead.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompPlayerHead") as FGUICompPlayerHead;

			view.makeFullScreen();
			FGUICompPlayerHead.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompPlayerHead.instance = null;
	}
	public static hideView():void {
		FGUICompPlayerHead.instance && FGUICompPlayerHead.instance.dispose();
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

	public static createInstance():FGUICompPlayerHead {
		return <FGUICompPlayerHead>(fgui.UIPackage.createObject("game10002", "CompPlayerHead"));
	}

	protected onConstruct():void {
		this.ctrl_roomtype = this.getControllerAt(0);
		this.UI_COMP_HEAD = <fgui.GComponent>(this.getChildAt(0));
		this.UI_COMP_OFFLINE = <FGUICompOffline>(this.getChildAt(1));
		this.UI_COMP_TALK = <FGUICompTalk>(this.getChildAt(2));
		this.UI_TXT_NICKNAME = <fgui.GTextField>(this.getChildAt(4));
		this.UI_IMG_SIGN_READY = <fgui.GImage>(this.getChildAt(5));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompPlayerHead.URL, FGUICompPlayerHead);