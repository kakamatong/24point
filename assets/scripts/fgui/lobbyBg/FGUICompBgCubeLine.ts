/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompBgCube from "./FGUICompBgCube";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompBgCubeLine extends fgui.GComponent {

	public UI_COMP_CUBE_0:FGUICompBgCube;
	public UI_COMP_CUBE_1:FGUICompBgCube;
	public UI_COMP_CUBE_2:FGUICompBgCube;
	public UI_COMP_CUBE_3:FGUICompBgCube;
	public UI_COMP_CUBE_4:FGUICompBgCube;
	public UI_COMP_CUBE_5:FGUICompBgCube;
	public UI_COMP_CUBE_6:FGUICompBgCube;
	public UI_COMP_CUBE_7:FGUICompBgCube;
	public UI_COMP_CUBE_8:FGUICompBgCube;
	public UI_COMP_CUBE_9:FGUICompBgCube;
	public UI_COMP_CUBE_10:FGUICompBgCube;
	public UI_COMP_CUBE_11:FGUICompBgCube;
	public UI_COMP_CUBE_12:FGUICompBgCube;
	public UI_COMP_CUBE_13:FGUICompBgCube;
	public static URL:string = "ui://m52rjp09ddk1q";

	public static packageName:string = "lobbyBg";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompBgCubeLine.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("lobbyBg", "CompBgCubeLine") as FGUICompBgCubeLine;

			view.makeFullScreen();
			FGUICompBgCubeLine.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompBgCubeLine.instance = null;
	}
	public static hideView():void {
		FGUICompBgCubeLine.instance && FGUICompBgCubeLine.instance.dispose();
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

	public static createInstance():FGUICompBgCubeLine {
		return <FGUICompBgCubeLine>(fgui.UIPackage.createObject("lobbyBg", "CompBgCubeLine"));
	}

	protected onConstruct():void {
		this.UI_COMP_CUBE_0 = <FGUICompBgCube>(this.getChildAt(0));
		this.UI_COMP_CUBE_1 = <FGUICompBgCube>(this.getChildAt(1));
		this.UI_COMP_CUBE_2 = <FGUICompBgCube>(this.getChildAt(2));
		this.UI_COMP_CUBE_3 = <FGUICompBgCube>(this.getChildAt(3));
		this.UI_COMP_CUBE_4 = <FGUICompBgCube>(this.getChildAt(4));
		this.UI_COMP_CUBE_5 = <FGUICompBgCube>(this.getChildAt(5));
		this.UI_COMP_CUBE_6 = <FGUICompBgCube>(this.getChildAt(6));
		this.UI_COMP_CUBE_7 = <FGUICompBgCube>(this.getChildAt(7));
		this.UI_COMP_CUBE_8 = <FGUICompBgCube>(this.getChildAt(8));
		this.UI_COMP_CUBE_9 = <FGUICompBgCube>(this.getChildAt(9));
		this.UI_COMP_CUBE_10 = <FGUICompBgCube>(this.getChildAt(10));
		this.UI_COMP_CUBE_11 = <FGUICompBgCube>(this.getChildAt(11));
		this.UI_COMP_CUBE_12 = <FGUICompBgCube>(this.getChildAt(12));
		this.UI_COMP_CUBE_13 = <FGUICompBgCube>(this.getChildAt(13));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompBgCubeLine.URL, FGUICompBgCubeLine);