/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompPirvateInfo from "./FGUICompPirvateInfo";
import FGUICompPlayers from "./FGUICompPlayers";
import FGUICompMap from "./FGUICompMap";
import FGUICompPlayerHead from "./FGUICompPlayerHead";
import FGUICompGameStartAct from "./FGUICompGameStartAct";
import FGUICompTimeLeft from "./FGUICompTimeLeft";
import FGUICompFinshInfo from "./FGUICompFinshInfo";
import FGUICompPropPanel from "./FGUICompPropPanel";
import FGUICompComb from "./FGUICompComb";
import FGUICompScoreStar from "./FGUICompScoreStar";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompGameMain extends fgui.GComponent {

	public ctrl_btn:fgui.Controller;
	public ctrl_roomtype:fgui.Controller;
	public ctrl_finshInfo:fgui.Controller;
	public UI_BTN_DISBAND:fgui.GButton;
	public UI_BTN_BACK:fgui.GButton;
	public UI_COMP_PRIVITE_INFO:FGUICompPirvateInfo;
	public UI_TXT_PROGRESS:fgui.GTextField;
	public UI_COMP_PLAYERS:FGUICompPlayers;
	public UI_COMP_MAP:FGUICompMap;
	public UI_BTN_INVITE:fgui.GButton;
	public UI_BTN_START_GAME:fgui.GButton;
	public UI_COMP_SELFPLAYER:FGUICompPlayerHead;
	public UI_COMP_SELF_MEDAL:fgui.GComponent;
	public UI_BTN_SURE:fgui.GButton;
	public UI_BTN_CHANGE:fgui.GButton;
	public UI_BTN_CONTINUE:fgui.GButton;
	public UI_BTN_READY:fgui.GButton;
	public UI_BTN_RESTART:fgui.GButton;
	public UI_COMP_GAME_START:FGUICompGameStartAct;
	public UI_BTN_TALK:fgui.GButton;
	public UI_COMP_CLOCK:FGUICompTimeLeft;
	public UI_COMP_FINSH_INFO:FGUICompFinshInfo;
	public UI_COMP_PROP:FGUICompPropPanel;
	public UI_COMP_COMB:FGUICompComb;
	public UI_COMP_SCORE_STAR:FGUICompScoreStar;
	public UI_COMP_SPE_RULE_HINT:fgui.GLabel;
	public static URL:string = "ui://2zsfe53xln74p";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompGameMain.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompGameMain") as FGUICompGameMain;

			view.makeFullScreen();
			FGUICompGameMain.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompGameMain.instance = null;
	}
	public static hideView():void {
		FGUICompGameMain.instance && FGUICompGameMain.instance.dispose();
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

	public static createInstance():FGUICompGameMain {
		return <FGUICompGameMain>(fgui.UIPackage.createObject("game10002", "CompGameMain"));
	}

	protected onConstruct():void {
		this.ctrl_btn = this.getControllerAt(0);
		this.ctrl_roomtype = this.getControllerAt(1);
		this.ctrl_finshInfo = this.getControllerAt(2);
		this.UI_BTN_DISBAND = <fgui.GButton>(this.getChildAt(0));
		this.UI_BTN_DISBAND.onClick(this.onBtnDisband, this);
		this.UI_BTN_BACK = <fgui.GButton>(this.getChildAt(1));
		this.UI_BTN_BACK.onClick(this.onBtnBack, this);
		this.UI_COMP_PRIVITE_INFO = <FGUICompPirvateInfo>(this.getChildAt(2));
		this.UI_TXT_PROGRESS = <fgui.GTextField>(this.getChildAt(4));
		this.UI_COMP_PLAYERS = <FGUICompPlayers>(this.getChildAt(6));
		this.UI_COMP_MAP = <FGUICompMap>(this.getChildAt(7));
		this.UI_BTN_INVITE = <fgui.GButton>(this.getChildAt(8));
		this.UI_BTN_INVITE.onClick(this.onBtnInvite, this);
		this.UI_BTN_START_GAME = <fgui.GButton>(this.getChildAt(9));
		this.UI_BTN_START_GAME.onClick(this.onBtnStartGame, this);
		this.UI_COMP_SELFPLAYER = <FGUICompPlayerHead>(this.getChildAt(11));
		this.UI_COMP_SELF_MEDAL = <fgui.GComponent>(this.getChildAt(12));
		this.UI_BTN_SURE = <fgui.GButton>(this.getChildAt(13));
		this.UI_BTN_SURE.onClick(this.onBtnSure, this);
		this.UI_BTN_CHANGE = <fgui.GButton>(this.getChildAt(14));
		this.UI_BTN_CHANGE.onClick(this.onBtnChange, this);
		this.UI_BTN_CONTINUE = <fgui.GButton>(this.getChildAt(15));
		this.UI_BTN_CONTINUE.onClick(this.onBtnContinue, this);
		this.UI_BTN_READY = <fgui.GButton>(this.getChildAt(16));
		this.UI_BTN_READY.onClick(this.onBtnReady, this);
		this.UI_BTN_RESTART = <fgui.GButton>(this.getChildAt(17));
		this.UI_BTN_RESTART.onClick(this.onBtnRestart, this);
		this.UI_COMP_GAME_START = <FGUICompGameStartAct>(this.getChildAt(19));
		this.UI_BTN_TALK = <fgui.GButton>(this.getChildAt(21));
		this.UI_BTN_TALK.onClick(this.onBtnTalk, this);
		this.UI_COMP_CLOCK = <FGUICompTimeLeft>(this.getChildAt(22));
		this.UI_COMP_FINSH_INFO = <FGUICompFinshInfo>(this.getChildAt(23));
		this.UI_COMP_PROP = <FGUICompPropPanel>(this.getChildAt(24));
		this.UI_COMP_COMB = <FGUICompComb>(this.getChildAt(25));
		this.UI_COMP_SCORE_STAR = <FGUICompScoreStar>(this.getChildAt(26));
		this.UI_COMP_SPE_RULE_HINT = <fgui.GLabel>(this.getChildAt(27));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnDisband():void{};
	onBtnBack():void{};
	onBtnInvite():void{};
	onBtnStartGame():void{};
	onBtnSure():void{};
	onBtnChange():void{};
	onBtnContinue():void{};
	onBtnReady():void{};
	onBtnRestart():void{};
	onBtnTalk():void{};
}
fgui.UIObjectFactory.setExtension(FGUICompGameMain.URL, FGUICompGameMain);