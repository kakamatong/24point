/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompBgCubeLine from "./FGUICompBgCubeLine";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompBgCubePage extends fgui.GComponent {

	public UI_COMP_CUBE_LINE_0:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_1:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_2:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_3:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_4:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_5:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_6:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_7:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_8:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_9:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_10:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_11:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_12:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_13:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_14:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_15:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_16:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_17:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_18:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_19:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_20:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_21:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_22:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_23:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_24:FGUICompBgCubeLine;
	public UI_COMP_CUBE_LINE_25:FGUICompBgCubeLine;
	public static URL:string = "ui://m52rjp09ddk1r";

	public static packageName:string = "lobbyBg";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompBgCubePage.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("lobbyBg", "CompBgCubePage") as FGUICompBgCubePage;

			view.makeFullScreen();
			FGUICompBgCubePage.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompBgCubePage.instance = null;
	}
	public static hideView():void {
		FGUICompBgCubePage.instance && FGUICompBgCubePage.instance.dispose();
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

	public static createInstance():FGUICompBgCubePage {
		return <FGUICompBgCubePage>(fgui.UIPackage.createObject("lobbyBg", "CompBgCubePage"));
	}

	protected onConstruct():void {
		this.UI_COMP_CUBE_LINE_0 = <FGUICompBgCubeLine>(this.getChildAt(0));
		this.UI_COMP_CUBE_LINE_1 = <FGUICompBgCubeLine>(this.getChildAt(1));
		this.UI_COMP_CUBE_LINE_2 = <FGUICompBgCubeLine>(this.getChildAt(2));
		this.UI_COMP_CUBE_LINE_3 = <FGUICompBgCubeLine>(this.getChildAt(3));
		this.UI_COMP_CUBE_LINE_4 = <FGUICompBgCubeLine>(this.getChildAt(4));
		this.UI_COMP_CUBE_LINE_5 = <FGUICompBgCubeLine>(this.getChildAt(5));
		this.UI_COMP_CUBE_LINE_6 = <FGUICompBgCubeLine>(this.getChildAt(6));
		this.UI_COMP_CUBE_LINE_7 = <FGUICompBgCubeLine>(this.getChildAt(7));
		this.UI_COMP_CUBE_LINE_8 = <FGUICompBgCubeLine>(this.getChildAt(8));
		this.UI_COMP_CUBE_LINE_9 = <FGUICompBgCubeLine>(this.getChildAt(9));
		this.UI_COMP_CUBE_LINE_10 = <FGUICompBgCubeLine>(this.getChildAt(10));
		this.UI_COMP_CUBE_LINE_11 = <FGUICompBgCubeLine>(this.getChildAt(11));
		this.UI_COMP_CUBE_LINE_12 = <FGUICompBgCubeLine>(this.getChildAt(12));
		this.UI_COMP_CUBE_LINE_13 = <FGUICompBgCubeLine>(this.getChildAt(13));
		this.UI_COMP_CUBE_LINE_14 = <FGUICompBgCubeLine>(this.getChildAt(14));
		this.UI_COMP_CUBE_LINE_15 = <FGUICompBgCubeLine>(this.getChildAt(15));
		this.UI_COMP_CUBE_LINE_16 = <FGUICompBgCubeLine>(this.getChildAt(16));
		this.UI_COMP_CUBE_LINE_17 = <FGUICompBgCubeLine>(this.getChildAt(17));
		this.UI_COMP_CUBE_LINE_18 = <FGUICompBgCubeLine>(this.getChildAt(18));
		this.UI_COMP_CUBE_LINE_19 = <FGUICompBgCubeLine>(this.getChildAt(19));
		this.UI_COMP_CUBE_LINE_20 = <FGUICompBgCubeLine>(this.getChildAt(20));
		this.UI_COMP_CUBE_LINE_21 = <FGUICompBgCubeLine>(this.getChildAt(21));
		this.UI_COMP_CUBE_LINE_22 = <FGUICompBgCubeLine>(this.getChildAt(22));
		this.UI_COMP_CUBE_LINE_23 = <FGUICompBgCubeLine>(this.getChildAt(23));
		this.UI_COMP_CUBE_LINE_24 = <FGUICompBgCubeLine>(this.getChildAt(24));
		this.UI_COMP_CUBE_LINE_25 = <FGUICompBgCubeLine>(this.getChildAt(25));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompBgCubePage.URL, FGUICompBgCubePage);