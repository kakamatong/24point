/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompTimeStar from "./FGUICompTimeStar";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompTimeLeft extends fgui.GComponent {

	public ctrl_warn:fgui.Controller;
	public ctrl_type:fgui.Controller;
	public UI_IMG_BAR:fgui.GImage;
	public UI_COMP_STAR_1:FGUICompTimeStar;
	public UI_COMP_STAR_2:FGUICompTimeStar;
	public UI_COMP_STAR_3:FGUICompTimeStar;
	public UI_TXT_TIME_MSG:fgui.GTextField;
	public act:fgui.Transition;
	public static URL:string = "ui://2zsfe53xmnt112";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompTimeLeft.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompTimeLeft") as FGUICompTimeLeft;

			view.makeFullScreen();
			FGUICompTimeLeft.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompTimeLeft.instance = null;
	}
	public static hideView():void {
		FGUICompTimeLeft.instance && FGUICompTimeLeft.instance.dispose();
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

	public static createInstance():FGUICompTimeLeft {
		return <FGUICompTimeLeft>(fgui.UIPackage.createObject("game10002", "CompTimeLeft"));
	}

	protected onConstruct():void {
		this.ctrl_warn = this.getControllerAt(0);
		this.ctrl_type = this.getControllerAt(1);
		this.UI_IMG_BAR = <fgui.GImage>(this.getChildAt(1));
		this.UI_COMP_STAR_1 = <FGUICompTimeStar>(this.getChildAt(2));
		this.UI_COMP_STAR_2 = <FGUICompTimeStar>(this.getChildAt(3));
		this.UI_COMP_STAR_3 = <FGUICompTimeStar>(this.getChildAt(4));
		this.UI_TXT_TIME_MSG = <fgui.GTextField>(this.getChildAt(5));
		this.act = this.getTransitionAt(0);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompTimeLeft.URL, FGUICompTimeLeft);