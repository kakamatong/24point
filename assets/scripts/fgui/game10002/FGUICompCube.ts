/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompCube extends fgui.GComponent {

	public ctrl_selected:fgui.Controller;
	public UI_LOADER_ICOM:fgui.GLoader;
	public UI_SP_ANI:fgui.GLoader3D;
	public act:fgui.Transition;
	public static URL:string = "ui://2zsfe53xhs3tr";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompCube.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompCube") as FGUICompCube;

			view.makeFullScreen();
			FGUICompCube.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompCube.instance = null;
	}
	public static hideView():void {
		FGUICompCube.instance && FGUICompCube.instance.dispose();
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

	public static createInstance():FGUICompCube {
		return <FGUICompCube>(fgui.UIPackage.createObject("game10002", "CompCube"));
	}

	protected onConstruct():void {
		this.ctrl_selected = this.getControllerAt(0);
		this.UI_LOADER_ICOM = <fgui.GLoader>(this.getChildAt(2));
		this.UI_SP_ANI = <fgui.GLoader3D>(this.getChildAt(3));
		this.act = this.getTransitionAt(0);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompCube.URL, FGUICompCube);