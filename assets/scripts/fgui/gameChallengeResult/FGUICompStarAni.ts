/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompStarAni1 from "./FGUICompStarAni1";
import FGUICompStarAni2 from "./FGUICompStarAni2";
import FGUICompStarAni3 from "./FGUICompStarAni3";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompStarAni extends fgui.GComponent {

	public UI_COMP_STAR_1:FGUICompStarAni1;
	public UI_COMP_STAR_2:FGUICompStarAni2;
	public UI_COMP_STAR_3:FGUICompStarAni3;
	public static URL:string = "ui://xjoxe981iccmb";

	public static packageName:string = "gameChallengeResult";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompStarAni.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("gameChallengeResult", "CompStarAni") as FGUICompStarAni;

			view.makeFullScreen();
			FGUICompStarAni.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompStarAni.instance = null;
	}
	public static hideView():void {
		FGUICompStarAni.instance && FGUICompStarAni.instance.dispose();
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

	public static createInstance():FGUICompStarAni {
		return <FGUICompStarAni>(fgui.UIPackage.createObject("gameChallengeResult", "CompStarAni"));
	}

	protected onConstruct():void {
		this.UI_COMP_STAR_1 = <FGUICompStarAni1>(this.getChildAt(0));
		this.UI_COMP_STAR_2 = <FGUICompStarAni2>(this.getChildAt(1));
		this.UI_COMP_STAR_3 = <FGUICompStarAni3>(this.getChildAt(2));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompStarAni.URL, FGUICompStarAni);