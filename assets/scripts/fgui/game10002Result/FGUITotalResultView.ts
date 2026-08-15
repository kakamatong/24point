/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUITotalResultView extends fgui.GComponent {

	public UI_LV_INFO:fgui.GList;
	public UI_BTN_EXIT:fgui.GButton;
	public UI_BTN_BACK:fgui.GButton;
	public static URL:string = "ui://5x18e99vkv65p";

	public static packageName:string = "game10002Result";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUITotalResultView.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002Result", "TotalResultView") as FGUITotalResultView;

			view.makeFullScreen();
			FGUITotalResultView.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUITotalResultView.instance = null;
	}
	public static hideView():void {
		FGUITotalResultView.instance && FGUITotalResultView.instance.dispose();
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

	public static createInstance():FGUITotalResultView {
		return <FGUITotalResultView>(fgui.UIPackage.createObject("game10002Result", "TotalResultView"));
	}

	protected onConstruct():void {
		this.UI_LV_INFO = <fgui.GList>(this.getChildAt(3));
		this.UI_BTN_EXIT = <fgui.GButton>(this.getChildAt(4));
		this.UI_BTN_EXIT.onClick(this.onBtnExit, this);
		this.UI_BTN_BACK = <fgui.GButton>(this.getChildAt(5));
		this.UI_BTN_BACK.onClick(this.onBtnBack, this);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnExit():void{};
	onBtnBack():void{};
}
fgui.UIObjectFactory.setExtension(FGUITotalResultView.URL, FGUITotalResultView);