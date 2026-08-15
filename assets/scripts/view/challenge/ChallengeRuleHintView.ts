/**
 * @file ChallengeRuleHintView.ts
 * @description 闯关规则提示框：展示规则说明，支持外部传入内容和确定回调
 * @category 闯关视图
 */

import FGUIChallengeRuleHintView from "@fgui/challenge/FGUIChallengeRuleHintView";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";

/**
 * @interface CHALLENGE_RULE_HINT_DATA
 * @description 闯关规则提示框传入参数
 */
export interface CHALLENGE_RULE_HINT_DATA {
    /** 标题文本 */
    title?: string;
    /** 规则内容（支持 UBB 标签） */
    content?: string;
    /** 体力消耗值 */
    energy?: number;
    /** 确定按钮回调 */
    sureBack?: () => void;
}

@ViewClass()
export class ChallengeRuleHintView extends FGUIChallengeRuleHintView {
    /** 确定按钮回调 */
    private _sureBack: (() => void) | null = null;

    protected onConstruct(): void {
        super.onConstruct();
        this.UI_COMP_MAIN.UI_BTN_CLOSE.clearClick();
        this.UI_COMP_MAIN.UI_BTN_SURE.clearClick();
        this.UI_COMP_MAIN.UI_BTN_CLOSE.onClick(this.onBtnClose, this);
        this.UI_COMP_MAIN.UI_BTN_SURE.onClick(this.onBtnSure, this);
    }

    /**
     * @method show
     * @description 显示提示框，设置标题、内容、体力消耗和按钮回调
     * @param {CHALLENGE_RULE_HINT_DATA} data - 传入参数
     */
    show(data?: CHALLENGE_RULE_HINT_DATA): void {
        if (data && this.UI_COMP_MAIN) {
            if (data.title) this.UI_COMP_MAIN.UI_TXT_TITLE.text = data.title;
            if (data.content) {
                this.UI_COMP_MAIN.UI_TXT_CONTENT.ubbEnabled = true;
                this.UI_COMP_MAIN.UI_TXT_CONTENT.text = data.content;
            }
            if (data.energy !== undefined && data.energy !== null) {
                this.UI_COMP_MAIN.UI_BTN_SURE.UI_TXT_ENERGY.text = String(data.energy);
            }
            this._sureBack = data.sureBack || null;
        }
    }

    /**
     * @method onBtnClose
     * @description 关闭按钮点击，隐藏弹窗
     */
    onBtnClose(): void {
        ChallengeRuleHintView.hideView();
    }

    /**
     * @method onBtnSure
     * @description 确定按钮点击，执行回调后隐藏弹窗
     */
    onBtnSure(): void {
        this._sureBack && this._sureBack();
        ChallengeRuleHintView.hideView();
    }
}

fgui.UIObjectFactory.setExtension(ChallengeRuleHintView.URL, ChallengeRuleHintView);
