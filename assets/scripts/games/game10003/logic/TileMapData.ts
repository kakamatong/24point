/**
 * @file TileMapData.ts
 * @description 连连看地图数据类型定义和工具函数
 * @category 游戏 10002 - 连连看
 */

/**
 * @interface Point
 * @description 坐标点
 * @property {number} row - 行坐标
 * @property {number} col - 列坐标
 */
export interface Point {
    row: number;
    col: number;
}

/**
 * @interface LineSegment
 * @description 直线段接口，包含起点和终点
 * @property {Point} start - 起点坐标
 * @property {Point} dest - 终点坐标
 */
export interface LineSegment {
    start: Point;
    dest: Point;
}

/**
 * @interface PathResult
 * @description 寻路结果
 * @property {boolean} canConnect - 是否可以连接
 * @property {LineSegment[]} lines - 路径线段数组，包含1-3条线段
 */
export interface PathResult {
    canConnect: boolean;
    lines: LineSegment[];
}

/**
 * @class TileUtils
 * @description 方块类型判断工具类
 * @category 工具类
 */
export class TileUtils {
    /**
     * @method isBlock
     * @description 判断是否为可消除方块（值在1-99之间）
     * @param {number} value - 方块值
     * @returns {boolean} 是否为可消除方块
     * @static
     */
    public static isBlock(value: number): boolean {
        return value > 0 && value < 100;
    }

    /**
     * @method isDecoration
     * @description 判断是否为装饰方块（值大于等于100）
     * @param {number} value - 方块值
     * @returns {boolean} 是否为装饰方块
     * @static
     */
    public static isDecoration(value: number): boolean {
        return value >= 100;
    }

    /**
     * @method isEmpty
     * @description 判断是否为空方块（值为0）
     * @param {number} value - 方块值
     * @returns {boolean} 是否为空方块
     * @static
     */
    public static isEmpty(value: number): boolean {
        return value === 0;
    }

    /**
     * @method isSameBlock
     * @description 判断两个方块是否是相同的可消除方块
     * @param {number} value1 - 第一个方块值
     * @param {number} value2 - 第二个方块值
     * @returns {boolean} 是否是相同的可消除方块
     * @static
     */
    public static isSameBlock(value1: number, value2: number): boolean {
        return this.isBlock(value1) && this.isBlock(value2) && value1 === value2;
    }

    /**
     * @method clonePoint
     * @description 克隆坐标点
     * @param {Point} point - 原始坐标点
     * @returns {Point} 克隆后的坐标点
     * @static
     */
    public static clonePoint(point: Point): Point {
        return { row: point.row, col: point.col };
    }

    /**
     * @method isSamePoint
     * @description 判断两个坐标点是否相同
     * @param {Point} p1 - 第一个坐标点
     * @param {Point} p2 - 第二个坐标点
     * @returns {boolean} 是否相同
     * @static
     */
    public static isSamePoint(p1: Point, p2: Point): boolean {
        return p1.row === p2.row && p1.col === p2.col;
    }
}

/**
 * @enum DIRECTION
 * @description 方向枚举
 */
export enum DIRECTION {
    UP = 0,
    RIGHT = 1,
    DOWN = 2,
    LEFT = 3,
    NONE = -1,
}

/**
 * @interface SearchState
 * @description BFS搜索状态
 * @property {number} row - 当前行
 * @property {number} col - 当前列
 * @property {DIRECTION} direction - 当前方向
 * @property {number} turnCount - 已转弯次数
 * @property {Point[]} path - 当前路径点数组
 */
export interface SearchState {
    row: number;
    col: number;
    direction: DIRECTION;
    turnCount: number;
    path: Point[];
}

/**
 * @constant DIRECTION_DELTAS
 * @description 方向偏移量数组
 * @type {Array<{row: number, col: number}>}
 */
export const DIRECTION_DELTAS = [
    { row: -1, col: 0 }, // 上
    { row: 0, col: 1 },  // 右
    { row: 1, col: 0 },  // 下
    { row: 0, col: -1 }, // 左
];

/**
 * @enum SHIFT_DIR
 * @description 消除后方块移动方向枚举（与服务器 mapConfig.SHIFT_DIR 保持一致）
 */
export enum SHIFT_DIR {
    /** 关闭 */
    OFF = 0,
    /** 随机一个方向（当前未使用，视为关闭） */
    RANDOM = 1,
    /** 向上 */
    UP = 2,
    /** 向下 */
    DOWN = 3,
    /** 向左 */
    LEFT = 4,
    /** 向右 */
    RIGHT = 5,
}

/**
 * @method shiftMap
 * @description 消除后将剩余方块向指定方向移动（压缩靠边），与服务器逻辑保持一致
 * @param {number[][]} map - 地图二维数组（原地修改，0 基索引）
 * @param {number} dir - 移动方向（SHIFT_DIR 枚举值）
 * @param {number} edge - 最边边位置（默认 2，如 2=上移靠第 2 行/左移靠第 2 列）
 * @returns {void}
 *
 * 规则：
 * 1. 采用分段提取-重放：全行/全列扫描，所有方块（含边缘行/列内的方块）都参与压缩，
 *    方块最多贴到第 edge 行/列（0 基第 edge-1 行/列），外圈（0..edge-2）留空供连线走位
 * 2. 装饰物(>=100)固定不动，方块不能穿过装饰物：按装饰物分段，每段独立提取并独立压缩
 */
export function shiftMap(map: number[][], dir: number, edge: number = 2): void {
    // 关闭或随机方向不移动
    if (!dir || dir <= SHIFT_DIR.RANDOM) {
        return;
    }

    if (!map || map.length === 0 || !map[0] || map[0].length === 0) {
        return;
    }

    const rows = map.length;
    const cols = map[0].length;

    if (edge < 1) {
        edge = 1;
    }

    // 边缘过大时没有可移动区域，直接返回（edge..rows-edge+1 或 edge..cols-edge+1 为空）
    if (edge * 2 > rows + 1 || edge * 2 > cols + 1) {
        return;
    }

    if (dir === SHIFT_DIR.LEFT || dir === SHIFT_DIR.RIGHT) {
        // 水平移动：逐行处理（全行扫描，保证边缘列内方块也参与压缩）
        for (let row = 0; row < rows; row++) {
            // 1. 按装饰物分段提取该行方块（保持相对顺序），清空该行（装饰物保留原位）
            const segments: Array<{ w: number; blocks: number[] }> = [];
            let curBlocks: number[] = [];
            let w = dir === SHIFT_DIR.LEFT ? edge - 1 : cols - edge;
            for (let col = 0; col < cols; col++) {
                const value = map[row][col];
                if (TileUtils.isBlock(value)) {
                    curBlocks.push(value);
                    map[row][col] = 0;
                } else if (TileUtils.isDecoration(value)) {
                    // 装饰物固定不动，作为分段屏障：当前段结束，下一段从装饰物后重新开始
                    segments.push({ w, blocks: curBlocks });
                    curBlocks = [];
                    w = dir === SHIFT_DIR.LEFT ? col + 1 : col - 1;
                }
            }
            segments.push({ w, blocks: curBlocks });

            // 2. 每段独立重放：从段起点 w 开始向移动方向连续放置
            for (const seg of segments) {
                if (seg.blocks.length === 0) {
                    continue;
                }
                if (dir === SHIFT_DIR.LEFT) {
                    let idx = 0;
                    for (let col = seg.w; col < cols && idx < seg.blocks.length; col++) {
                        if (TileUtils.isDecoration(map[row][col])) {
                            break;
                        }
                        map[row][col] = seg.blocks[idx++];
                    }
                } else {
                    // 向右靠：最右的方块放到最右位置（blocks 末尾先放）
                    let idx = seg.blocks.length - 1;
                    for (let col = seg.w; col >= 0 && idx >= 0; col--) {
                        if (TileUtils.isDecoration(map[row][col])) {
                            break;
                        }
                        map[row][col] = seg.blocks[idx--];
                    }
                }
            }
        }
    } else {
        // 垂直移动：逐列处理（全列扫描，保证边缘行内方块也参与压缩）
        for (let col = 0; col < cols; col++) {
            // 1. 按装饰物分段提取该列方块（保持相对顺序），清空该列（装饰物保留原位）
            const segments: Array<{ w: number; blocks: number[] }> = [];
            let curBlocks: number[] = [];
            let w = dir === SHIFT_DIR.UP ? edge - 1 : rows - edge;
            for (let row = 0; row < rows; row++) {
                const value = map[row][col];
                if (TileUtils.isBlock(value)) {
                    curBlocks.push(value);
                    map[row][col] = 0;
                } else if (TileUtils.isDecoration(value)) {
                    // 装饰物固定不动，作为分段屏障：当前段结束，下一段从装饰物后重新开始
                    segments.push({ w, blocks: curBlocks });
                    curBlocks = [];
                    w = dir === SHIFT_DIR.UP ? row + 1 : row - 1;
                }
            }
            segments.push({ w, blocks: curBlocks });

            // 2. 每段独立重放：从段起点 w 开始向移动方向连续放置
            for (const seg of segments) {
                if (seg.blocks.length === 0) {
                    continue;
                }
                if (dir === SHIFT_DIR.UP) {
                    let idx = 0;
                    for (let row = seg.w; row < rows && idx < seg.blocks.length; row++) {
                        if (TileUtils.isDecoration(map[row][col])) {
                            break;
                        }
                        map[row][col] = seg.blocks[idx++];
                    }
                } else {
                    // 向下靠：最下的方块放到最下位置（blocks 末尾先放）
                    let idx = seg.blocks.length - 1;
                    for (let row = seg.w; row >= 0 && idx >= 0; row--) {
                        if (TileUtils.isDecoration(map[row][col])) {
                            break;
                        }
                        map[row][col] = seg.blocks[idx--];
                    }
                }
            }
        }
    }
}

/**
 * @interface ShiftMoveInfo
 * @description 移动任务信息
 * @property {Point} from - 起始坐标
 * @property {Point[]} path - 移动路径（逐格坐标，不含起点，含终点）
 */
export interface ShiftMoveInfo {
    from: Point;
    path: Point[];
}

/**
 * @method computeShiftMoves
 * @description 对比移动前后的地图，计算每个方块需要执行的移动路径（逐格路径，供客户端播放移动动画使用）
 * @param {number[][]} oldMap - 移动前的地图数据
 * @param {number[][]} newMap - 移动后的地图数据
 * @param {number} dir - 移动方向（SHIFT_DIR 枚举值，<= RANDOM 表示关闭）
 * @returns {ShiftMoveInfo[]} 移动任务数组，path 为逐格路径（如 from col5 -> col2 的 path 为 [4, 3, 2]，对应 A-B, B-C, C-D 多个动画）
 */
export function computeShiftMoves(oldMap: number[][], newMap: number[][], dir: number): ShiftMoveInfo[] {
    const moves: ShiftMoveInfo[] = [];
    if (!dir || dir <= SHIFT_DIR.RANDOM) {
        return moves;
    }

    if (!oldMap || !newMap || oldMap.length === 0 || newMap.length === 0) {
        return moves;
    }

    const rows = oldMap.length;
    const cols = oldMap[0] ? oldMap[0].length : 0;

    if (dir === SHIFT_DIR.LEFT || dir === SHIFT_DIR.RIGHT) {
        // 水平移动：逐行对比，方块保持相对顺序，按序配对
        for (let row = 0; row < rows; row++) {
            const oldCols: number[] = [];
            const newCols: number[] = [];
            for (let col = 0; col < cols; col++) {
                if (TileUtils.isBlock(oldMap[row][col])) {
                    oldCols.push(col);
                }
                if (TileUtils.isBlock(newMap[row][col])) {
                    newCols.push(col);
                }
            }
            if (oldCols.length !== newCols.length) {
                continue;
            }
            for (let i = 0; i < oldCols.length; i++) {
                const fromCol = oldCols[i];
                const toCol = newCols[i];
                if (fromCol === toCol) {
                    continue;
                }
                const path: Point[] = [];
                const step = dir === SHIFT_DIR.LEFT ? -1 : 1;
                for (let col = fromCol + step; col !== toCol + step; col += step) {
                    path.push({ row, col });
                }
                moves.push({ from: { row, col: fromCol }, path });
            }
        }
    } else if (dir === SHIFT_DIR.UP || dir === SHIFT_DIR.DOWN) {
        // 垂直移动：逐列对比，方块保持相对顺序，按序配对
        for (let col = 0; col < cols; col++) {
            const oldRows: number[] = [];
            const newRows: number[] = [];
            for (let row = 0; row < rows; row++) {
                if (TileUtils.isBlock(oldMap[row][col])) {
                    oldRows.push(row);
                }
                if (TileUtils.isBlock(newMap[row][col])) {
                    newRows.push(row);
                }
            }
            if (oldRows.length !== newRows.length) {
                continue;
            }
            for (let i = 0; i < oldRows.length; i++) {
                const fromRow = oldRows[i];
                const toRow = newRows[i];
                if (fromRow === toRow) {
                    continue;
                }
                const path: Point[] = [];
                const step = dir === SHIFT_DIR.UP ? -1 : 1;
                for (let row = fromRow + step; row !== toRow + step; row += step) {
                    path.push({ row, col });
                }
                moves.push({ from: { row: fromRow, col }, path });
            }
        }
    }

    return moves;
}
