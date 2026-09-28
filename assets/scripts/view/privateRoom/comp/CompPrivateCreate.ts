/**
 * @file CompPrivateCreate.ts
 * @description 创建私密房间组件：处理私密房间的创建
 * @category 私密房间视图
 */

import FGUICompPrivateCreate from "@fgui/privateRoom/FGUICompPrivateCreate";
import * as fgui from "fairygui-cc";
import { LobbySocketManager } from "@frameworks/LobbySocketManager";
import { PopMessageView } from "../../common/PopMessageView";
import { ENUM_POP_MESSAGE_TYPE, LOCAL_KEY, MAIN_GAME_ID } from "@datacenter/InterfaceConfig";
import { TipsView } from "../../common/TipsView";
import { sys } from "cc";
import { ConnectGameSvr } from "@modules/ConnectGameSvr";
import { ViewClass } from "@frameworks/Framework";
import { SprotoCreatePrivateRoom } from "../../../../types/protocol/lobby/c2s";

/**
 * @class CompPrivateCreate
 * @description 创建私密房间组件，处理私密房间的创建
 * @category 私密房间视图
 */
@ViewClass()
export class CompPrivateCreate extends FGUICompPrivateCreate {
    /** 视图数据 */
    private _data: any | null = null;

    /**
     * @description 显示创建私密房间界面
     * @param data 视图数据
     */
    show(data?: any) {
        this._data = data;
        const strRule = sys.localStorage.getItem(LOCAL_KEY.PRIVATE_RULE);
        if (strRule && strRule !== "") {
            this.initUI(JSON.parse(strRule));
        }
    }

    /**
     * @description 初始化UI
     * @param rule 房间规则
     */
    initUI(rule: any): void {
        this.ctrl_nums.selectedPage = `${rule.playNum}`;
        this.ctrl_playMode.selectedPage = `${Number(rule.playMode) === 1 ? 1 : 0}`;
        // 难度：0随机/1简单/2中等/3困难，缺省或不合法按“随机”处理
        const difficulty = Number(rule.difficulty);
        const ctrlDifficulty = this.ctrl_difficulty;
        if (ctrlDifficulty) {
            ctrlDifficulty.selectedPage = `${Number.isInteger(difficulty) && difficulty >= 0 && difficulty <= 3 ? difficulty : 0}`;
        }
        // 玩法切换控制器 ctrl_playMode（页面 0普通/1竞速，FGUI 用户制作）：存在则回显、不存在回退默认
        const ctrlPlayMode = this.ctrl_playMode;
        if (ctrlPlayMode && typeof ctrlPlayMode === "object") {
            ctrlPlayMode.selectedPage = `${Number(rule.playMode) === 1 ? 1 : 0}`;
        }
        // 竞速题数控制器 ctrl_raceQuestionCount（页面 5/10，FGUI 用户制作）：存在则回显、不存在回退默认
        const ctrlRaceCount = this.ctrl_raceQuestionCount;
        if (ctrlRaceCount && typeof ctrlRaceCount === "object") {
            const cnt = Number(rule.raceQuestionCount);
            ctrlRaceCount.selectedPage = `${cnt === 5 ? 5 : 10}`;
        }
    }

    /**
     * @description 关闭按钮点击事件
     */
    onBtnClose(): void {
        CompPrivateCreate.hideView();
    }

    /**
     * @description 创建房间按钮点击事件
     */
    onBtnCreate(): void {
        // 玩法模式：ctrl_playMode 页面 0普通/1竞速（key 与服务端 privateRule.playMode 完全一致）
        const ctrlPlayMode = this.ctrl_playMode;
        const playMode = ctrlPlayMode && typeof ctrlPlayMode === "object" ? (Number(ctrlPlayMode.selectedPage) === 1 ? 1 : 0) : 0;
        // 竞速题数：ctrl_raceQuestionCount 页面 5/10（key 与服务端 privateRule.raceQuestionCount 完全一致），
        // 非法/未就绪回退默认 10（与服务端 config.RACE.DEFAULT_QUESTION_COUNT 一致）
        const ctrlRaceCount = this.ctrl_raceQuestionCount;
        let raceQuestionCount = ctrlRaceCount && typeof ctrlRaceCount === "object" ? Number(ctrlRaceCount.selectedPage) : 0;
        if (raceQuestionCount !== 5 && raceQuestionCount !== 10) {
            raceQuestionCount = 10;
        }
        const gameRule = {
            playNum: Number(this.ctrl_nums.selectedPage),
            // 出题难度：0随机/1简单/2中等/3困难（服务端按此走对应出题逻辑）
            difficulty: Number(this.ctrl_difficulty?.selectedPage ?? 0),
            // 玩法模式：0普通/1竞速
            playMode: playMode,
            // 竞速题数：5/10（仅 playMode=1 生效）
            raceQuestionCount: raceQuestionCount,
        };
        const func = (result: any) => {
            if (result && result.code == 1) {
                ConnectGameSvr.instance.connectGame(result, (b: boolean) => {
                    if (b) {
                        this._data && this._data.changeToGameScene && this._data.changeToGameScene();
                    }
                });
            } else if (result && result.code == 0 && result.gameid > 0) {
                PopMessageView.showView({
                    content: "您已在游戏中,是否返回",
                    type: ENUM_POP_MESSAGE_TYPE.NUM2,
                    sureBack: () => {
                        ConnectGameSvr.instance.connectGame(result, (b: boolean) => {
                            if (b) {
                                this._data && this._data.changeToGameScene && this._data.changeToGameScene();
                            }
                        });
                    },
                });
            } else {
                const msg = result && result.msg ? result.msg : "未知错误";
                TipsView.showView({ content: msg });
            }
        };

        const strRule = JSON.stringify(gameRule);
        sys.localStorage.setItem(LOCAL_KEY.PRIVATE_RULE, strRule);
        const reqData = { gameid: MAIN_GAME_ID, rule: strRule };
        LobbySocketManager.instance.sendToServer(SprotoCreatePrivateRoom, reqData, func);
    }
}
fgui.UIObjectFactory.setExtension(CompPrivateCreate.URL, CompPrivateCreate);
