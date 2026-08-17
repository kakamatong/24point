/**
 * @file PathFinder.ts
 * @description 连连看寻路算法核心 - 实现最多2个转弯的路径查找
 * @category 游戏 10002 - 连连看
 */

import { Logger } from "@frameworks/utils/Utils";
import { Point, LineSegment, PathResult, TileUtils, DIRECTION, DIRECTION_DELTAS, SearchState } from "./TileMapData";

/**
 * @class PathFinder
 * @description 连连看寻路器，使用BFS算法实现最多2个转弯的路径查找
 * @category 游戏 10002 - 连连看
 */
export class PathFinder {
    /**
     * @property {number[][]} _map - 当前地图数据
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
     * @property {number} _maxTurns - 最大允许转弯次数
     * @private
     * @constant
     */
    private readonly _maxTurns: number = 2;

    /**
     * @method setMap
     * @description 设置当前地图（每次判断前更新）
     * @param {number[][]} map - 地图二维数组
     * @returns {void}
     */
    public setMap(map: number[][]): void {
        if (!map || map.length === 0 || !map[0] || map[0].length === 0) {
            Logger.error("[PathFinder] 地图数据无效");
            return;
        }

        this._map = map;
        this._rows = map.length;
        this._cols = map[0].length;
    }

    /**
     * @method canConnect
     * @description 核心接口：判断两个方块是否可以消除
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @returns {PathResult} 寻路结果，包含是否可以连接和路径线段
     *
     * 规则：
     * 1. 两个方块值必须相等且 < 100 且 > 0
     * 2. 路径最多2个转弯
     * 3. 路径上不能经过装饰方块（>=100）
     * 4. 不允许延伸到地图外（外围已配置为0）
     */
    public canConnect(p1: Point, p2: Point): PathResult {
        // 检查坐标有效性
        if (!this._isValidPosition(p1.row, p1.col) || !this._isValidPosition(p2.row, p2.col)) {
            return { canConnect: false, lines: [] };
        }

        // 不能是同一个点
        if (TileUtils.isSamePoint(p1, p2)) {
            return { canConnect: false, lines: [] };
        }

        // 获取方块值
        const value1 = this._map[p1.row][p1.col];
        const value2 = this._map[p2.row][p2.col];

        // 检查是否为相同的可消除方块
        if (!TileUtils.isSameBlock(value1, value2)) {
            return { canConnect: false, lines: [] };
        }

        // 执行BFS寻路
        const path = this._bfs(p1, p2);

        if (path === null) {
            return { canConnect: false, lines: [] };
        }

        // 将路径点转换为线段
        const lines = this._pathToLines(path);

        return {
            canConnect: true,
            lines: lines,
        };
    }

    /**
     * @method hasAnyValidPair
     * @description 重要接口：判断当前地图是否存在可消除的方块对
     * @returns {boolean} 是否存在可消除的对方
     *
     * 算法：遍历所有相同类型的方块，检查是否可以连接
     */
    public hasAnyValidPair(): boolean {
        // 按类型收集所有方块
        const blocksByType = new Map<number, Point[]>();

        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const value = this._map[row][col];
                if (TileUtils.isBlock(value)) {
                    if (!blocksByType.has(value)) {
                        blocksByType.set(value, []);
                    }
                    blocksByType.get(value)!.push({ row, col });
                }
            }
        }

        // 检查每种类型的方块对
        for (const [, blocks] of blocksByType) {
            if (blocks.length < 2) {
                continue;
            }

            // 检查所有可能的配对
            for (let i = 0; i < blocks.length; i++) {
                for (let j = i + 1; j < blocks.length; j++) {
                    const result = this.canConnect(blocks[i], blocks[j]);
                    if (result.canConnect) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * @method getAllValidPairs
     * @description 获取所有可消除的方块对
     * @returns {Array<[Point, Point]>} 可消除的方块对数组
     */
    public getAllValidPairs(): Array<[Point, Point]> {
        const pairs: Array<[Point, Point]> = [];
        const blocksByType = new Map<number, Point[]>();

        // 按类型收集所有方块
        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const value = this._map[row][col];
                if (TileUtils.isBlock(value)) {
                    if (!blocksByType.has(value)) {
                        blocksByType.set(value, []);
                    }
                    blocksByType.get(value)!.push({ row, col });
                }
            }
        }

        // 检查每种类型的所有配对
        for (const [, blocks] of blocksByType) {
            if (blocks.length < 2) {
                continue;
            }

            for (let i = 0; i < blocks.length; i++) {
                for (let j = i + 1; j < blocks.length; j++) {
                    const result = this.canConnect(blocks[i], blocks[j]);
                    if (result.canConnect) {
                        pairs.push([blocks[i], blocks[j]]);
                    }
                }
            }
        }

        return pairs;
    }

    /**
     * @method getHint
     * @description 获取提示：返回一组可消除的方块
     * @returns {[Point, Point] | null} 可消除的方块对，如果没有则返回null
     */
    public getHint(): [Point, Point] | null {
        const blocksByType = new Map<number, Point[]>();

        // 按类型收集所有方块
        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const value = this._map[row][col];
                if (TileUtils.isBlock(value)) {
                    if (!blocksByType.has(value)) {
                        blocksByType.set(value, []);
                    }
                    blocksByType.get(value)!.push({ row, col });
                }
            }
        }

        // 查找第一个可消除的配对
        for (const [, blocks] of blocksByType) {
            if (blocks.length < 2) {
                continue;
            }

            for (let i = 0; i < blocks.length; i++) {
                for (let j = i + 1; j < blocks.length; j++) {
                    const result = this.canConnect(blocks[i], blocks[j]);
                    if (result.canConnect) {
                        return [blocks[i], blocks[j]];
                    }
                }
            }
        }

        return null;
    }

    /**
     * @method _bfs
     * @description BFS寻路算法（最多2个转弯）
     * @param {Point} start - 起点
     * @param {Point} end - 终点
     * @returns {Point[] | null} 路径点数组（包含起点和终点），失败返回null
     * @private
     *
     * 状态: (row, col, direction, turnCount, path)
     * direction: 当前方向 (0:上, 1:右, 2:下, 3:左, -1:起点)
     * turnCount: 转弯次数
     */
    private _bfs(start: Point, end: Point): Point[] | null {
        // 访问标记数组：visited[row][col][direction] = minTurnCount
        const visited: number[][][] = Array(this._rows)
            .fill(null)
            .map(() =>
                Array(this._cols)
                    .fill(null)
                    .map(() => Array(4).fill(Infinity))
            );

        const queue: SearchState[] = [];

        // 从起点向4个方向初始化
        for (let dir = 0; dir < 4; dir++) {
            const delta = DIRECTION_DELTAS[dir];
            const newRow = start.row + delta.row;
            const newCol = start.col + delta.col;

            // 检查是否可以移动到该位置
            if (this._canMoveTo(newRow, newCol, end)) {
                const newPath = [TileUtils.clonePoint(start), { row: newRow, col: newCol }];
                queue.push({
                    row: newRow,
                    col: newCol,
                    direction: dir,
                    turnCount: 0,
                    path: newPath,
                });
                visited[newRow][newCol][dir] = 0;
            }
        }

        // BFS搜索
        let head = 0;
        while (head < queue.length) {
            const current = queue[head++];

            // 到达终点
            if (current.row === end.row && current.col === end.col) {
                return current.path;
            }

            // 向4个方向扩展
            for (let newDir = 0; newDir < 4; newDir++) {
                const delta = DIRECTION_DELTAS[newDir];
                const newRow = current.row + delta.row;
                const newCol = current.col + delta.col;

                // 检查是否可以移动到该位置
                if (!this._canMoveTo(newRow, newCol, end)) {
                    continue;
                }

                // 计算新的转弯次数
                let newTurnCount = current.turnCount;
                if (current.direction !== DIRECTION.NONE && current.direction !== newDir) {
                    newTurnCount++;
                }

                // 检查转弯次数是否超过限制
                if (newTurnCount > this._maxTurns) {
                    continue;
                }

                // 检查是否已经访问过（以更少或相等的转弯次数）
                if (visited[newRow][newCol][newDir] <= newTurnCount) {
                    continue;
                }

                // 更新访问标记并入队
                visited[newRow][newCol][newDir] = newTurnCount;
                const newPath = [...current.path, { row: newRow, col: newCol }];
                queue.push({
                    row: newRow,
                    col: newCol,
                    direction: newDir,
                    turnCount: newTurnCount,
                    path: newPath,
                });
            }
        }

        // 未找到路径
        return null;
    }

    /**
     * @method _canMoveTo
     * @description 检查是否可以移动到指定位置
     * @param {number} row - 目标行
     * @param {number} col - 目标列
     * @param {Point} end - 终点坐标
     * @returns {boolean} 是否可以移动
     * @private
     *
     * 规则：
     * 1. 必须在地图范围内
     * 2. 如果是终点，总是可以通过
     * 3. 否则必须是空格子（0），不能是装饰（>=100）
     */
    private _canMoveTo(row: number, col: number, end: Point): boolean {
        // 检查范围
        if (!this._isValidPosition(row, col)) {
            return false;
        }

        // 如果是终点，可以通过
        if (row === end.row && col === end.col) {
            return true;
        }

        // 检查该位置是否可以通过（必须是空的）
        const value = this._map[row][col];
        return TileUtils.isEmpty(value);
    }

    /**
     * @method _pathToLines
     * @description 将路径点数组转换为线段数组
     * @param {Point[]} path - 路径点数组
     * @returns {LineSegment[]} 线段数组
     * @private
     *
     * 算法：遍历路径，当方向改变时创建一条新线段
     */
    private _pathToLines(path: Point[]): LineSegment[] {
        if (path.length < 2) {
            return [];
        }

        const lines: LineSegment[] = [];
        let lineStart = path[0];

        for (let i = 1; i < path.length; i++) {
            // 检查是否是最后一个点，或者方向会改变
            const isLastPoint = i === path.length - 1;
            let directionWillChange = false;

            if (!isLastPoint) {
                const currentDir = this._getDirection(path[i - 1], path[i]);
                const nextDir = this._getDirection(path[i], path[i + 1]);
                directionWillChange = currentDir !== nextDir;
            }

            // 如果是最后一点或方向改变，结束当前线段
            if (isLastPoint || directionWillChange) {
                lines.push({
                    start: lineStart,
                    dest: path[i],
                });
                lineStart = path[i];
            }
        }

        return lines;
    }

    /**
     * @method _getDirection
     * @description 获取从p1到p2的方向
     * @param {Point} p1 - 起点
     * @param {Point} p2 - 终点
     * @returns {DIRECTION} 方向枚举值
     * @private
     */
    private _getDirection(p1: Point, p2: Point): DIRECTION {
        const dRow = p2.row - p1.row;
        const dCol = p2.col - p1.col;

        if (dRow === -1 && dCol === 0) return DIRECTION.UP;
        if (dRow === 1 && dCol === 0) return DIRECTION.DOWN;
        if (dRow === 0 && dCol === 1) return DIRECTION.RIGHT;
        if (dRow === 0 && dCol === -1) return DIRECTION.LEFT;

        return DIRECTION.NONE;
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
