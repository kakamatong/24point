/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompBag extends fgui.GComponent {

	public ctrl_have:fgui.Controller;
	public UI_TXT_TITLE:fgui.GTextField;
	public UI_BTN_CLOSE:fgui.GButton;
	public UI_LV_BAGS:fgui.GList;
	public UI_COMP_ICON:fgui.GButton;
	public UI_COMP_DIS:fgui.GTextField;
	public static URL:string = "ui://w2uvmi35rgj11";

	public static packageName:string = "bag";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompBag.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("bag", "CompBag") as FGUICompBag;

			view.makeFullScreen();
			FGUICompBag.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompBag.instance = null;
	}
	public static hideView():void {
		FGUICompBag.instance && FGUICompBag.instance.dispose();
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

	public static createInstance():FGUICompBag {
		return <FGUICompBag>(fgui.UIPackage.createObject("bag", "CompBag"));
	}

	protected onConstruct():void {
		this.ctrl_have = this.getControllerAt(0);
		this.UI_TXT_TITLE = <fgui.GTextField>(this.getChildAt(1));
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(2));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_LV_BAGS = <fgui.GList>(this.getChildAt(5));
		this.UI_COMP_ICON = <fgui.GButton>(this.getChildAt(6));
		this.UI_COMP_DIS = <fgui.GTextField>(this.getChildAt(7));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnClose():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompBag.URL, FGUICompBag);