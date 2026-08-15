/**
 * @file mapGenerator.ts
 * @description 连连看地图生成器：根据设计配置生成地图，支持障碍物和多图标类型分配
 * @category 本地游戏
 */

import { MAP_DESIGN_CONFIG } from "./mapConfig";
import { Logger } from "@frameworks/utils/Utils";

// ============================================
// 地图生成
// ============================================

/** 障碍物初始值（障碍物编号以此为基准递增，避免与图标类型冲突） */
const DECORATION_VALUE = 100;

/**
 * 根据设计配置生成连连看地图
 *
 * 算法流程：
 * 1. 扫描设计地图，收集可填充位置
 * 2. 按图标类型数量平均分配图标（确保每种为偶数）
 * 3. Fisher-Yates 洗牌（3 轮）打乱顺序
 * 4. 按位置填充图标和障碍物编号
 *
 * @param designMap - 设计地图 10×10（0=边界, 1=填充位, 9=障碍）
 * @param rows - 地图行数
 * @param cols - 地图列数
 * @param iconTypes - 图标类型数量
 * @returns 生成的地图（0=空, 1~iconTypes=图标, 100+=障碍）
 */
export function generateFromDesign(designMap: number[][], rows: number, cols: number, iconTypes: number): number[][] {
    // 收集可填充位置
    const fillPositions: { row: number; col: number }[] = [];

    // 初始化地图（全 0）
    const map: number[][] = [];

    const mapLength = designMap ? designMap.length : 0;
    for (let row = 0; row < mapLength; row++) {
        map[row] = [];
        for (let col = 0; col < designMap[row].length; col++) {
            map[row][col] = 0; // 默认空
            if (designMap[row][col] === 1) {
                fillPositions.push({ row, col });
            }
        }
    }

    const totalBlocks = fillPositions.length;

    // 平均分配图标（每种图标数量尽可能接近，且必须为偶数）
    let baseCount = Math.floor(totalBlocks / iconTypes);
    if (baseCount % 2 !== 0) {
        baseCount = baseCount - 1;
    }
    const remainder = totalBlocks - baseCount * iconTypes;
    const typesWithExtra = Math.floor(remainder / 2);

    // 创建图标池
    const iconPool: number[] = [];
    for (let iconType = 1; iconType <= iconTypes; iconType++) {
        let count = baseCount;
        if (iconType <= typesWithExtra) {
            count = count + 2;
        }
        for (let i = 0; i < count; i++) {
            iconPool.push(iconType);
        }
    }

    // Fisher-Yates 洗牌算法（多轮打乱，确保随机性）
    const shuffleRounds = 3;
    for (let round = 0; round < shuffleRounds; round++) {
        for (let i = iconPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [iconPool[i], iconPool[j]] = [iconPool[j], iconPool[i]];
        }
    }

    // 填充可消除方块
    for (let i = 0; i < fillPositions.length; i++) {
        const pos = fillPositions[i];
        map[pos.row][pos.col] = iconPool[i];
    }

    // 填充障碍物（编号从 101 开始）
    let obstacleIdx = 0;
    for (let row = 0; row < mapLength; row++) {
        for (let col = 0; col < designMap[row].length; col++) {
            if (designMap[row][col] === 9) {
                map[row][col] = DECORATION_VALUE + (obstacleIdx + 1);
                obstacleIdx++;
            }
        }
    }

    return map;
}

/**
 * 从配置中随机选取一个设计并生成地图
 * @returns { map, design } - 生成的地图和对应的设计配置
 */
export function generateRandomMap(): { map: number[][]; design: (typeof MAP_DESIGN_CONFIG)[number] } {
    let index = Math.floor(Math.random() * MAP_DESIGN_CONFIG.length);
    Logger.log(`随机选择地图设计索引: ${index}`);
    //index = MAP_DESIGN_CONFIG.length - 1
    const design = MAP_DESIGN_CONFIG[index];
    const map = generateFromDesign(design.map, design.defaultRows, design.defaultCols, design.iconTypes);
    return { map, design };
}

/**
 * 获取指定的地图设计配置
 * @param index - 配置索引（从 0 开始）
 * @returns 地图设计配置，不存在时返回 undefined
 */
export function getDesignByIndex(index: number): (typeof MAP_DESIGN_CONFIG)[number] | undefined {
    return MAP_DESIGN_CONFIG[index];
}
