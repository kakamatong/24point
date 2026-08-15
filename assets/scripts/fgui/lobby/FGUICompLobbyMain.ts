/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompTop from "./FGUICompTop";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompLobbyMain extends fgui.GComponent {

	public UI_BTN_MATCH_ROOM:fgui.GButton;
	public UI_BTN_PRIVATE_ROOM:fgui.GButton;
	public UI_BTN_LOCALGAME:fgui.GButton;
	public UI_COMP_TOP:FGUICompTop;
	public UI_BTN_MAILS:fgui.GButton;
	public UI_BTN_RANK:fgui.GButton;
	public UI_BTN_SHARE:fgui.GButton;
	public UI_BTN_SIGN_IN:fgui.GButton;
	public UI_BTN_AD:fgui.GButton;
	public UI_TXT_ENV:fgui.GTextField;
	public UI_BTN_BAG:fgui.GButton;
	public UI_BTN_CHALLENGE:fgui.GButton;
	public static URL:string = "ui://gv22rev3ln74i";

	public static packageName:string = "lobby";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompLobbyMain.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("lobby", "CompLobbyMain") as FGUICompLobbyMain;

			view.makeFullScreen();
			FGUICompLobbyMain.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompLobbyMain.instance = null;
	}
	public static hideView():void {
		FGUICompLobbyMain.instance && FGUICompLobbyMain.instance.dispose();
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

	public static createInstance():FGUICompLobbyMain {
		return <FGUICompLobbyMain>(fgui.UIPackage.createObject("lobby", "CompLobbyMain"));
	}

	protected onConstruct():void {
		this.UI_BTN_MATCH_ROOM = <fgui.GButton>(this.getChildAt(0));
		this.UI_BTN_MATCH_ROOM.onClick(this.onBtnMatchRoom, this);
		this.UI_BTN_PRIVATE_ROOM = <fgui.GButton>(this.getChildAt(1));
		this.UI_BTN_PRIVATE_ROOM.onClick(this.onBtnPrivateRoom, this);
		this.UI_BTN_LOCALGAME = <fgui.GButton>(this.getChildAt(2));
		this.UI_BTN_LOCALGAME.onClick(this.onBtnLocalgame, this);
		this.UI_COMP_TOP = <FGUICompTop>(this.getChildAt(3));
		this.UI_BTN_MAILS = <fgui.GButton>(this.getChildAt(4));
		this.UI_BTN_MAILS.onClick(this.onBtnMails, this);
		this.UI_BTN_RANK = <fgui.GButton>(this.getChildAt(5));
		this.UI_BTN_RANK.onClick(this.onBtnRank, this);
		this.UI_BTN_SHARE = <fgui.GButton>(this.getChildAt(6));
		this.UI_BTN_SHARE.onClick(this.onBtnShare, this);
		this.UI_BTN_SIGN_IN = <fgui.GButton>(this.getChildAt(7));
		this.UI_BTN_SIGN_IN.onClick(this.onBtnSignIn, this);
		this.UI_BTN_AD = <fgui.GButton>(this.getChildAt(8));
		this.UI_BTN_AD.onClick(this.onBtnAd, this);
		this.UI_TXT_ENV = <fgui.GTextField>(this.getChildAt(9));
		this.UI_BTN_BAG = <fgui.GButton>(this.getChildAt(10));
		this.UI_BTN_BAG.onClick(this.onBtnBag, this);
		this.UI_BTN_CHALLENGE = <fgui.GButton>(this.getChildAt(11));
		this.UI_BTN_CHALLENGE.onClick(this.onBtnChallenge, this);
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnMatchRoom():void{};
	onBtnPrivateRoom():void{};
	onBtnLocalgame():void{};
	onBtnMails():void{};
	onBtnRank():void{};
	onBtnShare():void{};
	onBtnSignIn():void{};
	onBtnAd():void{};
	onBtnBag():void{};
	onBtnChallenge():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompLobbyMain.URL, FGUICompLobbyMain);