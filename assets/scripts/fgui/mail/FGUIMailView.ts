/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompMailContent from "./FGUICompMailContent";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUIMailView extends fgui.GComponent {

	public ctrl_have:fgui.Controller;
	public UI_BTN_CLOSE:fgui.GButton;
	public UI_TXT_TITLE:fgui.GTextField;
	public UI_LV_LIST:fgui.GList;
	public UI_COMP_CONTENT:FGUICompMailContent;
	public static URL:string = "ui://8lqwicsugd4t0";

	public static packageName:string = "mail";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUIMailView.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("mail", "MailView") as FGUIMailView;

			view.makeFullScreen();
			FGUIMailView.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUIMailView.instance = null;
	}
	public static hideView():void {
		FGUIMailView.instance && FGUIMailView.instance.dispose();
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

	public static createInstance():FGUIMailView {
		return <FGUIMailView>(fgui.UIPackage.createObject("mail", "MailView"));
	}

	protected onConstruct():void {
		this.ctrl_have = this.getControllerAt(0);
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(3));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_TXT_TITLE = <fgui.GTextField>(this.getChildAt(4));
		this.UI_LV_LIST = <fgui.GList>(this.getChildAt(5));
		this.UI_COMP_CONTENT = <FGUICompMailContent>(this.getChildAt(8));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnClose():void{};
}
fgui.UIObjectFactory.setExtension(FGUIMailView.URL, FGUIMailView);