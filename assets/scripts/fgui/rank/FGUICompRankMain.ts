/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompRankDay from "./FGUICompRankDay";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompRankMain extends fgui.GComponent {

	public ctrl_day:fgui.Controller;
	public UI_BTN_CLOSE:fgui.GButton;
	public UI_COMP_DAY:FGUICompRankDay;
	public static URL:string = "ui://2a32uf5ylcf02";

	public static packageName:string = "rank";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?: any, callBack?: (b: boolean) => void): void {
		if (FGUICompRankMain.instance) {
			console.log("allready show");
			callBack && callBack(false);
			return;
		}
		const createView = () => {
			const view = fgui.UIPackage.createObject("rank", "CompRankMain") as FGUICompRankMain;

			view.makeFullScreen();
			FGUICompRankMain.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack && callBack(true);
		};

		if (PackageManager.instance.hasPackage("fgui", this.packageName)) {
			createView();
			return;
		}

		PackageManager.instance
			.loadPackage("fgui", this.packageName)
			.then(() => {
				createView();
			})
			.catch((error) => {
				Logger.error("showView error", error);
				callBack && callBack(false);
				return;
			});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompRankMain.instance = null;
	}
	public static hideView():void {
		FGUICompRankMain.instance && FGUICompRankMain.instance.dispose();
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

	public static createInstance():FGUICompRankMain {
		return <FGUICompRankMain>(fgui.UIPackage.createObject("rank", "CompRankMain"));
	}

	protected onConstruct():void {
		this.ctrl_day = this.getControllerAt(0);
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(1));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_COMP_DAY = <FGUICompRankDay>(this.getChildAt(5));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnClose():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompRankMain.URL, FGUICompRankMain);