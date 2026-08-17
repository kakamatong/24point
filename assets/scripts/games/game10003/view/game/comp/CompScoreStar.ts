/**
 * @file CompScoreStar.ts
 * @description 得分转化为星星的UI组件，进度条长度代表当前得分，3颗星星标记30%/60%/90%长度处对应的分数档位
 * @category 游戏 10002 - 连连看
 */

import * as fgui from "fairygui-cc";
import { ViewClass } from "@frameworks/Framework";
import FGUICompScoreStar from "@fgui/game10002/FGUICompScoreStar";

/**
 * @class CompScoreStar
 * @description 得分转化为星星的UI组件，继承自 FGUI 自动生成的 FGUICompScoreStar
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompScoreStar extends FGUICompScoreStar {
    /**
     * @property {number[]} _starRatios
     * @description 3颗星星在进度条上的长度比例，索引0/1/2对应第1/2/3颗星
     * @private
     */
    private _starRatios: number[] = [0.3, 0.6, 0.9];

    /**
     * @property {number[]} _starScores
     * @description 3颗星星对应的限制分数，索引0/1/2对应第1/2/3颗星（如 [200, 500, 1000]）
     * @private
     */
    private _starScores: number[] = [];

    /**
     * @property {number} _currentScore
     * @description 当前分数
     * @private
     */
    private _currentScore: number = 0;

    /**
     * @property {number} _passScore
     * @description 过关分数（计分规则闯关模式的过关门槛）
     * @private
     */
    private _passScore: number = 0;

    /**
     * @property {number} _animDuration
     * @description 进度条补间动画时长（秒）
     * @private
     */
    private _animDuration: number = 0.5;

    /**
     * @property {number} _scaleAnimHalfDuration
     * @description 总分文本放大回弹动画的单段时长（秒），放大+回弹两段合计 0.05s
     * @private
     */
    private _scaleAnimHalfDuration: number = 0.025;

    /**
     * @property {object} _scaleTweenTarget
     * @description 总分文本放大回弹补间的独立目标，避免与进度条补间（target=this）互相误杀
     * @private
     */
    private _scaleTweenTarget: object = {};

    /**
     * @method init
     * @description 初始化星星限制分数并显示当前进度（无动画）
     * @param {number[]} starScores - 3颗星星对应的限制分数（如 [200, 500, 1000]）
     * @param {number} currentScore - 当前分数
     * @param {number} passScore - 过关分数（计分规则闯关模式的过关门槛）
     */
    init(starScores: number[], currentScore: number, passScore: number): void {
        this._starScores = starScores.slice(0, 3);
        this._sanitizeStarScores();
        this._currentScore = Math.max(currentScore, 0);
        this._passScore = Math.max(passScore, 0);
        if (this.UI_IMG_BAR) {
            this.UI_IMG_BAR.fillAmount = this._calcFillAmount(this._currentScore);
        }
        this._updateStars();
        this._updateTotalScoreText();
        this._updatePassScoreText();
    }

    /**
     * @method updateScore
     * @description 更新当前分数并带动画刷新进度条，总分文本执行放大回弹动画
     * @param {number} currentScore - 当前分数
     */
    updateScore(currentScore: number): void {
        this._currentScore = Math.max(currentScore, 0);
        this._updateStars();
        this._animateBar();
        this._updateTotalScoreText();
        this._animateTotalScore();
    }

    /**
     * @method reset
     * @description 重置组件，清空分数阈值并将进度归零
     */
    reset(): void {
        fgui.GTween.kill(this);
        fgui.GTween.kill(this._scaleTweenTarget);
        this._starScores = [];
        this._currentScore = 0;
        this._passScore = 0;
        if (this.UI_IMG_BAR) {
            this.UI_IMG_BAR.fillAmount = 0;
        }
        if (this.UI_TXT_TOTAL_SCORE) {
            this.UI_TXT_TOTAL_SCORE.text = "0";
        }
        if (this.UI_TXT_PASS_SCORE) {
            this.UI_TXT_PASS_SCORE.text = "";
        }
        const stars = [this.UI_IMG_STAR_0, this.UI_IMG_STAR_1, this.UI_IMG_STAR_2];
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            if (star) {
                star.grayed = true;
            }
        }
    }

    /**
     * @method _updateStars
     * @description 根据当前分数更新3颗星星的亮暗状态，达到限制分数的星星点亮（grayed=false），未达到的保持灰置
     * @private
     */
    private _updateStars(): void {
        const stars = [this.UI_IMG_STAR_0, this.UI_IMG_STAR_1, this.UI_IMG_STAR_2];
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            if (!star) {
                continue;
            }
            const reached = i < this._starScores.length && this._currentScore >= this._starScores[i];
            star.grayed = !reached;
        }
    }

    /**
     * @method _sanitizeStarScores
     * @description 修正星星限制分数：保证每个阈值大于0且严格递增，避免插值除零
     * @private
     */
    private _sanitizeStarScores(): void {
        for (let i = 0; i < this._starScores.length; i++) {
            const min = i > 0 ? this._starScores[i - 1] + 1 : 1;
            if (this._starScores[i] < min) {
                this._starScores[i] = min;
            }
        }
    }

    /**
     * @method _calcFillAmount
     * @description 根据当前分数计算进度条填充比例（分段线性插值，超过第3颗星按最后一段斜率外推并封顶100%）
     * @param {number} score - 当前分数
     * @returns {number} 填充比例 0~1
     * @private
     */
    private _calcFillAmount(score: number): number {
        const count = this._starScores.length;
        if (score <= 0 || count === 0) {
            return 0;
        }

        // 第一段：0 到第1颗星
        if (score <= this._starScores[0]) {
            return (score / this._starScores[0]) * this._starRatios[0];
        }

        // 中间段：第1颗星到最后一颗星之间分段线性插值
        for (let i = 1; i < count; i++) {
            const prevScore = this._starScores[i - 1];
            const curScore = this._starScores[i];
            if (score <= curScore) {
                const ratioStep = this._starRatios[i] - this._starRatios[i - 1];
                const scoreStep = curScore - prevScore;
                return this._starRatios[i - 1] + ((score - prevScore) / scoreStep) * ratioStep;
            }
        }

        // 超过最后一颗星：按最后一段斜率外推，封顶100%
        const lastScore = this._starScores[count - 1];
        const prevScore = this._starScores[count - 2];
        const ratioStep = this._starRatios[count - 1] - this._starRatios[count - 2];
        const scoreStep = lastScore - prevScore;
        const extrapolated = this._starRatios[count - 1] + ((score - lastScore) / scoreStep) * ratioStep;
        return Math.min(extrapolated, 1);
    }

    /**
     * @method _animateBar
     * @description 进度条补间动画，从当前填充比例平滑过渡到目标值
     * @private
     */
    private _animateBar(): void {
        if (!this.UI_IMG_BAR) {
            return;
        }
        const target = this._calcFillAmount(this._currentScore);
        fgui.GTween.kill(this);
        fgui.GTween.to(this.UI_IMG_BAR.fillAmount, target, this._animDuration)
            .setTarget(this)
            .setEase(fgui.EaseType.Linear)
            .onUpdate((tween) => {
                if (this.UI_IMG_BAR) {
                    this.UI_IMG_BAR.fillAmount = tween.value.x;
                }
            });
    }

    /**
     * @method _updateTotalScoreText
     * @description 更新总分文本显示
     * @private
     */
    private _updateTotalScoreText(): void {
        if (this.UI_TXT_TOTAL_SCORE) {
            this.UI_TXT_TOTAL_SCORE.text = String(this._currentScore);
        }
    }

    /**
     * @method _updatePassScoreText
     * @description 更新过关分数文本显示（格式："过关分数:xxxx"）
     * @private
     */
    private _updatePassScoreText(): void {
        if (this.UI_TXT_PASS_SCORE) {
            this.UI_TXT_PASS_SCORE.text = "过关分数:" + this._passScore;
        }
    }

    /**
     * @method _animateTotalScore
     * @description 总分文本放大回弹动画：先放大到1.2倍，再回弹到原始大小，两段合计0.05s
     * @private
     */
    private _animateTotalScore(): void {
        if (!this.UI_TXT_TOTAL_SCORE) {
            return;
        }
        fgui.GTween.kill(this._scaleTweenTarget);
        fgui.GTween.to2(1, 1, 1.2, 1.2, this._scaleAnimHalfDuration)
            .setTarget(this._scaleTweenTarget)
            .setEase(fgui.EaseType.QuadOut)
            .onUpdate((tween) => {
                if (this.UI_TXT_TOTAL_SCORE) {
                    this.UI_TXT_TOTAL_SCORE.setScale(tween.value.x, tween.value.y);
                }
            })
            .onComplete(() => {
                fgui.GTween.kill(this._scaleTweenTarget);
                fgui.GTween.to2(1.2, 1.2, 1, 1, this._scaleAnimHalfDuration)
                    .setTarget(this._scaleTweenTarget)
                    .setEase(fgui.EaseType.QuadOut)
                    .onUpdate((tween) => {
                        if (this.UI_TXT_TOTAL_SCORE) {
                            this.UI_TXT_TOTAL_SCORE.setScale(tween.value.x, tween.value.y);
                        }
                    });
            });
    }

    protected onDestroy(): void {
        fgui.GTween.kill(this);
        fgui.GTween.kill(this._scaleTweenTarget);
        super.onDestroy();
    }
}

fgui.UIObjectFactory.setExtension(CompScoreStar.URL, CompScoreStar);
