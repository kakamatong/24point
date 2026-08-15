/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUIRankView extends fgui.GComponent {

	public UI_LV_RANK:fgui.GList;
	public UI_BTN_CLOSE:fgui.GButton;
	public UI_TXT_SELF_RANK:fgui.GTextField;
	public static URL:string = "ui://2a32uf5yis910";

	public static packageName:string = "rank";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUIRankView.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("rank", "RankView") as FGUIRankView;

			view.makeFullScreen();
			FGUIRankView.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUIRankView.instance = null;
	}
	public static hideView():void {
		FGUIRankView.instance && FGUIRankView.instance.dispose();
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

	public static createInstance():FGUIRankView {
		return <FGUIRankView>(fgui.UIPackage.createObject("rank", "RankView"));
	}

	protected onConstruct():void {
		this.UI_LV_RANK = <fgui.GList>(this.getChildAt(3));
		this.UI_BTN_CLOSE = <fgui.GButton>(this.getChildAt(4));
		this.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
		this.UI_TXT_SELF_RANK = <fgui.GTextField>(this.getChildAt(6));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
	onBtnClose():void{};
}
fgui.UIObjectFactory.setExtension(FGUIRankView.URL, FGUIRankView);