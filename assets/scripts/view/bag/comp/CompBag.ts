/**
 * @file CompBag.ts
 * @description 背包主组件：背包界面的核心组件
 * @category 背包视图
 */

import FGUICompBag from "@fgui/bag/FGUICompBag";
import { ViewClass, AddEventListener, RemoveEventListener } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { BagView } from "../BagView";
import { DataCenter } from "@datacenter/Datacenter";
import FGUIComProp from "@fgui/props/FGUIComProp";
import { Prop } from "@modules/Prop";

/**
 * @class CompBag
 * @description 背包主组件，负责背包物品列表展示与交互
 * @category 背包视图
 */
@ViewClass({ enableAnimation: true })
export class CompBag extends FGUICompBag {
    private _richList: Array<{ richType: number; richNums: number }> = [];
    /**
     * @method onConstruct
     * @description 组件构建回调，初始化监听和UI
     */
    onConstruct() {
        super.onConstruct();
        this.show();
    }

    /**
     * @method onDestroy
     * @description 组件销毁回调，清理事件监听
     */
    onDestroy() {
        super.onDestroy();
    }

    /**
     * @method onBtnClose
     * @description 关闭按钮点击回调
     */
    onBtnClose() {
        this.hideAnimation(() => {
            BagView.hideView();
        });
    }

    /**
     * @method show
     * @description 显示视图，接收外部传入数据
     * @param {any} [data] - 传入数据
     */
    show(data?: any): void {
        // TODO: 实现数据显示逻辑
        this.initRiches();
        this.initUI();
    }

    /**
     * 初始化财富
     */
    initRiches(): void {
        // 体力类道具 ID 列表（背包中不展示）
        const ENERGY_PROP_IDS = [20001, 20002, 20003, 20004];
        const riches = DataCenter.instance.userRiches;
        riches.forEach((element) => {
            if (element.richType > 10000 && !ENERGY_PROP_IDS.includes(element.richType)) {
                this._richList.push(element);
            }
        });
    }

    /**
     * 初始化界面
     */
    initUI(): void {
        this.UI_LV_BAGS.itemRenderer = this.itemRenderer.bind(this);
        this.UI_LV_BAGS.numItems = this._richList.length;
        this._richList.length > 0 ? (this.ctrl_have.selectedIndex = 1) : (this.ctrl_have.selectedIndex = 0);
        this._richList.length > 0 && this.initDis(this._richList[0].richType);
    }

    /**
     * 初始化道具列表
     */
    initList(): void {}

    /**
     * 初始化具体道具描述
     * @param richType 财富类型
     */
    initDis(richType: number): void {
        const iconNode = this.UI_COMP_ICON as FGUIComProp;
        iconNode.UI_LOADER_ICON.url = `ui://props/prop_${richType}`;
        iconNode.ctrl_num.selectedIndex = 0;

        const propInfo = Prop.create(richType);
        const dis = propInfo.desc;
        this.UI_COMP_DIS.text = dis;
    }

    /**
     * 列表渲染
     * @param index
     * @param obj
     */
    itemRenderer(index: number, obj: fgui.GObject): void {
        const propConfig = this._richList[index];
        const itemNode = obj as FGUIComProp;
        itemNode.UI_LOADER_ICON.url = `ui://props/prop_${propConfig.richType}`;
        itemNode.UI_TXT_NUM.text = `X ${propConfig.richNums || 0}`;
        itemNode.clearClick();
        itemNode.onClick(() => {
            this.onBtnRich(propConfig.richType);
        });
    }

    /**
     * 点击财富
     * @param richType 财富类型
     */
    onBtnRich(richType: number): void {
        this.initDis(richType);
    }
}

fgui.UIObjectFactory.setExtension(CompBag.URL, CompBag);
