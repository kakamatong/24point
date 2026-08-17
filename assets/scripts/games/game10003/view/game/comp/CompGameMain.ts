import FGUICompGameMain from "@fgui/game10002/FGUICompGameMain";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import { AddEventListener, ChangeScene, LogColors, RemoveEventListener, ViewClass } from "@frameworks/Framework";
import { DataCenter } from "@datacenter/Datacenter";
import { ChallengeData, CHALLENGE_LEVEL_TYPE, CHALLENGE_END_TYPE } from "@datacenter/ChallengeData";
import { GameData } from "../../../data/GameData";
import { LocalSvr } from "@localGame/LocalSvr";
import {
    PLAYER_STATUS,
    ROOM_END_FLAG,
    ROOM_TYPE,
    CTRL_BTN_INDEX,
    GAME_MODE_TXT,
    GAME_PLAYER_INFO,
} from "../../../data/InterfaceGameConfig";
import * as fgui from "fairygui-cc";
import { CompTimeLeft } from "./CompTimeLeft";
import { CompScoreStar } from "./CompScoreStar";
import { CompFinshInfo } from "./CompFinshInfo";
import { PopMessageView } from "@view/common/PopMessageView";
import { ENUM_POP_MESSAGE_TYPE, RICH_TYPE } from "@datacenter/InterfaceConfig";
import { FW_EVENT_NAMES } from "@frameworks/config/Config";
import { ResultView } from "../../result/ResultView";
import { UserStatus } from "@modules/UserStatus";
import { MatchView } from "@view/match/MatchView";
import { Match } from "@modules/Match";
import { Challenge } from "@modules/Challenge";
import { LobbySocketManager } from "@frameworks/LobbySocketManager";
import { AuthGame } from "@modules/AuthGame";
import { TotalResultView } from "../../result/TotalResultView";
import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";
import { CompPlayerHead } from "./CompPlayerHead";
import { CompPlayers } from "./CompPlayers";
import {
    SprotoForwardMessage,
    SprotoGameClock,
    SprotoGameEnd,
    SprotoGameRecord,
    SprotoGameRelink,
    SprotoGameStart,
    SprotoItemEffect,
    SprotoLogicInfo,
    SprotoMapData,
    SprotoPlayerEnter,
    SprotoPlayerFinished,
    SprotoPlayerInfos,
    SprotoPlayerLeave,
    SprotoPlayerStatusUpdate,
    SprotoPrivateInfo,
    SprotoProgressUpdate,
    SprotoRoomEnd,
    SprotoRoomInfo,
    SprotoStepId,
    SprotoTilesRemoved,
    SprotoTotalResult,
    SprotoComboSuccess,
    SprotoMapShuffled,
} from "../../../../../../types/protocol/game10002/s2c";
import {
    SprotoClientReady,
    SprotoGameReady,
    SprotoLeaveRoom,
    SprotoVoteDisbandRoom,
    SprotoOwnerStartGame,
} from "../../../../../../types/protocol/game10002/c2s";
import { SprotoGameRoomReady } from "../../../../../../types/protocol/lobby/s2c";
import { TALK_LIST, FORWARD_MESSAGE_TYPE } from "../../talk/TalkConfig";
import { TalkView } from "../../talk/TalkView";
import { CompMap } from "./CompMap";
import { LineSegment, SHIFT_DIR } from "../../../logic/TileMapData";
import FGUICompMedal from "@fgui/gameCommon/FGUICompMedal";
import { Logger } from "@frameworks/utils/Utils";
import { TipsView } from "@view/common/TipsView";
import { GameChallengeResultView } from "../../challengeResult/GameChallengeResultView";

/**
 * 游戏主体组件
 */
@ViewClass({ curveScreenAdapt: true })
export class CompGameMain extends FGUICompGameMain {
    public UI_COMP_SELF_MEDAL: FGUICompMedal;
    /**
     * 组件构造完成时的初始化
     */
    onConstruct() {
        super.onConstruct();
        this.init();
        this.initListeners();

        // 默认隐藏时钟组件，收到时钟协议后再显示
        this.UI_COMP_CLOCK.visible = false;

        // 客户端进入完成
        if (GameData.instance.isChallengeMode) {
            this.ctrl_roomtype.selectedIndex = ROOM_TYPE.CHALLENGE;
        } else if (GameData.instance.isPrivateRoom) {
            this.ctrl_roomtype.selectedIndex = ROOM_TYPE.PRIVATE;
        } else if (GameData.instance.isLocalGame) {
            this.ctrl_roomtype.selectedIndex = ROOM_TYPE.LOCAL;
        }

        // 初始化分数星星组件（闯关计分规则显示，其他情况隐藏）
        this._setupScoreStar();

        // 注册特殊规则提示点击事件，默认隐藏
        this.UI_COMP_SPE_RULE_HINT.onClick(this.onSpeRuleHintClick, this);
        this.UI_COMP_SPE_RULE_HINT.visible = false;

        // 延迟发送客户端进入完成
        this.scheduleOnce(() => {
            this.sendClientReady();
        }, 0);
    }

    /**
     * 初始化游戏数据
     */
    init() {
        GameData.instance.init();
        GameData.instance.maxPlayer = 2;
        if (DataCenter.instance.shortRoomid) {
            GameData.instance.isPrivateRoom = true;
        }

        if (GameSocketManager.instance.isLocalGame()) {
            if (LocalSvr.instance.isChallengeMode()) {
                GameData.instance.isChallengeMode = true;
            } else {
                GameData.instance.isLocalGame = true;
            }
        } else {
            GameData.instance.isLocalGame = false;
        }
    }

    /**
     * 初始化所有服务器消息监听器
     */
    initListeners() {
        GameSocketManager.instance.addServerListen(SprotoRoomInfo, this.onRoomInfo.bind(this));
        GameSocketManager.instance.addServerListen(SprotoRoomEnd, this.onRoomEnd.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerInfos, this.onSvrPlayerInfos.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameStart, this.onSvrGameStart.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameEnd, this.onSvrGameEnd.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerEnter, this.onSvrPlayerEnter.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerStatusUpdate, this.onSvrPlayerStatusUpdate.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerLeave, this.onSvrPlayerLeave.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameClock, this.onSvrGameClock.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPrivateInfo, this.onSvrPrivateInfo.bind(this));
        GameSocketManager.instance.addServerListen(SprotoTotalResult, this.onSvrTotalResult.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameRecord, this.onSvrGameRecord.bind(this));
        GameSocketManager.instance.addServerListen(SprotoForwardMessage, this.onSvrForwardMessage.bind(this));
        GameSocketManager.instance.addServerListen(SprotoStepId, this.onSvrStepId.bind(this));
        // 连连看游戏协议
        GameSocketManager.instance.addServerListen(SprotoLogicInfo, this.onSvrLogicInfo.bind(this));
        GameSocketManager.instance.addServerListen(SprotoMapData, this.onSvrMapData.bind(this));
        GameSocketManager.instance.addServerListen(SprotoTilesRemoved, this.onSvrTilesRemoved.bind(this));
        GameSocketManager.instance.addServerListen(SprotoPlayerFinished, this.onSvrPlayerFinished.bind(this));
        GameSocketManager.instance.addServerListen(SprotoGameRelink, this.onSvrGameRelink.bind(this));
        GameSocketManager.instance.addServerListen(SprotoProgressUpdate, this.onSvrProgressUpdate.bind(this));
        GameSocketManager.instance.addServerListen(SprotoItemEffect, this.onSvrItemEffect.bind(this));
        GameSocketManager.instance.addServerListen(SprotoComboSuccess, this.onSvrComboSuccess.bind(this));
        GameSocketManager.instance.addServerListen(SprotoMapShuffled, this.onSvrMapShuffled.bind(this));
        LobbySocketManager.instance.addServerListen(SprotoGameRoomReady, this.onSvrGameRoomReady.bind(this));
        AddEventListener(FW_EVENT_NAMES.GAME_SOCKET_DISCONNECT, this.onGameSocketDisconnect, this);
    }

    /**
     * 组件销毁时的清理
     */
    onDestroy() {
        super.onDestroy();
        this.removeListeners();
        if (GameData.instance.isLocalGame || GameData.instance.isChallengeMode) {
            LocalSvr.instance.destroy();
        }
        if (GameSocketManager.instance.isOpen()) {
            GameSocketManager.instance.close();
        }
    }

    /**
     * 移除所有服务器消息监听器
     */
    removeListeners(): void {
        GameSocketManager.instance.removeServerListen(SprotoRoomInfo);
        GameSocketManager.instance.removeServerListen(SprotoRoomEnd);
        GameSocketManager.instance.removeServerListen(SprotoPlayerInfos);
        GameSocketManager.instance.removeServerListen(SprotoGameStart);
        GameSocketManager.instance.removeServerListen(SprotoGameEnd);
        GameSocketManager.instance.removeServerListen(SprotoPlayerEnter);
        GameSocketManager.instance.removeServerListen(SprotoPlayerStatusUpdate);
        GameSocketManager.instance.removeServerListen(SprotoPlayerLeave);
        GameSocketManager.instance.removeServerListen(SprotoGameClock);
        GameSocketManager.instance.removeServerListen(SprotoPrivateInfo);
        GameSocketManager.instance.removeServerListen(SprotoTotalResult);
        GameSocketManager.instance.removeServerListen(SprotoGameRecord);
        GameSocketManager.instance.removeServerListen(SprotoForwardMessage);
        GameSocketManager.instance.removeServerListen(SprotoStepId);
        // 连连看游戏协议
        GameSocketManager.instance.removeServerListen(SprotoLogicInfo);
        GameSocketManager.instance.removeServerListen(SprotoMapData);
        GameSocketManager.instance.removeServerListen(SprotoTilesRemoved);
        GameSocketManager.instance.removeServerListen(SprotoPlayerFinished);
        GameSocketManager.instance.removeServerListen(SprotoGameRelink);
        GameSocketManager.instance.removeServerListen(SprotoProgressUpdate);
        GameSocketManager.instance.removeServerListen(SprotoItemEffect);
        GameSocketManager.instance.removeServerListen(SprotoComboSuccess);
        GameSocketManager.instance.removeServerListen(SprotoMapShuffled);
        LobbySocketManager.instance.removeServerListen(SprotoGameRoomReady);
        RemoveEventListener(FW_EVENT_NAMES.GAME_SOCKET_DISCONNECT, this.onGameSocketDisconnect);
    }

    sendClientReady() {
        GameSocketManager.instance.sendToServer(SprotoClientReady, {});
    }

    /**
     * 地图打乱处理
     * @param data
     */
    onSvrMapShuffled(data: SprotoMapShuffled.Request): void {
        const selfSeat = GameData.instance.getSelfSeat();
        if (data.seat === selfSeat) {
            // 处理自己的地图打乱逻辑
            TipsView.showView({ content: `地图已自动打乱` });
        }
    }

    /**
     * 服务器消息转发处理
     * @param data 转发消息数据
     */
    onSvrForwardMessage(data: SprotoForwardMessage.Request) {
        Logger.log(data);
        this.forwardMessage(data);
    }

    /**
     * 步骤ID处理
     * @param data 步骤ID数据
     */
    onSvrStepId(data: SprotoStepId.Request) {
        GameData.instance.gameStep = data.step;
    }

    /**
     * 游戏记录处理
     * @param data 游戏记录数据
     */
    onSvrGameRecord(data: any) {
        GameData.instance.record = data;
    }

    /**
     * 总结果处理
     * @param data 总结果数据
     */
    onSvrTotalResult(data: SprotoTotalResult.Request) {
        const time = 0.2;
        this.scheduleOnce(() => {
            TotalResultView.showView(data);
        }, time);
    }

    /**
     * 私人房信息处理
     * @param data 私人房数据
     */
    onSvrPrivateInfo(data: any) {
        if (!data) {
            return;
        }
        if (GameData.instance.isPrivateRoom) {
            if (data.maxCnt === 9999) {
                this.UI_TXT_PROGRESS.text = `第${data.nowCnt ?? 0}局 无限局`;
            } else {
                this.UI_TXT_PROGRESS.text = `第${data.nowCnt ?? 0}局 共${data.maxCnt ?? 0}局`;
            }
            GameData.instance.privateMaxCnt = data.maxCnt;
            GameData.instance.privateNowCnt = data.nowCnt;

            if (data.nowCnt && data.nowCnt > 0) {
                this.UI_COMP_PRIVITE_INFO.UI_TXT_RULE.text = `准备后继续游戏`;
            }

            this.checkShowStartGameBtn();
        }
    }

    onSvrComboSuccess(data: SprotoComboSuccess.Request) {
        Logger.log("ComboSuccess", data);
        const selfSeat = GameData.instance.getSelfSeat();
        if (selfSeat === data.seat) {
            // 自己的Combo成功，显示Combo数
            this.playComb(data.comboCount);
        }
    }

    playComb(count: number) {
        this.UI_COMP_COMB.text = `连击X${count}`;
        this.UI_COMP_COMB.act.play();
    }

    /**
     * 游戏断开连接处理
     */
    onGameSocketDisconnect(): void {
        if (!GameData.instance.gameStart) {
            return;
        }
        if (GameData.instance.isLocalGame) {
            return;
        }
        PopMessageView.showView({
            content: "游戏已断开，返回大厅",
            type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
            sureBack: () => {
                this.changeToLobbyScene();
            },
        });
    }

    /**
     * @method _isScoreChallengeMode
     * @description 是否闯关计分规则（type=2）模式：当前为闯关模式且关卡配置类型为计分规则
     * @returns {boolean} 是否为计分规则闯关模式
     * @private
     */
    private _isScoreChallengeMode(): boolean {
        if (!GameData.instance.isChallengeMode) {
            return false;
        }
        const levelConfig = ChallengeData.instance.getSelectedLevelConfig();
        return !!levelConfig && levelConfig.type === CHALLENGE_LEVEL_TYPE.SCORING;
    }

    /**
     * @method _setupScoreStar
     * @description 初始化分数星星组件：计分规则(type=2)闯关模式显示并传入星级分数，其他情况隐藏并重置
     * @private
     */
    private _setupScoreStar(): void {
        const compScoreStar = this.UI_COMP_SCORE_STAR as CompScoreStar;
        if (!compScoreStar) {
            return;
        }
        if (this._isScoreChallengeMode()) {
            const levelConfig = ChallengeData.instance.getSelectedLevelConfig();
            compScoreStar.visible = true;
            compScoreStar.init(levelConfig?.starScore ?? [], 0, levelConfig?.targetScore ?? 0);
        } else {
            compScoreStar.visible = false;
            compScoreStar.reset();
        }
    }

    /**
     * 显示或隐藏倒计时
     * @param bshow 是否显示
     * @param clock 倒计时时间
     */
    showClock(bshow: boolean, clock?: number): void {
        const compTimeLeft = this.UI_COMP_CLOCK as CompTimeLeft;
        if (bshow) {
            // 计分规则(type=2)闯关模式不显示时钟
            if (this._isScoreChallengeMode()) {
                compTimeLeft.visible = false;
                compTimeLeft.stop();
                return;
            }
            if (clock && clock > 0) {
                const totalTime = GameData.instance.playingStepTime || clock;
                compTimeLeft.visible = true;

                if (GameData.instance.isChallengeMode) {
                    const levelConfig = ChallengeData.instance.getSelectedLevelConfig();
                    if (levelConfig && levelConfig.type === CHALLENGE_LEVEL_TYPE.TIMING && levelConfig.starTime) {
                        compTimeLeft.start(clock, totalTime, 1, levelConfig.starTime);
                        return;
                    }
                }

                compTimeLeft.start(clock, totalTime);
            }
        } else {
            compTimeLeft.visible = false;
            compTimeLeft.stop();
        }
    }

    // 处理转发协议
    forwardMessage(data: SprotoForwardMessage.Request) {
        const type = data.type;

        switch (type) {
            case FORWARD_MESSAGE_TYPE.TALK:
                // 处理聊天消息
                Logger.log("[聊天] 收到消息转发:", data);
                try {
                    const talkData = JSON.parse(data.msg);
                    Logger.log("[聊天] 解析后的数据:", talkData);
                    if (talkData && talkData.id) {
                        Logger.log("[聊天] 显示聊天，from:", data.from, "id:", talkData.id);
                        this.showTalk({
                            from: data.from,
                            id: talkData.id,
                        });
                    } else {
                        Logger.warn("[聊天] talkData.id 不存在:", talkData);
                    }
                } catch (e) {
                    Logger.error("[聊天] 解析聊天消息失败:", e);
                }
                break;
            default:
                Logger.log("未处理的消息转发类型:", type);
                break;
        }
    }

    /**
     * 显示聊天消息
     * @param data 聊天数据
     */
    showTalk(data: { from: number; id: number }): void {
        Logger.log("[聊天] showTalk 被调用:", data);
        const id = data.id;
        const userid = data.from;
        Logger.log("[聊天] 查找玩家 userid:", userid);
        const player = GameData.instance.getPlayerByUserid(userid);
        if (!player) {
            Logger.warn("[聊天] 未找到玩家 userid:", userid);
            return;
        }
        Logger.log("[聊天] 找到玩家:", player.nickname);
        const talkData = TALK_LIST.find((item) => item.id == id);
        if (!talkData) {
            Logger.warn("[聊天] 未找到聊天配置 id:", id);
            return;
        }
        Logger.log("[聊天] 显示消息:", talkData.msg);

        const selfid = DataCenter.instance.userid;
        if (userid === selfid) {
            // 自己，使用 UI_COMP_SELFPLAYER
            const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
            if (selfPlayer) {
                selfPlayer.showMsg(talkData.msg);
            }
        } else {
            // 其他玩家，使用 UI_COMP_PLAYERS 列表
            const svrSeat = GameData.instance.getSeatByUserid(player.userid);
            Logger.log("[聊天] 处理其他玩家消息，svrSeat:", svrSeat);
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            Logger.log("[聊天] compPlayers:", compPlayers ? "存在" : "不存在");
            const otherPlayer = compPlayers?.getOtherPlayer(svrSeat);
            Logger.log("[聊天] otherPlayer:", otherPlayer ? "存在" : "不存在");
            if (otherPlayer) {
                const headComp = otherPlayer.getHeadComponent();
                Logger.log("[聊天] headComponent:", headComp ? "存在" : "不存在");
                if (headComp) {
                    headComp.showMsg(talkData.msg);
                    Logger.log("[聊天] 消息已显示");
                } else {
                    Logger.warn("[聊天] headComponent 为空");
                }
            } else {
                Logger.warn("[聊天] 未找到其他玩家组件，svrSeat:", svrSeat);
            }
        }
    }

    /**
     * 游戏逻辑信息处理
     * @param data 逻辑信息数据
     */
    onSvrLogicInfo(data: any): void {
        Logger.log("游戏逻辑信息", data);
        if (data.playingStepTime !== undefined) {
            GameData.instance.playingStepTime = data.playingStepTime;
        }

        // 解析方块移动配置（ext = {"shiftDir": 2, "edge": 3}），兼容服务端字段名差异：shiftDir/dir、shiftEdge/edge/shift_edge
        if (data.ext) {
            try {
                const ext = JSON.parse(data.ext);
                const dir = ext.shiftDir ?? ext.dir ?? ext.shift_dir;
                const edge = ext.shiftEdge ?? ext.edge ?? ext.shift_edge;
                if (typeof dir === "number") {
                    GameData.instance.shiftDir = dir;
                }
                if (typeof edge === "number") {
                    GameData.instance.shiftEdge = edge;
                }
                Logger.log(`方块移动配置: shiftDir=${GameData.instance.shiftDir}, shiftEdge=${GameData.instance.shiftEdge}`);
            } catch (e) {
                Logger.error("解析 logicInfo.ext 失败:", e);
            }
        }

        // 根据特殊规则更新提示组件显示
        this._setupSpeRuleHint();
    }

    /**
     * @method _setupSpeRuleHint
     * @description 根据特殊规则（shiftDir）更新特殊规则提示组件的显示：无特殊规则时隐藏，否则显示并设置标题
     * @private
     */
    private _setupSpeRuleHint(): void {
        const shiftDir = GameData.instance.shiftDir;
        const dirText = this._getShiftDirText(shiftDir);
        if (!dirText) {
            this.UI_COMP_SPE_RULE_HINT.visible = false;
            return;
        }
        this.UI_COMP_SPE_RULE_HINT.title = `消除后${dirText}移动`;
        this.UI_COMP_SPE_RULE_HINT.visible = true;
    }

    /**
     * @method _getShiftDirText
     * @description 将移动方向枚举转为中文方向文本，无有效方向返回空字符串
     * @param {number} shiftDir - SHIFT_DIR 枚举值
     * @returns {string} 方向文本（向上/向下/向左/向右），无有效方向返回空
     * @private
     */
    private _getShiftDirText(shiftDir: number): string {
        switch (shiftDir) {
            case SHIFT_DIR.UP:
                return "向上";
            case SHIFT_DIR.DOWN:
                return "向下";
            case SHIFT_DIR.LEFT:
                return "向左";
            case SHIFT_DIR.RIGHT:
                return "向右";
            default:
                return "";
        }
    }

    /**
     * @method onSpeRuleHintClick
     * @description 特殊规则提示点击事件：弹出规则说明弹窗
     */
    onSpeRuleHintClick(): void {
        const dirText = this._getShiftDirText(GameData.instance.shiftDir);
        if (!dirText) {
            return;
        }
        PopMessageView.showView({
            content: `消除后，所有方块会${dirText}移动压缩`,
            type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
        });
    }

    /**
     * 游戏时钟处理
     * @param data 时钟数据
     */
    onSvrGameClock(data: any): void {
        if (data.time > 0) {
            this.showClock(true, data.time);
        } else {
            this.showClock(false);
        }
    }

    // ============================================
    // 连连看游戏协议处理
    // ============================================

    /**
     * 地图数据处理
     * @param data 地图数据
     */
    onSvrMapData(data: SprotoMapData.Request): void {
        Logger.log("地图数据", data);
        if (!data.mapData) {
            Logger.warn("地图数据为空");
            return;
        }

        try {
            const map = JSON.parse(data.mapData);

            // 兼容服务端 10×10 地图，底部补零扩展到 16×10
            const TARGET_ROWS = 16;
            if (map.length < TARGET_ROWS) {
                const cols = map[0] ? map[0].length : data.col;
                for (let row = map.length; row < TARGET_ROWS; row++) {
                    map[row] = new Array(cols).fill(0);
                }
            }

            const selfSeat = GameData.instance.getSelfSeat();
            // 保存地图数据到 GameData
            GameData.instance.setPlayerMapData(data.seat, map, data.totalBlocks, data.col, data.row);

            if (data.seat === selfSeat) {
                // 自己的地图，渲染到主地图
                const compMap = this.getCompMap();
                if (compMap) {
                    compMap.visible = true;
                    const scale = 1.0;
                    compMap.node.setScale(scale, scale);
                    compMap.initMap(map, "resFruit");
                }
            } else {
                // 其他玩家的地图，渲染到对应的小地图
                this.updateOtherPlayerMap(data.seat, map);
            }
        } catch (e) {
            Logger.error("地图数据解析失败:", e);
        }
    }

    /**
     * 方块消除成功通知处理
     * @param data 消除数据
     */
    onSvrTilesRemoved(data: SprotoTilesRemoved.Request): void {
        Logger.log("方块消除", data);
        const selfSeat = GameData.instance.getSelfSeat();

        if (data.seat === selfSeat) {
            // 闯关计分规则：同步总分数到分数星星组件（本次加分仅记录日志）
            if (this._isScoreChallengeMode() && data.totalScore !== undefined) {
                const compScoreStar = this.UI_COMP_SCORE_STAR as CompScoreStar;
                if (compScoreStar) {
                    compScoreStar.updateScore(data.totalScore);
                    Logger.log(`本次消除加分: ${data.score ?? 0}，当前总分: ${data.totalScore}`);
                }
            }

            const playerMap = GameData.instance.getPlayerMapData(data.seat);
            // const isAlreadyRemoved =
            //     playerMap?.mapData?.[data.p1.row]?.[data.p1.col] === 0 && playerMap?.mapData?.[data.p2.row]?.[data.p2.col] === 0;
            const compMap = this.getCompMap();
            const isAlreadyRemoved = compMap?.checkClientRemoved(data.p1, data.p2);

            if (isAlreadyRemoved) {
                GameData.instance.updatePlayerMapTilesRemoved(data.seat, data.p1.row, data.p1.col, data.p2.row, data.p2.col);
            } else {
                if (compMap) {
                    compMap.removeTilesWithAnimation(data.p1, data.p2, data.lines);
                }
                GameData.instance.updatePlayerMapTilesRemoved(data.seat, data.p1.row, data.p1.col, data.p2.row, data.p2.col);
            }
        } else {
            // 其他玩家的消除，需要在对应的小地图上显示消除效果
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;

            if (compPlayers) {
                // 使用更新后的方法，传递连线数据
                compPlayers.removeOtherPlayerTiles(data.seat, data.p1, data.p2, data.lines as LineSegment[]);
            }

            // 更新数据中的地图
            GameData.instance.updatePlayerMapTilesRemoved(data.seat, data.p1.row, data.p1.col, data.p2.row, data.p2.col);
        }
    }

    /**
     * 玩家完成游戏处理
     * @param data 完成数据
     */
    onSvrPlayerFinished(data: any): void {
        Logger.log("玩家完成", data);
        const selfSeat = GameData.instance.getSelfSeat();

        if (data.seat === selfSeat) {
            // 自己完成，显示排名奖牌和完成信息
            Logger.log(`自己完成游戏，排名: ${data.rank}，用时: ${data.usedTime}秒`);
            if (this.UI_COMP_SELF_MEDAL && data.rank > 0) {
                this.UI_COMP_SELF_MEDAL.ctrl_rank.selectedIndex = data.rank;
            }
            // 显示完成信息组件
            const compFinshInfo = this.UI_COMP_FINSH_INFO as CompFinshInfo;
            if (compFinshInfo) {
                compFinshInfo.showFinishInfo(data.rank, data.usedTime);
            }
            // 使用控制器显示完成信息
            if (this.ctrl_finshInfo) {
                this.ctrl_finshInfo.selectedIndex = 1;
            }
        } else {
            // 其他玩家完成，更新完成状态显示和名次
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            if (compPlayers) {
                compPlayers.setOtherPlayerComplete(data.seat, true);
                // 设置名次，服务器返回的rank从1开始
                compPlayers.setOtherPlayerRank(data.seat, data.rank);
            }

            const player = GameData.instance.getPlayerBySeat(data.seat);
            if (player) {
                Logger.log(`玩家 ${player.nickname} 完成游戏，排名: ${data.rank}，用时: ${data.usedTime}秒`);
            }
        }
    }

    /**
     * 游戏重连恢复处理
     * @param data 重连数据
     */
    onSvrGameRelink(data: any): void {
        Logger.log("游戏重连", data);
        this.showStartGameBtn(false);
        this.showInviteBtn(false);
    }

    /**
     * 游戏进度更新处理
     * @param data 进度数据
     */
    onSvrProgressUpdate(data: any): void {
        const selfSeat = GameData.instance.getSelfSeat();
        if (data.seat === selfSeat) {
            // 自己的进度更新，不需要处理
            return;
        }

        const player = GameData.instance.getPlayerBySeat(data.seat);
        if (player) {
            // 更新其他玩家的进度显示
            Logger.log(`玩家 ${player.nickname} 进度: ${data.percentage}%，剩余: ${data.remaining}`);
            // TODO: 后续服务器完善接口后，可以更新其他玩家的地图
            // this.updateOtherPlayerMap(data.seat, mapData);
        }
    }

    /**
     * 更新其他玩家地图（预留接口）
     * @param svrSeat 服务器座位号
     * @param mapData 地图数据
     */
    updateOtherPlayerMap(svrSeat: number, mapData: number[][]): void {
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (compPlayers) {
            compPlayers.updateOtherPlayerMap(svrSeat, mapData);
        }
    }

    /**
     * 移除其他玩家的方块（预留接口）
     * @param svrSeat 服务器座位号
     * @param p1 第一个方块坐标
     * @param p2 第二个方块坐标
     */
    removeOtherPlayerTiles(svrSeat: number, p1: any, p2: any): void {
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (compPlayers) {
            compPlayers.removeOtherPlayerTiles(svrSeat, p1, p2);
        }
    }

    /**
     * 道具效果通知处理
     * @param data 道具效果数据
     */
    onSvrItemEffect(data: any): void {
        Logger.log("道具效果", data);
        // 预留：处理道具效果
    }

    /**
     * 清除游戏状态
     */
    clear(): void {
        this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.NONE;
        // 隐藏完成信息组件
        if (this.ctrl_finshInfo) {
            this.ctrl_finshInfo.selectedIndex = 0;
        }
        // 重置完成信息组件
        const compFinshInfo = this.UI_COMP_FINSH_INFO as CompFinshInfo;
        if (compFinshInfo) {
            compFinshInfo.reset();
        }
        // 清理自己的奖牌
        if (this.UI_COMP_SELF_MEDAL) {
            this.UI_COMP_SELF_MEDAL.ctrl_rank.selectedIndex = 0;
        }
    }

    /**
     * 继续游戏按钮处理
     */
    onBtnContinue(): void {
        if (GameData.instance.gameStart) {
            return;
        }

        // 匹配房：清理其他玩家列表（私人房列表保留，状态重置由 onBtnReady 统一处理）
        if (!GameData.instance.isPrivateRoom) {
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            if (compPlayers) {
                compPlayers.clear();
            }
        }
        // 隐藏计时器
        this.UI_COMP_CLOCK.visible = false;

        if (GameData.instance.isPrivateRoom) {
            this.onBtnReady();
        } else if (GameData.instance.isLocalGame) {
            this.sendClientReady();
        } else {
            this.startMatch();
        }
    }

    /**
     * 开始匹配
     */
    startMatch() {
        const func = (b: boolean, data?: any) => {
            if (b) {
                // 显示匹配view
                MatchView.showView();
            } else {
                if (data && data.gameid && data.roomid) {
                    const func2 = () => {
                        //返回房间
                    };
                    PopMessageView.showView({
                        title: "温馨提示",
                        content: "您已经在房间中，是否返回？",
                        type: ENUM_POP_MESSAGE_TYPE.NUM2,
                        sureBack: func2,
                    });
                }
            }
        };
        Match.instance.req(0, func);
    }

    /**
     * 连接到游戏服务器
     * @param addr 游戏服务器地址
     * @param gameid 游戏ID
     * @param roomid 房间ID
     */
    connectToGame(addr: string, gatewayUrl: string, gameid: number, roomid: string) {
        const callBack = (success: boolean) => {
            if (success) {
                //this.changeToGameScene()
                this.clear();
                this.init();
                GameSocketManager.instance.sendToServer(SprotoClientReady, {});
            }
        };
        AuthGame.instance.req(addr, gatewayUrl, gameid, roomid, callBack);
    }

    /**
     * 游戏房间准备就绪处理
     * @param data 房间数据
     */
    onSvrGameRoomReady(data: any): void {
        Logger.log("gameRoomReady", data);
        MatchView.hideView();
        DataCenter.instance.gameid = data.gameid;
        DataCenter.instance.roomid = data.roomid;
        DataCenter.instance.gameAddr = data.addr;
        DataCenter.instance.shortRoomid = 0; // 匹配房
        DataCenter.instance.gameGatewayUrl = data.gatewayUrl;
        Logger.log(LogColors.green("游戏房间准备完成"));
        this.connectToGame(data.addr, data.gatewayUrl, data.gameid, data.roomid);
    }

    /**
     * 房间结束处理
     * @param data 结束数据
     */
    onRoomEnd(data: any): void {
        GameData.instance.roomEnd = true;
        const msg = "房间销毁";
        if (data.code == ROOM_END_FLAG.GAME_END) {
            Logger.log("游戏结束 " + msg);
        } else if (data.code == ROOM_END_FLAG.OUT_TIME_WAITING) {
            Logger.log("等待超时 " + msg);
            PopMessageView.showView({
                content: "等待超时",
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: () => {
                    this.changeToLobbyScene();
                },
                closeBack: () => {
                    this.changeToLobbyScene();
                },
            });
        } else if (data.code == ROOM_END_FLAG.OUT_TIME_PLAYING) {
            Logger.log("游戏超时 " + msg);
            PopMessageView.showView({
                content: "游戏超时",
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: () => {
                    this.changeToLobbyScene();
                },
                closeBack: () => {
                    this.changeToLobbyScene();
                },
            });
        } else if (data.code == ROOM_END_FLAG.OWNER_DISBAND) {
            let endMsg = "房主已经解散房间";
            if (GameData.instance.owner == DataCenter.instance.userid) {
                endMsg = "您已经解散房间";
            }
            PopMessageView.showView({
                content: endMsg,
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                sureBack: () => {
                    this.changeToLobbyScene();
                },
                closeBack: () => {
                    this.changeToLobbyScene();
                },
            });
        } else if (data.code == ROOM_END_FLAG.VOTE_DISBAND) {
            Logger.log("投票解散 " + msg);
            //this.onBtnClose()
        }
    }

    /**
     * 玩家信息处理
     * @param data 玩家信息数据
     */
    onSvrPlayerInfos(data: SprotoPlayerInfos.Request): void {
        Logger.log("onSvrPlayerInfos", data);
        const selfid = DataCenter.instance.userid;
        for (let i = 0; i < data.infos.length; i++) {
            const info = data.infos[i];
            const player: GAME_PLAYER_INFO = {
                nickname: info.nickname,
                headurl: info.headurl,
                sex: info.sex,
                province: info.province,
                city: info.city,
                ext: info.ext,
                ip: info.ip,
                status: info.status,
                cp: info.cp ?? 0,
                userid: info.userid,
            };

            GameData.instance.addPlayer(player);

            // 座位未知（playerEnter 之前）时跳过 UI 更新，等待 playerEnter 处理
            const svrSeat = GameData.instance.getSeatByUserid(info.userid);
            if (svrSeat === 0) {
                continue;
            }

            // 更新玩家信息
            if (info.userid === selfid) {
                // 自己，更新自己的头像
                this.showPlayerInfoBySeat(svrSeat);
            } else {
                // 其他玩家，更新列表中的头像
                this.updateOtherPlayerHead(svrSeat, player);
            }
        }
    }

    /**
     * 更新其他玩家头像
     * @param svrSeat 服务器座位号
     * @param player 玩家信息
     */
    updateOtherPlayerHead(svrSeat: number, player: any): void {
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (!compPlayers) return;

        const headurl = GameData.instance.getHeadurlByUserid(player.userid);
        if (compPlayers.hasPlayer(svrSeat)) {
            // 已存在，更新信息
            compPlayers.updateOtherPlayerHead(svrSeat, player, headurl);
        }
        // 如果不存在，等待 onSvrPlayerEnter 时创建
    }

    /**
     * 游戏开始处理
     * @param data 游戏开始数据
     */
    onSvrGameStart(data: any): void {
        GameData.instance.gameStart = true;

        // 每局开始重新初始化分数星星组件（重连和开局均处理）
        this._setupScoreStar();

        // 隐藏开始,邀请游戏按钮
        if (GameData.instance.isPrivateRoom) {
            this.showStartGameBtn(false);
            this.showInviteBtn(false);
            this.UI_COMP_PRIVITE_INFO.visible = false;
        }

        // 非重连情况
        if (!data.brelink) {
            // 私人房：新一局开始时权威重置其他玩家组件状态（完成标识、名次、小地图）
            // 无论玩家通过何种路径进入准备状态，开局时状态必然干净
            if (GameData.instance.isPrivateRoom) {
                const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
                if (compPlayers) {
                    compPlayers.resetAllPlayers();
                }
            }

            this.UI_COMP_GAME_START.visible = true;
            this.UI_COMP_GAME_START.act.play(() => {
                this.UI_COMP_GAME_START.visible = false;
            });

            // 第几回合
            this.clear();
        } else {
            // 地图数据通过 mapData 协议单独下发
            // 清除本地地图数据缓存，等待 mapData 协议重新下发所有玩家地图
            GameData.instance.clearAllPlayerMaps();
        }

        // 单机显示重新开始按钮
        if (GameData.instance.isLocalGame) {
            this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.RESTART;
        }

        // 显示道具面板
        this.showPropPanel(GameData.instance.itemEnabled);

        for (let index = 0; index < GameData.instance.maxPlayer; index++) {
            this.showSignReady(index + 1, false);
        }
    }

    /**
     * 游戏结束处理
     * @param data 游戏结束数据
     */
    onSvrGameEnd(data: SprotoGameEnd.Request): void {
        GameData.instance.gameStart = false;
        this.showPropPanel(false);
        // 停止倒计时
        const compTimeLeft = this.UI_COMP_CLOCK as CompTimeLeft;
        if (compTimeLeft) {
            compTimeLeft.stop();
        }

        if (GameData.instance.isChallengeMode) {
            this.onChallengeGameEnd(data);
            return;
        }

        // 处理连连看游戏结束数据
        if (data.rankings && data.rankings.length > 0) {
            // 处理未完成的其他玩家
            const completedSeats = data.rankings.filter((r: any) => r.usedTime >= 0).map((r: any) => r.seat);

            // 设置所有未完成玩家状态
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            if (compPlayers) {
                compPlayers.setAllPlayersIncomplete(completedSeats);
            }

            // 组装用户数据
            const scoreData = data.rankings.map((rank: any) => {
                const player = GameData.instance.getPlayerBySeat(rank.seat);
                const headurl = player ? GameData.instance.getHeadurlByUserid(player.userid) : "";
                // 分数按座位号匹配（scores 与 rankings 顺序可能不一致）
                const scoreInfo = data.scores?.find((s) => s.seat === rank.seat);
                return {
                    userid: player?.userid ?? 0,
                    nickname: player?.nickname ?? "",
                    usedTime: rank.usedTime,
                    eliminated: rank.eliminated,
                    rank: rank.rank,
                    headurl: headurl,
                    score: scoreInfo?.delta ?? 0,
                    maxComb: rank.maxCombo,
                    totalScore: scoreInfo?.newScore ?? 0,
                };
            });

            scoreData.sort((a: any, b: any) => {
                if (a.usedTime == -1) {
                    return 1;
                }
                if (b.usedTime == -1) {
                    return -1;
                }
                return a.rank - b.rank;
            });

            const func = () => {
                this.onBtnContinue();
            };

            this.scheduleOnce(() => {
                // 显示结果界面
                ResultView.showView({
                    continueFunc: func,
                    scores: scoreData,
                });
            }, 0.3);
        }

        UserStatus.instance.req();

        // 显示继续游戏
        if (GameData.instance.isPrivateRoom) {
            this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.NONE;
        } else {
            this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.CONTINUE;
        }
    }

    /**
     * @method onChallengeGameEnd
     * @description 闯关模式游戏结束处理（数据层 + 展示结算面板）
     * @param {SprotoGameEnd.Request} data - 游戏结束数据
     * @private
     */
    private onChallengeGameEnd(data: SprotoGameEnd.Request): void {
        const endType = data.endType;
        const ranking = data.rankings?.[0];
        const usedTime = (ranking?.usedTime ?? 0) / 1000;
        const score = data.scores?.[0]?.delta ?? 0;

        Logger.log(`闯关模式结束: endType=${endType}, usedTime=${usedTime}, score=${score}`);

        const chapter = ChallengeData.instance.selectedChapter;
        const level = ChallengeData.instance.selectedLevel;
        const pass = endType === CHALLENGE_END_TYPE.SUCCESS;

        let stars = 0;

        if (pass) {
            const levelConfig = ChallengeData.instance.getSelectedLevelConfig();

            if (levelConfig?.type === CHALLENGE_LEVEL_TYPE.TIMING) {
                // 计时规则：通关时剩余时间大于等于各星级限制时间
                if (levelConfig.starTime && levelConfig.starTime.length > 0) {
                    for (let i = levelConfig.starTime.length - 1; i >= 0; i--) {
                        if (levelConfig.totalTime - usedTime >= levelConfig.starTime[i]) {
                            stars = i + 1;
                            break;
                        }
                    }
                }
            } else if (levelConfig?.type === CHALLENGE_LEVEL_TYPE.SCORING) {
                // 计分规则：本局总分大于等于各星级限制分数
                const totalScore = data.scores?.[0]?.newScore ?? 0;
                if (levelConfig.starScore && levelConfig.starScore.length > 0) {
                    for (let i = levelConfig.starScore.length - 1; i >= 0; i--) {
                        if (totalScore >= levelConfig.starScore[i]) {
                            stars = i + 1;
                            break;
                        }
                    }
                }
            }

            const next = ChallengeData.instance.getNextLevel(chapter, level);
            Challenge.instance.updateLevelData(chapter, level, score, stars, next.chapter, next.level, (success) => {
                if (success) {
                    Logger.log("闯关进度已同步到服务器");
                } else {
                    Logger.warn("闯关进度同步失败");
                }
            });
        }

        this.scheduleOnce(() => {
            GameChallengeResultView.showView({
                score: score,
                time: usedTime,
                pass: pass,
                stars: stars,
                chapter: chapter,
                level: level,
            });
        }, 0.3);
    }

    /**
     * 玩家进入处理
     * @param data 进入数据
     */
    onSvrPlayerEnter(data: any): void {
        const selfid = DataCenter.instance.userid;
        const svrSeat = data.seat;
        const userid = data.userid;

        // 座位权威入口：无条件记录座位映射，自己的座位同步到 GameData
        GameData.instance.setSeatForUserid(userid, svrSeat);
        if (selfid == userid) {
            GameData.instance.setSelfSeat(svrSeat);
        }

        const playerInfo = GameData.instance.getPlayerByUserid(userid);
        if (!playerInfo) {
            return;
        }

        if (selfid == userid) {
            // 自己使用 UI_COMP_SELFPLAYER
            this.showPlayerInfoBySeat(svrSeat);
        } else {
            // 其他玩家使用 UI_COMP_PLAYERS 列表
            this.addOtherPlayer(svrSeat, playerInfo);
        }

        if (GameData.instance.isPrivateRoom) {
            if (playerInfo.status == PLAYER_STATUS.ONLINE && selfid == userid) {
                // 房主在第一局开始前(privateNowCnt=0)不显示准备按钮
                const isOwner = GameData.instance.owner === selfid;
                if (!isOwner || GameData.instance.privateNowCnt > 0) {
                    this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.READY;
                }
            }

            this.checkShowInviteBtn();
            this.checkShowStartGameBtn();
        }
    }

    /**
     * 添加其他玩家到列表
     * @param svrSeat 服务器座位号
     * @param playerInfo 玩家信息
     */
    addOtherPlayer(svrSeat: number, playerInfo: any): void {
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (!compPlayers) {
            Logger.error("UI_COMP_PLAYERS 组件不存在");
            return;
        }
        const headurl = GameData.instance.getHeadurlByUserid(playerInfo.userid);
        compPlayers.addOtherPlayer(svrSeat, playerInfo, headurl);
    }

    /**
     * 玩家状态更新处理
     * @param data 状态数据
     */
    onSvrPlayerStatusUpdate(data: any): void {
        const selfid = DataCenter.instance.userid;
        const player = GameData.instance.getPlayerByUserid(data.userid);
        if (!player) return;

        player.status = data.status;
        const svrSeat = GameData.instance.getSeatByUserid(player.userid);

        if (data.userid === selfid) {
            // 自己状态更新
            this.showPlayerInfoBySeat(svrSeat);
            if (data.status == PLAYER_STATUS.ONLINE) {
                // 房主在第一局开始前(privateNowCnt=0)不显示准备按钮
                const isOwner = GameData.instance.owner === selfid;
                if (!isOwner || GameData.instance.privateNowCnt > 0) {
                    this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.READY;
                }
            }
        } else {
            // 其他玩家状态更新
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            const otherPlayer = compPlayers?.getOtherPlayer(svrSeat);
            if (otherPlayer) {
                const headurl = GameData.instance.getHeadurlByUserid(player.userid);
                otherPlayer.updatePlayerInfo(player, headurl);
            }
        }

        if (GameData.instance.isPrivateRoom) {
            this.checkShowStartGameBtn();
        }
    }

    /**
     * 根据座位显示玩家信息（仅用于自己）
     * @param svrSeat 服务器座位号
     */
    showPlayerInfoBySeat(svrSeat: number): void {
        if (svrSeat !== GameData.instance.getSelfSeat()) {
            Logger.warn("showPlayerInfoBySeat 仅用于自己，其他玩家请使用 CompPlayers");
            return;
        }
        const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
        if (!selfPlayer) return;

        const player = GameData.instance.getPlayerBySeat(svrSeat);
        if (!player) return;

        const headurl = GameData.instance.getHeadurl(svrSeat);
        selfPlayer.updatePlayerInfo(player, true, headurl);
    }

    /**
     * 隐藏自己头像
     */
    hideSelfPlayer(): void {
        const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
        if (selfPlayer) {
            selfPlayer.hide();
        }
    }

    /**
     * 玩家离开处理
     * @param data 离开数据
     */
    onSvrPlayerLeave(data: any): void {
        const selfid = DataCenter.instance.userid;
        const svrSeat = data.seat;
        const player = GameData.instance.getPlayerBySeat(svrSeat);

        if (player && player.userid === selfid) {
            // 自己离开
            GameData.instance.removePlayerBySeat(svrSeat);
            GameData.instance.setSelfSeat(0);
            this.hideSelfPlayer();
        } else {
            // 其他玩家离开，从列表中移除
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            if (compPlayers) {
                compPlayers.removeOtherPlayer(svrSeat);
            }
            GameData.instance.removePlayerBySeat(svrSeat);
        }

        this.checkShowInviteBtn();
        this.checkShowStartGameBtn();
    }

    /**
     * 房间信息处理
     * @param data 房间数据
     */
    onRoomInfo(data: any): void {
        Logger.log(data);
        GameData.instance.owner = data.owner;
        // 展示好友房信息
        if (data.shortRoomid) {
            const shortRoomid = `${data.shortRoomid}`;
            this.UI_COMP_PRIVITE_INFO.UI_TXT_ROOMID.text = "房间号:" + shortRoomid.padStart(6, "0");
        }

        const gameData = JSON.parse(data.gameData);
        if (GameData.instance.isPrivateRoom && data.gameData && data.gameData != "") {
            if (gameData && gameData.rule != "") {
                const rule = JSON.parse(gameData.rule);
                // if (rule.mode) {
                //     this.UI_COMP_PRIVITE_INFO.UI_TXT_RULE.text = `${GAME_MODE_TXT[rule.mode]}`;
                // } else {
                //     this.UI_COMP_PRIVITE_INFO.UI_TXT_RULE.text = "排名模式";
                // }

                // 重新赋值房间人数
                GameData.instance.maxPlayer = rule.playerCnt;
            }
        } else {
            GameData.instance.maxPlayer = data.playerids.length ?? 2;
        }

        if (gameData.itemEnabled) {
            GameData.instance.itemEnabled = gameData.itemEnabled;
        }

        this.checkShowStartGameBtn();
    }

    /**
     * 显示准备标识
     * @param svrSeat 服务器座位号
     * @param bshow 是否显示
     */
    showSignReady(svrSeat: number, bshow: boolean): void {
        if (svrSeat === GameData.instance.getSelfSeat()) {
            // 自己，使用 UI_COMP_SELFPLAYER
            const selfPlayer = this.UI_COMP_SELFPLAYER as CompPlayerHead;
            if (selfPlayer) {
                selfPlayer.showSignReady(bshow);
            }
        } else {
            // 其他玩家，使用 UI_COMP_PLAYERS 列表
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            const otherPlayer = compPlayers?.getOtherPlayer(svrSeat);
            if (otherPlayer) {
                otherPlayer.getHeadComponent()?.showSignReady(bshow);
            }
        }
    }

    /**
     * 切换到大厅场景
     */
    changeToLobbyScene(): void {
        // 单机模式：清理本地服务器
        if (GameData.instance.isLocalGame || GameData.instance.isChallengeMode) {
            LocalSvr.instance.destroy();
        }
        if (GameData.instance.isChallengeMode) {
            DataCenter.instance.shouldGotoChallenge = true;
        }
        if (GameSocketManager.instance.isOpen()) {
            GameSocketManager.instance.close();
        }
        ChangeScene("LobbyScene");
    }

    /**
     * 返回按钮处理
     */
    onBtnBack(): void {
        // 闯关模式：游戏开始状态下退出增加二级确认弹窗
        if (GameData.instance.isChallengeMode && GameData.instance.gameStart) {
            PopMessageView.showView({
                title: "温馨提示",
                content: "退出将放弃本局进度",
                type: ENUM_POP_MESSAGE_TYPE.NUM2,
                sureBack: () => {
                    this.changeToLobbyScene();
                },
            });
            return;
        }
        // 如果房间的socket已经断开，直接退出
        if (!GameSocketManager.instance.isOpen()) {
            return this.changeToLobbyScene();
        }
        // 私人房退出 需要发送协议
        if (GameData.instance.isPrivateRoom) {
            if (!GameData.instance.roomEnd) {
                if (GameData.instance.gameStart) {
                    Logger.log("游戏中无法退出");
                } else {
                    GameSocketManager.instance.sendToServer(SprotoLeaveRoom, { flag: 1 });
                }
            }
        }

        if (GameData.instance.gameStart) {
            PopMessageView.showView({
                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                content: "游戏进行中，无法返回",
            });
        } else {
            this.changeToLobbyScene();
        }
    }

    /**
     * 准备按钮处理
     */
    onBtnReady(): void {
        // 私人房：准备时重置其他玩家组件状态（完成标识、名次、小地图），为新一局做准备
        if (GameData.instance.isPrivateRoom) {
            const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
            if (compPlayers) {
                compPlayers.resetAllPlayers();
            }
        }
        const func = (res: any) => {
            if (res.code) {
                Logger.log(res.msg);
                //this.UI_BTN_READY.visible = false;
                this.ctrl_btn.selectedIndex = CTRL_BTN_INDEX.NONE;
            }
        };
        GameSocketManager.instance.sendToServer(SprotoGameReady, { ready: 1 }, func);
        this.clear();
    }

    /**
     * 开始解散房间投票
     */
    startDisband(): void {
        // 发起解散房间投票请求
        const data = {
            reason: "玩家发起解散", // 解散原因（可选）
        };

        GameSocketManager.instance.sendToServer(SprotoVoteDisbandRoom, data, (response: any) => {
            if (response && response.code === 1) {
                Logger.log("发起解散投票成功");
            } else {
                Logger.error("发起解散投票失败:", response?.msg || "未知错误");
            }
        });
    }

    /**
     * 解散房间按钮处理
     */
    onBtnDisband(): void {
        // 如果房间的socket已经断开，直接退出
        if (!GameSocketManager.instance.isOpen()) {
            return this.changeToLobbyScene();
        }
        if (GameData.instance.owner == DataCenter.instance.userid) {
            if (GameData.instance.gameStart || GameData.instance.privateNowCnt > 0) {
                this.startDisband();
            } else {
                PopMessageView.showView({
                    content: "解散后将无法返回此房间",
                    type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                    sureBack: () => {
                        this.startDisband();
                    },
                });
            }
        } else {
            if (GameData.instance.gameStart || GameData.instance.privateNowCnt > 0) {
                this.startDisband();
            } else {
                PopMessageView.showView({
                    type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                    content: "非房主只能在游戏开始后，发起解散",
                });
            }
        }
    }

    /**
     * 显示邀请按钮
     * @param bshow 是否显示
     */
    showInviteBtn(bshow: boolean): void {
        this.UI_BTN_INVITE.visible = bshow;
        //this.UI_BTN_INVITE.visible = false;
    }

    /**
     * 检测是否显示邀请按钮
     * @param bshow
     */
    checkShowInviteBtn(): void {
        if (!GameData.instance.isPrivateRoom) {
            this.showInviteBtn(false);
            return;
        }

        if (GameData.instance.gameStart) {
            this.showInviteBtn(false);
            return;
        }

        if (GameData.instance.privateNowCnt > 0) {
            this.showInviteBtn(false);
            return;
        }

        const playerCnt = GameData.instance.getPlayerCnt();
        if (playerCnt >= GameData.instance.maxPlayer) {
            this.showInviteBtn(false);
            return;
        }
        this.showInviteBtn(true);
    }

    /**
     * 显示开始游戏按钮
     * @param bshow 是否显示
     */
    showStartGameBtn(bshow: boolean): void {
        this.UI_BTN_START_GAME.visible = bshow;
    }

    /**
     * 检测是否显示开始游戏按钮
     * 显示条件：好友房、房主、游戏未开始、privateNowCnt = 0
     */
    checkShowStartGameBtn(): void {
        if (!GameData.instance.isPrivateRoom) {
            this.showStartGameBtn(false);
            return;
        }

        if (GameData.instance.owner !== DataCenter.instance.userid) {
            this.showStartGameBtn(false);
            return;
        }

        if (GameData.instance.gameStart) {
            this.showStartGameBtn(false);
            return;
        }

        if (GameData.instance.privateNowCnt > 0) {
            this.showStartGameBtn(false);
            return;
        }

        this.showStartGameBtn(true);
    }

    /**
     * 开始游戏按钮处理
     */
    onBtnStartGame(): void {
        GameSocketManager.instance.sendToServer(SprotoOwnerStartGame, {}, (response: any) => {
            if (response) {
                if (response.code === 1) {
                    Logger.log("开始游戏成功");
                } else if (response.code === 0) {
                    if (response.notReadyUserids && response.notReadyUserids.length > 0) {
                        const nicknames: string[] = [];
                        for (const userid of response.notReadyUserids) {
                            const player = GameData.instance.getPlayerByUserid(userid);
                            if (player && player.nickname) {
                                nicknames.push(player.nickname);
                            }
                        }
                        if (nicknames.length > 0) {
                            PopMessageView.showView({
                                content: `${nicknames.join("，")} 未准备，无法开始游戏`,
                                type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                            });
                        }
                    } else if (response.msg) {
                        PopMessageView.showView({
                            content: response.msg,
                            type: ENUM_POP_MESSAGE_TYPE.NUM1SURE,
                        });
                    }
                }
            }
        });
    }

    /**
     * 绘制邀请图片
     * @returns 图片路径
     */
    async drawInviteInfo(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            // 邀请好友
            const bgUrl = "https://qiudaoyu-miniapp.oss-cn-hangzhou.aliyuncs.com/share/10002/invite.jpg";
            const width = 776;
            const height = 621;
            const bg = await MiniGameUtils.instance.loadImage(bgUrl);
            const canvas = MiniGameUtils.instance.getCanvas();
            if (!canvas) {
                reject();
                return;
            }
            canvas.width = width;
            canvas.height = height;
            const canvasContext = MiniGameUtils.instance.getCanvasContext();
            if (!canvasContext) {
                reject();
                return;
            }

            canvasContext.globalCompositeOperation = "source-over";
            canvasContext.clearRect(0, 0, width, height);
            canvasContext.drawImage(bg, 0, 0, width, height);

            const head = await MiniGameUtils.instance.loadImage(DataCenter.instance.headurl);
            const headWidth = 160;
            const headHeight = 160;
            canvasContext.drawImage(head, width * 0.1, height * 0.7, headWidth, headHeight);

            canvasContext.font = "bold 36px Arial";
            canvasContext.fillStyle = "#993300";
            canvasContext.textAlign = "left";
            canvasContext.fillText(DataCenter.instance.userData?.nickname || "", width * 0.1 + headWidth + 10, height * 0.8 + 10);
            canvasContext.fillText(`${DataCenter.instance.userid || 0}`, width * 0.1 + headWidth + 10, height * 0.8 + 50);
            MiniGameUtils.instance
                .makeCanvasImage({ filename: "invite" })
                .then((res: string) => {
                    Logger.log(res);
                    resolve(res);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    }

    /**
     * 邀请好友
     */
    onBtnInvite(): void {
        this.drawInviteInfo()
            .then((res: string) => {
                MiniGameUtils.instance.shareAppMessage({
                    title: `房间号：${DataCenter.instance.shortRoomid} 点击加入 速来战`,
                    imageUrl: res,
                    query: `gameid=${10002}&roomid=${DataCenter.instance.shortRoomid}`,
                });
            })
            .catch((err: any) => {
                Logger.log(err);
            });
    }

    /**
     * 聊天
     */
    onBtnTalk(): void {
        TalkView.showView();
    }

    /**
     * 获取地图组件
     * @returns 地图组件
     */
    getCompMap(): CompMap {
        return this.UI_COMP_MAP as CompMap;
    }

    /**
     * 显示道具面板
     */
    showPropPanel(b: boolean): void {
        this.UI_COMP_PROP.visible = b;
    }

    /**
     * 重开按钮处理
     */
    onBtnRestart(): void {
        if (GameData.instance.isLocalGame) {
            this.sendClientReady();
        }
    }
}
fgui.UIObjectFactory.setExtension(CompGameMain.URL, CompGameMain);
