/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompResult from "./FGUICompResult";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUIGameChallengeResultView extends fgui.GComponent {

	public UI_COMP_MAIN:FGUICompResult;
	public static URL:string = "ui://xjoxe981iccm2";

	public static packageName:string = "gameChallengeResult";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUIGameChallengeResultView.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("gameChallengeResult", "GameChallengeResultView") as FGUIGameChallengeResultView;

			view.makeFullScreen();
			FGUIGameChallengeResultView.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUIGameChallengeResultView.instance = null;
	}
	public static hideView():void {
		FGUIGameChallengeResultView.instance && FGUIGameChallengeResultView.instance.dispose();
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

	public static createInstance():FGUIGameChallengeResultView {
		return <FGUIGameChallengeResultView>(fgui.UIPackage.createObject("gameChallengeResult", "GameChallengeResultView"));
	}

	protected onConstruct():void {
		this.UI_COMP_MAIN = <FGUICompResult>(this.getChildAt(1));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUIGameChallengeResultView.URL, FGUIGameChallengeResultView);