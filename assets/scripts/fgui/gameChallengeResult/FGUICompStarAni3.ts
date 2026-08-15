/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompStarAct1 from "./FGUICompStarAct1";
import FGUICompStarActShow from "./FGUICompStarActShow";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompStarAni3 extends fgui.GComponent {

	public ctrl_get:fgui.Controller;
	public UI_COMP_SMALL:FGUICompStarAct1;
	public UI_COMP_BIG:FGUICompStarActShow;
	public static URL:string = "ui://xjoxe981iccma";

	public static packageName:string = "gameChallengeResult";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompStarAni3.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("gameChallengeResult", "CompStarAni3") as FGUICompStarAni3;

			view.makeFullScreen();
			FGUICompStarAni3.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompStarAni3.instance = null;
	}
	public static hideView():void {
		FGUICompStarAni3.instance && FGUICompStarAni3.instance.dispose();
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

	public static createInstance():FGUICompStarAni3 {
		return <FGUICompStarAni3>(fgui.UIPackage.createObject("gameChallengeResult", "CompStarAni3"));
	}

	protected onConstruct():void {
		this.ctrl_get = this.getControllerAt(0);
		this.UI_COMP_SMALL = <FGUICompStarAct1>(this.getChildAt(1));
		this.UI_COMP_BIG = <FGUICompStarActShow>(this.getChildAt(2));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompStarAni3.URL, FGUICompStarAni3);