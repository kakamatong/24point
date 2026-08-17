import FGUICompMap from "@fgui/game10002/FGUICompMap";
import * as fgui from "fairygui-cc";
import { PathFinder } from "../../../logic/PathFinder";
import { MapManager } from "../../../logic/MapManager";
import { Point, LineSegment, SHIFT_DIR, computeShiftMoves } from "../../../logic/TileMapData";
import { CompCube, MoveTarget } from "./CompCube";
import { ViewClass } from "@frameworks/Framework";
import { GameSocketManager } from "@frameworks/GameSocketManager";
import { SprotoClickTiles } from "../../../../../../types/protocol/game10002/c2s";
import { TipsView } from "@view/common/TipsView";
import { GameData } from "../../../data/GameData";
import { ENUM_GAME_STEP } from "../../../data/InterfaceGameConfig";
import { Logger, SpinePlay } from "@frameworks/utils/Utils";
import { SoundManager } from "@frameworks/SoundManager";

/**
 * @class CompMap
 * @description 连连看地图组件，管理所有方块
 */
@ViewClass()
export class CompMap extends FGUICompMap {
    /**
     * @property {CompCube[][]} _cubeMap
     * @description 存储所有方块的二维数组
     * @private
     */
    private _cubeMap: CompCube[][] = [];

    /**
     * @property {Array<Array<{x: number, y: number, cx: number, cy: number}>>} _cellPositions
     * @description 每个格子（行列）对应的初始像素坐标表，x/y 为格子左上角（移动动画目标坐标），cx/cy 为格子中心（连线绘制坐标），不随方块移动改变
     * @private
     */
    private _cellPositions: Array<Array<{ x: number; y: number; cx: number; cy: number }>> = [];

    /**
     * @property {number} _rows
     * @description 地图行数
     * @private
     */
    private _rows: number = 0;

    /**
     * @property {number} _cols
     * @description 地图列数
     * @private
     */
    private _cols: number = 0;

    /**
     * @property {MapManager} _mapManager
     * @description 地图数据管理器
     * @private
     */
    private _mapManager: MapManager = new MapManager();

    /**
     * @property {PathFinder} _pathFinder
     * @description 路径查找器
     * @private
     */
    private _pathFinder: PathFinder = new PathFinder();

    /**
     * @property {Array<{cube: CompCube, row: number, col: number}>} _selectedCubes
     * @description 当前选中的方块数组（最多2个）
     * @private
     */
    private _selectedCubes: Array<{ cube: CompCube; row: number; col: number }> = [];

    /**
     * @property {FGUICompLine[]} _pathLines
     * @description 当前显示的路径线条数组
     * @private
     */
    private _pathLines: fgui.GComponent[] = [];

    /**
     * @property {number} _selectScale
     * @description 选中时的缩放比例
     * @private
     */
    private readonly _selectScale: number = 1.2;

    /**
     * @property {number} _selectZOrder
     * @description 选中时的ZOrder值
     * @private
     */
    private readonly _selectZOrder: number = 999;

    /**
     * @property {number} _removeDelay
     * @description 消除延迟时间（秒）
     * @private
     */
    private readonly _removeDelay: number = 0.2;

    /**
     * @property {boolean} _readonly
     * @description 是否只读模式（仅显示，不可交互）
     * @private
     */
    private _readonly: boolean = false;

    /**
     * @property {boolean} _isShifting
     * @description 是否正在播放方块移动动画批次（用于串行处理，防止数据与动画不同步）
     * @private
     */
    private _isShifting: boolean = false;

    /**
     * @property {number} _shiftPendingCount
     * @description 待处理的移动动画批次次数（前一批次未完成时累计，完成后逐次执行）
     * @private
     */
    private _shiftPendingCount: number = 0;

    /**
     * @property {Array<() => void>} _deferredOps
     * @description 移动动画批次期间延迟执行的操作队列（如服务器确认的消除，需等待批次完成后再处理，避免 _cubeMap 数据错位）
     * @private
     */
    private _deferredOps: Array<() => void> = [];

    /**
     * @property {Map<string, number>} _allreadyRemoved
     * @description 已经消除的方块坐标对记录表（key 为规范化坐标 key，value 为重复记录次数），客户端本地消除后记录，方便服务器返回确认时逐条消费，客户端不再重复消除
     * @private
     */
    private _allreadyRemoved: Map<string, number> = new Map();

    /**
     * @method onConstruct
     * @description 组件构造完成时的初始化
     */
    onConstruct(): void {
        super.onConstruct();
        this._initCubeMap();
    }

    /**
     * @method setReadonly
     * @description 设置只读模式
     * @param {boolean} readonly - 是否只读
     */
    setReadonly(readonly: boolean): void {
        this._readonly = readonly;
    }

    /**
     * @method isReadonly
     * @description 获取是否只读模式
     * @returns {boolean} 是否只读
     */
    isReadonly(): boolean {
        return this._readonly;
    }

    /**
     * @method _initCubeMap
     * @description 初始化方块二维数组，将所有 CUTE_X_Y 引用存入数组，并记录每个格子的初始像素坐标
     * @private
     */
    private _initCubeMap(): void {
        // 清空现有数据
        this._cubeMap = [];
        this._cellPositions = [];

        // 遍历所有子节点，提取 CUTE_X_Y 格式的方块
        for (let i = 0; i < this.numChildren; i++) {
            const child = this.getChildAt(i) as CompCube;
            if (child && child.name && child.name.startsWith("CUTE_")) {
                const parts = child.name.split("_");
                if (parts.length === 3) {
                    const row = parseInt(parts[1]);
                    const col = parseInt(parts[2]);

                    // 确保行数组存在
                    if (!this._cubeMap[row]) {
                        this._cubeMap[row] = [];
                    }
                    if (!this._cellPositions[row]) {
                        this._cellPositions[row] = [];
                    }

                    // 存储方块引用
                    this._cubeMap[row][col] = child;

                    // 记录格子初始像素坐标（布局坐标，不随方块移动改变；x/y 为左上角，cx/cy 为格子中心）
                    this._cellPositions[row][col] = {
                        x: child.x,
                        y: child.y,
                        cx: child.x + child.width / 2,
                        cy: child.y + child.height / 2,
                    };

                    // 记录方块初始坐标，方便一局结束后重置
                    child.setInitPosition(row, col);

                    // 更新地图尺寸
                    if (row >= this._rows) this._rows = row + 1;
                    if (col >= this._cols) this._cols = col + 1;

                    // 绑定点击事件
                    this._bindCubeClickEvent(child, row, col);
                }
            }
        }
    }

    /**
     * @method _getCellPos
     * @description 获取指定格子的初始像素坐标（左上角）
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {{x: number, y: number}} 格子像素坐标
     * @private
     */
    private _getCellPos(row: number, col: number): { x: number; y: number } {
        if (this._cellPositions[row] && this._cellPositions[row][col]) {
            return this._cellPositions[row][col];
        }
        return { x: 0, y: 0 };
    }

    /**
     * @method _getCellCenter
     * @description 获取指定格子的中心像素坐标（连线绘制用，不依赖方块对象，方块移动后依然准确）
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {{x: number, y: number}} 格子中心像素坐标
     * @private
     */
    private _getCellCenter(row: number, col: number): { x: number; y: number } {
        if (this._cellPositions[row] && this._cellPositions[row][col]) {
            const pos = this._cellPositions[row][col];
            return { x: pos.cx, y: pos.cy };
        }
        return { x: 0, y: 0 };
    }

    /**
     * @method _bindCubeClickEvent
     * @description 绑定方块的点击事件
     * @param {CompCube} cube - 方块对象
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _bindCubeClickEvent(cube: CompCube, row: number, col: number): void {
        cube.onClick(() => {
            this._onCubeClick(cube, row, col);
        }, this);
    }

    /**
     * @method _unbindCubeClickEvent
     * @description 移除方块的点击事件
     * @param {CompCube} cube - 方块对象
     * @private
     */
    private _unbindCubeClickEvent(cube: CompCube): void {
        cube.clearClick();
    }

    /**
     * @method _onCubeClick
     * @description 处理方块点击事件
     * @param {CompCube} cube - 被点击的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _onCubeClick(cube: CompCube, row: number, col: number): void {
        // 只读模式下不处理点击事件
        if (this._readonly) {
            return;
        }

        // 非 playing 阶段不处理点击事件
        if (GameData.instance.gameStep !== ENUM_GAME_STEP.PLAYING) {
            return;
        }

        // 移动动画播放期间不处理点击（数据与画面处于过渡状态）
        // if (this._isShifting) {
        //     return;
        // }

        SoundManager.instance.playSoundEffect("game10002/cubeClick");

        // 检查是否点击了已选中的方块
        const selectedIndex = this._selectedCubes.findIndex((item) => item.row === row && item.col === col);

        if (selectedIndex >= 0) {
            // 取消选中
            this._deselectCube(selectedIndex);
            return;
        }

        // 检查是否已经选中了2个方块
        if (this._selectedCubes.length >= 2) {
            // 已经有2个选中了，先取消第一个
            this._deselectCube(0);
        }

        // 选中新方块
        this._selectCube(cube, row, col);

        // 如果选中了2个方块，检查是否可以消除
        if (this._selectedCubes.length === 2) {
            this._checkAndRemove();
        }
    }

    /**
     * @method _selectCube
     * @description 选中方块
     * @param {CompCube} cube - 要选的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @private
     */
    private _selectCube(cube: CompCube, row: number, col: number): void {
        // 记录选中的方块
        this._selectedCubes.push({ cube, row, col });

        // 设置选中控制器
        cube.ctrl_selected.selectedIndex = 1;
        cube.act.play();
    }

    /**
     * @method _deselectCube
     * @description 取消选中方块
     * @param {number} index - 在选中数组中的索引
     * @private
     */
    private _deselectCube(index: number): void {
        if (index < 0 || index >= this._selectedCubes.length) {
            return;
        }

        const selected = this._selectedCubes[index];

        // 取消选中控制器
        selected.cube.ctrl_selected.selectedIndex = 0;

        // 从选中数组中移除
        this._selectedCubes.splice(index, 1);
    }

    /**
     * @method _clearSelection
     * @description 清空所有选中状态
     * @private
     */
    private _clearSelection(): void {
        // 恢复所有选中方块的状态
        for (const selected of this._selectedCubes) {
            selected.cube.ctrl_selected.selectedIndex = 0;
        }

        // 清空选中数组
        this._selectedCubes = [];
    }

    /**
     * @method _checkAndRemove
     * @description 检查两个选中方块是否可以消除，并执行消除
     * @private
     */
    private _checkAndRemove(): void {
        if (this._selectedCubes.length !== 2) {
            return;
        }

        const first = this._selectedCubes[0];
        const second = this._selectedCubes[1];

        const p1: Point = { row: first.row, col: first.col };
        const p2: Point = { row: second.row, col: second.col };

        // 使用PathFinder检查是否可以连接
        const result = this._pathFinder.canConnect(p1, p2);

        if (result.canConnect) {
            // 可以消除，显示路径线条，然后延迟消除
            this._showPathLines(result.lines);
            first.cube.UI_SP_ANI.visible = true;
            second.cube.UI_SP_ANI.visible = true;
            this._unbindCubeClickEvent(first.cube);
            this._unbindCubeClickEvent(second.cube);
            SpinePlay(first.cube.UI_SP_ANI, "action", false);
            SpinePlay(second.cube.UI_SP_ANI, "action", false);
            !this._readonly && SoundManager.instance.playSoundEffect("game10002/bomb");
            // 清空选中数组
            this._selectedCubes = [];
            // 延迟0.2秒后执行消除
            this.scheduleOnce(() => {
                this._removeCubesWithLines(first, second, p1, p2);
            }, this._removeDelay);
        } else {
            // 不能消除，取消第一个方块的选中，保留第二个
            this._deselectCube(0);
        }
    }

    /**
     * @method _showPathLines
     * @description 显示连接路径线条（使用静态格位中心坐标绘制，方块移动后仍准确，不依赖方块对象）
     * @param {LineSegment[]} lines - 路径线段数组
     * @private
     */
    private _showPathLines(lines: LineSegment[]): void {
        // 先清理之前的路径线条
        this._clearPathLines();

        const lineThickness = 15; // 线条粗细固定

        for (const line of lines) {
            // 获取起点和终点对应的格子中心坐标（格位固定，方块移动不影响）
            const startPos = this._getCellCenter(line.start.row, line.start.col);
            const destPos = this._getCellCenter(line.dest.row, line.dest.col);

            // 计算线段差值
            const deltaX = destPos.x - startPos.x;
            const deltaY = destPos.y - startPos.y;

            // 创建线条节点
            const lineNode = fgui.UIPackage.createObject("game10002", "CompLine") as fgui.GComponent;

            // 判断是水平线还是垂直线
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平线：通过改变 width 实现
                lineNode.width = Math.abs(deltaX);
                lineNode.height = lineThickness;
                lineNode.x = Math.min(startPos.x, destPos.x);
                lineNode.y = startPos.y - lineThickness / 2; // 居中对齐
            } else {
                // 垂直线：通过改变 height 实现
                lineNode.width = lineThickness;
                lineNode.height = Math.abs(deltaY);
                lineNode.x = startPos.x - lineThickness / 2; // 居中对齐
                lineNode.y = Math.min(startPos.y, destPos.y);
            }

            // 设置较高的sortingOrder确保线条显示在方块上方
            lineNode.sortingOrder = 1000;

            // 添加到地图
            this.addChild(lineNode);
            this._pathLines.push(lineNode);
        }
    }

    /**
     * @method _clearPathLines
     * @description 清理所有路径线条
     * @private
     */
    private _clearPathLines(): void {
        for (const line of this._pathLines) {
            if (line && !line.isDisposed) {
                line.removeFromParent();
                line.dispose();
            }
        }
        this._pathLines = [];
    }

    /**
     * @method _removeCubesWithLines
     * @description 消除两个方块并清理线条
     * @param {Object} first - 第一个选中的方块信息
     * @param {Object} second - 第二个选中的方块信息
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @private
     */
    private _removeCubesWithLines(
        first: { cube: CompCube; row: number; col: number },
        second: { cube: CompCube; row: number; col: number },
        p1: Point,
        p2: Point
    ): void {
        // 在MapManager中执行消除
        this._mapManager.removeTiles(p1, p2);

        // 更新PathFinder的地图数据
        this._pathFinder.setMap(this._mapManager.getMap());

        // 记录已经消除的方块坐标，方便服务器返回确认时消费，客户端不再重复消除
        this._addAllreadyRemoved(p1, p2);

        // 隐藏方块（重置为初始状态）
        first.cube.visible = false;
        first.cube.ctrl_selected.selectedIndex = 0;
        first.cube.UI_LOADER_ICOM.url = "";

        second.cube.visible = false;
        second.cube.ctrl_selected.selectedIndex = 0;
        second.cube.UI_LOADER_ICOM.url = "";

        // 清理路径线条
        this._clearPathLines();

        // 消除后剩余方块移动动画
        this._shiftAndAnimate();

        Logger.log(`消除方块: (${first.row},${first.col}) 和 (${second.row},${second.col})`);

        // 发送消除请求给服务器
        GameSocketManager.instance.sendToServer(
            SprotoClickTiles,
            {
                row1: first.row,
                col1: first.col,
                row2: second.row,
                col2: second.col,
            },
            (response: any) => {
                if (response && response.code === 0) {
                    // 服务器返回错误，显示提示
                    TipsView.showView({ content: response.msg || "消除失败" });
                }
                // 成功时不处理，客户端自己管理消除逻辑
            }
        );
    }

    /**
     * @method _shiftAndAnimate
     * @description 消除后执行数据移动（MapManager + PathFinder），并播放方块移动动画（数据与动画均串行处理）
     * @private
     */
    private _shiftAndAnimate(): void {
        // 读取移动配置，关闭或随机方向不移动
        const shiftDir = GameData.instance.shiftDir;
        if (shiftDir <= SHIFT_DIR.RANDOM) {
            return;
        }

        // 当前动画批次未完成时，累计待处理次数，批次完成后自动继续（延迟处理可保证坐标空间一致）
        if (this._isShifting) {
            this._shiftPendingCount++;
            return;
        }

        this._doShiftAndAnimate();
    }

    /**
     * @method _doShiftAndAnimate
     * @description 执行一次数据移动与移动动画批次（串行调用，动画全部完成后处理待执行批次）
     * @private
     */
    private _doShiftAndAnimate(): void {
        const shiftDir = GameData.instance.shiftDir;
        const shiftEdge = GameData.instance.shiftEdge;

        // 移动前的地图快照
        const oldMap = this._mapManager.getMap();

        // 数据层移动（与服务器保持一致）
        this._mapManager.shiftBlocks(shiftDir, shiftEdge);

        // 更新PathFinder地图数据
        this._pathFinder.setMap(this._mapManager.getMap());

        // 计算每个方块的移动路径
        const newMap = this._mapManager.getMap();
        const moves = computeShiftMoves(oldMap, newMap, shiftDir);

        // 没有方块需要移动，直接处理待执行批次
        if (moves.length === 0) {
            this._processShiftPending();
            return;
        }

        this._isShifting = true;

        // 动画前解绑所有参与移动方块的点击事件（需求：动画期间不可点击）
        for (const move of moves) {
            const cube = this._cubeMap[move.from.row] && this._cubeMap[move.from.row][move.from.col];
            if (cube) {
                this._unbindCubeClickEvent(cube);
            }
        }

        // 统计本批次动画完成数量，全部完成后处理待执行批次
        let doneCount = 0;
        let totalCount = 0;

        for (const move of moves) {
            const cube = this._cubeMap[move.from.row] && this._cubeMap[move.from.row][move.from.col];
            if (!cube) {
                continue;
            }

            totalCount++;
            const last = move.path[move.path.length - 1];

            // 将逐格路径转换为像素坐标目标队列
            const targets: MoveTarget[] = move.path.map((p) => {
                const cellPos = this._getCellPos(p.row, p.col);
                return { x: cellPos.x, y: cellPos.y, row: p.row, col: p.col };
            });

            // 播放移动动画队列，全部完成后回调
            cube.playMoveQueue(targets, () => {
                this._onCubeMoveComplete(cube, move.from, last);
                doneCount++;
                if (doneCount >= totalCount) {
                    this._onShiftBatchComplete();
                }
            });
        }

        // 参与动画的方块数为0（理论上不会发生，防御性处理）
        if (totalCount === 0) {
            this._isShifting = false;
            this._processShiftPending();
        }
    }

    /**
     * @method _processShiftPending
     * @description 处理待执行的移动批次（每处理一次执行一轮移动）
     * @private
     */
    private _processShiftPending(): void {
        if (this._shiftPendingCount > 0) {
            this._shiftPendingCount--;
            this._doShiftAndAnimate();
        }
    }

    /**
     * @method _onShiftBatchComplete
     * @description 当前移动动画批次全部完成后，执行延迟操作并处理待执行批次
     * @private
     */
    private _onShiftBatchComplete(): void {
        this._isShifting = false;

        // 执行延迟操作（如服务器确认的消除），操作内部可能启动新的动画批次
        const ops = this._deferredOps;
        this._deferredOps = [];
        for (const op of ops) {
            op();
        }

        // 若延迟操作已启动新批次，则等待其完成后再处理待执行批次（保持批次串行）
        if (!this._isShifting) {
            this._processShiftPending();
        }
    }

    /**
     * @method _onCubeMoveComplete
     * @description 单个方块移动动画队列全部完成后的回调：以新坐标更新 _cubeMap，并重新绑定点击事件
     * @param {CompCube} cube - 移动完成的方块
     * @param {Point} from - 移动前坐标
     * @param {Point} to - 移动后坐标
     * @private
     */
    private _onCubeMoveComplete(cube: CompCube, from: Point, to: Point): void {
        // 清空旧位置引用
        if (this._cubeMap[from.row] && this._cubeMap[from.row][from.col] === cube) {
            this._cubeMap[from.row][from.col] = null;
        }

        // 写入新位置引用
        if (!this._cubeMap[to.row]) {
            this._cubeMap[to.row] = [];
        }
        this._cubeMap[to.row][to.col] = cube;

        // 同步方块逻辑坐标
        cube.setGridPos(to.row, to.col);

        // 重新绑定点击事件（新坐标）
        this._bindCubeClickEvent(cube, to.row, to.col);
    }

    /**
     * @method removeTilesWithShift
     * @description 消除两个方块并执行数据移动与移动动画（用于其他玩家小地图等只读场景），不发送网络请求
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     */
    removeTilesWithShift(p1: Point, p2: Point): void {
        // 移动动画播放期间延迟处理，避免 _cubeMap 坐标错位
        if (this._isShifting) {
            this._deferredOps.push(() => {
                this.removeTilesWithShift(p1, p2);
            });
            return;
        }
        this.hideCube(p1.row, p1.col);
        this.hideCube(p2.row, p2.col);
        this._mapManager.removeTiles(p1, p2);
        this._pathFinder.setMap(this._mapManager.getMap());
        this._shiftAndAnimate();
    }

    /**
     * @method _resetAllCubes
     * @description 重置所有方块到初始位置（一局结束后调用），并重建 _cubeMap 与重新绑定点击事件
     * @private
     */
    private _resetAllCubes(): void {
        // 清空移动动画队列与状态（新一局开始，丢弃未播放的移动批次）
        this._isShifting = false;
        this._shiftPendingCount = 0;

        // 停止所有移动动画并重置位置、解除点击事件
        for (let i = 0; i < this.numChildren; i++) {
            const child = this.getChildAt(i) as CompCube;
            if (child && child.name && child.name.startsWith("CUTE_")) {
                child.stopMove();
                child.resetPosition();
                this._unbindCubeClickEvent(child);
            }
        }

        // 重建 _cubeMap 并重新绑定点击事件（按名称初始坐标）
        this._initCubeMap();
    }

    /**
     * @method initMap
     * @description 根据地图数据初始化所有方块资源，同时设置logic数据
     * @param {number[][]} map - 地图数据，number 代表方块资源 ID，0 表示空方块
     * @param {string} resPath - 资源前缀路径，格式如 "game10002"
     */
    initMap(map: number[][], resPath: string): void {
        if (!map || map.length === 0) {
            Logger.log("地图数据为空");
            return;
        }

        // 清空之前的选中状态和路径线条
        this._clearSelection();
        this._clearPathLines();

        // 重置所有方块到初始位置（新一局开始）
        this._resetAllCubes();

        // 清空已消除记录，防止上一局残留的坐标对被误消费
        this._allreadyRemoved.clear();

        // 初始化MapManager
        this._mapManager.initMap(map);

        // 初始化PathFinder
        this._pathFinder.setMap(map);

        // 遍历地图数据设置每个方块的资源
        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                const resId = map[row][col];
                const cube = this.getCube(row, col);

                if (cube) {
                    if (resId === 0) {
                        // 空方块，隐藏或清空
                        cube.visible = false;
                        cube.UI_LOADER_ICOM.url = "";
                    } else {
                        // 设置资源路径，格式: ui://resPath/80_resId
                        cube.visible = true;
                        cube.UI_SP_ANI.visible = false;
                        cube.UI_LOADER_ICOM.url = `ui://${resPath}/80_${resId}`;
                    }
                }
            }
        }
    }

    /**
     * @method getCube
     * @description 获取指定位置的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {CompCube | null} 方块对象，不存在则返回 null
     */
    getCube(row: number, col: number): CompCube | null {
        if (this._cubeMap[row] && this._cubeMap[row][col]) {
            return this._cubeMap[row][col];
        }
        return null;
    }

    /**
     * @method setCube
     * @description 设置指定位置的方块资源
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number} resId - 资源 ID，0 表示空方块
     * @param {string} resPath - 资源前缀路径
     */
    setCube(row: number, col: number, resId: number, resPath: string): void {
        const cube = this.getCube(row, col);
        if (!cube) {
            Logger.log(`方块位置 [${row}, ${col}] 不存在`);
            return;
        }

        if (resId === 0) {
            cube.visible = false;
            cube.UI_LOADER_ICOM.url = "";
        } else {
            cube.visible = true;
            cube.UI_LOADER_ICOM.url = `ui://${resPath}/80_${resId}`;
        }
    }

    /**
     * @method clearMap
     * @description 清空整个地图，隐藏所有方块
     */
    clearMap(): void {
        // 清空选中状态和路径线条
        this._clearSelection();
        this._clearPathLines();

        // 重置所有方块到初始位置
        this._resetAllCubes();

        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const cube = this.getCube(row, col);
                if (cube) {
                    cube.visible = false;
                    cube.UI_LOADER_ICOM.url = "";
                }
            }
        }

        // 重置MapManager
        this._mapManager.reset();
    }

    /**
     * @method hideCube
     * @description 隐藏指定位置的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
    hideCube(row: number, col: number): void {
        const cube = this.getCube(row, col);
        if (cube) {
            cube.visible = false;
        }
    }

    /**
     * @method showCube
     * @description 显示指定位置的方块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
    showCube(row: number, col: number): void {
        const cube = this.getCube(row, col);
        if (cube) {
            cube.visible = true;
        }
    }

    /**
     * @method getRows
     * @description 获取地图行数
     * @returns {number} 行数
     */
    getRows(): number {
        return this._rows;
    }

    /**
     * @method getCols
     * @description 获取地图列数
     * @returns {number} 列数
     */
    getCols(): number {
        return this._cols;
    }

    /**
     * @method getAllCubes
     * @description 获取所有方块数据
     * @returns {CompCube[][]} 方块二维数组
     */
    getAllCubes(): CompCube[][] {
        return this._cubeMap;
    }

    /**
     * @method getMapManager
     * @description 获取地图管理器
     * @returns {MapManager} 地图管理器实例
     */
    getMapManager(): MapManager {
        return this._mapManager;
    }

    /**
     * @method getPathFinder
     * @description 获取路径查找器
     * @returns {PathFinder} 路径查找器实例
     */
    getPathFinder(): PathFinder {
        return this._pathFinder;
    }

    /**
     * @method hasHint
     * @description 获取提示，返回一组可以消除的方块
     * @returns {[Point, Point] | null} 可消除的方块对，如果没有则返回null
     */
    hasHint(): [Point, Point] | null {
        return this._pathFinder.getHint();
    }

    /**
     * @method hasAnyValidPair
     * @description 判断当前地图是否还存在可消除的方块对
     * @returns {boolean} 是否存在可消除的方块对
     */
    hasAnyValidPair(): boolean {
        return this._pathFinder.hasAnyValidPair();
    }

    /**
     * @method _pairKey
     * @description 规范化坐标对生成唯一 key，消除 (p1,p2) 与 (p2,p1) 映射到同一 key
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @returns {string} 规范化 key
     * @private
     */
    private _pairKey(p1: Point, p2: Point): string {
        const a = p1.row * 1000 + p1.col;
        const b = p2.row * 1000 + p2.col;
        return Math.min(a, b) + "_" + Math.max(a, b);
    }

    /**
     * @method _addAllreadyRemoved
     * @description 记录一条已消除的方块坐标对，同一坐标对重复记录时次数累加
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @private
     */
    private _addAllreadyRemoved(p1: Point, p2: Point): void {
        const key = this._pairKey(p1, p2);
        this._allreadyRemoved.set(key, (this._allreadyRemoved.get(key) ?? 0) + 1);
    }

    /**
     * @method checkClientRemoved
     * @description 检查指定的方块是否已经被客户端消除，每次服务器确认消耗一条记录
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @returns {boolean} 如果已经被消除则返回 true，否则返回 false
     */
    checkClientRemoved(p1: Point, p2: Point): boolean {
        const key = this._pairKey(p1, p2);
        const count = this._allreadyRemoved.get(key);
        if (count === undefined) {
            return false;
        }

        Logger.log(`方块已被客户端消除: (${p1.row}, ${p1.col}) - (${p2.row}, ${p2.col})`);
        if (count <= 1) {
            this._allreadyRemoved.delete(key);
        } else {
            this._allreadyRemoved.set(key, count - 1);
        }
        return true;
    }

    /**
     * @method removeTilesWithAnimation
     * @description 服务器确认自己消除时，执行消除动画（连线 + 特效 + 隐藏方块），不发送网络请求
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @param {LineSegment[]} lines - 连接路径
     */
    removeTilesWithAnimation(p1: Point, p2: Point, lines: LineSegment[]): void {
        // 移动动画播放期间延迟处理，避免 _cubeMap 坐标错位
        if (this._isShifting) {
            this._deferredOps.push(() => {
                this.removeTilesWithAnimation(p1, p2, lines);
            });
            return;
        }

        const firstCube = this.getCube(p1.row, p1.col);
        const secondCube = this.getCube(p2.row, p2.col);

        if (!firstCube || !secondCube) return;
        if (!firstCube.visible || !secondCube.visible) return;

        this._clearSelection();

        this._showPathLines(lines);

        firstCube.UI_SP_ANI.visible = true;
        secondCube.UI_SP_ANI.visible = true;
        SpinePlay(firstCube.UI_SP_ANI, "action", false);
        SpinePlay(secondCube.UI_SP_ANI, "action", false);
        SoundManager.instance.playSoundEffect("game10002/bomb");

        this.scheduleOnce(() => {
            // 延迟执行期间可能开始了移动动画批次，此时需要延迟处理，避免坐标错位
            if (this._isShifting) {
                this._deferredOps.push(() => {
                    this._finishRemoveTilesWithAnimation(p1, p2);
                });
                return;
            }
            this._finishRemoveTilesWithAnimation(p1, p2);
        }, this._removeDelay);
    }

    /**
     * @method _finishRemoveTilesWithAnimation
     * @description 消除动画延迟后真正执行消除与数据移动
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @private
     */
    private _finishRemoveTilesWithAnimation(p1: Point, p2: Point): void {
        // 重新按坐标获取方块，避免延迟期间方块已移动导致引用错位
        const firstCube = this.getCube(p1.row, p1.col);
        const secondCube = this.getCube(p2.row, p2.col);
        if (!firstCube || !secondCube) return;
        if (!firstCube.visible || !secondCube.visible) return;

        this._mapManager.removeTiles(p1, p2);
        this._pathFinder.setMap(this._mapManager.getMap());

        firstCube.visible = false;
        firstCube.ctrl_selected.selectedIndex = 0;
        firstCube.UI_LOADER_ICOM.url = "";

        secondCube.visible = false;
        secondCube.ctrl_selected.selectedIndex = 0;
        secondCube.UI_LOADER_ICOM.url = "";

        this._clearPathLines();

        // 消除后剩余方块移动动画
        this._shiftAndAnimate();
    }

    /**
     * @method showOtherPlayerRemoveAnimation
     * @description 显示其他玩家消除的连线动画（不判断是否可以消除）
     * @param {Point} p1 - 第一个方块坐标
     * @param {Point} p2 - 第二个方块坐标
     * @param {LineSegment[]} lines - 连接路径
     */
    showOtherPlayerRemoveAnimation(p1: Point, p2: Point, lines: LineSegment[]): void {
        // 显示连线动画
        this._showPathLines(lines);

        // 延迟后清除连线
        this.scheduleOnce(() => {
            this._clearPathLines();
        }, this._removeDelay + 0.1);
    }
}
fgui.UIObjectFactory.setExtension(CompMap.URL, CompMap);
