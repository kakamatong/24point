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
    /** 本局发牌数字（提交与撤销重置用） */
    private _dealNumbers: number[] = [];
    /** 当前飞行 tween 引用 */
    private _flyTween: fgui.GTweener | null = null;
    /** 进行中的发牌入场动画 tween 列表（新发牌/重置/销毁时清理） */
    private _dealTweens: fgui.GTweener[] = [];
    /** 发牌入场动画：尚未完成的卡片数（全部完成才解除输入锁） */
    private _dealAnimCount: number = 0;

    /** 发牌入场动画：单卡动画时长(秒) */
    private static readonly _DEAL_ANIM_DUR: number = 0.35;
    /** 发牌入场动画：相邻卡片错峰延迟(秒) */
    private static readonly _DEAL_ANIM_STAGGER: number = 0.08;

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
        this.clearDealTweens();
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
        this.applyDealNumbers(this._dealNumbers);
    }

    /**
     * @description 将发牌数字写入四格：设置数值/算式、显示按钮并刷新标题
     * @param {number[]} numbers - 发牌数字
     * @private
     */
    private applyDealNumbers(numbers: number[]): void {
        for (let i = 0; i < this._numBtns.length; i++) {
            const num = numbers[i];
            if (num === undefined) {
                this._slots[i] = null;
                this._exprs[i] = "";
                this._numBtns[i].visible = false;
                continue;
            }
            // 发牌数字均为正整数，直接构造最简分数 {n, d=1}
            this._slots[i] = { n: num, d: 1 };
            this._exprs[i] = `${num}`;
            this._numBtns[i].visible = true;
            this._numBtns[i].title = this.formatFraction(this._slots[i] as FRACTION);
        }
        // 发牌/重置统一在此触发四卡入场动画
        this.playDealAnim();
    }

    /**
     * @description 发牌/重置后的四卡入场动画：卡片从四格中心原点散开飞向各自卡位，
     *              伴随缩放回弹(BackOut)与淡入，按序错峰播放；动画期间锁定输入防误触
     * @private
     */
    private playDealAnim(): void {
        this.clearDealTweens();
        const targets: { btn: fgui.GButton; x: number; y: number }[] = [];
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        for (let i = 0; i < this._numBtns.length; i++) {
            const btn = this._numBtns[i];
            if (!btn.visible) {
                continue;
            }
            const x = this._numBtnPos[i].x;
            const y = this._numBtnPos[i].y;
            targets.push({ btn, x, y });
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
        if (targets.length === 0) {
            return;
        }
        // 四格中心作为发牌原点
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const dur = CompCtrl._DEAL_ANIM_DUR;
        const stagger = CompCtrl._DEAL_ANIM_STAGGER;
        this._dealAnimCount = targets.length;
        this._busy = true;
        for (let k = 0; k < targets.length; k++) {
            const target = targets[k];
            const btn = target.btn;
            const delay = k * stagger;
            // 初始：置于原点、隐藏（缩为0、透明）
            btn.setPosition(cx, cy);
            btn.setScale(0, 0);
            btn.alpha = 0;
            // 位移：从中心原点飞向各自卡位（QuartOut 缓出）
            const posTween = fgui.GTween.to2(cx, cy, target.x, target.y, dur)
                .setDelay(delay)
                .setEase(fgui.EaseType.QuartOut)
                .onUpdate((tween) => {
                    btn.setPosition(tween.value.x, tween.value.y);
                })
                .onComplete(() => {
                    this.onDealAnimCardDone();
                });
            // 缩放：0→1 BackOut 轻微回弹放大
            const scaleTween = fgui.GTween.to2(0, 0, 1, 1, dur)
                .setDelay(delay)
                .setEase(fgui.EaseType.BackOut)
                .onUpdate((tween) => {
                    btn.setScale(tween.value.x, tween.value.y);
                });
            // 淡入（QuadOut，alpha 不超过1）
            const alphaTween = fgui.GTween.to2(0, 0, 1, 1, dur)
                .setDelay(delay)
                .setEase(fgui.EaseType.QuadOut)
                .onUpdate((tween) => {
                    btn.alpha = tween.value.x;
                });
            this._dealTweens.push(posTween, scaleTween, alphaTween);
        }
    }

    /**
     * @description 单张卡片入场动画结束回调：全部卡片完成（含错峰）后解除输入锁定
     * @private
     */
    private onDealAnimCardDone(): void {
        this._dealAnimCount--;
        if (this._dealAnimCount <= 0) {
            this._dealAnimCount = 0;
            this._busy = false;
        }
    }

    /**
     * @description 清理全部进行中的入场动画（新发牌/重置/销毁时调用）
     * @private
     */
    private clearDealTweens(): void {
        for (const t of this._dealTweens) {
            t.kill();
        }
        this._dealTweens = [];
        this._dealAnimCount = 0;
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
        } else if (this._selFirst === i) {
        } else if (this._selSymbol === -1) {
            // 未选符号时点其他格：移动选中（换数）
            this._selFirst = i;
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
        } else {
            this._selSymbol = s;
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
                // 只清理运算符号，保留数字选中状态
                this._selSymbol = -1;
                this.ctrl_symbol.selectedIndex = 4;
                // 选中计算结果卡片（第二格）
                this._selFirst = second;
                this.ctrl_nums.selectedIndex = second;
                // 三次运算后只剩一个数字，进入结算
                if (this._opCount >= 3) {
                    this.finishRound();
                }
            });
    }

    /**
     * @description 结算：本地判定结果是否等于24，并调用提交算式协议上抛服务器；核实不等于24时提示并自动重置本局
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
                // 本地预校验未通过（核实结果不等于24等）：自动执行重置接口，恢复发牌初始状态以便重新作答
                if (result.localValid) {
                    this.onBtnReset();
                }
            }
        });
    }

    /**
     * @description 点击重置按钮：恢复到本局发牌初始状态（清空全部运算/选中，重新铺开四个数字）
     * @public 由 FGUI 基类 onClick 绑定调用（UI_BTN_RESET）
     */
    public onBtnReset(): void {
        if (this._busy || this._dealNumbers.length === 0) {
            return;
        }
        this.restoreToDeal();
    }

    /**
     * @description 恢复到发牌初始状态：终止动画、清空运算与选中后重新铺开本局数字
     * @private
     */
    private restoreToDeal(): void {
        this._flyTween && this._flyTween.kill();
        this._flyTween = null;
        this.resetRound();
        this.applyDealNumbers(this._dealNumbers);
    }

    /**
     * @description 撤销整局操作（公开接口，供程序调用）：恢复到发牌初始状态
     */
    public undo(): void {
        if (this._busy || this._opCount === 0) {
            return;
        }
        this.restoreToDeal();
    }

    /**
     * @description 重置整局状态：终止动画、恢复按钮布局、清空数据与选择
     * @private
     */
    private resetRound(): void {
        this.clearDealTweens();
        this._flyTween && this._flyTween.kill();
        this._flyTween = null;
        this._busy = false;
        this._opCount = 0;
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
