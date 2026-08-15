/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompStar from "./FGUICompStar";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompLevel extends fgui.GButton {

	public ctrl_status:fgui.Controller;
	public ctrl_stars:fgui.Controller;
	public UI_LOAD_ICON:fgui.GLoader;
	public UI_COMP_STAR_0:FGUICompStar;
	public UI_COMP_STAR_1:FGUICompStar;
	public UI_COMP_STAR_2:FGUICompStar;
	public UI_TXT_INDEX:fgui.GTextField;
	public static URL:string = "ui://22u2b061vcww5";

	public static packageName:string = "challenge";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompLevel.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("challenge", "CompLevel") as FGUICompLevel;

			view.makeFullScreen();
			FGUICompLevel.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompLevel.instance = null;
	}
	public static hideView():void {
		FGUICompLevel.instance && FGUICompLevel.instance.dispose();
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

	public static createInstance():FGUICompLevel {
		return <FGUICompLevel>(fgui.UIPackage.createObject("challenge", "CompLevel"));
	}

	protected onConstruct():void {
		this.ctrl_status = this.getControllerAt(0);
		this.ctrl_stars = this.getControllerAt(1);
		this.UI_LOAD_ICON = <fgui.GLoader>(this.getChildAt(0));
		this.UI_COMP_STAR_0 = <FGUICompStar>(this.getChildAt(1));
		this.UI_COMP_STAR_1 = <FGUICompStar>(this.getChildAt(2));
		this.UI_COMP_STAR_2 = <FGUICompStar>(this.getChildAt(3));
		this.UI_TXT_INDEX = <fgui.GTextField>(this.getChildAt(4));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompLevel.URL, FGUICompLevel);