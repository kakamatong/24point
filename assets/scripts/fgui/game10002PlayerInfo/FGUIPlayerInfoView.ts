/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUIPlayerInfoView extends fgui.GComponent {

	public UI_BG_MASK:fgui.GGraph;
	public UI_BTN_CLOSE:fgui.GButton;
	public UI_COMP_HEAD:fgui.GComponent;
	public UI_TXT_NICKNAME:fgui.GTextField;
	public UI_TXT_USERID:fgui.GTextField;
	public UI_TXT_WIN:fgui.GTextField;
	public UI_TXT_LOSE:fgui.GTextField;
	public UI_TXT_DRAW:fgui.GTextField;
	public UI_TXT_RATE:fgui.GTextField;
	public UI_TXT_CP:fgui.GTextField;
	public UI_TXT_TITLE:fgui.GTextField;
	public static URL:string = "ui://nhq4h2n4bp6f0";

	public static packageName:string = "game10002PlayerInfo";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUIPlayerInfoView.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002PlayerInfo", "PlayerInfoView") as FGUIPlayerInfoView;

			view.makeFullScreen();
			FGUIPlayerInfoView.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUIPlayerInfoView.instance = null;
	}
	public static hideView():void {
		FGUIPlayerInfoView.instance && FGUIPlayerInfoView.instance.dispose();
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

	public static createInstance():FGUIPlayerInfoView {
		return <FGUIPlayerInfoView>(fgui.UIPackage.createObject("game10002PlayerInfo", "PlayerInfoView"));
	}

	protected onConstruct():void {
		this.UI_BG_MASK = <fgui.GGraph>(this.getChildAt(0));
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(2));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_COMP_HEAD = <fgui.GComponent>(this.getChildAt(4));
		this.UI_TXT_NICKNAME = <fgui.GTextField>(this.getChildAt(5));
		this.UI_TXT_USERID = <fgui.GTextField>(this.getChildAt(6));
		this.UI_TXT_WIN = <fgui.GTextField>(this.getChildAt(12));
		this.UI_TXT_LOSE = <fgui.GTextField>(this.getChildAt(13));
		this.UI_TXT_DRAW = <fgui.GTextField>(this.getChildAt(14));
		this.UI_TXT_RATE = <fgui.GTextField>(this.getChildAt(15));
		this.UI_TXT_CP = <fgui.GTextField>(this.getChildAt(16));
		this.UI_TXT_TITLE = <fgui.GTextField>(this.getChildAt(17));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnClose():void{};
}
fgui.UIObjectFactory.setExtension(FGUIPlayerInfoView.URL, FGUIPlayerInfoView);