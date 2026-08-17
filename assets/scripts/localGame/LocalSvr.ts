import { AddEventListener, DispatchEvent, RemoveEventListener } from "@frameworks/Framework";
import { Logger } from "@frameworks/utils/Utils";
import { MAP_LEVEL_CONFIG } from "@datacenter/ChallengeData";

/**
 * @enum LOCAL_SVR_MODE
 * @description 本地服务器运行模式
 */
export enum LOCAL_SVR_MODE {
    /** 单机模式 */
    STANDALONE = 0,
    /** 闯关模式：使用外部传入的关卡配置 */
    CHALLENGE = 1,
}

/**
 * @class LocalSvr
 * @description 本地游戏模拟服务器，接管 GameSocketManager 在本地模式下的协议收发，
 *              模拟联网游戏的核心协议流程。当前仅保留本地框架，具体游戏协议处理待新游戏实现后填充
 */
export class LocalSvr {
    /** 单例实例 */
    private static _instance: LocalSvr;

    /**
     * 获取 LocalSvr 单例
     */
    public static get instance(): LocalSvr {
        if (!this._instance) {
            this._instance = new LocalSvr();
        }
        return this._instance;
    }

    /** 当前运行模式 */
    private _mode: LOCAL_SVR_MODE = LOCAL_SVR_MODE.STANDALONE;
    /** 闯关模式下的关卡配置 */
    private _challengeConfig: MAP_LEVEL_CONFIG | null = null;

    /** 游戏开始时间戳 */
    private _startTime: number = 0;

    /** 当前地图的总时间（秒），从关卡配置读取 */
    private _totalTime: number = 0;
    /** 剩余时间（秒） */
    private _remainTime: number = 0;
    /** 服务器端时钟定时器 */
    private _clockTimer: any = null;
    /** 本次游戏是否因超时结束 */
    private _isTimeout: boolean = false;

    constructor() {}

    /**
     * 判断当前是否为闯关模式
     */
    isChallengeMode(): boolean {
        return this._mode === LOCAL_SVR_MODE.CHALLENGE;
    }

    /**
     * 设置运行模式
     * @param mode 运行模式
     */
    setMode(mode: LOCAL_SVR_MODE): void {
        this._mode = mode;
    }

    /**
     * 设置闯关模式的关卡配置
     * @param config 关卡配置
     */
    setChallengeConfig(config: MAP_LEVEL_CONFIG): void {
        this._challengeConfig = config;
    }

    /**
     * 启动本地服务器，注册所有 C2S 协议监听
     */
    start(): void {
        // 先清理旧监听，确保多次调用不累积
        this.destroy();

        // TODO: 待新游戏协议确定后在此注册 C2S 协议监听，例如：
        // AddEventListener(SprotoXxx.Name, this.onXxx, this);
    }

    /**
     * 销毁本地服务器，移除所有监听
     */
    destroy(): void {
        // TODO: 待新游戏协议确定后在移除对应监听，例如：
        // RemoveEventListener(SprotoXxx.Name, this.onXxx);
        this._stopClock();
    }

    /** 分发响应事件（"resp" + 协议名，供 GameSocketManager 的回调使用） */
    dispatchEventResp(eventName: string, data?: any): void {
        DispatchEvent("resp" + eventName, data);
    }

    /** 分发广播事件（协议名，模拟服务器推送） */
    dispatchEvent(eventName: string, data?: any): void {
        DispatchEvent(eventName, data);
    }

    // ============================================
    // 游戏流程（待新游戏实现）
    // ============================================

    /**
     * 开始一局游戏（待新游戏实现：初始化对局数据、下发协议）
     */
    startStepGame(): void {
        this._startTime = Date.now();
        // 启动时钟（由新游戏实现设置 _totalTime 后生效）
        this._startClock();
    }

    /**
     * 游戏完成处理（待新游戏实现：结算并下发结束协议）
     */
    onGameFinished(): void {
        // 停止时钟
        this._stopClock();
    }

    // ============================================
    // 时钟管理
    // ============================================

    /**
     * 启动服务器端时钟，每秒检查是否超时
     * 超时后强制结束游戏
     * TOTAL_TIME=0 表示不需要倒计时
     */
    private _startClock(): void {
        this._stopClock();
        this._remainTime = this._totalTime;
        this._isTimeout = false;

        // TOTAL_TIME=0 表示不需要倒计时，不下发协议
        if (this._totalTime <= 0) {
            return;
        }

        this._clockTimer = setInterval(() => {
            this._remainTime--;

            if (this._remainTime <= 0) {
                this._remainTime = 0;
                this._stopClock();
                this._onTimeout();
            }
        }, 1000);
    }

    /**
     * 停止服务器端时钟
     */
    private _stopClock(): void {
        if (this._clockTimer) {
            clearInterval(this._clockTimer);
            this._clockTimer = null;
        }
    }

    /**
     * 超时处理：强制结束游戏
     */
    private _onTimeout(): void {
        Logger.log("[LocalSvr] 游戏超时，强制结束");
        this._isTimeout = true;
        this.onGameFinished();
    }
}
