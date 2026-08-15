/**
 * @file MapManager.ts
 * @description 连连看地图管理器 - 负责地图数据的维护和更新
 * @category 游戏 10002 - 连连看
 */

import { Logger } from "@frameworks/utils/Utils";
import { Point, TileUtils, shiftMap } from "./TileMapData";

/**
 * @class MapManager
 * @description 地图管理器，负责地图的初始化、查询和更新
 * @category 游戏 10002 - 连连看
 */
export class MapManager {
    /**
     * @property {number[][]} _map - 地图二维数组
     * @private
     */
    private _map: number[][] = [];

    /**
     * @property {number} _rows - 地图行数
     * @private
     */
    private _rows: number = 0;

    /**
     * @property {number} _cols - 地图列数
     * @private
     */
    private _cols: number = 0;

    /**
     * @method initMap
     * @description 初始化地图
     * @param {number[][]} map - 二维数组地图，值小于100表示可消除方块，大于等于100表示装饰，0表示空
     * @returns {void}
     */
    public initMap(map: number[][]): void {
        if (!map || map.length === 0 || !map[0] || map[0].length === 0) {
            Logger.error("[MapManager] 地图数据无效");
            return;
        }

        // 深拷贝地图数据
        this._map = map.map((row) => [...row]);
        this._rows = map.length;
        this._cols = map[0].length;

        Logger.log(`[MapManager] 地图初始化完成，尺寸: ${this._rows}x${this._cols}`);
    }

    /**
     * @method getMap
     * @description 获取当前地图的深拷贝
     * @returns {number[][]} 地图二维数组的深拷贝
     */
    public getMap(): number[][] {
        return this._map.map((row) => [...row]);
    }

    /**
     * @method getTile
     * @description 获取指定位置的方块值
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @returns {number} 方块值，如果坐标越界返回-1
     */
    public getTile(row: number, col: number): number {
        if (!this._isValidPosition(row, col)) {
            Logger.warn(`[MapManager] 坐标越界: (${row}, ${col})`);
            return -1;
        }
        return this._map[row][col];
    }

    /**
     * @method setTile
     * @description 更新指定位置的方块
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {number} value - 新的方块值
     * @returns {boolean} 是否更新成功
     */
    public setTile(row: number, col: number, value: number): boolean {
        if (!this._isValidPosition(row, col)) {
            Logger.warn(`[MapManager] 坐标越界，无法更新: (${row}, ${col})`);
            return false;
        }

        this._map[row][col] = value;
        return true;
    }

    /**
     * @method removeTiles
     * @description 消除两个方块（将值设为0）
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @returns {boolean} 是否消除成功
     */
    public removeTiles(p1: Point, p2: Point): boolean {
        if (!this._isValidPosition(p1.row, p1.col) || !this._isValidPosition(p2.row, p2.col)) {
            Logger.warn("[MapManager] 消除失败，坐标越界");
            return false;
        }

        const value1 = this._map[p1.row][p1.col];
        const value2 = this._map[p2.row][p2.col];

        if (!TileUtils.isBlock(value1) || !TileUtils.isBlock(value2)) {
            Logger.warn("[MapManager] 消除失败，选择的不是可消除方块");
            return false;
        }

        if (value1 !== value2) {
            Logger.warn("[MapManager] 消除失败，两个方块类型不同");
            return false;
        }

        // 执行消除
        this._map[p1.row][p1.col] = 0;
        this._map[p2.row][p2.col] = 0;

        Logger.log(`[MapManager] 消除方块: (${p1.row},${p1.col}) 和 (${p2.row},${p2.col})`);
        return true;
    }

    /**
     * @method shiftBlocks
     * @description 消除后将剩余方块向指定方向移动（压缩靠边），与服务器逻辑保持一致
     * @param {number} dir - 移动方向（SHIFT_DIR 枚举值，<= RANDOM 表示关闭）
     * @param {number} edge - 最边边位置（默认 2）
     * @returns {void}
     */
    public shiftBlocks(dir: number, edge: number = 2): void {
        shiftMap(this._map, dir, edge);
    }

    /**
     * @method getSize
     * @description 获取地图尺寸
     * @returns {{rows: number, cols: number}} 地图行数和列数
     */
    public getSize(): { rows: number; cols: number } {
        return {
            rows: this._rows,
            cols: this._cols,
        };
    }

    /**
     * @method getRemainingBlockCount
     * @description 获取剩余可消除方块数量
     * @returns {number} 剩余可消除方块数量
     */
    public getRemainingBlockCount(): number {
        let count = 0;
        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                if (TileUtils.isBlock(this._map[row][col])) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * @method getAllBlocks
     * @description 获取所有可消除方块的坐标
     * @returns {Point[]} 可消除方块的坐标数组
     */
    public getAllBlocks(): Point[] {
        const blocks: Point[] = [];
        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                if (TileUtils.isBlock(this._map[row][col])) {
                    blocks.push({ row, col });
                }
            }
        }
        return blocks;
    }

    /**
     * @method getBlocksByType
     * @description 获取指定类型的所有方块坐标
     * @param {number} type - 方块类型值
     * @returns {Point[]} 该类型方块的坐标数组
     */
    public getBlocksByType(type: number): Point[] {
        const blocks: Point[] = [];
        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                if (this._map[row][col] === type) {
                    blocks.push({ row, col });
                }
            }
        }
        return blocks;
    }

    /**
     * @method isValidBlock
     * @description 判断指定位置是否为有效的可消除方块
     * @param {Point} point - 坐标点
     * @returns {boolean} 是否为有效的可消除方块
     */
    public isValidBlock(point: Point): boolean {
        if (!this._isValidPosition(point.row, point.col)) {
            return false;
        }
        return TileUtils.isBlock(this._map[point.row][point.col]);
    }

    /**
     * @method isEmpty
     * @description 判断指定位置是否为空
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @returns {boolean} 是否为空
     */
    public isEmpty(row: number, col: number): boolean {
        if (!this._isValidPosition(row, col)) {
            return false;
        }
        return TileUtils.isEmpty(this._map[row][col]);
    }

    /**
     * @method isDecoration
     * @description 判断指定位置是否为装饰方块
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @returns {boolean} 是否为装饰方块
     */
    public isDecoration(row: number, col: number): boolean {
        if (!this._isValidPosition(row, col)) {
            return false;
        }
        return TileUtils.isDecoration(this._map[row][col]);
    }

    /**
     * @method reset
     * @description 重置地图管理器
     * @returns {void}
     */
    public reset(): void {
        this._map = [];
        this._rows = 0;
        this._cols = 0;
        Logger.log("[MapManager] 地图管理器已重置");
    }

    /**
     * @method _isValidPosition
     * @description 检查坐标是否在地图范围内
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @returns {boolean} 是否有效
     * @private
     */
    private _isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < this._rows && col >= 0 && col < this._cols;
    }
}
