/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompChapter extends fgui.GComponent {

	public UI_LV_ITEMS:fgui.GList;
	public UI_BTN_NEXT:fgui.GButton;
	public UI_BTN_PRE:fgui.GButton;
	public static URL:string = "ui://22u2b061vcww3";

	public static packageName:string = "challenge";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompChapter.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("challenge", "CompChapter") as FGUICompChapter;

			view.makeFullScreen();
			FGUICompChapter.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompChapter.instance = null;
	}
	public static hideView():void {
		FGUICompChapter.instance && FGUICompChapter.instance.dispose();
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

	public static createInstance():FGUICompChapter {
		return <FGUICompChapter>(fgui.UIPackage.createObject("challenge", "CompChapter"));
	}

	protected onConstruct():void {
		this.UI_LV_ITEMS = <fgui.GList>(this.getChildAt(0));
		this.UI_BTN_NEXT = <fgui.GButton>(this.getChildAt(1));
		this.UI_BTN_NEXT.onClick(this.onBtnNext, this);
		this.UI_BTN_PRE = <fgui.GButton>(this.getChildAt(2));
		this.UI_BTN_PRE.onClick(this.onBtnPre, this);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnNext():void{};
	onBtnPre():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompChapter.URL, FGUICompChapter);