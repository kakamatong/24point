/**
 * @file Solver.ts
 * @description 算24点(10003)求解器：服务端 solver.lua 的 TypeScript 移植。
 *              ① combine/solve 枚举全部组合方式（分数运算 + - * /），求目标值24的算式；
 *                 算式按“最小括号”规则拼字符串（仅保留优先级/结合性必需的括号）；
 *              ② solvable 判定4数是否有解（发牌可解校验用）；
 *              ③ deal 发牌：随机生成可解4数，失败100次后从预置组合取并打乱兜底，保证有解。
 *              分数运算复用 Expression.ts 已导出的 calc/FRACTION（= 服务端 expression.lua 等价实现，
 *              见规格§4 结论：Expression.ts 为 expression.lua 逐函数移植）；Expression.ts 未导出
 *              fractionAdd/fractionSub 等底层函数，故此处经 calc 统一入口做四则运算，语义与服务端
 *              expression.lua add/sub/mul/div 一致（除法分母分子为0返回 null，combine 内丢弃）。
 * @category 游戏 10003
 */

import { calc } from "./Expression";
import type { FRACTION } from "./Expression";
import { TARGET_VALUE, DEAL_COUNT } from "./GameRoundConfig";

/** 运算符优先级：+ - 为 1，* / 为 2；叶子数字为 3（高于任何运算符，永不需括号） */
const OP_PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
const NUM_PREC = 3;

/**
 * @interface SOLVER_NODE
 * @description 求解节点：一个分数值 + 其对应的算式字符串（叶子节点为单个数字）
 */
export interface SOLVER_NODE {
    /** 分数值（始终约分且分母为正） */
    value: FRACTION;
    /** 算式字符串（最小括号） */
    expr: string;
    /** 算式顶层优先级（+ - 为1，* / 为2；叶子数字为3） */
    prec: number;
}

/**
 * @property {number[][]} PRESET_SOLVABLE - 预置可解组合（发牌随机失败后的兜底来源，
 *              全部为经典24点有解组合；来源：solver.lua:101-120）
 */
export const PRESET_SOLVABLE: number[][] = [
    [3, 3, 8, 8], // 8/(3-8/3)
    [1, 5, 5, 5], // 5*(5-1/5)
    [3, 3, 7, 7], // 7*(3+3/7)
    [4, 4, 7, 7], // 7*(4-4/7)
    [1, 3, 4, 6], // 6/(1-3/4)
    [1, 4, 5, 6], // 6/(5/4-1)
    [1, 2, 7, 7], // (7*7-1)/2
    [2, 2, 6, 8], // (8*2)+6+2
    [2, 3, 5, 7], // 7*(5-2)+3
    [4, 6, 6, 9], // (9-4)*6-6
];

/**
 * @method randInt
 * @description Lua math.random(min,max) 闭区间整数随机等价（来源：规格§3；随机源为均匀整数）
 * @param {number} min - 下限（含）
 * @param {number} max - 上限（含）
 * @returns {number} [min,max] 内的随机整数
 */
export function randInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * @method exprOf
 * @description 按最小括号规则拼接 a op b 的算式（不改变数值语义）：
 *              左子式：优先级低于父运算时加括号（左结合，同级不加）；
 *              右子式：优先级低于父运算时加括号，或与父运算同级且父运算为 - / 时加括号（右结合性）
 * @param {SOLVER_NODE} a - 左节点
 * @param {string} op - 运算符（+ - * /）
 * @param {SOLVER_NODE} b - 右节点
 * @returns {{expr: string, prec: number}} 算式字符串与其顶层优先级
 * @private
 */
function exprOf(a: SOLVER_NODE, op: string, b: SOLVER_NODE): { expr: string; prec: number } {
    const prec = OP_PREC[op];
    const left = a.prec < prec ? `(${a.expr})` : a.expr;
    const rightNeedsParen = b.prec < prec || (b.prec === prec && (op === "-" || op === "/"));
    const right = rightNeedsParen ? `(${b.expr})` : b.expr;
    return { expr: `${left}${op}${right}`, prec };
}

/**
 * @method combineNode
 * @description 对两节点执行一次指定运算生成新节点（分数运算无效时返回 null，如除数为0）
 * @param {SOLVER_NODE} a - 左节点
 * @param {string} op - 运算符："+"、"-"、"*"、"/"
 * @param {SOLVER_NODE} b - 右节点
 * @returns {SOLVER_NODE | null} 合并后的新节点（算式按最小括号规则），运算非法时返回 null
 * @private
 */
function combineNode(a: SOLVER_NODE, op: string, b: SOLVER_NODE): SOLVER_NODE | null {
    const value = calc(a.value, op, b.value);
    if (!value) {
        return null;
    }
    const { expr, prec } = exprOf(a, op, b);
    return { value, expr, prec };
}

/**
 * @method combine
 * @description 对两个节点做全部有向运算（+、a-b、b-a、*、a/b、b/a），返回新节点数组；
 *              减法/除法各两个方向，除法在分子为0时跳过（来源：solver.lua:28-43 combine）
 * @param {SOLVER_NODE} a - 节点a
 * @param {SOLVER_NODE} b - 节点b
 * @returns {SOLVER_NODE[]} 合并结果数组（最多6个，表达式带全括号）
 */
export function combine(a: SOLVER_NODE, b: SOLVER_NODE): SOLVER_NODE[] {
    const out: SOLVER_NODE[] = [];
    // 加法/减法（两方向）/乘法恒有结果（分母不可能为0）
    const add = combineNode(a, "+", b);
    if (add) {
        out.push(add);
    }
    const subAB = combineNode(a, "-", b);
    if (subAB) {
        out.push(subAB);
    }
    const subBA = combineNode(b, "-", a);
    if (subBA) {
        out.push(subBA);
    }
    const mul = combineNode(a, "*", b);
    if (mul) {
        out.push(mul);
    }
    // 除法：除数分子为0（值为0）时无意义，跳过
    if (b.value.n !== 0) {
        const divAB = combineNode(a, "/", b);
        if (divAB) {
            out.push(divAB);
        }
    }
    if (a.value.n !== 0) {
        const divBA = combineNode(b, "/", a);
        if (divBA) {
            out.push(divBA);
        }
    }
    return out;
}

/**
 * @method solve
 * @description 递归求解：任取两节点(i<j)做全部运算合并后继续递归，剩1个节点且值恰为目标值24时返回其算式；
 *              返回第一个可行解（来源：solver.lua:44-78 solve）
 * @param {SOLVER_NODE[]} nodes - 当前节点数组
 * @returns {string | null} 可行算式字符串（含全括号），无解返回 null
 */
export function solve(nodes: SOLVER_NODE[]): string | null {
    const cnt = nodes.length;
    if (cnt === 1) {
        const v = nodes[0].value;
        return v.n === TARGET_VALUE && v.d === 1 ? nodes[0].expr : null;
    }
    for (let i = 0; i < cnt - 1; i++) {
        for (let j = i + 1; j < cnt; j++) {
            // 剩余节点（不含 i/j）
            const rest: SOLVER_NODE[] = [];
            for (let k = 0; k < cnt; k++) {
                if (k !== i && k !== j) {
                    rest.push(nodes[k]);
                }
            }
            for (const merged of combine(nodes[i], nodes[j])) {
                const expr = solve([merged, ...rest]);
                if (expr) {
                    return expr;
                }
            }
        }
    }
    return null;
}

/**
 * @method solveNumbers
 * @description 求解4个数字的第一组可行算式；numbers 必须恰好4个否则返回 null（来源：solver.lua:80-94 solve）
 * @param {number[]} numbers - 4个发牌数字
 * @returns {string | null} 可行算式字符串（含全括号），无解或数量不对返回 null
 */
export function solveNumbers(numbers: number[]): string | null {
    if (!numbers || numbers.length !== DEAL_COUNT) {
        return null;
    }
    const nodes: SOLVER_NODE[] = numbers.map((n) => ({ value: { n, d: 1 }, expr: `${n}`, prec: NUM_PREC }));
    return solve(nodes);
}

/**
 * @method solvable
 * @description 判断4个数字是否存在可行解（发牌随机校验用；来源：solver.lua:95-99 solvable）
 * @param {number[]} numbers - 4个数字
 * @returns {boolean} true 可解
 */
export function solvable(numbers: number[]): boolean {
    return solveNumbers(numbers) !== null;
}

/**
 * @method deal
 * @description 生成一组保证有解的4个数字：随机生成并做可解校验，最多尝试100次；
 *              仍失败则从10组预置可解组合随机取1组并倒序 Fisher-Yates 打乱兜底（来源：solver.lua:121-147 deal）
 * @param {number} [min=1] - 数字下限（含，默认1 = config.lua NUMBER_RANGE.MIN）
 * @param {number} [max=9] - 数字上限（含，默认9 = config.lua NUMBER_RANGE.MAX）
 * @returns {number[]} 4个有解数字
 */
export function deal(min: number = 1, max: number = 9): number[] {
    for (let i = 0; i < 100; i++) {
        const numbers = [randInt(min, max), randInt(min, max), randInt(min, max), randInt(min, max)];
        if (solvable(numbers)) {
            return numbers;
        }
    }
    // 兜底：预置可解组合随机取一组并打乱顺序
    const preset = PRESET_SOLVABLE[randInt(0, PRESET_SOLVABLE.length - 1)].slice();
    for (let i = preset.length - 1; i >= 1; i--) {
        const j = randInt(0, i);
        const tmp = preset[i];
        preset[i] = preset[j];
        preset[j] = tmp;
    }
    return preset;
}
