/**
 * @file CompGameMain.ts
 * @description 算24点(10003)游戏主界面组件：游戏区域容器（含操作面板/解散投票等子组件），当前仅组件框架，业务逻辑后续补充
 * @category 游戏 10003
 */

import FGUICompGameMain from "@fgui/game10003/FGUICompGameMain";
import * as fgui from "fairygui-cc";
import { AddEventListener, ChangeScene, LogColors, RemoveEventListener, ViewClass } from "@frameworks/Framework";
import { GameData } from "@game10003/data/GameData";
import { DataCenter } from "@datacenter/Datacenter";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import { LocalSvr } from "@localGame/LocalSvr";
import {
    SprotoAnswerResult,
    SprotoForwardMessage,
    SprotoGameClock,
    SprotoGameEnd,
    SprotoGameRecord,
    SprotoGameStart,
    SprotoPlayerEnter,
    SprotoPlayerInfos,
    SprotoPlayerLeave,
    SprotoPlayerStatusUpdate,
    SprotoPrivateInfo,
    SprotoRoomEnd,
    SprotoRoomInfo,
    SprotoStepId,
    SprotoTotalResult,
} from "../../../../../../types/protocol/game10003/s2c";
import { FW_EVENT_NAMES } from "@frameworks/config/Config";
import { LobbySocketManager } from "@frameworks/LobbySocketManager";
import { SprotoGameRoomReady } from "../../../../../../types/protocol/lobby/s2c";
import { Logger } from "@frameworks/utils/Utils";
import { MatchView } from "@view/match/MatchView";
import { AuthGame } from "@modules/AuthGame";
import { SprotoClientReady, SprotoGameReady, SprotoLeaveRoom } from "../../../../../../types/protocol/game10003/c2s";
import { PopMessageView } from "@view/common/PopMessageView";
import { ENUM_POP_MESSAGE_TYPE } from "@datacenter/InterfaceConfig";
import { CompPlayers } from "./CompPlayers";
import { CompPlayerHead } from "./CompPlayerHead";
import { CompTimeLeft } from "./CompTimeLeft";
import { FORWARD_MESSAGE_TYPE, GAME_PLAYER_INFO, PLAYER_STATUS, ROOM_END_FLAG, ROOM_TYPE } from "@game10003/data/InterfaceGameConfig";
import { SoundManager } from "@frameworks/SoundManager";
import FGUICompMedal from "@fgui/gameCommon/FGUICompMedal";
import { UserStatus } from "@modules/UserStatus";
import { TALK_LIST } from "@game10003/view/talk/TalkConfig";
import { ResultView } from "@game10003/view/result/ResultView";
import { CompFireFlower } from "@game10003/view/game/comp/CompFireFlower";

/**
 * @class CompGameMain
 * @description 算24点游戏主界面组件业务子类：继承 FGUICompGameMain，框架初始化后挂载子组件，业务逻辑待补充
 * @category 游戏 10003
 */
@ViewClass()
export class CompGameMain extends FGUICompGameMain {
    public UI_COMP_SELF_MEDAL: FGUICompMedal;
    public UI_COMP_SELFPLAYER: CompPlayerHead;
    public UI_COMP_LHT_LEFT: CompFireFlower;
    public UI_COMP_LHT_RIGHT: CompFireFlower;
    /**
     * @property {(() => void) | null} _pendingResultShow - 单机延迟弹出结算的待执行回调
     * @private
     */
    private _pendingResultShow: (() => void) | null = null;
    /**
     * @description 组件构造：调用基类初始化 UI_COMP_CTRL 等子组件引用
     */
    onConstruct() {
        super.onConstruct();
        this.init();
        this.initListeners();

        // 客户端进入完成
        if (GameData.instance.isPrivateRoom) {
            this.ctrl_roomtype.selectedIndex = ROOM_TYPE.PRIVATE;
        } else if (GameData.instance.isLocalGame) {
            this.ctrl_roomtype.selectedIndex = ROOM_TYPE.LOCAL;
        }

        // 倒计时初始隐藏，收到 gameClock 后才显示
        this.showClock(false);

        // 延迟发送客户端进入完成
        this.scheduleOnce(() => {
            this.sendClientReady();
        }, 0);
    }

    /**
     * @description 组件销毁：调用基类清理
     */
    protected onDestroy(): void {
        super.onDestroy();
        this.cancelPendingResultShow();
        ResultView.hideView();
        this.removeListeners();
        if (GameData.instance.isLocalGame) {
            LocalSvr.instance.destroy();
        }
        if (GameSocketManager.instance.isOpen()) {
            GameSocketManager.instance.close();
        }
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
            GameData.instance.isLocalGame = true;
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
        GameSocketManager.instance.addServerListen(SprotoAnswerResult, this.onSvrAnswerResult.bind(this));
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

        LobbySocketManager.instance.addServerListen(SprotoGameRoomReady, this.onSvrGameRoomReady.bind(this));
        AddEventListener(FW_EVENT_NAMES.GAME_SOCKET_DISCONNECT, this.onGameSocketDisconnect, this);
    }

    /**
     * 移除所有服务器消息监听器
     */
    removeListeners(): void {
        GameSocketManager.instance.removeServerListen(SprotoRoomInfo);
        GameSocketManager.instance.removeServerListen(SprotoRoomEnd);
        GameSocketManager.instance.removeServerListen(SprotoPlayerInfos);
        GameSocketManager.instance.removeServerListen(SprotoGameStart);
        GameSocketManager.instance.removeServerListen(SprotoAnswerResult);
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

        LobbySocketManager.instance.removeServerListen(SprotoGameRoomReady);
        RemoveEventListener(FW_EVENT_NAMES.GAME_SOCKET_DISCONNECT, this.onGameSocketDisconnect);
    }

    /**
     * 发送客户端准备完成消息
     */
    sendClientReady() {
        GameSocketManager.instance.sendToServer(SprotoClientReady, {});
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
     * 切换到大厅场景
     */
    changeToLobbyScene(): void {
        this.cancelPendingResultShow();
        ResultView.hideView();
        // 单机模式：清理本地服务器
        if (GameData.instance.isLocalGame) {
            LocalSvr.instance.destroy();
        }
        if (GameSocketManager.instance.isOpen()) {
            GameSocketManager.instance.close();
        }
        ChangeScene("LobbyScene");
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

        this.checkShowStartGameBtn();
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
     * 显示开始游戏按钮
     * @param bshow 是否显示
     */
    showStartGameBtn(bshow: boolean): void {
        this.UI_BTN_START_GAME.visible = bshow;
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
     * 显示邀请按钮
     * @param bshow 是否显示
     */
    showInviteBtn(bshow: boolean): void {
        this.UI_BTN_INVITE.visible = bshow;
        //this.UI_BTN_INVITE.visible = false;
    }

    /**
     * 隐藏自己头像
     */
    hideSelfPlayer(): void {
        const selfPlayer = this.UI_COMP_SELFPLAYER;
        if (selfPlayer) {
            selfPlayer.hide();
        }
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
     * 根据座位显示玩家信息（仅用于自己）
     * @param svrSeat 服务器座位号
     */
    showPlayerInfoBySeat(svrSeat: number): void {
        if (svrSeat !== GameData.instance.getSelfSeat()) {
            Logger.warn("showPlayerInfoBySeat 仅用于自己，其他玩家请使用 CompPlayers");
            return;
        }
        const selfPlayer = this.UI_COMP_SELFPLAYER;
        if (!selfPlayer) return;

        const player = GameData.instance.getPlayerBySeat(svrSeat);
        if (!player) return;

        const headurl = GameData.instance.getHeadurl(svrSeat);
        selfPlayer.updatePlayerInfo(player, true, headurl);
    }

    /**
     * 游戏开始处理
     * @param data 游戏开始数据
     */
    onSvrGameStart(data: any): void {
        GameData.instance.gameStart = true;
        // 新一局开始时取消延迟结算、关闭上一局结算弹窗，并停止可能仍在播放的礼花
        this.cancelPendingResultShow();
        ResultView.hideView();
        this.UI_COMP_LHT_LEFT?.stop();
        this.UI_COMP_LHT_RIGHT?.stop();

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

            // 播放开局动画音效
            //SoundManager.instance.playSoundEffect("game10002/readygo");

            // 第几回合
            this.clear();
        } else {
        }

        for (let index = 0; index < GameData.instance.maxPlayer; index++) {
            this.showSignReady(index + 1, false);
        }
    }

    /**
     * 清除游戏状态
     */
    clear(): void {
        // 清理自己的奖牌
        if (this.UI_COMP_SELF_MEDAL) {
            this.UI_COMP_SELF_MEDAL.ctrl_rank.selectedIndex = 0;
        }
    }

    /**
     * 显示准备标识
     * @param svrSeat 服务器座位号
     * @param bshow 是否显示
     */
    showSignReady(svrSeat: number, bshow: boolean): void {
        if (svrSeat === GameData.instance.getSelfSeat()) {
            // 自己，使用 UI_COMP_SELFPLAYER
            const selfPlayer = this.UI_COMP_SELFPLAYER;
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
     * 游戏结束处理
     * @param data 游戏结束数据
     */
    onSvrGameEnd(data: SprotoGameEnd.Request): void {
        GameData.instance.gameStart = false;
        // 本局结束：停止并隐藏倒计时
        this.showClock(false);

        // 先刷新本局名次/完成状态，再展示结算弹窗
        this.updateRoundRank(data);
        const showResult = () => {
            this._pendingResultShow = null;
            ResultView.showView({
                ...data,
                continueFunc: () => this.onRoundResultContinue(),
                backFunc: () => this.onBtnBack(),
                resultEffectFunc: (resultFlag: number) => this.playRoundResultSound(resultFlag),
            });
        };

        if (GameData.instance.isLocalGame) {
            // 单机模式延迟 1 秒弹出，让答对礼花/提示先完整展示
            this._pendingResultShow = showResult;
            this.scheduleOnce(showResult, 1);
        } else {
            showResult();
        }

        UserStatus.instance.req();
    }

    /**
     * @method cancelPendingResultShow
     * @description 取消单机延迟弹出结算的待执行回调（新一局/退出场景/销毁时调用）
     * @private
     */
    private cancelPendingResultShow(): void {
        if (!this._pendingResultShow) {
            return;
        }
        this.unschedule(this._pendingResultShow);
        this._pendingResultShow = null;
    }

    /**
     * @method updateRoundRank
     * @description 根据 gameEnd.rankings 更新自己和其他玩家的名次/完成状态
     * @param {SprotoGameEnd.Request} data - 本局结算数据
     * @private
     */
    private updateRoundRank(data: SprotoGameEnd.Request): void {
        const rankings = data?.rankings ?? [];
        const selfSeat = GameData.instance.getSelfSeat();
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;

        for (const ranking of rankings) {
            const seat = ranking.seat;
            const rank = ranking.rank ?? 0;
            const usedTime = ranking.usedTime ?? -1;
            if (seat === selfSeat) {
                if (this.UI_COMP_SELF_MEDAL) {
                    this.UI_COMP_SELF_MEDAL.ctrl_rank.selectedIndex = Math.max(0, Math.min(6, rank));
                }
                continue;
            }

            compPlayers?.setOtherPlayerRank(seat, rank);
            if (usedTime >= 0) {
                compPlayers?.setOtherPlayerComplete(seat, true);
            } else {
                compPlayers?.setOtherPlayerIncomplete(seat);
            }
        }
    }

    /**
     * @method playRoundResultSound
     * @description 根据结算胜负标记播放胜负音效：胜利 win、失败 lose，平局不播放
     * @param {number} resultFlag - 0失败 1胜利 2平局
     * @private
     */
    private playRoundResultSound(resultFlag: number): void {
        if (resultFlag === 1) {
            SoundManager.instance.playSoundEffect("game10003/win");
        } else if (resultFlag === 0) {
            SoundManager.instance.playSoundEffect("game10003/lose");
        }
    }

    /**
     * @method playAnswerCorrectEffect
     * @description 自己答对并得到服务器确认后播放左右礼花（礼花只在算出24点时播放，结算不再播放）
     * @private
     */
    private playAnswerCorrectEffect(): void {
        this.UI_COMP_LHT_LEFT?.stop();
        this.UI_COMP_LHT_RIGHT?.stop();
        this.UI_COMP_LHT_LEFT?.play();
        this.UI_COMP_LHT_RIGHT?.play();
    }

    /**
     * @method onSvrAnswerResult
     * @description 提交结果广播处理：自己答对播放礼花；他人答对即时刷新其完成标识与名次
     *              断线重连时服务端会按同一协议补发已完成玩家的 answerResult，因此重连玩家也据此恢复
     * @param {SprotoAnswerResult.Request} data - 提交结果数据
     * @private
     */
    private onSvrAnswerResult(data: SprotoAnswerResult.Request): void {
        // 仅处理答对广播；错误提交(correct=0)与结算(gameEnd)都不在此刷新完成状态
        if (data?.correct !== 1) {
            return;
        }

        // 自己答对：播放礼花（完成标识/名次由结算或自身逻辑处理）
        if (data.seat === GameData.instance.getSelfSeat()) {
            this.playAnswerCorrectEffect();
            return;
        }

        // 其他玩家答对：立即显示其"已经完成"标识与名次，无需等本局结算
        const compPlayers = this.UI_COMP_PLAYERS as CompPlayers;
        if (!compPlayers) {
            return;
        }
        compPlayers.setOtherPlayerComplete(data.seat, true);
        compPlayers.setOtherPlayerRank(data.seat, data.rank ?? 0);
    }

    /**
     * @method onRoundResultContinue
     * @description 结算弹窗点击继续游戏：单机重新发送 clientReady 开下一局，私人房发送 gameReady 准备，匹配房由服务器自动开局
     * @private
     */
    private onRoundResultContinue(): void {
        if (GameData.instance.isLocalGame) {
            GameSocketManager.instance.sendToServer(SprotoClientReady, {});
            return;
        }
        if (!GameSocketManager.instance.isOpen()) {
            this.changeToLobbyScene();
            return;
        }
        if (GameData.instance.isPrivateRoom) {
            GameSocketManager.instance.sendToServer(SprotoGameReady, { ready: 1 });
        }
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
                    this.UI_BTN_READY.visible = true;
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
                    this.UI_BTN_READY.visible = true;
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

    /**
     * 显示或隐藏倒计时
     * @param bshow 是否显示
     * @param clock 倒计时时间（gameClock.time：剩余秒数）
     */
    showClock(bshow: boolean, clock?: number): void {
        const clockComp = this.UI_COMP_CLOCK as CompTimeLeft;
        if (!clockComp) {
            return;
        }
        if (bshow && clock && clock > 0) {
            clockComp.visible = true;
            clockComp.start(clock);
        } else {
            clockComp.stopClock();
            clockComp.visible = false;
        }
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

    /**
     * 总结果处理
     * @param data 总结果数据
     */
    onSvrTotalResult(data: SprotoTotalResult.Request) {
        const time = 0.2;
        this.scheduleOnce(() => {
            //TotalResultView.showView(data);
        }, time);
    }

    /**
     * 游戏记录处理
     * @param data 游戏记录数据
     */
    onSvrGameRecord(data: any) {
        GameData.instance.record = data;
    }

    /**
     * 服务器消息转发处理
     * @param data 转发消息数据
     */
    onSvrForwardMessage(data: SprotoForwardMessage.Request) {
        Logger.log(data);
        this.forwardMessage(data);
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
     * 步骤ID处理
     * @param data 步骤ID数据
     */
    onSvrStepId(data: SprotoStepId.Request) {
        GameData.instance.gameStep = data.step;
    }

    /**
     * 返回按钮处理
     */
    onBtnBack(): void {
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
}
fgui.UIObjectFactory.setExtension(CompGameMain.URL, CompGameMain);
