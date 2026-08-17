/**
 * @file TalkConfig.ts
 * @description 聊天配置：定义游戏中的快捷聊天内容
 * @category 游戏 10002
 */

/**
 * @enum FORWARD_MESSAGE_TYPE
 * @description 消息转发类型
 */
export enum FORWARD_MESSAGE_TYPE {
    TALK = 1, // 快捷聊天
}

/**
 * @description 聊天列表配置
 * @property {number} id 聊天内容 ID
 * @property {string} msg 聊天内容
 */
export const TALK_LIST = [
    { id: 1, msg: "准备！准备！" },
    { id: 2, msg: "加油！" },
    { id: 3, msg: "真慢~~" },
    { id: 4, msg: "真墨迹！" },
    { id: 5, msg: "我闭着眼睛都比你快。" },
    { id: 6, msg: "这把让你了。" },
];
