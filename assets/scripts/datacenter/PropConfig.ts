import { RICH_TYPE } from "./InterfaceConfig";

/**
 * @typedef PropData
 * @description 道具数据类型
 * @property {number} id 道具 ID
 * @property {string} name 道具名称
 * @property {string} desc 道具描述
 * @property {string} [icon] 道具图标
 */
// 道具类型
export type PropData = {
    id: number;
    name: string;
    desc: string;
    icon?: string;
};

export const PROP_CONFIG: Record<RICH_TYPE, PropData> = {
    [RICH_TYPE.UPSET]: {
        id: RICH_TYPE.UPSET,
        name: "打乱地图",
        desc: "打乱地图",
    },
    [RICH_TYPE.AUTO_REMOVE]: {
        id: RICH_TYPE.AUTO_REMOVE,
        name: "自动消除",
        desc: "自动消除一对方块",
    },
    [RICH_TYPE.NONE]: {
        id: RICH_TYPE.NONE,
        name: "",
        desc: "",
        icon: "",
    },
    [RICH_TYPE.GOLD_COIN]: {
        id: RICH_TYPE.GOLD_COIN,
        name: "",
        desc: "",
        icon: "",
    },
    [RICH_TYPE.SILVER_COIN]: {
        id: RICH_TYPE.SILVER_COIN,
        name: "",
        desc: "",
        icon: "",
    },
    [RICH_TYPE.COMBAT_POWER]: {
        id: RICH_TYPE.COMBAT_POWER,
        name: "",
        desc: "",
        icon: "",
    },
};
