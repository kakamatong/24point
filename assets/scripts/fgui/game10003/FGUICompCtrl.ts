/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompCtrl extends fgui.GComponent {

	public ctrl_nums:fgui.Controller;
	public ctrl_symbol:fgui.Controller;
	public UI_BTN_NUM_0:fgui.GButton;
	public UI_BTN_NUM_1:fgui.GButton;
	public UI_BTN_NUM_2:fgui.GButton;
	public UI_BTN_NUM_3:fgui.GButton;
	public UI_BTN_SYMBOL_0:fgui.GButton;
	public UI_BTN_SYMBOL_1:fgui.GButton;
	public UI_BTN_SYMBOL_2:fgui.GButton;
	public UI_BTN_SYMBOL_3:fgui.GButton;
	public static URL:string = "ui://2zsfe53xh3uk1r";

	public static packageName:string = "game10003";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompCtrl.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10003", "CompCtrl") as FGUICompCtrl;

			view.makeFullScreen();
			FGUICompCtrl.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompCtrl.instance = null;
	}
	public static hideView():void {
		FGUICompCtrl.instance && FGUICompCtrl.instance.dispose();
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

	public static createInstance():FGUICompCtrl {
		return <FGUICompCtrl>(fgui.UIPackage.createObject("game10003", "CompCtrl"));
	}

	protected onConstruct():void {
		this.ctrl_nums = this.getControllerAt(0);
		this.ctrl_symbol = this.getControllerAt(1);
		this.UI_BTN_NUM_0 = <fgui.GButton>(this.getChildAt(0));
		this.UI_BTN_NUM_0.onClick(this.onBtnNum0, this);
		this.UI_BTN_NUM_1 = <fgui.GButton>(this.getChildAt(1));
		this.UI_BTN_NUM_1.onClick(this.onBtnNum1, this);
		this.UI_BTN_NUM_2 = <fgui.GButton>(this.getChildAt(2));
		this.UI_BTN_NUM_2.onClick(this.onBtnNum2, this);
		this.UI_BTN_NUM_3 = <fgui.GButton>(this.getChildAt(3));
		this.UI_BTN_NUM_3.onClick(this.onBtnNum3, this);
		this.UI_BTN_SYMBOL_0 = <fgui.GButton>(this.getChildAt(4));
		this.UI_BTN_SYMBOL_0.onClick(this.onBtnSymbol0, this);
		this.UI_BTN_SYMBOL_1 = <fgui.GButton>(this.getChildAt(5));
		this.UI_BTN_SYMBOL_1.onClick(this.onBtnSymbol1, this);
		this.UI_BTN_SYMBOL_2 = <fgui.GButton>(this.getChildAt(6));
		this.UI_BTN_SYMBOL_2.onClick(this.onBtnSymbol2, this);
		this.UI_BTN_SYMBOL_3 = <fgui.GButton>(this.getChildAt(7));
		this.UI_BTN_SYMBOL_3.onClick(this.onBtnSymbol3, this);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnNum0():void{};
	onBtnNum1():void{};
	onBtnNum2():void{};
	onBtnNum3():void{};
	onBtnSymbol0():void{};
	onBtnSymbol1():void{};
	onBtnSymbol2():void{};
	onBtnSymbol3():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompCtrl.URL, FGUICompCtrl);