/**
 * @file SubmitAnswer.ts
 * @description 算24点(10003)提交算式协议封装：发送前本地预校验，通过后上抛服务器判定
 * @category 游戏 10003
 */

import { GameSocketManager } from "@frameworks/GameSocketManager";
import { Logger } from "@frameworks/utils/Utils";
import { SprotoSubmitAnswer } from "../../../../types/protocol/game10003/c2s";
import { validate } from "../logic/Expression";

/**
 * @interface SUBMIT_RESULT
 * @description 提交算式结果回调数据
 */
export interface SUBMIT_RESULT {
    /** 1:正确, 0:错误 */
    code: number;
    /** 错误信息 */
    msg: string;
    /** 排名（答对时才有） */
    rank: number;
    /** 是否由本地预校验直接判定（false 表示服务器判定） */
    localValid: boolean;
}

/**
 * @method submitAnswer
 * @description 提交算式：先用本地算法预校验（需传入本局发牌数字），通过后上抛服务器判定
 * @param {string} expression - 玩家拼出的算式
 * @param {number[]} numbers - 本局发牌数字
 * @param {(result: SUBMIT_RESULT) => void} callBack - 结果回调
 */
export function submitAnswer(expression: string, numbers: number[], callBack?: (result: SUBMIT_RESULT) => void): void {
    // 本地预校验：错误直接回调，不浪费网络往返
    const checked = validate(expression, numbers);
    if (!checked.ok) {
        Logger.log("本地校验未通过:", checked.msg);
        callBack && callBack({ code: 0, msg: checked.msg || "表达式错误", rank: 0, localValid: true });
        return;
    }

    // 上抛服务器判定
    GameSocketManager.instance.sendToServer(SprotoSubmitAnswer, { expression }, (response: any) => {
        if (response && response.code === 1) {
            callBack && callBack({ code: 1, msg: response.msg || "", rank: response.rank || 0, localValid: false });
        } else {
            Logger.error("提交算式失败:", response?.msg || "服务器返回错误");
            callBack && callBack({ code: 0, msg: response?.msg || "提交失败", rank: 0, localValid: false });
        }
    });
}
