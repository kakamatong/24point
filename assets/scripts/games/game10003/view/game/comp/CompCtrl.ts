/**
 * @file CompCtrl.ts
 * @description 算24点(10003)操作组件：四个数字 + 四个运算符，点击数字/符号两两合并为新数字（分数显示），支持撤销与自动提交
 * @category 游戏 10003
 */

import FGUICompCtrl from "@fgui/game10003/FGUICompCtrl";
import * as fgui from "fairygui-cc";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import { TipsView } from "@view/common/TipsView";
import { ViewClass } from "@frameworks/Framework";
import { SprotoDealCards } from "../../../../../../types/protocol/game10003/s2c";
import { calc, FRACTION } from "../../../logic/Expression";
import { submitAnswer } from "../../../net/SubmitAnswer";

/**
 * @interface UNDO_ITEM
 * @description 撤销栈元素：记录一次运算前两个格子（被消耗格与结果格）的状态
 */
interface UNDO_ITEM {
    /** 被消耗的格 */
    first: number;
    /** 结果格 */
    second: number;
    /** 被消耗格运算前的数值 */
    firstValue: FRACTION | null;
    /** 结果格运算前的数值 */
    secondValue: FRACTION | null;
    /** 被消耗格运算前的算式 */
    firstExpr: string;
    /** 结果格运算前的算式 */
    secondExpr: string;
}

/**
 * @class CompCtrl
 * @description 算24点操作组件业务子类：管理数字格状态机（选数/选符/合并运算/撤销/提交）
 * @category 游戏 10003
 */
@ViewClass()
export class CompCtrl extends FGUICompCtrl {
    /** 运算符字符映射：0加 1减 2乘 3除（提交算式用 ASCII 运算符） */
    private static readonly _OP_CHARS: string[] = ["+", "-", "*", "/"];
    /** 四个数字按钮 */
    private _numBtns: fgui.GButton[] = [];
    /** 四个数字按钮的原始布局位置（飞行后恢复用） */
    private _numBtnPos: { x: number; y: number }[] = [];
    /** 当前四格数值（null 表示已消耗） */
    private _slots: (FRACTION | null)[] = [null, null, null, null];
    /** 当前四格累计算式字符串 */
    private _exprs: string[] = ["", "", "", ""];
    /** 第一操作数格索引，-1 未选中 */
    private _selFirst: number = -1;
    /** 选中符号索引（0加 1减 2乘 3除），-1 未选中 */
    private _selSymbol: number = -1;
    /** 已完成的运算次数 */
    private _opCount: number = 0;
    /** 飞行动画期间锁定输入 */
    private _busy: boolean = false;
    /** 本局发牌数字（提交用） */
    private _dealNumbers: number[] = [];
    /** 撤销栈 */
    private _undoStack: UNDO_ITEM[] = [];
    /** 当前飞行 tween 引用 */
    private _flyTween: fgui.GTweener | null = null;

    /**
     * @description 组件初始化：缓存按钮/布局位置、默认不选中、监听发牌协议
     */
    onConstruct() {
        super.onConstruct();
        this._numBtns = [this.UI_BTN_NUM_0, this.UI_BTN_NUM_1, this.UI_BTN_NUM_2, this.UI_BTN_NUM_3];
        for (const btn of this._numBtns) {
            this._numBtnPos.push({ x: btn.x, y: btn.y });
            btn.visible = false;
        }
        this.clearSelection();
        GameSocketManager.instance.addServerListen(SprotoDealCards, this.onDealCards.bind(this));
    }

    /**
     * @description 组件销毁：清理发牌监听与飞行 tween
     */
    protected onDestroy(): void {
        super.onDestroy();
        this._flyTween && this._flyTween.kill();
        this._flyTween = null;
        GameSocketManager.instance.removeServerListen(SprotoDealCards);
    }

    /**
     * @description 发牌协议回调：重置全部状态并设置四个数字
     * @param {SprotoDealCards.Request} data - 发牌数据（numbers 为4个数字）
     * @private
     */
    private onDealCards(data: SprotoDealCards.Request) {
        if (!data || !data.numbers || data.numbers.length === 0) {
            return;
        }
        this.resetRound();
        this._dealNumbers = data.numbers.slice();
        for (let i = 0; i < 4 && i < data.numbers.length; i++) {
            // 发牌数字均为正整数，直接构造最简分数 {n, d=1}
            this._slots[i] = { n: data.numbers[i], d: 1 };
            this._exprs[i] = `${data.numbers[i]}`;
            this._numBtns[i].visible = true;
            this._numBtns[i].title = this.formatFraction(this._slots[i] as FRACTION);
        }
    }

    /**
     * @description 点击数字0
     */
    onBtnNum0(): void {
        this.onNumClicked(0);
    }

    /**
     * @description 点击数字1
     */
    onBtnNum1(): void {
        this.onNumClicked(1);
    }

    /**
     * @description 点击数字2
     */
    onBtnNum2(): void {
        this.onNumClicked(2);
    }

    /**
     * @description 点击数字3
     */
    onBtnNum3(): void {
        this.onNumClicked(3);
    }

    /**
     * @description 点击符号0（加）
     */
    onBtnSymbol0(): void {
        this.onSymbolClicked(0);
    }

    /**
     * @description 点击符号1（减）
     */
    onBtnSymbol1(): void {
        this.onSymbolClicked(1);
    }

    /**
     * @description 点击符号2（乘）
     */
    onBtnSymbol2(): void {
        this.onSymbolClicked(2);
    }

    /**
     * @description 点击符号3（除）
     */
    onBtnSymbol3(): void {
        this.onSymbolClicked(3);
    }

    /**
     * @description 点击数字处理：选中第一操作数 / 取消选中 / 换数 / 触发运算
     * @param {number} i - 格子索引 0-3
     * @private
     */
    private onNumClicked(i: number): void {
        if (this._busy || !this._slots[i]) {
            return;
        }
        if (this._selFirst === -1) {
            this._selFirst = i;
            this.ctrl_nums.selectedIndex = i;
        } else if (this._selFirst === i) {
            // 再点同一格：取消选中（连带取消符号）
            this.clearSelection();
        } else if (this._selSymbol === -1) {
            // 未选符号时点其他格：移动选中（换数）
            this._selFirst = i;
            this.ctrl_nums.selectedIndex = i;
        } else {
            this.performOperation(this._selFirst, i);
        }
    }

    /**
     * @description 点击符号处理：未选第一数字时无效（回落到不选中页），否则选中/取消/切换
     * @param {number} s - 符号索引 0-3
     * @private
     */
    private onSymbolClicked(s: number): void {
        if (this._busy) {
            return;
        }
        if (this._selFirst === -1) {
            // 未选中第一数字，符号选择无效，强制回落到"都不选中"页
            this.ctrl_symbol.selectedIndex = 4;
            return;
        }
        if (this._selSymbol === s) {
            this._selSymbol = -1;
            this.ctrl_symbol.selectedIndex = 4;
        } else {
            this._selSymbol = s;
            this.ctrl_symbol.selectedIndex = s;
        }
    }

    /**
     * @description 执行运算：第一格数字飞向第二格，消失后第二格显示计算结果；除零等非法运算被拒绝
     * @param {number} first - 被消耗格索引
     * @param {number} second - 结果格索引
     * @private
     */
    private performOperation(first: number, second: number): void {
        const a = this._slots[first];
        const b = this._slots[second];
        if (!a || !b || this._selSymbol < 0) {
            return;
        }
        const result = calc(a, CompCtrl._OP_CHARS[this._selSymbol], b);
        if (!result) {
            // 非法运算（如除零）：拒绝，取消符号选中，保留第一数字
            this._selSymbol = -1;
            this.ctrl_symbol.selectedIndex = 4;
            return;
        }
        // 入栈运算前状态，供撤销
        this._undoStack.push({
            first,
            second,
            firstValue: a,
            secondValue: b,
            firstExpr: this._exprs[first],
            secondExpr: this._exprs[second],
        });
        const opChar = CompCtrl._OP_CHARS[this._selSymbol];
        this._busy = true;
        const fromBtn = this._numBtns[first];
        const toBtn = this._numBtns[second];
        // 置顶并飞向第二格
        this.setChildIndex(fromBtn, this.numChildren - 1);
        this._flyTween = fgui.GTween.to2(fromBtn.x, fromBtn.y, toBtn.x, toBtn.y, 0.35)
            .setEase(fgui.EaseType.QuartOut)
            .onUpdate((tween) => {
                fromBtn.setPosition(tween.value.x, tween.value.y);
            })
            .onComplete(() => {
                this._flyTween = null;
                this._busy = false;
                fromBtn.visible = false;
                this._slots[first] = null;
                this._slots[second] = result;
                this._exprs[second] = `(${this._exprs[first]})${opChar}(${this._exprs[second]})`;
                toBtn.title = this.formatFraction(result);
                this._opCount++;
                this.clearSelection();
                // 三次运算后只剩一个数字，进入结算
                if (this._opCount >= 3) {
                    this.finishRound();
                }
            });
    }

    /**
     * @description 结算：本地判定结果是否等于24，并调用提交算式协议上抛服务器
     * @private
     */
    private finishRound(): void {
        const lastIdx = this._slots.findIndex((v) => v !== null);
        if (lastIdx < 0) {
            return;
        }
        submitAnswer(this._exprs[lastIdx], this._dealNumbers, (result) => {
            if (result.code === 1) {
                TipsView.showView({ content: "回答正确" });
            } else {
                TipsView.showView({ content: result.msg || "回答错误" });
            }
        });
    }

    /**
     * @description 撤销上一步运算（公开接口，暂无调用入口）：恢复被消耗格与结果格的数值/算式/显示
     */
    public undo(): void {
        if (this._busy || this._undoStack.length === 0) {
            return;
        }
        const item = this._undoStack.pop();
        if (!item) {
            return;
        }
        // 恢复被消耗格
        this._slots[item.first] = item.firstValue;
        this._exprs[item.first] = item.firstExpr;
        const firstBtn = this._numBtns[item.first];
        firstBtn.visible = true;
        firstBtn.setPosition(this._numBtnPos[item.first].x, this._numBtnPos[item.first].y);
        firstBtn.title = item.firstValue ? this.formatFraction(item.firstValue) : "";
        // 恢复结果格
        this._slots[item.second] = item.secondValue;
        this._exprs[item.second] = item.secondExpr;
        this._numBtns[item.second].title = item.secondValue ? this.formatFraction(item.secondValue) : "";
        this._opCount--;
        this.clearSelection();
    }

    /**
     * @description 重置整局状态：终止动画、恢复按钮布局、清空数据与选择
     * @private
     */
    private resetRound(): void {
        this._flyTween && this._flyTween.kill();
        this._flyTween = null;
        this._busy = false;
        this._opCount = 0;
        this._undoStack = [];
        this._slots = [null, null, null, null];
        this._exprs = ["", "", "", ""];
        for (let i = 0; i < this._numBtns.length; i++) {
            const btn = this._numBtns[i];
            btn.setPosition(this._numBtnPos[i].x, this._numBtnPos[i].y);
            btn.visible = false;
        }
        this.clearSelection();
    }

    /**
     * @description 清除全部选中：数字与符号控制器都回落到"都不选中"页（index 4）
     * @private
     */
    private clearSelection(): void {
        this._selFirst = -1;
        this._selSymbol = -1;
        this.ctrl_nums.selectedIndex = 4;
        this.ctrl_symbol.selectedIndex = 4;
    }

    /**
     * @description 分数显示格式化：分母为1显示整数，否则显示 n/d（如 1/17）
     * @param {FRACTION} v - 分数
     * @returns {string} 显示文本
     * @private
     */
    private formatFraction(v: FRACTION): string {
        if (v.d === 1) {
            return `${v.n}`;
        }
        return `${v.n}/${v.d}`;
    }
}
fgui.UIObjectFactory.setExtension(CompCtrl.URL, CompCtrl);
