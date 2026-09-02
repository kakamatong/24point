/**
 * @file CompChapter.ts
 * @description 章节组件：展示章节关卡列表，支持上一章/下一章切换
 * @category 闯关视图
 */

import { ChallengeData, MAP_LEVEL_CONFIG } from "@datacenter/ChallengeData";
import FGUICompChapter from "@fgui/challenge/FGUICompChapter";
import { ChangeScene, ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { CompLevel, LEVEL_STATUS, STAR_COUNT } from "./CompLevel";
import { Logger } from "@frameworks/utils/Utils";
import { Challenge, USER_ENERGY_CHANGE_TYPE } from "@modules/Challenge";
import { ChallengeRuleHintView } from "@view/challenge/ChallengeRuleHintView";
import { DataCenter } from "@datacenter/Datacenter";
import { UserEnergy } from "@modules/UserEnergy";
import { ConnectGameSvr } from "@modules/ConnectGameSvr";
import { TipsView } from "@view/common/TipsView";

@ViewClass()
export class CompChapter extends FGUICompChapter {
    /**
     * @property {number} _chapterIndex - 当前章节索引
     * @private
     */
    private _chapterIndex: number = 0;

    /**
     * @property {MAP_LEVEL_CONFIG[]} _chapterConfig - 当前章节关卡配置数据
     * @private
     */
    private _chapterConfig: MAP_LEVEL_CONFIG[] = [];

    /**
     * @property {number} _chapterCount - 章节总数
     * @private
     */
    private _chapterCount: number = 0;

    onConstruct() {
        super.onConstruct();
        this.init();
    }

    /**
     * @method init
     * @description 初始化组件：设置列表渲染器、拉取配置、获取当前章节、显示关卡列表
     * @private
     */
    private init() {
        this.UI_LV_ITEMS.itemRenderer = this.itemRenderer.bind(this);
        Challenge.instance.getConfig((success) => {
            if (success) {
                this._chapterCount = ChallengeData.instance.chapterCount;
                Challenge.instance.getCurChapterData((ok, curChapter) => {
                    if (ok && curChapter !== undefined) {
                        this._chapterIndex = curChapter;
                    }
                    const pendingChapter = ChallengeData.instance.pendingDirectChapter;
                    if (pendingChapter >= 0) {
                        this._chapterIndex = pendingChapter;
                    }
                    this.showChapter(this._chapterIndex);
                });
                Logger.log("闯关配置获取成功");
            } else {
                Logger.warn("闯关配置获取失败");
            }
        });
    }

    /**
     * @method showChapter
     * @description 加载并显示指定章节的关卡列表（地图配置 + 玩家数据），有缓存则跳过请求，同时更新按钮状态
     * @param {number} index - 章节索引
     * @private
     */
    private async showChapter(index: number) {
        const configPromise = ChallengeData.instance.loadChapterConfig(index);

        const hasData = !!ChallengeData.instance.getChapterData(index);
        const levelDataPromise = hasData
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                  Challenge.instance.getChapterData(index, () => resolve());
              });

        const [config] = await Promise.all([configPromise, levelDataPromise]);
        this._chapterConfig = config ?? [];
        this.UI_LV_ITEMS.numItems = this._chapterConfig.length;
        //this.UI_LV_ITEMS.scrollPane.scrollToView(ChallengeData.instance.curLevel, true, true);
        this.updateButtons();
        this.checkPendingDirectChallenge();
    }

    /**
     * @method onBtnNext
     * @description 点击下一章：索引 +1 并重新渲染
     */
    onBtnNext(): void {
        if (this._chapterIndex < this._chapterCount - 1) {
            this._chapterIndex++;
            this.showChapter(this._chapterIndex);
        }
    }

    /**
     * @method onBtnPre
     * @description 点击上一章：索引 -1 并重新渲染
     */
    onBtnPre(): void {
        if (this._chapterIndex > 0) {
            this._chapterIndex--;
            this.showChapter(this._chapterIndex);
        }
    }

    /**
     * @method updateButtons
     * @description 根据当前章节索引更新上一章/下一章按钮可见性
     * @private
     */
    private updateButtons(): void {
        if (this.UI_BTN_PRE) {
            this.UI_BTN_PRE.visible = this._chapterIndex > 0;
        }
        if (this.UI_BTN_NEXT) {
            this.UI_BTN_NEXT.visible = this._chapterIndex < this._chapterCount - 1;
        }
    }

    /**
     * @method checkPendingDirectChallenge
     * @description 检测是否存在待直接挑战的关卡，若有则触发 onBtnLevel 弹出确认弹窗
     * @private
     */
    private checkPendingDirectChallenge(): void {
        const pendingChapter = ChallengeData.instance.pendingDirectChapter;
        const pendingLevel = ChallengeData.instance.pendingDirectLevel;
        if (pendingChapter >= 0 && pendingLevel >= 0 && pendingChapter === this._chapterIndex) {
            ChallengeData.instance.pendingDirectChapter = -1;
            ChallengeData.instance.pendingDirectLevel = -1;
            const config = this._chapterConfig.find((c) => c.index === pendingLevel);
            if (config) {
                this.onBtnLevel(pendingChapter, pendingLevel, config.energy ?? 0);
            }
        }
    }

    /**
     * @method itemRenderer
     * @description 章节列表项渲染器：根据玩家数据决定关卡状态和星级展示
     * @param {number} index - 列表索引
     * @param {fgui.GObject} item - 列表项对象
     * @private
     */
    private itemRenderer(index: number, item: fgui.GObject) {
        const chapterItem = item as CompLevel;
        const config = this._chapterConfig[index];
        const levelData = ChallengeData.instance.getLevelData(this._chapterIndex, config.index);
        if (!config || !chapterItem) return;

        chapterItem.setLevelName(`${config.index + 1}`);
        chapterItem.clearClick();

        if (!levelData) {
            // 如果当前章节是玩家所在章节，并且关卡索引是当前关卡，则设置为进行中状态
            if (this._chapterIndex === ChallengeData.instance.curChapter && config.index === ChallengeData.instance.curLevel) {
                if (config.boss === 1) {
                    chapterItem.setStatus(LEVEL_STATUS.BOSS);
                } else {
                    chapterItem.setStatus(LEVEL_STATUS.IN_PROGRESS);
                }
                chapterItem.touchable = true;
                chapterItem.onClick(() => {
                    this.onBtnLevel(this._chapterIndex, config.index, config.energy ?? 0);
                });
            } else {
                chapterItem.setStatus(LEVEL_STATUS.LOCKED);
                chapterItem.touchable = false;
            }

            chapterItem.setStars(STAR_COUNT.HIDE);
        } else {
            chapterItem.touchable = true;
            chapterItem.setStars(levelData.stars);
            if (config.boss === 1) {
                chapterItem.setStatus(LEVEL_STATUS.BOSS);
            } else {
                chapterItem.setStatus(LEVEL_STATUS.COMPLETED);
            }

            chapterItem.onClick(() => {
                this.onBtnLevel(this._chapterIndex, config.index, config.energy ?? 0);
            });
        }
    }

    private onBtnLevel(chapter: number, level: number, energy: number) {
        Logger.log(`点击关卡: ${chapter}-${level}`);
        const msg = this.getRule(chapter, level);
        const config = this._chapterConfig.find((c) => c.index === level);
        ChallengeRuleHintView.showView({
            title: `第${level + 1}关`,
            content: msg,
            energy: -energy,
            sureBack: () => {
                this.startChallengeLevel(config, chapter, level, energy);
            },
        });
    }

    /**
     * @method startChallengeLevel
     * @description 开始闯关关卡：检查体力是否足够，扣除体力后开启本地闯关模式
     * @param {MAP_LEVEL_CONFIG | undefined} config - 关卡配置
     * @param {number} chapter - 章节索引
     * @param {number} level - 关卡索引
     * @param {number} energy - 体力消耗
     * @private
     */
    private startChallengeLevel(config: MAP_LEVEL_CONFIG | undefined, chapter: number, level: number, energy: number) {
        if (!config) {
            TipsView.showView({ content: "关卡配置不存在" });
            return;
        }

        ChallengeData.instance.selectedChapter = chapter;
        ChallengeData.instance.selectedLevel = level;

        if (energy > 0) {
            const state = DataCenter.instance.getCurrentEnergyState();
            if (state.currentTotal < energy) {
                TipsView.showView({ content: "体力不足" });
                return;
            }
            UserEnergy.instance.changeReq(-energy, USER_ENERGY_CHANGE_TYPE.CHALLENGE, JSON.stringify({ chapter, level }), (data) => {
                if (data && data.code === 1) {
                    this.doStartChallenge(config);
                } else {
                    TipsView.showView({ content: "扣除体力失败" });
                }
            });
        } else {
            this.doStartChallenge(config);
        }
    }

    /**
     * @method doStartChallenge
     * @description 执行开启：连接本地游戏服务器并切换到游戏场景（24point 无闯关模式，
     *              LocalSvr 已收敛为纯单机，关卡配置不再下发，仅保留 gameid 入参）
     * @param {MAP_LEVEL_CONFIG} config - 关卡配置（已废弃忽略，保留形参仅为避免改动调用方）
     * @private
     */
    private doStartChallenge(_config: MAP_LEVEL_CONFIG) {
        ConnectGameSvr.instance.connectLocalGame({ gameid: 10003 }, (success) => {
            if (success) {
                ChangeScene("GameScene");
            }
        });
    }

    private getRule(chapter: number, level: number): string {
        const config = this._chapterConfig.find((c) => c.index === level);
        if (!config) {
            return "关卡配置不存在";
        }

        if (config.type == 1) {
            return `在 [color=#FF0000]${config.totalTime}[/color] 秒内完成挑战`;
        } else if (config.type == 2) {
            const targetScore = config.targetScore ?? 0;
            return `达到 [color=#FF0000]${targetScore}[/color] 分并完成关卡（消除一对方块[color=#FF0000]1[/color]分再加上当前连击分数）`;
        }
    }
}

fgui.UIObjectFactory.setExtension(CompChapter.URL, CompChapter);
