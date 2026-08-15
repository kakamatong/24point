/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompResultInfo extends fgui.GComponent {

	public ctrl_self:fgui.Controller;
	public ctrl_uncomp:fgui.Controller;
	public ctrl_color:fgui.Controller;
	public UI_COMP_HEAD:fgui.GComponent;
	public UI_TXT_NICKNAME:fgui.GTextField;
	public UI_COMP_MEDAL:fgui.GComponent;
	public UI_TXT_USE_TIME:fgui.GTextField;
	public UI_TXT_SCORE:fgui.GTextField;
	public UI_TXT_MAX_COMB:fgui.GTextField;
	public UI_TXT_TOTALSCORE:fgui.GTextField;
	public static URL:string = "ui://5x18e99vfnug1";

	public static packageName:string = "game10002Result";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompResultInfo.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002Result", "CompResultInfo") as FGUICompResultInfo;

			view.makeFullScreen();
			FGUICompResultInfo.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompResultInfo.instance = null;
	}
	public static hideView():void {
		FGUICompResultInfo.instance && FGUICompResultInfo.instance.dispose();
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

	public static createInstance():FGUICompResultInfo {
		return <FGUICompResultInfo>(fgui.UIPackage.createObject("game10002Result", "CompResultInfo"));
	}

	protected onConstruct():void {
		this.ctrl_self = this.getControllerAt(0);
		this.ctrl_uncomp = this.getControllerAt(1);
		this.ctrl_color = this.getControllerAt(2);
		this.UI_COMP_HEAD = <fgui.GComponent>(this.getChildAt(0));
		this.UI_TXT_NICKNAME = <fgui.GTextField>(this.getChildAt(2));
		this.UI_COMP_MEDAL = <fgui.GComponent>(this.getChildAt(3));
		this.UI_TXT_USE_TIME = <fgui.GTextField>(this.getChildAt(4));
		this.UI_TXT_SCORE = <fgui.GTextField>(this.getChildAt(6));
		this.UI_TXT_MAX_COMB = <fgui.GTextField>(this.getChildAt(7));
		this.UI_TXT_TOTALSCORE = <fgui.GTextField>(this.getChildAt(8));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompResultInfo.URL, FGUICompResultInfo);