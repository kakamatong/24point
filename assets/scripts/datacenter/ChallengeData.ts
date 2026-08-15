/**
 * @file ChallengeData.ts
 * @description 闯关模式数据管理：定义闯关配置数据类型，使用单例模式管理数据存取
 * @category 数据中心
 */

import { HttpGet, Logger } from "@frameworks/utils/Utils";
import { sys } from "cc";
import { LOCAL_KEY } from "./InterfaceConfig";
import { ChallengeLevelData } from "../../types/protocol/lobby/c2s";

/**
 * @enum CHALLENGE_LEVEL_TYPE
 * @description 闯关关卡类型
 */
export enum CHALLENGE_LEVEL_TYPE {
    /** 计时规则 */
    TIMING = 1,
    /** 计分规则 */
    SCORING = 2,
}

/**
 * @enum CHALLENGE_END_TYPE
 * @description 闯关游戏结束类型
 */
export enum CHALLENGE_END_TYPE {
    /** 闯关失败 */
    FAIL = 0,
    /** 闯关成功 */
    SUCCESS = 1,
}

/**
 * @interface CHALLENGE_CHAPTER
 * @description 闯关章节配置
 */
export interface CHALLENGE_CHAPTER {
    /** 章节索引 */
    index: number;
    /** 章节名称 */
    name: string;
    /** 配置文件路径 */
    path: string;
    /** 配置版本 */
    ver: string;
}

/**
 * @interface CHALLENGE_CONFIG
 * @description 闯关模式整体配置
 */
export interface CHALLENGE_CONFIG {
    /** 资源域名 */
    doMain: string;
    /** 章节列表 */
    chapter: CHALLENGE_CHAPTER[];
}

/**
 * @interface MAP_LEVEL_CONFIG
 * @description 关卡地图关卡配置（单个关卡）
 */
export interface MAP_LEVEL_CONFIG {
    /** 章节索引 */
    chapter: number;
    /** 关卡索引 */
    index: number;
    /** 地图二维数组 0=边界 1=可放置 */
    map: number[][];
    /** 图标种类数 */
    iconTypes: number;
    /** 总时间(秒) */
    totalTime: number;
    /** 结束倒计时(秒)，可选 */
    endTime?: number;
    /** boss 关卡标识 */
    boss: number;
    /** 关卡类型 1是计时规则，2是计分规则 */
    type: number;
    /** 获取星星限制时间(秒)，计时规则使用，可选 */
    starTime?: number[];
    /** 获取星星限制分数，计分规则使用，可选 */
    starScore?: number[];
    /** 目标分数（计分规则过关门槛，可选，缺省按 0 分门槛处理） */
    targetScore?: number;
    /** 体力消耗 */
    energy?: number;
    /** 消除后方块移动方向（0=关闭 2=向上 3=向下 4=向左 5=向右，可选，缺省关闭） */
    shiftDir?: number;
    /** 消除后方块移动的最边边位置（可选，缺省 2） */
    shiftEdge?: number;
}

/**
 * @interface CHAPTER_CACHE_DATA
 * @description 章节本地缓存数据结构
 */
interface CHAPTER_CACHE_DATA {
    /** 配置版本 */
    ver: string;
    /** 关卡配置数组 */
    data: MAP_LEVEL_CONFIG[];
}

/**
 * @class ChallengeData
 * @description 闯关数据管理单例，负责闯关模式配置数据的存取
 * @category 数据中心
 * @singleton 单例模式
 */
export class ChallengeData {
    /**
     * @property {CHALLENGE_CONFIG | null} _config - 闯关模式配置数据
     * @private
     */
    private _config: CHALLENGE_CONFIG | null = null;

    /**
     * @property {Map<number, MAP_LEVEL_CONFIG[]>} _chapterMaps - 章节关卡地图缓存
     * @private
     */
    private _chapterMaps: Map<number, MAP_LEVEL_CONFIG[]> = new Map();

    /**
     * @property {Map<number, ChallengeLevelData[]>} _chapterLevelData - 章节玩家关卡数据缓存
     * @private
     */
    private _chapterLevelData: Map<number, ChallengeLevelData[]> = new Map();

    /**
     * @property {number} _curChapter - 当前对战的章节ID
     * @private
     */
    private _curChapter: number = 0;

    /**
     * @property {number} _curLevel - 当前对战的关卡ID
     * @private
     */
    private _curLevel: number = 0;

    /**
     * @property {number} _selectedChapter - 当前选中的章节ID（玩家在UI中选中但未必是对战中的关卡）
     * @private
     */
    private _selectedChapter: number = 0;

    /**
     * @property {number} _selectedLevel - 当前选中的关卡ID（玩家在UI中选中但未必是对战中的关卡）
     * @private
     */
    private _selectedLevel: number = 0;

    /**
     * @property {number} _pendingDirectChapter - 待直接挑战的章节索引（从结算页点击"下一关"/"重新挑战"后设置，-1 表示无）
     * @private
     */
    private _pendingDirectChapter: number = -1;

    /**
     * @property {number} _pendingDirectLevel - 待直接挑战的关卡索引（-1 表示无）
     * @private
     */
    private _pendingDirectLevel: number = -1;

    /**
     * @property {ChallengeData} _instance - 单例实例
     * @private
     * @static
     */
    private static _instance: ChallengeData;

    /**
     * @method instance
     * @description 获取ChallengeData的单例实例
     * @static
     * @returns {ChallengeData} ChallengeData单例实例
     */
    public static get instance(): ChallengeData {
        if (!this._instance) {
            this._instance = new ChallengeData();
        }
        return this._instance;
    }

    /**
     * @constructor
     * @description 私有构造函数
     * @private
     */
    private constructor() {}

    /**
     * @method config
     * @description 设置闯关模式配置
     * @param {CHALLENGE_CONFIG | null} data - 配置数据
     */
    set config(data: CHALLENGE_CONFIG | null) {
        this._config = data;
    }

    /**
     * @method config
     * @description 获取闯关模式配置
     * @returns {CHALLENGE_CONFIG | null} 配置数据
     */
    get config(): CHALLENGE_CONFIG | null {
        return this._config;
    }

    /**
     * @method chapterCount
     * @description 获取章节数量
     * @returns {number} 章节数量
     */
    get chapterCount(): number {
        return this._config?.chapter.length ?? 0;
    }

    /**
     * @property {number} curChapter - 当前对战的章节ID
     */
    get curChapter(): number {
        return this._curChapter;
    }
    set curChapter(v: number) {
        this._curChapter = v;
    }

    /**
     * @property {number} curLevel - 当前对战的关卡ID
     */
    get curLevel(): number {
        return this._curLevel;
    }
    set curLevel(v: number) {
        this._curLevel = v;
    }

    /**
     * @property {number} selectedChapter - 当前选中的章节ID（玩家在UI中选中但未必是对战中的关卡）
     */
    get selectedChapter(): number {
        return this._selectedChapter;
    }
    set selectedChapter(v: number) {
        this._selectedChapter = v;
    }

    /**
     * @property {number} selectedLevel - 当前选中的关卡ID（玩家在UI中选中但未必是对战中的关卡）
     */
    get selectedLevel(): number {
        return this._selectedLevel;
    }
    set selectedLevel(v: number) {
        this._selectedLevel = v;
    }

    /**
     * @property {number} pendingDirectChapter - 待直接挑战的章节索引（-1 表示无）
     */
    get pendingDirectChapter(): number {
        return this._pendingDirectChapter;
    }
    set pendingDirectChapter(v: number) {
        this._pendingDirectChapter = v;
    }

    /**
     * @property {number} pendingDirectLevel - 待直接挑战的关卡索引（-1 表示无）
     */
    get pendingDirectLevel(): number {
        return this._pendingDirectLevel;
    }
    set pendingDirectLevel(v: number) {
        this._pendingDirectLevel = v;
    }

    /**
     * @method setChapterLevelData
     * @description 设置指定章节的玩家关卡数据
     * @param {number} chapter - 章节索引
     * @param {ChallengeLevelData[]} data - 关卡数据数组
     */
    setChapterLevelData(chapter: number, data: ChallengeLevelData[]): void {
        this._chapterLevelData.set(chapter, data);
    }

    /**
     * @method getChapterData
     * @description 获取指定章节的玩家关卡数据
     * @param {number} chapter - 章节索引
     * @returns {ChallengeLevelData[] | undefined} 关卡数据数组
     */
    getChapterData(chapter: number): ChallengeLevelData[] | undefined {
        return this._chapterLevelData.get(chapter);
    }

    /**
     * @method getLevelData
     * @description 获取指定章节和关卡的玩家关卡数据
     * @param {number} chapter - 章节索引
     * @param {number} level - 关卡索引
     * @returns {ChallengeLevelData | undefined} 关卡数据对象
     */
    getLevelData(chapter: number, level: number): ChallengeLevelData | undefined {
        const list = this._chapterLevelData.get(chapter);
        if (!list) return undefined;
        return list.find((i) => i.level === level);
    }

    /**
     * @method getSelectedLevelConfig
     * @description 获取当前选中关卡的配置数据
     * @returns {MAP_LEVEL_CONFIG | undefined} 关卡配置对象
     */
    getSelectedLevelConfig(): MAP_LEVEL_CONFIG | undefined {
        const maps = this._chapterMaps.get(this._selectedChapter);
        if (!maps) return undefined;
        return maps.find((m) => m.index === this._selectedLevel);
    }

    /**
     * @method getNextLevel
     * @description 计算指定关卡的下一个关卡（用于上传进度时告知服务端下一关位置）
     * @param {number} chapter - 当前章节索引
     * @param {number} level - 当前关卡索引
     * @returns {{ chapter: number; level: number }} 下一关的章节和关卡索引
     */
    getNextLevel(chapter: number, level: number): { chapter: number; level: number } {
        const maps = this._chapterMaps.get(chapter);
        const nextLevel = level + 1;
        const nextLevelConfig = maps?.find((m) => m.index === nextLevel);
        if (nextLevelConfig) {
            return { chapter, level: nextLevel };
        } else {
            return { chapter: chapter + 1, level: nextLevel };
        }
    }

    /**
     * @method updateSingleLevelData
     * @description 更新单个关卡数据（本地缓存），通关后更新分数、星级和挑战次数
     * @param {number} chapter - 章节索引
     * @param {number} level - 关卡索引
     * @param {number} score - 本次分数
     * @param {number} stars - 本次星级
     */
    updateSingleLevelData(chapter: number, level: number, score: number, stars: number): void {
        let list = this._chapterLevelData.get(chapter);
        if (!list) {
            list = [];
            this._chapterLevelData.set(chapter, list);
        }
        const item = list.find((i) => i.level === level);
        if (item) {
            if (score > item.scoreMax) item.scoreMax = score;
            if (stars > item.stars) item.stars = stars;
            item.isGet = 1;
            item.challengeCount++;
        } else {
            list.push({
                chapter,
                level,
                isGet: 1,
                stars,
                scoreMax: score,
                challengeCount: 1,
            });
        }
    }

    /**
     * @method loadChapterConfig
     * @description 加载指定章节的关卡地图配置，优先使用 localStorage 缓存，通过版本判断是否需要更新
     * @param {number} chapterIndex - 章节索引
     * @returns {Promise<MAP_LEVEL_CONFIG[]>} 关卡配置数组
     */
    async loadChapterConfig(chapterIndex: number): Promise<MAP_LEVEL_CONFIG[]> {
        // ① 内存缓存命中
        const memCached = this._chapterMaps.get(chapterIndex);
        if (memCached) {
            return memCached;
        }

        if (!this._config) {
            throw new Error("闯关配置尚未加载，请先调用 Challenge.instance.getConfig()");
        }

        const chapter = this._config.chapter.find((c) => c.index === chapterIndex);
        if (!chapter) {
            throw new Error(`章节 ${chapterIndex} 不存在`);
        }

        // ② 查 localStorage 缓存，通过版本判断是否需要更新
        const storageKey = LOCAL_KEY.CHALLENGE_CHAPTER_PREFIX + chapterIndex;
        try {
            const raw = sys.localStorage.getItem(storageKey);
            if (raw) {
                const cachedData: CHAPTER_CACHE_DATA = JSON.parse(raw);
                if (cachedData.ver && cachedData.ver === chapter.ver) {
                    Logger.log(`章节 ${chapterIndex} 使用本地缓存，版本匹配: ${chapter.ver}`);
                    this._chapterMaps.set(chapterIndex, cachedData.data);
                    return cachedData.data;
                }
                Logger.log(`章节 ${chapterIndex} 版本已更新: ${cachedData.ver} → ${chapter.ver}`);
            }
        } catch (e) {
            Logger.warn(`读取章节 ${chapterIndex} 本地缓存失败: ${e}`);
        }

        // ③ 重新下载
        const url = this._config.doMain + chapter.path;
        Logger.log(`下载章节 ${chapterIndex} 地图配置: ${url}`);
        const data = await HttpGet(url);

        // ④ 同时写入内存缓存和 localStorage
        this._chapterMaps.set(chapterIndex, data);
        try {
            const cacheData: CHAPTER_CACHE_DATA = { ver: chapter.ver, data };
            sys.localStorage.setItem(storageKey, JSON.stringify(cacheData));
        } catch (e) {
            Logger.warn(`保存章节 ${chapterIndex} 缓存失败: ${e}`);
        }

        return data as MAP_LEVEL_CONFIG[];
    }
}
