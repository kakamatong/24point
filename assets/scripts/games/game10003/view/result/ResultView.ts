/**
 * @file ResultView.ts
 * @description 算24点(10003)单局结算视图：接收 gameEnd 协议数据，展示排名、用时、算式，并处理胜负表现与继续/返回操作
 * @category 游戏 10003
 */
import FGUIResultView from "@fgui/game10003Result/FGUIResultView";
import * as fgui from "fairygui-cc";
import { GameData } from "../../data/GameData";
import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";
import { PackageLoad, ViewClass } from "@frameworks/Framework";
import FGUICompResultInfo from "@fgui/game10003Result/FGUICompResultInfo";
import FGUICompHead from "@fgui/common/FGUICompHead";
import FGUICompMedal from "@fgui/gameCommon/FGUICompMedal";
import { DataCenter } from "@datacenter/Datacenter";
import { TruncateString } from "@frameworks/utils/Utils";
import { ScoreInfo, SprotoGameEnd } from "../../../../../types/protocol/game10003/s2c";
import { END_TYPE } from "../../logic/GameRoundConfig";

/**
 * @interface RESULT_VIEW_PARAMS
 * @description 单局结算视图参数：gameEnd 协议数据 + 按钮回调
 */
export interface RESULT_VIEW_PARAMS extends SprotoGameEnd.Request {
    /** 点击继续游戏的回调 */
    continueFunc?: () => void;
    /** 点击返回的回调 */
    backFunc?: () => void;
    /** 结算胜负音效回调（0失败 1胜利 2平局），由游戏主界面播放胜负音效 */
    resultEffectFunc?: (resultFlag: number) => void;
}

/**
 * @interface RESULT_ITEM_DATA
 * @description 单局结算列表项数据
 */
interface RESULT_ITEM_DATA {
    /** 服务器座位号 */
    seat: number;
    /** 用户ID */
    userid: number;
    /** 昵称 */
    nickname: string;
    /** 头像URL */
    headurl: string;
    /** 用时(ms)，未完成为 -1 */
    usedTime: number;
    /** 名次，0表示未完成/无名次 */
    rank: number;
    /** 答对算式，未完成则为空 */
    expression: string;
    /** 本局分数变化 */
    delta: number;
}

/**
 * @class ResultView
 * @description 算24点单局结算业务子类：负责将 gameEnd 排名/分数数据渲染到结果列表，并通知主界面播放胜负表现
 * @category 游戏 10003
 */
@ViewClass()
@PackageLoad(["gameCommon"])
export class ResultView extends FGUIResultView {
    /**
     * @property {(() => void) | null} _continueFunc - 继续游戏回调
     * @private
     */
    private _continueFunc: (() => void) | null = null;

    /**
     * @property {(() => void) | null} _backFunc - 返回回调
     * @private
     */
    private _backFunc: (() => void) | null = null;

    /**
     * @property {RESULT_ITEM_DATA[]} _items - 当前结算列表数据
     * @private
     */
    private _items: RESULT_ITEM_DATA[] = [];

    /**
     * @method show
     * @description 展示单局结算：合并 rankings/scores 与玩家信息，刷新列表、胜负标记、按钮和结算表现
     * @param {RESULT_VIEW_PARAMS} data - gameEnd 数据与按钮回调
     */
    show(data?: RESULT_VIEW_PARAMS): void {
        this._continueFunc = data?.continueFunc ?? null;
        this._backFunc = data?.backFunc ?? null;
        this._items = this.buildItemData(data);

        this.UI_LV_GAME_INFO.itemRenderer = this.itemRenderer.bind(this);
        this.UI_LV_GAME_INFO.numItems = this._items.length;

        const resultFlag = this.getResultFlag(data);
        this.ctrl_flag.selectedIndex = resultFlag;
        this.updateButtonState();
        data?.resultEffectFunc?.(resultFlag);

        this.act.play(() => {
            MiniGameUtils.instance.showInterstitialAd("adunit-60af440d294b0df5");
        });
    }

    /**
     * @method onDestroy
     * @description 销毁时清理回调，避免视图关闭后仍被持有
     * @private
     */
    protected onDestroy(): void {
        super.onDestroy();
        this._continueFunc = null;
        this._backFunc = null;
        this._items = [];
    }

    /**
     * @method buildItemData
     * @description 合并 gameEnd.rankings 与 gameEnd.scores，并从 GameData 补齐昵称/头像，按名次排序
     * @param {RESULT_VIEW_PARAMS} data - 结算协议数据
     * @returns {RESULT_ITEM_DATA[]} 结算列表数据
     * @private
     */
    private buildItemData(data?: RESULT_VIEW_PARAMS): RESULT_ITEM_DATA[] {
        if (!data || !data.rankings || data.rankings.length === 0) {
            return [];
        }

        const scoreMap = new Map<number, ScoreInfo>();
        for (const score of data.scores ?? []) {
            scoreMap.set(score.seat, score);
        }

        const items: RESULT_ITEM_DATA[] = [];
        for (const ranking of data.rankings) {
            const player = GameData.instance.getPlayerBySeat(ranking.seat);
            const score = scoreMap.get(ranking.seat);
            const isSelf = ranking.seat === GameData.instance.getSelfSeat();
            const userData = DataCenter.instance.userData;
            const nickname = player?.nickname || (isSelf ? userData?.nickname ?? "" : "");
            const headurl = player?.headurl || (isSelf ? userData?.headurl ?? "" : "") || GameData.instance.getHeadurl(ranking.seat);
            items.push({
                seat: ranking.seat,
                userid: player?.userid ?? (isSelf ? DataCenter.instance.userid : 0),
                nickname: nickname,
                headurl: headurl,
                usedTime: ranking.usedTime ?? -1,
                rank: ranking.rank ?? 0,
                expression: ranking.expression ?? "",
                delta: score?.delta ?? 0,
            });
        }

        items.sort((a, b) => {
            const rankA = a.rank > 0 ? a.rank : Number.MAX_SAFE_INTEGER;
            const rankB = b.rank > 0 ? b.rank : Number.MAX_SAFE_INTEGER;
            return rankA - rankB;
        });
        return items;
    }

    /**
     * @method getResultFlag
     * @description 根据 endType、自己的名次和是否有人完成计算胜负页：0失败 1胜利 2平局
     * @param {RESULT_VIEW_PARAMS} data - 结算协议数据
     * @returns {number} ctrl_flag 页索引
     * @private
     */
    private getResultFlag(data?: RESULT_VIEW_PARAMS): number {
        if (!data) {
            return 0;
        }

        const selfData = this._items.find((item) => item.userid === DataCenter.instance.userid);
        const hasFinished = this._items.some((item) => item.rank > 0);

        switch (data.endType) {
            case END_TYPE.WIN:
                return selfData && selfData.rank === 1 ? 1 : 0;
            case END_TYPE.TIMEOUT:
                // 单机超时无人答对判失败；多人超时无人答对判平局
                return !hasFinished && !GameData.instance.isLocalGame ? 2 : 0;
            case END_TYPE.DISBAND:
                return 0;
            default:
                return selfData && selfData.rank === 1 ? 1 : 0;
        }
    }

    /**
     * @method updateButtonState
     * @description 切换按钮显示：0=继续+返回，1=仅返回。只有私人房房间已结束（无法再开下一局）或没有继续回调时才只显示返回；
     *              匹配房/单机房即使房间已销毁也保留继续游戏（匹配房点击后重新匹配新对局）
     * @private
     */
    private updateButtonState(): void {
        const onlyBack = !this._continueFunc || (GameData.instance.roomEnd && GameData.instance.isPrivateRoom);
        this.ctrl_btn.selectedIndex = onlyBack ? 1 : 0;
    }

    /**
     * @method itemRenderer
     * @description 结算列表项渲染：头像、昵称、用时、算式、名次奖牌、自己高亮
     * @param {number} index - 列表索引
     * @param {fgui.GObject} item - 列表项对象
     */
    itemRenderer(index: number, item: fgui.GObject): void {
        const data = this._items[index];
        if (!data || !item) {
            return;
        }

        const node = item as FGUICompResultInfo;
        const head = node.UI_COMP_HEAD as FGUICompHead;
        head.UI_LOADER_HEAD.url = data.headurl;
        node.UI_TXT_NICKNAME.text = TruncateString(data.nickname || "未知玩家", 8);

        const completed = data.usedTime >= 0;
        node.ctrl_uncomp.selectedIndex = completed ? 0 : 1;
        if (completed) {
            node.UI_TXT_USE_TIME.text = `${(data.usedTime / 1000).toFixed(3)}秒`;
            node.UI_TXT_FUNC.text = data.expression || "-";
        } else {
            node.UI_TXT_USE_TIME.text = "未完成";
            node.UI_TXT_FUNC.text = "-";
        }

        const medal = node.UI_COMP_MEDAL as FGUICompMedal;
        if (medal && medal.ctrl_rank) {
            medal.ctrl_rank.selectedIndex = Math.max(0, Math.min(6, data.rank));
        }

        // 沿用原结算颜色规则：分数非负红色，负分蓝色
        node.ctrl_color.selectedIndex = data.delta >= 0 ? 0 : 1;
        node.ctrl_self.selectedIndex = data.userid === DataCenter.instance.userid ? 1 : 0;
    }

    /**
     * @method onBtnBack
     * @description 点击返回：先关闭结算弹窗，再执行外部返回回调
     */
    onBtnBack(): void {
        const callback = this._backFunc;
        ResultView.hideView();
        callback && callback();
    }

    /**
     * @method onBtnCon
     * @description 点击继续游戏：先关闭结算弹窗，再执行外部继续回调
     */
    onBtnCon(): void {
        const callback = this._continueFunc;
        ResultView.hideView();
        callback && callback();
    }
}

fgui.UIObjectFactory.setExtension(ResultView.URL, ResultView);