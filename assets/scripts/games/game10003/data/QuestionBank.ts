/**
 * @file QuestionBank.ts
 * @description 24点单机题库：按难度从 OSS 拉取 1-5.json，优先读本地缓存；
 *              本地 JSON 解析失败时删除缓存并重新下载，不做 MD5 校验。
 * @category 游戏 10003
 */

import { sys } from "cc";
import { MiniGameUtils } from "@frameworks/utils/sdk/MiniGameUtils";
import { HttpGet, Logger } from "@frameworks/utils/Utils";

/** 题库 OSS 根地址 */
export const QUESTION_BANK_OSS_BASE =
    "https://qiudaoyu-miniapp.oss-cn-hangzhou.aliyuncs.com/config/game10003/question";

/** 支持的难度范围（对应 1.json ~ 5.json） */
export const QUESTION_DIFFICULTY_MIN = 1;
export const QUESTION_DIFFICULTY_MAX = 5;
export const QUESTION_DIFFICULTIES = [1, 2, 3, 4, 5];

/**
 * 本地缓存版本：OSS 上的题库内容整体替换、又不想继续命中旧缓存时，
 * 递增该值即可让客户端按新目录重新下载；无需做文件 MD5。
 */
const CACHE_VERSION = "v1";
/** 微信本地缓存目录（位于 USER_DATA_PATH 下） */
const CACHE_DIR = "game10003/question";
/** 浏览器/localStorage 缓存 key 前缀 */
const STORAGE_KEY_PREFIX = "game10003_question";

/**
 * @interface QuestionItem
 * @description 单道题库数据，字段与 OSS 上的 1.json ~ 5.json 保持一致
 */
export interface QuestionItem {
    /** 题目唯一 id */
    id: string;
    /** 四张牌的数字 */
    numbers: number[];
    /** 参考答案表达式 */
    solution?: string;
    /** 等价解数量（题库生成时统计） */
    variants?: number;
    /** 难度/技巧标签 */
    tags?: string[];
}

/**
 * @class QuestionBank
 * @description 单机题库加载器（单例）：
 *              1. 内存缓存 -> 本地文件/localStorage -> OSS 下载；
 *              2. 本地 JSON 解析失败会删除本地缓存并重新下载；
 *              3. 下载成功后先校验结构再落盘，避免把坏文件缓存下来。
 * @category 游戏 10003
 * @singleton 单例模式
 */
export class QuestionBank {
    private static _instance: QuestionBank;

    /** 已成功解析的题库，key 为难度 id */
    private readonly _cache: Map<number, QuestionItem[]> = new Map();
    /** 正在加载中的请求，避免同一难度重复下载 */
    private readonly _loading: Map<number, Promise<QuestionItem[]>> = new Map();

    /**
     * @description 获取 QuestionBank 单例实例
     * @returns QuestionBank 单例实例
     */
    public static get instance(): QuestionBank {
        if (!this._instance) {
            this._instance = new QuestionBank();
        }
        return this._instance;
    }

    private constructor() {}

    /**
     * @method load
     * @description 加载指定难度的题库。优先返回内存缓存；其次读取本地缓存；
     *              本地不存在或解析失败时从 OSS 下载并写入本地缓存。
     * @param {number} difficulty 难度 id，1~5
     * @returns {Promise<QuestionItem[]>} 题目列表
     */
    public load(difficulty: number): Promise<QuestionItem[]> {
        const id = this.normalizeDifficulty(difficulty);

        const cached = this._cache.get(id);
        if (cached) {
            return Promise.resolve(cached);
        }

        const loading = this._loading.get(id);
        if (loading) {
            return loading;
        }

        const task = this.loadInternal(id)
            .then((list) => {
                this._cache.set(id, list);
                this._loading.delete(id);
                return list;
            })
            .catch((err) => {
                this._loading.delete(id);
                throw err;
            });

        this._loading.set(id, task);
        return task;
    }

    /**
     * @method pick
     * @description 从指定难度中随机取一道题
     * @param {number} difficulty 难度 id，1~5
     * @returns {Promise<QuestionItem | null>} 随机题目，题库为空时返回 null
     */
    public async pick(difficulty: number): Promise<QuestionItem | null> {
        const list = await this.load(difficulty);
        if (list.length === 0) {
            return null;
        }
        return list[Math.floor(Math.random() * list.length)];
    }

    /**
     * @method clear
     * @description 清空指定难度的内存与本地缓存；不传难度时清空全部 1~5
     * @param {number} [difficulty] 难度 id
     */
    public clear(difficulty?: number): void {
        if (difficulty === undefined || difficulty === null) {
            for (let id = QUESTION_DIFFICULTY_MIN; id <= QUESTION_DIFFICULTY_MAX; id++) {
                this.clear(id);
            }
            return;
        }

        const id = this.normalizeDifficulty(difficulty);
        this._cache.delete(id);
        this._loading.delete(id);

        if (this.isWeChat()) {
            this.removeFile(this.localPath(id));
        } else {
            sys.localStorage.removeItem(this.storageKey(id));
        }
    }

    /**
     * @method getLocalPath
     * @description 获取某难度在微信本地文件系统中的缓存路径（排查/清理用）
     * @param {number} difficulty 难度 id
     * @returns {string} 本地缓存路径
     */
    public getLocalPath(difficulty: number): string {
        return this.localPath(this.normalizeDifficulty(difficulty));
    }

    /** 按平台读取本地或下载 */
    private loadInternal(id: number): Promise<QuestionItem[]> {
        if (this.isWeChat()) {
            return this.loadFromWeChat(id);
        }
        return this.loadFromStorage(id);
    }

    /** 微信小游戏：本地文件 -> 下载 */
    private loadFromWeChat(id: number): Promise<QuestionItem[]> {
        const path = this.localPath(id);
        const local = this.readLocalFile(path);
        if (local) {
            Logger.log("[题库] 命中本地缓存 difficulty=" + id + " path=" + path);
            return Promise.resolve(local);
        }
        return this.downloadToLocal(id, path);
    }

    /**
     * 读取并解析本地文件；文件不存在返回 null；
     * 解析失败/结构非法时删除该文件后返回 null，由调用方重新下载。
     */
    private readLocalFile(path: string): QuestionItem[] | null {
        const fs = MiniGameUtils.instance.getFileSystemManager();
        if (!fs) {
            return null;
        }
        try {
            if (!this.fileExists(path)) {
                return null;
            }
            const text = fs.readFileSync(path, "utf8") as string;
            const data = JSON.parse(text);
            if (!this.isValidList(data)) {
                throw new Error("题库结构不合法");
            }
            return data as QuestionItem[];
        } catch (err) {
            Logger.warn("[题库] 本地缓存解析失败，删除后重新下载 path=" + path, err);
            this.removeFile(path);
            return null;
        }
    }

    /** 微信小游戏：下载到临时文件，校验后写入本地缓存 */
    private downloadToLocal(id: number, path: string): Promise<QuestionItem[]> {
        const url = this.url(id);
        Logger.log("[题库] 开始下载 difficulty=" + id + " url=" + url);

        return MiniGameUtils.instance
            .downloadFile(url)
            .then((tempPath) => {
                const fs = MiniGameUtils.instance.getFileSystemManager();
                if (!fs) {
                    throw new Error("文件系统不可用");
                }

                const text = fs.readFileSync(tempPath, "utf8") as string;
                const data = JSON.parse(text);
                if (!this.isValidList(data)) {
                    throw new Error("下载的题库结构不合法");
                }

                this.ensureDir(path);
                try {
                    fs.writeFileSync(path, text, "utf8");
                    Logger.log("[题库] 下载完成并已缓存 difficulty=" + id + " path=" + path);
                } catch (err) {
                    // 写缓存失败不影响本次使用，下次会重新下载
                    Logger.warn("[题库] 写入本地缓存失败 path=" + path, err);
                }
                return data as QuestionItem[];
            })
            .catch((err) => {
                // 下载或解析失败时清掉可能残留的坏缓存
                this.removeFile(path);
                Logger.error("[题库] 下载或解析失败 difficulty=" + id, err);
                throw err;
            });
    }

    /** 浏览器/编辑器预览：localStorage -> HTTP GET */
    private loadFromStorage(id: number): Promise<QuestionItem[]> {
        const key = this.storageKey(id);
        const raw = sys.localStorage.getItem(key);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (this.isValidList(data)) {
                    Logger.log("[题库] 命中本地存储 difficulty=" + id);
                    return Promise.resolve(data as QuestionItem[]);
                }
                throw new Error("题库结构不合法");
            } catch (err) {
                Logger.warn("[题库] 本地存储解析失败，删除后重新下载 difficulty=" + id, err);
                sys.localStorage.removeItem(key);
            }
        }

        const url = this.url(id);
        Logger.log("[题库] 开始下载 difficulty=" + id + " url=" + url);
        return HttpGet(url)
            .then((data) => {
                if (!this.isValidList(data)) {
                    throw new Error("下载的题库结构不合法");
                }
                sys.localStorage.setItem(key, JSON.stringify(data));
                Logger.log("[题库] 下载完成并已写入本地存储 difficulty=" + id);
                return data as QuestionItem[];
            })
            .catch((err) => {
                sys.localStorage.removeItem(key);
                Logger.error("[题库] 下载或解析失败 difficulty=" + id, err);
                throw err;
            });
    }

    /** 校验题库数组结构，防止把坏 JSON 当成可用题库 */
    private isValidList(data: any): boolean {
        if (!Array.isArray(data) || data.length === 0) {
            return false;
        }
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (!item || typeof item.id !== "string" || item.id === "") {
                return false;
            }
            if (!Array.isArray(item.numbers) || item.numbers.length !== 4) {
                return false;
            }
            for (let j = 0; j < item.numbers.length; j++) {
                const n = item.numbers[j];
                if (typeof n !== "number" || !isFinite(n) || n % 1 !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /** 难度 id 规整：只接受 1~5 的整数 */
    private normalizeDifficulty(difficulty: number): number {
        const id = Math.floor(Number(difficulty));
        if (!isFinite(id) || id < QUESTION_DIFFICULTY_MIN || id > QUESTION_DIFFICULTY_MAX) {
            throw new Error("不支持的题库难度: " + difficulty);
        }
        return id;
    }

    private isWeChat(): boolean {
        return MiniGameUtils.instance.isWeChatGame();
    }

    private url(id: number): string {
        return QUESTION_BANK_OSS_BASE + "/" + id + ".json";
    }

    private localPath(id: number): string {
        const env = typeof wx !== "undefined" ? wx.env : null;
        const root = (env && env.USER_DATA_PATH) || "wxfile://usr";
        return root + "/" + CACHE_DIR + "/" + CACHE_VERSION + "/" + id + ".json";
    }

    private storageKey(id: number): string {
        return STORAGE_KEY_PREFIX + "_" + CACHE_VERSION + "_" + id;
    }

    private fileExists(path: string): boolean {
        const fs = MiniGameUtils.instance.getFileSystemManager();
        if (!fs) {
            return false;
        }
        try {
            fs.accessSync(path);
            return true;
        } catch (err) {
            return false;
        }
    }

    /** 创建缓存文件所在目录 */
    private ensureDir(filePath: string): void {
        const fs = MiniGameUtils.instance.getFileSystemManager();
        if (!fs) {
            return;
        }
        const index = filePath.lastIndexOf("/");
        if (index <= 0) {
            return;
        }
        const dir = filePath.substring(0, index);
        try {
            fs.accessSync(dir);
            return;
        } catch (err) {
            // 目录不存在，继续创建
        }
        try {
            fs.mkdirSync(dir, true);
        } catch (err) {
            Logger.warn("[题库] 创建缓存目录失败 dir=" + dir, err);
        }
    }

    /** 删除本地缓存文件，失败只记录 */
    private removeFile(path: string): void {
        const fs = MiniGameUtils.instance.getFileSystemManager();
        if (!fs) {
            return;
        }
        try {
            fs.unlinkSync(path);
            Logger.log("[题库] 已删除本地缓存 path=" + path);
        } catch (err) {
            // 文件本来就不存在时忽略
        }
    }
}
