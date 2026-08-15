/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompGm extends fgui.GComponent {

	public UI_BTN_CLOSE:fgui.GButton;
	public UI_TXT_TITLE:fgui.GTextField;
	public UI_BTN_ENERGY_ADD:fgui.GButton;
	public UI_BTN_ENERGY_REDUCE:fgui.GButton;
	public UI_BTN_TEST:fgui.GButton;
	public static URL:string = "ui://vljlqy6gf9cy1";

	public static packageName:string = "gm";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompGm.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("gm", "CompGm") as FGUICompGm;

			view.makeFullScreen();
			FGUICompGm.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompGm.instance = null;
	}
	public static hideView():void {
		FGUICompGm.instance && FGUICompGm.instance.dispose();
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

	public static createInstance():FGUICompGm {
		return <FGUICompGm>(fgui.UIPackage.createObject("gm", "CompGm"));
	}

	protected onConstruct():void {
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(1));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_TXT_TITLE = <fgui.GTextField>(this.getChildAt(2));
		this.UI_BTN_ENERGY_ADD = <fgui.GButton>(this.getChildAt(3));
		this.UI_BTN_ENERGY_ADD.onClick(this.onBtnEnergyAdd, this);
		this.UI_BTN_ENERGY_REDUCE = <fgui.GButton>(this.getChildAt(4));
		this.UI_BTN_ENERGY_REDUCE.onClick(this.onBtnEnergyReduce, this);
		this.UI_BTN_TEST = <fgui.GButton>(this.getChildAt(5));
		this.UI_BTN_TEST.onClick(this.onBtnTest, this);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnClose():void{};
	onBtnEnergyAdd():void{};
	onBtnEnergyReduce():void{};
	onBtnTest():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompGm.URL, FGUICompGm);