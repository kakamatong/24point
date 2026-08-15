/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompPrivateCreate extends fgui.GComponent {

	public ctrl_mode:fgui.Controller;
	public ctrl_prop:fgui.Controller;
	public UI_BTN_CREATE:fgui.GButton;
	public UI_BTN_JU3:fgui.GButton;
	public UI_BTN_JU5:fgui.GButton;
	public UI_BTN_JU7:fgui.GButton;
	public UI_BTN_JU0:fgui.GButton;
	public UI_BTN_ENABLE:fgui.GButton;
	public UI_BTN_DISENABLE:fgui.GButton;
	public static URL:string = "ui://s0qy2rl1nomu1";

	public static packageName:string = "privateRoom";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompPrivateCreate.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("privateRoom", "CompPrivateCreate") as FGUICompPrivateCreate;

			view.makeFullScreen();
			FGUICompPrivateCreate.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompPrivateCreate.instance = null;
	}
	public static hideView():void {
		FGUICompPrivateCreate.instance && FGUICompPrivateCreate.instance.dispose();
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

	public static createInstance():FGUICompPrivateCreate {
		return <FGUICompPrivateCreate>(fgui.UIPackage.createObject("privateRoom", "CompPrivateCreate"));
	}

	protected onConstruct():void {
		this.ctrl_mode = this.getControllerAt(0);
		this.ctrl_prop = this.getControllerAt(1);
		this.UI_BTN_CREATE = <fgui.GButton>(this.getChildAt(1));
		this.UI_BTN_CREATE.onClick(this.onBtnCreate, this);
		this.UI_BTN_JU3 = <fgui.GButton>(this.getChildAt(3));
		this.UI_BTN_JU3.onClick(this.onBtnJu3, this);
		this.UI_BTN_JU5 = <fgui.GButton>(this.getChildAt(4));
		this.UI_BTN_JU5.onClick(this.onBtnJu5, this);
		this.UI_BTN_JU7 = <fgui.GButton>(this.getChildAt(5));
		this.UI_BTN_JU7.onClick(this.onBtnJu7, this);
		this.UI_BTN_JU0 = <fgui.GButton>(this.getChildAt(6));
		this.UI_BTN_JU0.onClick(this.onBtnJu0, this);
		this.UI_BTN_ENABLE = <fgui.GButton>(this.getChildAt(9));
		this.UI_BTN_ENABLE.onClick(this.onBtnEnable, this);
		this.UI_BTN_DISENABLE = <fgui.GButton>(this.getChildAt(10));
		this.UI_BTN_DISENABLE.onClick(this.onBtnDisenable, this);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnCreate():void{};
	onBtnJu3():void{};
	onBtnJu5():void{};
	onBtnJu7():void{};
	onBtnJu0():void{};
	onBtnEnable():void{};
	onBtnDisenable():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompPrivateCreate.URL, FGUICompPrivateCreate);