/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import { assetManager, AssetManager } from "cc";
import * as fgui from "fairygui-cc";
import FGUICompCube from "./FGUICompCube";

import { PackageManager } from "@frameworks/PackageManager";
import { Logger } from "@frameworks/utils/Utils";

export default class FGUICompMap extends fgui.GComponent {

	public ctrl_size:fgui.Controller;
	public CUTE_0_0:FGUICompCube;
	public CUTE_4_1:FGUICompCube;
	public CUTE_7_2:FGUICompCube;
	public CUTE_6_6:FGUICompCube;
	public CUTE_4_4:FGUICompCube;
	public CUTE_1_8:FGUICompCube;
	public CUTE_0_3:FGUICompCube;
	public CUTE_4_7:FGUICompCube;
	public CUTE_2_3:FGUICompCube;
	public CUTE_2_7:FGUICompCube;
	public CUTE_5_0:FGUICompCube;
	public CUTE_5_9:FGUICompCube;
	public CUTE_6_4:FGUICompCube;
	public CUTE_6_7:FGUICompCube;
	public CUTE_4_3:FGUICompCube;
	public CUTE_1_3:FGUICompCube;
	public CUTE_0_4:FGUICompCube;
	public CUTE_4_8:FGUICompCube;
	public CUTE_3_9:FGUICompCube;
	public CUTE_2_4:FGUICompCube;
	public CUTE_5_2:FGUICompCube;
	public CUTE_5_7:FGUICompCube;
	public CUTE_7_4:FGUICompCube;
	public CUTE_6_8:FGUICompCube;
	public CUTE_1_2:FGUICompCube;
	public CUTE_1_6:FGUICompCube;
	public CUTE_0_5:FGUICompCube;
	public CUTE_3_2:FGUICompCube;
	public CUTE_3_8:FGUICompCube;
	public CUTE_2_8:FGUICompCube;
	public CUTE_5_3:FGUICompCube;
	public CUTE_4_0:FGUICompCube;
	public CUTE_6_2:FGUICompCube;
	public CUTE_6_5:FGUICompCube;
	public CUTE_1_0:FGUICompCube;
	public CUTE_1_9:FGUICompCube;
	public CUTE_0_6:FGUICompCube;
	public CUTE_2_1:FGUICompCube;
	public CUTE_3_3:FGUICompCube;
	public CUTE_2_5:FGUICompCube;
	public CUTE_5_5:FGUICompCube;
	public CUTE_6_1:FGUICompCube;
	public CUTE_6_3:FGUICompCube;
	public CUTE_7_8:FGUICompCube;
	public CUTE_4_5:FGUICompCube;
	public CUTE_0_1:FGUICompCube;
	public CUTE_0_9:FGUICompCube;
	public CUTE_3_1:FGUICompCube;
	public CUTE_3_7:FGUICompCube;
	public CUTE_4_9:FGUICompCube;
	public CUTE_5_4:FGUICompCube;
	public CUTE_5_6:FGUICompCube;
	public CUTE_7_0:FGUICompCube;
	public CUTE_7_5:FGUICompCube;
	public CUTE_1_1:FGUICompCube;
	public CUTE_1_4:FGUICompCube;
	public CUTE_0_7:FGUICompCube;
	public CUTE_2_0:FGUICompCube;
	public CUTE_3_5:FGUICompCube;
	public CUTE_7_9:FGUICompCube;
	public CUTE_6_0:FGUICompCube;
	public CUTE_5_8:FGUICompCube;
	public CUTE_7_1:FGUICompCube;
	public CUTE_7_6:FGUICompCube;
	public CUTE_6_9:FGUICompCube;
	public CUTE_1_7:FGUICompCube;
	public CUTE_0_2:FGUICompCube;
	public CUTE_3_0:FGUICompCube;
	public CUTE_3_6:FGUICompCube;
	public CUTE_2_9:FGUICompCube;
	public CUTE_5_1:FGUICompCube;
	public CUTE_4_2:FGUICompCube;
	public CUTE_7_3:FGUICompCube;
	public CUTE_7_7:FGUICompCube;
	public CUTE_4_6:FGUICompCube;
	public CUTE_1_5:FGUICompCube;
	public CUTE_0_8:FGUICompCube;
	public CUTE_2_2:FGUICompCube;
	public CUTE_3_4:FGUICompCube;
	public CUTE_2_6:FGUICompCube;
	public CUTE_8_0:FGUICompCube;
	public CUTE_8_1:FGUICompCube;
	public CUTE_8_2:FGUICompCube;
	public CUTE_8_3:FGUICompCube;
	public CUTE_8_4:FGUICompCube;
	public CUTE_8_5:FGUICompCube;
	public CUTE_8_6:FGUICompCube;
	public CUTE_8_7:FGUICompCube;
	public CUTE_8_8:FGUICompCube;
	public CUTE_8_9:FGUICompCube;
	public CUTE_9_0:FGUICompCube;
	public CUTE_9_1:FGUICompCube;
	public CUTE_9_2:FGUICompCube;
	public CUTE_9_3:FGUICompCube;
	public CUTE_9_4:FGUICompCube;
	public CUTE_9_5:FGUICompCube;
	public CUTE_9_6:FGUICompCube;
	public CUTE_9_7:FGUICompCube;
	public CUTE_9_8:FGUICompCube;
	public CUTE_9_9:FGUICompCube;
	public CUTE_10_0:FGUICompCube;
	public CUTE_10_1:FGUICompCube;
	public CUTE_10_2:FGUICompCube;
	public CUTE_10_3:FGUICompCube;
	public CUTE_10_4:FGUICompCube;
	public CUTE_10_5:FGUICompCube;
	public CUTE_10_6:FGUICompCube;
	public CUTE_10_7:FGUICompCube;
	public CUTE_10_8:FGUICompCube;
	public CUTE_10_9:FGUICompCube;
	public CUTE_11_0:FGUICompCube;
	public CUTE_11_1:FGUICompCube;
	public CUTE_11_2:FGUICompCube;
	public CUTE_11_3:FGUICompCube;
	public CUTE_11_4:FGUICompCube;
	public CUTE_11_5:FGUICompCube;
	public CUTE_11_6:FGUICompCube;
	public CUTE_11_7:FGUICompCube;
	public CUTE_11_8:FGUICompCube;
	public CUTE_11_9:FGUICompCube;
	public CUTE_12_0:FGUICompCube;
	public CUTE_12_1:FGUICompCube;
	public CUTE_12_2:FGUICompCube;
	public CUTE_12_3:FGUICompCube;
	public CUTE_12_4:FGUICompCube;
	public CUTE_12_5:FGUICompCube;
	public CUTE_12_6:FGUICompCube;
	public CUTE_12_7:FGUICompCube;
	public CUTE_12_8:FGUICompCube;
	public CUTE_12_9:FGUICompCube;
	public CUTE_13_0:FGUICompCube;
	public CUTE_13_1:FGUICompCube;
	public CUTE_13_2:FGUICompCube;
	public CUTE_13_3:FGUICompCube;
	public CUTE_13_4:FGUICompCube;
	public CUTE_13_5:FGUICompCube;
	public CUTE_13_6:FGUICompCube;
	public CUTE_13_7:FGUICompCube;
	public CUTE_13_8:FGUICompCube;
	public CUTE_13_9:FGUICompCube;
	public CUTE_14_0:FGUICompCube;
	public CUTE_14_1:FGUICompCube;
	public CUTE_14_2:FGUICompCube;
	public CUTE_14_3:FGUICompCube;
	public CUTE_14_4:FGUICompCube;
	public CUTE_14_5:FGUICompCube;
	public CUTE_14_6:FGUICompCube;
	public CUTE_14_7:FGUICompCube;
	public CUTE_14_8:FGUICompCube;
	public CUTE_14_9:FGUICompCube;
	public CUTE_15_0:FGUICompCube;
	public CUTE_15_1:FGUICompCube;
	public CUTE_15_2:FGUICompCube;
	public CUTE_15_3:FGUICompCube;
	public CUTE_15_4:FGUICompCube;
	public CUTE_15_5:FGUICompCube;
	public CUTE_15_6:FGUICompCube;
	public CUTE_15_7:FGUICompCube;
	public CUTE_15_8:FGUICompCube;
	public CUTE_15_9:FGUICompCube;
	public static URL:string = "ui://2zsfe53xhs3tq";

	public static packageName:string = "game10002";

	public static instance:any | null = null;

	public enableAnimation: boolean = false;

	public static showView(params?:any, callBack?:(b:boolean)=>void):void {
		if(FGUICompMap.instance) {
			console.log("allready show");
			callBack&&callBack(false);
			return;
		}
		PackageManager.instance.loadPackage("fgui", this.packageName).then(()=> {

			const view = fgui.UIPackage.createObject("game10002", "CompMap") as FGUICompMap;

			view.makeFullScreen();
			FGUICompMap.instance = view;
			fgui.GRoot.inst.addChild(view);
			view.show && view.show(params);
			callBack&&callBack(true);
		}
		).catch(error=>{Logger.error("showView error", error);callBack&&callBack(false);return;});
	}

	protected onDestroy():void {
		super.onDestroy();
		FGUICompMap.instance = null;
	}
	public static hideView():void {
		FGUICompMap.instance && FGUICompMap.instance.dispose();
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

	public static createInstance():FGUICompMap {
		return <FGUICompMap>(fgui.UIPackage.createObject("game10002", "CompMap"));
	}

	protected onConstruct():void {
		this.ctrl_size = this.getControllerAt(0);
		this.CUTE_0_0 = <FGUICompCube>(this.getChildAt(0));
		this.CUTE_4_1 = <FGUICompCube>(this.getChildAt(1));
		this.CUTE_7_2 = <FGUICompCube>(this.getChildAt(2));
		this.CUTE_6_6 = <FGUICompCube>(this.getChildAt(3));
		this.CUTE_4_4 = <FGUICompCube>(this.getChildAt(4));
		this.CUTE_1_8 = <FGUICompCube>(this.getChildAt(5));
		this.CUTE_0_3 = <FGUICompCube>(this.getChildAt(6));
		this.CUTE_4_7 = <FGUICompCube>(this.getChildAt(7));
		this.CUTE_2_3 = <FGUICompCube>(this.getChildAt(8));
		this.CUTE_2_7 = <FGUICompCube>(this.getChildAt(9));
		this.CUTE_5_0 = <FGUICompCube>(this.getChildAt(10));
		this.CUTE_5_9 = <FGUICompCube>(this.getChildAt(11));
		this.CUTE_6_4 = <FGUICompCube>(this.getChildAt(12));
		this.CUTE_6_7 = <FGUICompCube>(this.getChildAt(13));
		this.CUTE_4_3 = <FGUICompCube>(this.getChildAt(14));
		this.CUTE_1_3 = <FGUICompCube>(this.getChildAt(15));
		this.CUTE_0_4 = <FGUICompCube>(this.getChildAt(16));
		this.CUTE_4_8 = <FGUICompCube>(this.getChildAt(17));
		this.CUTE_3_9 = <FGUICompCube>(this.getChildAt(18));
		this.CUTE_2_4 = <FGUICompCube>(this.getChildAt(19));
		this.CUTE_5_2 = <FGUICompCube>(this.getChildAt(20));
		this.CUTE_5_7 = <FGUICompCube>(this.getChildAt(21));
		this.CUTE_7_4 = <FGUICompCube>(this.getChildAt(22));
		this.CUTE_6_8 = <FGUICompCube>(this.getChildAt(23));
		this.CUTE_1_2 = <FGUICompCube>(this.getChildAt(24));
		this.CUTE_1_6 = <FGUICompCube>(this.getChildAt(25));
		this.CUTE_0_5 = <FGUICompCube>(this.getChildAt(26));
		this.CUTE_3_2 = <FGUICompCube>(this.getChildAt(27));
		this.CUTE_3_8 = <FGUICompCube>(this.getChildAt(28));
		this.CUTE_2_8 = <FGUICompCube>(this.getChildAt(29));
		this.CUTE_5_3 = <FGUICompCube>(this.getChildAt(30));
		this.CUTE_4_0 = <FGUICompCube>(this.getChildAt(31));
		this.CUTE_6_2 = <FGUICompCube>(this.getChildAt(32));
		this.CUTE_6_5 = <FGUICompCube>(this.getChildAt(33));
		this.CUTE_1_0 = <FGUICompCube>(this.getChildAt(34));
		this.CUTE_1_9 = <FGUICompCube>(this.getChildAt(35));
		this.CUTE_0_6 = <FGUICompCube>(this.getChildAt(36));
		this.CUTE_2_1 = <FGUICompCube>(this.getChildAt(37));
		this.CUTE_3_3 = <FGUICompCube>(this.getChildAt(38));
		this.CUTE_2_5 = <FGUICompCube>(this.getChildAt(39));
		this.CUTE_5_5 = <FGUICompCube>(this.getChildAt(40));
		this.CUTE_6_1 = <FGUICompCube>(this.getChildAt(41));
		this.CUTE_6_3 = <FGUICompCube>(this.getChildAt(42));
		this.CUTE_7_8 = <FGUICompCube>(this.getChildAt(43));
		this.CUTE_4_5 = <FGUICompCube>(this.getChildAt(44));
		this.CUTE_0_1 = <FGUICompCube>(this.getChildAt(45));
		this.CUTE_0_9 = <FGUICompCube>(this.getChildAt(46));
		this.CUTE_3_1 = <FGUICompCube>(this.getChildAt(47));
		this.CUTE_3_7 = <FGUICompCube>(this.getChildAt(48));
		this.CUTE_4_9 = <FGUICompCube>(this.getChildAt(49));
		this.CUTE_5_4 = <FGUICompCube>(this.getChildAt(50));
		this.CUTE_5_6 = <FGUICompCube>(this.getChildAt(51));
		this.CUTE_7_0 = <FGUICompCube>(this.getChildAt(52));
		this.CUTE_7_5 = <FGUICompCube>(this.getChildAt(53));
		this.CUTE_1_1 = <FGUICompCube>(this.getChildAt(54));
		this.CUTE_1_4 = <FGUICompCube>(this.getChildAt(55));
		this.CUTE_0_7 = <FGUICompCube>(this.getChildAt(56));
		this.CUTE_2_0 = <FGUICompCube>(this.getChildAt(57));
		this.CUTE_3_5 = <FGUICompCube>(this.getChildAt(58));
		this.CUTE_7_9 = <FGUICompCube>(this.getChildAt(59));
		this.CUTE_6_0 = <FGUICompCube>(this.getChildAt(60));
		this.CUTE_5_8 = <FGUICompCube>(this.getChildAt(61));
		this.CUTE_7_1 = <FGUICompCube>(this.getChildAt(62));
		this.CUTE_7_6 = <FGUICompCube>(this.getChildAt(63));
		this.CUTE_6_9 = <FGUICompCube>(this.getChildAt(64));
		this.CUTE_1_7 = <FGUICompCube>(this.getChildAt(65));
		this.CUTE_0_2 = <FGUICompCube>(this.getChildAt(66));
		this.CUTE_3_0 = <FGUICompCube>(this.getChildAt(67));
		this.CUTE_3_6 = <FGUICompCube>(this.getChildAt(68));
		this.CUTE_2_9 = <FGUICompCube>(this.getChildAt(69));
		this.CUTE_5_1 = <FGUICompCube>(this.getChildAt(70));
		this.CUTE_4_2 = <FGUICompCube>(this.getChildAt(71));
		this.CUTE_7_3 = <FGUICompCube>(this.getChildAt(72));
		this.CUTE_7_7 = <FGUICompCube>(this.getChildAt(73));
		this.CUTE_4_6 = <FGUICompCube>(this.getChildAt(74));
		this.CUTE_1_5 = <FGUICompCube>(this.getChildAt(75));
		this.CUTE_0_8 = <FGUICompCube>(this.getChildAt(76));
		this.CUTE_2_2 = <FGUICompCube>(this.getChildAt(77));
		this.CUTE_3_4 = <FGUICompCube>(this.getChildAt(78));
		this.CUTE_2_6 = <FGUICompCube>(this.getChildAt(79));
		this.CUTE_8_0 = <FGUICompCube>(this.getChildAt(80));
		this.CUTE_8_1 = <FGUICompCube>(this.getChildAt(81));
		this.CUTE_8_2 = <FGUICompCube>(this.getChildAt(82));
		this.CUTE_8_3 = <FGUICompCube>(this.getChildAt(83));
		this.CUTE_8_4 = <FGUICompCube>(this.getChildAt(84));
		this.CUTE_8_5 = <FGUICompCube>(this.getChildAt(85));
		this.CUTE_8_6 = <FGUICompCube>(this.getChildAt(86));
		this.CUTE_8_7 = <FGUICompCube>(this.getChildAt(87));
		this.CUTE_8_8 = <FGUICompCube>(this.getChildAt(88));
		this.CUTE_8_9 = <FGUICompCube>(this.getChildAt(89));
		this.CUTE_9_0 = <FGUICompCube>(this.getChildAt(90));
		this.CUTE_9_1 = <FGUICompCube>(this.getChildAt(91));
		this.CUTE_9_2 = <FGUICompCube>(this.getChildAt(92));
		this.CUTE_9_3 = <FGUICompCube>(this.getChildAt(93));
		this.CUTE_9_4 = <FGUICompCube>(this.getChildAt(94));
		this.CUTE_9_5 = <FGUICompCube>(this.getChildAt(95));
		this.CUTE_9_6 = <FGUICompCube>(this.getChildAt(96));
		this.CUTE_9_7 = <FGUICompCube>(this.getChildAt(97));
		this.CUTE_9_8 = <FGUICompCube>(this.getChildAt(98));
		this.CUTE_9_9 = <FGUICompCube>(this.getChildAt(99));
		this.CUTE_10_0 = <FGUICompCube>(this.getChildAt(100));
		this.CUTE_10_1 = <FGUICompCube>(this.getChildAt(101));
		this.CUTE_10_2 = <FGUICompCube>(this.getChildAt(102));
		this.CUTE_10_3 = <FGUICompCube>(this.getChildAt(103));
		this.CUTE_10_4 = <FGUICompCube>(this.getChildAt(104));
		this.CUTE_10_5 = <FGUICompCube>(this.getChildAt(105));
		this.CUTE_10_6 = <FGUICompCube>(this.getChildAt(106));
		this.CUTE_10_7 = <FGUICompCube>(this.getChildAt(107));
		this.CUTE_10_8 = <FGUICompCube>(this.getChildAt(108));
		this.CUTE_10_9 = <FGUICompCube>(this.getChildAt(109));
		this.CUTE_11_0 = <FGUICompCube>(this.getChildAt(110));
		this.CUTE_11_1 = <FGUICompCube>(this.getChildAt(111));
		this.CUTE_11_2 = <FGUICompCube>(this.getChildAt(112));
		this.CUTE_11_3 = <FGUICompCube>(this.getChildAt(113));
		this.CUTE_11_4 = <FGUICompCube>(this.getChildAt(114));
		this.CUTE_11_5 = <FGUICompCube>(this.getChildAt(115));
		this.CUTE_11_6 = <FGUICompCube>(this.getChildAt(116));
		this.CUTE_11_7 = <FGUICompCube>(this.getChildAt(117));
		this.CUTE_11_8 = <FGUICompCube>(this.getChildAt(118));
		this.CUTE_11_9 = <FGUICompCube>(this.getChildAt(119));
		this.CUTE_12_0 = <FGUICompCube>(this.getChildAt(120));
		this.CUTE_12_1 = <FGUICompCube>(this.getChildAt(121));
		this.CUTE_12_2 = <FGUICompCube>(this.getChildAt(122));
		this.CUTE_12_3 = <FGUICompCube>(this.getChildAt(123));
		this.CUTE_12_4 = <FGUICompCube>(this.getChildAt(124));
		this.CUTE_12_5 = <FGUICompCube>(this.getChildAt(125));
		this.CUTE_12_6 = <FGUICompCube>(this.getChildAt(126));
		this.CUTE_12_7 = <FGUICompCube>(this.getChildAt(127));
		this.CUTE_12_8 = <FGUICompCube>(this.getChildAt(128));
		this.CUTE_12_9 = <FGUICompCube>(this.getChildAt(129));
		this.CUTE_13_0 = <FGUICompCube>(this.getChildAt(130));
		this.CUTE_13_1 = <FGUICompCube>(this.getChildAt(131));
		this.CUTE_13_2 = <FGUICompCube>(this.getChildAt(132));
		this.CUTE_13_3 = <FGUICompCube>(this.getChildAt(133));
		this.CUTE_13_4 = <FGUICompCube>(this.getChildAt(134));
		this.CUTE_13_5 = <FGUICompCube>(this.getChildAt(135));
		this.CUTE_13_6 = <FGUICompCube>(this.getChildAt(136));
		this.CUTE_13_7 = <FGUICompCube>(this.getChildAt(137));
		this.CUTE_13_8 = <FGUICompCube>(this.getChildAt(138));
		this.CUTE_13_9 = <FGUICompCube>(this.getChildAt(139));
		this.CUTE_14_0 = <FGUICompCube>(this.getChildAt(140));
		this.CUTE_14_1 = <FGUICompCube>(this.getChildAt(141));
		this.CUTE_14_2 = <FGUICompCube>(this.getChildAt(142));
		this.CUTE_14_3 = <FGUICompCube>(this.getChildAt(143));
		this.CUTE_14_4 = <FGUICompCube>(this.getChildAt(144));
		this.CUTE_14_5 = <FGUICompCube>(this.getChildAt(145));
		this.CUTE_14_6 = <FGUICompCube>(this.getChildAt(146));
		this.CUTE_14_7 = <FGUICompCube>(this.getChildAt(147));
		this.CUTE_14_8 = <FGUICompCube>(this.getChildAt(148));
		this.CUTE_14_9 = <FGUICompCube>(this.getChildAt(149));
		this.CUTE_15_0 = <FGUICompCube>(this.getChildAt(150));
		this.CUTE_15_1 = <FGUICompCube>(this.getChildAt(151));
		this.CUTE_15_2 = <FGUICompCube>(this.getChildAt(152));
		this.CUTE_15_3 = <FGUICompCube>(this.getChildAt(153));
		this.CUTE_15_4 = <FGUICompCube>(this.getChildAt(154));
		this.CUTE_15_5 = <FGUICompCube>(this.getChildAt(155));
		this.CUTE_15_6 = <FGUICompCube>(this.getChildAt(156));
		this.CUTE_15_7 = <FGUICompCube>(this.getChildAt(157));
		this.CUTE_15_8 = <FGUICompCube>(this.getChildAt(158));
		this.CUTE_15_9 = <FGUICompCube>(this.getChildAt(159));
		if (this.enableAnimation) this.enterAnimation();
	}
	scheduleOnce(callback: () => void, delay: number):void{};
	unscheduleAllCallbacks():void{};
	unschedule(callback: () => void):void{};
	schedule(callback: () => void, interval: number):void{};
}
fgui.UIObjectFactory.setExtension(FGUICompMap.URL, FGUICompMap);