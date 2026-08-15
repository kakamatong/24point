/**
 * @file Challenge.ts
 * @description 闯关模块：拉取闯关模式配置
 * @category 网络请求模块
 */

import { DataCenter } from "@datacenter/Datacenter";
import { ChallengeData } from "@datacenter/ChallengeData";
import { LogColors } from "@frameworks/Framework";
import { HttpPostWithDefaultJWT, Logger } from "@frameworks/utils/Utils";
import { BaseModule } from "@frameworks/base/BaseModule";
import { LobbySocketManager } from "@frameworks/LobbySocketManager";
import {
    SprotoGetChallengeChapterData,
    SprotoGetCurChallengeChapterData,
    SprotoUpdateChallengeLevelData,
} from "../../types/protocol/lobby/c2s";
import { ConnectSvr } from "./ConnectSvr";

/**
 * @enum USER_ENERGY_CHANGE_TYPE
 * @description 体力变更类型
 */
export enum USER_ENERGY_CHANGE_TYPE {
    /** 测试 */
    TEST = 0,
    /** 闯关 */
    CHALLENGE = 1,
    /** 广告 */
    AD = 2,
}

/**
 * @class Challenge
 * @description 闯关管理类，负责请求闯关模式配置，使用单例模式
 * @category 网络请求模块
 * @singleton 单例模式
 */
export class Challenge extends BaseModule {
    static get instance(): Challenge {
        return this._getInstance<Challenge>(Challenge);
    }

    /**
     * @method getConfig
     * @description 获取闯关模式配置
     * @param {(success:boolean, data?:any)=>void} callBack - 回调函数，返回请求结果
     */
    getConfig(callBack: (success: boolean, data?: any) => void) {
        const url = DataCenter.instance.appConfig.webUrl + "/api/game/challengeconfig";
        if (!DataCenter.instance.appConfig.webUrl) {
            Logger.warn(LogColors.red("webUrl not configured!"));
            callBack(false);
            return;
        }

        Logger.log(LogColors.blue(`Sending POST request to: ${url}`));

        const payload = {
            "userid": DataCenter.instance.userid,
            "channelid": DataCenter.instance.channelID,
        };

        HttpPostWithDefaultJWT(url, {}, payload)
            .then((data) => {
                Logger.log(LogColors.green("challenge config request successful!"));
                if (data && data.code === 200 && data.data) {
                    ChallengeData.instance.config = data.data;
                }
                callBack(true, data);
            })
            .catch((error) => {
                Logger.warn(LogColors.red(`challenge config request failed: ${error.message}`));
                callBack(false, error);
            });
    }

    /**
     * @method getChapterData
     * @description 获取指定章节的玩家关卡数据
     * @param {number} chapter - 章节索引
     * @param {(success:boolean)=>void} callBack - 回调函数
     */
    getChapterData(chapter: number, callBack?: (success: boolean) => void) {
        this.reqLobby(SprotoGetChallengeChapterData, { chapter }, (data: SprotoGetChallengeChapterData.Response) => {
            if (data && data.list) {
                ChallengeData.instance.setChapterLevelData(data.chapter, data.list);
                Logger.log(LogColors.green(`章节 ${data.chapter} 关卡数据获取成功, 共 ${data.list.length} 关`));
                callBack && callBack(true);
            } else {
                Logger.warn(LogColors.red(`章节 ${chapter} 关卡数据获取失败`));
                callBack && callBack(false);
            }
        });
    }

    /**
     * @method getCurChapterData
     * @description 获取当前对战章节的玩家关卡数据
     * @param {(success:boolean, curChapter?:number)=>void} callBack - 回调函数，返回当前章节索引
     */
    getCurChapterData(callBack?: (success: boolean, curChapter?: number) => void) {
        this.reqLobby(SprotoGetCurChallengeChapterData, {}, (data: SprotoGetCurChallengeChapterData.Response) => {
            if (data) {
                const list = data.list || [];
                ChallengeData.instance.curChapter = data.curChapter;
                ChallengeData.instance.curLevel = data.curLevel;
                ChallengeData.instance.setChapterLevelData(data.curChapter, list);
                Logger.log(LogColors.green(`当前章节 ${data.curChapter} 关卡数据获取成功, 共 ${list.length} 关`));
                callBack && callBack(true, data.curChapter);
            } else {
                Logger.warn(LogColors.red("当前章节关卡数据获取失败"));
                callBack && callBack(false);
            }
        });
    }

    /**
     * @method updateLevelData
     * @description 更新关卡数据（上传分数和星级）。大厅连接断开时先自动重连，重连成功后再发送，重连失败则直接回调失败
     * @param {number} chapter - 章节索引
     * @param {number} level - 关卡索引
     * @param {number} score - 本次分数
     * @param {number} stars - 本次星级
     * @param {number} nextChapter - 下一章节索引
     * @param {number} nextLevel - 下一关卡索引
     * @param {(success:boolean)=>void} callBack - 回调函数
     */
    updateLevelData(
        chapter: number,
        level: number,
        score: number,
        stars: number,
        nextChapter: number,
        nextLevel: number,
        callBack?: (success: boolean) => void
    ) {
        const send = () => {
            this.reqLobby(
                SprotoUpdateChallengeLevelData,
                { chapter, level, score, stars, nextChapter, nextLevel },
                (data: SprotoUpdateChallengeLevelData.Response) => {
                    if (data && data.code === 1) {
                        ChallengeData.instance.updateSingleLevelData(chapter, level, score, stars);
                        if (chapter === ChallengeData.instance.curChapter && level === ChallengeData.instance.curLevel) {
                            ChallengeData.instance.curChapter = nextChapter;
                            ChallengeData.instance.curLevel = nextLevel;
                        }
                        Logger.log(LogColors.green(`关卡 ${chapter}-${level} 数据更新成功, 分数: ${score}, 星级: ${stars}`));
                        callBack && callBack(true);
                    } else {
                        Logger.warn(LogColors.red(`关卡 ${chapter}-${level} 数据更新失败`));
                        callBack && callBack(false);
                    }
                }
            );
        };

        if (LobbySocketManager.instance.isOpen()) {
            send();
        } else {
            // 大厅断开，先自动重连再发送
            ConnectSvr.instance.checkAutoLogin((b: boolean) => {
                if (b) {
                    send();
                } else {
                    Logger.warn(LogColors.red(`关卡 ${chapter}-${level} 数据更新失败: 大厅重连失败`));
                    callBack && callBack(false);
                }
            });
        }
    }
}
