/**
 * @file CompCube.ts
 * @description 连连看方块组件，继承 FGUICompCube，负责方块的移动动画队列
 * @category 游戏 10002 - 连连看
 */

import FGUICompCube from "@fgui/game10002/FGUICompCube";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";

/**
 * @interface MoveTarget
 * @description 移动目标点（像素坐标 + 逻辑坐标）
 * @property {number} x - 目标像素 x 坐标
 * @property {number} y - 目标像素 y 坐标
 * @property {number} row - 目标行
 * @property {number} col - 目标列
 */
export interface MoveTarget {
    x: number;
    y: number;
    row: number;
    col: number;
}

/**
 * @class CompCube
 * @description 方块组件，实现方块移动坐标动画队列（A->B, B->C, C->D 逐个播放）
 * @category 游戏 10002 - 连连看
 */
@ViewClass()
export class CompCube extends FGUICompCube {
    /**
     * @property {number} _initRow
     * @description 初始行（一局结束后用于重置）
     * @private
     */
    private _initRow: number = -1;

    /**
     * @property {number} _initCol
     * @description 初始列（一局结束后用于重置）
     * @private
     */
    private _initCol: number = -1;

    /**
     * @property {number} _initX
     * @description 初始像素 x 坐标（一局结束后用于重置）
     * @private
     */
    private _initX: number = 0;

    /**
     * @property {number} _initY
     * @description 初始像素 y 坐标（一局结束后用于重置）
     * @private
     */
    private _initY: number = 0;

    /**
     * @property {number} _curRow
     * @description 当前所在行
     * @private
     */
    private _curRow: number = -1;

    /**
     * @property {number} _curCol
     * @description 当前所在列
     * @private
     */
    private _curCol: number = -1;

    /**
     * @property {MoveTarget[]} _moveQueue
     * @description 移动动画队列（注意：必须使用队列，逐个播放，动画完成后删除当前项再执行下一项）
     * @private
     */
    private _moveQueue: MoveTarget[] = [];

    /**
     * @property {boolean} _moving
     * @description 是否正在播放移动动画
     * @private
     */
    private _moving: boolean = false;

    /**
     * @property {Function[]} _onMoveDoneCallbacks
     * @description 队列全部播放完成后的回调列表（每次 playMoveQueue 入队一个回调，队列清空后逐个执行）
     * @private
     */
    private _onMoveDoneCallbacks: Array<() => void> = [];

    /**
     * @property {number} _moveDuration
     * @description 单个动画（一格距离）的播放时长（秒）
     * @private
     */
    private readonly _moveDuration: number = 0.08;

    /**
     * @property {number} _moveElapsed
     * @description 当前动画已播放时长（秒）
     * @private
     */
    private _moveElapsed: number = 0;

    /**
     * @property {number} _moveFromX
     * @description 当前动画起点 x
     * @private
     */
    private _moveFromX: number = 0;

    /**
     * @property {number} _moveFromY
     * @description 当前动画起点 y
     * @private
     */
    private _moveFromY: number = 0;

    /**
     * @property {MoveTarget | null} _moveTarget
     * @description 当前动画目标点
     * @private
     */
    private _moveTarget: MoveTarget | null = null;

    /**
     * @property {() => void} _onMoveFrameHandler
     * @description 绑定 this 的帧回调处理函数（框架 schedule 会以底层组件为 this 调用回调，必须 bind；参数 dt 由调度器传入，类型未声明）
     * @private
     */
    private _onMoveFrameHandler: () => void = null;

    /**
     * @method onConstruct
     * @description 组件构造完成时的初始化
     */
    protected onConstruct(): void {
        super.onConstruct();
        this._onMoveFrameHandler = this._onMoveFrame.bind(this);
    }

    /**
     * @method setInitPosition
     * @description 记录初始坐标（由 CompMap 在初始化时调用），用于一局结束后重置
     * @param {number} row - 初始行
     * @param {number} col - 初始列
     */
    setInitPosition(row: number, col: number): void {
        if (this._initRow === -1) {
            this._initRow = row;
            this._initCol = col;
            this._initX = this.x;
            this._initY = this.y;
        }
        this._curRow = row;
        this._curCol = col;
    }

    /**
     * @method resetPosition
     * @description 重置到初始坐标，停止所有移动动画
     */
    resetPosition(): void {
        this.stopMove();
        this.x = this._initX;
        this.y = this._initY;
        this._curRow = this._initRow;
        this._curCol = this._initCol;
    }

    /**
     * @method getRow
     * @description 获取当前行
     * @returns {number} 当前行
     */
    getRow(): number {
        return this._curRow;
    }

    /**
     * @method getCol
     * @description 获取当前列
     * @returns {number} 当前列
     */
    getCol(): number {
        return this._curCol;
    }

    /**
     * @method setGridPos
     * @description 直接设置当前逻辑坐标（不触发移动动画）
     * @param {number} row - 行
     * @param {number} col - 列
     */
    setGridPos(row: number, col: number): void {
        this._curRow = row;
        this._curCol = col;
    }

    /**
     * @method isMoving
     * @description 是否正在播放移动动画
     * @returns {boolean} 是否正在移动
     */
    isMoving(): boolean {
        return this._moving;
    }

    /**
     * @method stopMove
     * @description 停止移动动画并清空队列
     */
    stopMove(): void {
        this._moving = false;
        this._moveQueue = [];
        this._moveTarget = null;
        this._moveElapsed = 0;
        this._onMoveDoneCallbacks = [];
        if (this._onMoveFrameHandler) {
            this.unschedule(this._onMoveFrameHandler);
        }
    }

    /**
     * @method playMoveQueue
     * @description 播放移动动画队列，队列中的目标点会逐个播放（可多次调用，追加到队列尾部）
     * @param {MoveTarget[]} targets - 移动目标点数组（按播放顺序）
     * @param {() => void} onAllDone - 该批次队列全部播放完成后的回调
     */
    playMoveQueue(targets: MoveTarget[], onAllDone?: () => void): void {
        if (onAllDone) {
            this._onMoveDoneCallbacks.push(onAllDone);
        }
        this._moveQueue.push(...targets);

        if (!this._moving) {
            this._startNextMove();
        }
    }

    /**
     * @method _startNextMove
     * @description 启动下一个移动动画（从队列中取出队首）
     * @private
     */
    private _startNextMove(): void {
        // 队列为空，说明全部播放完成，执行外层回调
        if (this._moveQueue.length === 0) {
            this._moving = false;
            this._moveTarget = null;
            const cbs = this._onMoveDoneCallbacks;
            this._onMoveDoneCallbacks = [];
            for (const cb of cbs) {
                cb();
            }
            return;
        }

        const target = this._moveQueue[0];
        this._moveTarget = target;
        this._moveFromX = this.x;
        this._moveFromY = this.y;
        this._moveElapsed = 0;
        this._moving = true;

        // 通过帧回调更新坐标
        this.schedule(this._onMoveFrameHandler, 0);
    }

    /**
     * @method _onMoveFrame
     * @description 每帧回调，更新方块坐标，到达目标点后删除当前动画并播放下一个
     * @param {number} dt - 帧间隔（秒），由调度器传入
     * @private
     */
    private _onMoveFrame(dt?: number): void {
        if (!this._moveTarget) {
            return;
        }

        this._moveElapsed += dt ?? 0;
        const progress = Math.min(1, this._moveElapsed / this._moveDuration);

        // 线性插值更新坐标
        this.x = this._moveFromX + (this._moveTarget.x - this._moveFromX) * progress;
        this.y = this._moveFromY + (this._moveTarget.y - this._moveFromY) * progress;

        // 到达目标点
        if (progress >= 1) {
            // 删除当前动画
            this.unschedule(this._onMoveFrameHandler);
            this._moveQueue.shift();
            this._moveTarget = null;

            // 判断是否执行下一个动画
            if (this._moveQueue.length > 0) {
                this._startNextMove();
            } else {
                this._moving = false;
                const cbs = this._onMoveDoneCallbacks;
                this._onMoveDoneCallbacks = [];
                for (const cb of cbs) {
                    cb();
                }
            }
        }
    }
}
fgui.UIObjectFactory.setExtension(CompCube.URL, CompCube);
