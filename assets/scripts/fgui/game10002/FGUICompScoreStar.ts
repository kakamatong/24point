/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompScoreStar extends fgui.GComponent {

	public UI_IMG_BAR:fgui.GImage;
	public UI_IMG_STAR_0:fgui.GImage;
	public UI_IMG_STAR_1:fgui.GImage;
	public UI_IMG_STAR_2:fgui.GImage;
	public UI_TXT_TOTAL_SCORE:fgui.GTextField;
	public UI_TXT_PASS_SCORE:fgui.GTextField;
	public static URL:string = "ui://2zsfe53xgxvf20";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompScoreStar.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompScoreStar") as FGUICompScoreStar;

			view.makeFullScreen();
			FGUICompScoreStar.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompScoreStar.instance = null;
	}
	public static hideView():void {
		FGUICompScoreStar.instance && FGUICompScoreStar.instance.dispose();
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

	public static createInstance():FGUICompScoreStar {
		return <FGUICompScoreStar>(fgui.UIPackage.createObject("game10002", "CompScoreStar"));
	}

	protected onConstruct():void {
		this.UI_IMG_BAR = <fgui.GImage>(this.getChildAt(1));
		this.UI_IMG_STAR_0 = <fgui.GImage>(this.getChildAt(2));
		this.UI_IMG_STAR_1 = <fgui.GImage>(this.getChildAt(3));
		this.UI_IMG_STAR_2 = <fgui.GImage>(this.getChildAt(4));
		this.UI_TXT_TOTAL_SCORE = <fgui.GTextField>(this.getChildAt(5));
		this.UI_TXT_PASS_SCORE = <fgui.GTextField>(this.getChildAt(6));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompScoreStar.URL, FGUICompScoreStar);