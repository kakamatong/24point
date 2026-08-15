/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompAwardMain from "./FGUICompAwardMain";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUIAwardView extends fgui.GComponent {

	public UI_BG:fgui.GGraph;
	public UI_COMP_MAIN:FGUICompAwardMain;
	public enter:fgui.Transition;
	public static URL:string = "ui://vb2pxowopz9v0";

	public static packageName:string = "award";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUIAwardView.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("award", "AwardView") as FGUIAwardView;

			view.makeFullScreen();
			FGUIAwardView.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUIAwardView.instance = null;
	}
	public static hideView():void {
		FGUIAwardView.instance && FGUIAwardView.instance.dispose();
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

	public static createInstance():FGUIAwardView {
		return <FGUIAwardView>(fgui.UIPackage.createObject("award", "AwardView"));
	}

	protected onConstruct():void {
		this.UI_BG = <fgui.GGraph>(this.getChildAt(0));
		this.UI_COMP_MAIN = <FGUICompAwardMain>(this.getChildAt(1));
		this.enter = this.getTransitionAt(0);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUIAwardView.URL, FGUIAwardView);