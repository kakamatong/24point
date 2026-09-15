/**
 * @file CompMatchAct.ts
 * @description 匹配动画组件：按顺序轮播结果为24的算式
 * @category 匹配视图
 */

import FGUICompMatchAct from "@fgui/match/FGUICompMatchAct";
import * as fgui from "fairygui-cc";
import { ViewClass } from "@frameworks/Framework";

/**
 * @class CompMatchAct
 * @description 匹配动画组件，按顺序轮播结果为24的算式
 * @category 匹配视图
 */
@ViewClass()
export class CompMatchAct extends FGUICompMatchAct {
    /** @private 匹配期间顺序展示的20条算式 */
    private readonly _matchExpressions: string[] = [
        "9*2+6=24",
        "3*8=24",
        "5+5+5+9=24",
        "4*6=24",
        "8+8+8=24",
        "9+9+6=24",
        "7*3+3=24",
        "5*5-1=24",
        "9*3-3=24",
        "8*4-8=24",
        "6*5-6=24",
        "6*6-9-3=24",
        "(9-3)*4=24",
        "(7+5)*2=24",
        "(8-2)*4=24",
        "8/(3-8/3)=24",
        "6/(5/4-1)=24",
        "(9+7+8)*1=24",
        "(8+4)*(3-1)=24",
        "9+8+7=24",
    ];
    /** @private 下一条待展示算式的索引 */
    private _expressionIndex: number = 0;
    /** 定时器回调函数 */
    private _scheid: (() => void) | null = null;

    /**
     * @description 构造时立即显示第一条算式，并启动轮播
     */
    protected onConstruct() {
        super.onConstruct();
        this.stopSche();
        this._expressionIndex = 0;
        this.change();
        this._scheid = this.change.bind(this);
        this.schedule(this._scheid, 0.2);
    }

    /**
     * @method change
     * @description 显示下一条算式，末条之后回到第一条
     */
    change(): void {
        this.UI_TXT_MSG.text = this._matchExpressions[this._expressionIndex];
        this._expressionIndex = (this._expressionIndex + 1) % this._matchExpressions.length;
    }

    /**
     * @description 停止定时器
     */
    stopSche(): void {
        this._scheid && this.unschedule(this._scheid);
        this._scheid = null;
    }

    /**
     * @method onDestroy
     * @description 销毁组件时停止轮播，避免退出后继续刷新
     */
    protected onDestroy(): void {
        this.stopSche();
        super.onDestroy();
    }
}
fgui.UIObjectFactory.setExtension(CompMatchAct.URL, CompMatchAct);
