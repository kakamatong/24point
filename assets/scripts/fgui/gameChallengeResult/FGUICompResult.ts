/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompStarAni from "./FGUICompStarAni";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompResult extends fgui.GComponent {

	public ctrl_result:fgui.Controller;
	public UI_COMP_STAR:FGUICompStarAni;
	public UI_BTN_NEXT:fgui.GButton;
	public UI_BTN_REPLAY:fgui.GButton;
	public UI_TXT_SCORE:fgui.GTextField;
	public UI_TXT_TIME:fgui.GTextField;
	public static URL:string = "ui://xjoxe981iccm3";

	public static packageName:string = "gameChallengeResult";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompResult.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("gameChallengeResult", "CompResult") as FGUICompResult;

			view.makeFullScreen();
			FGUICompResult.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompResult.instance = null;
	}
	public static hideView():void {
		FGUICompResult.instance && FGUICompResult.instance.dispose();
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

	public static createInstance():FGUICompResult {
		return <FGUICompResult>(fgui.UIPackage.createObject("gameChallengeResult", "CompResult"));
	}

	protected onConstruct():void {
		this.ctrl_result = this.getControllerAt(0);
		this.UI_COMP_STAR = <FGUICompStarAni>(this.getChildAt(3));
		this.UI_BTN_NEXT = <fgui.GButton>(this.getChildAt(4));
		this.UI_BTN_NEXT.onClick(this.onBtnNext, this);
		this.UI_BTN_REPLAY = <fgui.GButton>(this.getChildAt(5));
		this.UI_BTN_REPLAY.onClick(this.onBtnReplay, this);
		this.UI_TXT_SCORE = <fgui.GTextField>(this.getChildAt(7));
		this.UI_TXT_TIME = <fgui.GTextField>(this.getChildAt(8));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnNext():void{};
	onBtnReplay():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompResult.URL, FGUICompResult);