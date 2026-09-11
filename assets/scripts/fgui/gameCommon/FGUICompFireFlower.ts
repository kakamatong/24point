/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompFire1 from "./FGUICompFire1";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompFireFlower extends fgui.GComponent {

	public UI_COMP_BUCKET:FGUICompFire1;
	public UI_COMP_RIBBONS:fgui.GLoader3D;
	public static URL:string = "ui://so20wr0w9kqju";

	public static packageName:string = "gameCommon";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompFireFlower.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("gameCommon", "CompFireFlower") as FGUICompFireFlower;

			view.makeFullScreen();
			FGUICompFireFlower.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompFireFlower.instance = null;
	}
	public static hideView():void {
		FGUICompFireFlower.instance && FGUICompFireFlower.instance.dispose();
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

	public static createInstance():FGUICompFireFlower {
		return <FGUICompFireFlower>(fgui.UIPackage.createObject("gameCommon", "CompFireFlower"));
	}

	protected onConstruct():void {
		this.UI_COMP_BUCKET = <FGUICompFire1>(this.getChildAt(0));
		this.UI_COMP_RIBBONS = <fgui.GLoader3D>(this.getChildAt(1));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompFireFlower.URL, FGUICompFireFlower);