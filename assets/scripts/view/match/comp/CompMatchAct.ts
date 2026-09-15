/**
 * @file CompMatchAct.ts
 * @description 匹配动画组件：显示匹配时的随机动画效果
 * @category 匹配视图
 */

import FGUICompMatchAct from "@fgui/match/FGUICompMatchAct";
import * as fgui from "fairygui-cc";
import { GetRandomInt } from "@frameworks/utils/Utils";
import { ViewClass } from "@frameworks/Framework";

/**
 * @class CompMatchAct
 * @description 匹配动画组件，显示匹配时的随机动画效果
 * @category 匹配视图
 */
@ViewClass()
export class CompMatchAct extends FGUICompMatchAct {
    /** 控制器列表 */
    private _ctrls: Array<fgui.Controller> = [];
    /** 当前索引 */
    private _nowIndex = 0;
    /** 定时器回调函数 */
    private _scheid: (() => void) | null = null;

    /**
     * @description 构造函数，初始化定时器和控制器
     */
    protected onConstruct() {
        super.onConstruct();
        this._scheid = this.change.bind(this);
        this.schedule(this._scheid, 0.2);
    }

    /**
     * @description 改变控制器状态
     */
    change() {}

    /**
     * @description 停止定时器
     */
    stopSche(): void {
        this._scheid && this.unschedule(this._scheid);
    }
}
fgui.UIObjectFactory.setExtension(CompMatchAct.URL, CompMatchAct);
