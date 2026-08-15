/**
 * @file gen_chapter.js
 * @description 闯关章节配置生成脚本：根据模板库、逐关映射与数值公式，确定性生成 4 个章节配置文件
 * @category 工具脚本
 *
 * 运行方式：
 *   node tools/gen_chapter.js config/chapter
 *
 * 生成文件：
 *   config/chapter/chapter_0.json（章1：30 关，type=2，boss 9/19/29）
 *   config/chapter/chapter_1.json（章2：40 关，type=1，boss 39/49/59/69）
 *   config/chapter/chapter_2.json（章3：50 关，type 每 10 关轮换，boss 79/89/99/109/119）
 *   config/chapter/chapter_3.json（章4：60 关，type 每 10 关轮换，boss 129/139/149/159/169/179，开启挤压玩法）
 *
 * 规则：
 *  - 模板最小 48 块，外圈恒 0，1 恒双数
 *  - 章1-3 iconTypes = clamp(round(p*0.35)+boss*3, 6, 22)
 *  - 章4 iconTypes 顶格 22，对子数 36 起步，全部开启 shiftDir（固定 seed 随机 2-5）+ shiftEdge=2
 *  - 章1-3 type=2: starScore=[p, p+round(0.5p), 2p]；boss [p, p+round(0.7p), round(2.5p)]；targetScore=p / round(1.2p)
 *  - 章4 type=2: starScore=[round(1.1p), p+round(0.6p), round(2.2p)]；boss [round(1.3p), p+round(0.8p), round(2.8p)]
 *  - 章1-3 type=1: totalTime=6p+15, starTime=[15, 2p+15, 4p+15]；boss 5p+15 / [15, 2p+15, 3p+15]
 *  - 章4 type=1: totalTime=4p+15, starTime=[15, 1.5p+15, 2.5p+15]；boss 3p+15 / [15, p+15, 1.5p+15]
 *  - 生成脚本内置全部校验断言，不满足即报错退出
 */
const fs = require("fs");
const path = require("path");

// ============ 模板 ============
function makeMap() {
  const m = [];
  for (let r = 0; r < 16; r++) m.push(new Array(10).fill(0));
  return m;
}
function set(m, rows, cols) {
  for (const r of rows) for (const c of cols) m[r][c] = 1;
}
function range(a, b) {
  const o = [];
  for (let i = a; i <= b; i++) o.push(i);
  return o;
}
const C18 = range(1, 8);

const T = {};
{
  // I 菱形 48
  let m = makeMap();
  set(m, [1], range(4, 5));
  set(m, [2], range(3, 6));
  set(m, [3], range(2, 7));
  set(m, [4, 5, 6], C18);
  set(m, [7], range(2, 7));
  set(m, [8], range(3, 6));
  set(m, [9], range(4, 5));
  T["I"] = m;
  // K 三宽带 48
  m = makeMap();
  set(m, [2, 3, 7, 8, 12, 13], C18);
  T["K"] = m;
  // H 棋盘 56
  m = makeMap();
  for (let r = 1; r <= 14; r++)
    for (let c = 1; c <= 8; c++) if ((r + c) % 2 === 0) m[r][c] = 1;
  T["H"] = m;
  // L 回字小 64
  m = makeMap();
  set(m, range(3, 12), C18);
  for (let r = 6; r <= 9; r++) for (let c = 3; c <= 6; c++) m[r][c] = 0;
  T["L"] = m;
  // M 四象限 72
  m = makeMap();
  for (const rs of [range(2, 7), range(9, 14)])
    for (const cs of [range(1, 3), range(6, 8)]) set(m, rs, cs);
  T["M"] = m;
  // N U形 72
  m = makeMap();
  set(m, range(1, 4), C18);
  set(m, range(5, 14), [1, 2]);
  set(m, range(5, 14), [7, 8]);
  T["N"] = m;
  // P 砖墙 80
  m = makeMap();
  const even = [];
  const odd = [];
  for (let r = 2; r <= 14; r += 2) even.push(r);
  for (let r = 3; r <= 13; r += 2) odd.push(r);
  set(m, even, C18);
  set(m, odd, [1, 2, 7, 8]);
  T["P"] = m;
  // O 六竖条 84
  m = makeMap();
  set(m, range(1, 14), [1, 2, 4, 5, 7, 8]);
  T["O"] = m;
  // Q 回字大 88
  m = makeMap();
  set(m, range(1, 14), C18);
  for (let r = 5; r <= 10; r++) for (let c = 3; c <= 6; c++) m[r][c] = 0;
  T["Q"] = m;
  // R 三角 100
  m = makeMap();
  set(m, [1], range(4, 5));
  set(m, [2], range(3, 6));
  set(m, [3], range(2, 7));
  set(m, range(4, 14), C18);
  T["R"] = m;
  // S 全满 112
  m = makeMap();
  set(m, range(1, 14), C18);
  T["S"] = m;
}

// ============ 每关映射 [模板, boss] ============
// 前期: 24,24,28,32,36,36,40,42,44 | boss 50
// 中期: 32,36,36,40,42,44,50,56,50 | boss 56
// 后期: 36,36,40,42,44,50,56,50,44 | boss 56
const PHASE_A = [["I", 0], ["K", 0], ["H", 0], ["L", 0], ["M", 0], ["N", 0], ["P", 0], ["O", 0], ["Q", 0]];
const PHASE_B = [["L", 0], ["M", 0], ["N", 0], ["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0]];
const PHASE_C = [["M", 0], ["N", 0], ["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0]];

const CH1 = [...PHASE_A.map(([t]) => [t, 0]), ["R", 1], ...PHASE_B.map(([t]) => [t, 0]), ["S", 1], ...PHASE_C.map(([t]) => [t, 0]), ["S", 1]];
const CH2 = [...PHASE_A.map(([t]) => [t, 0]), ["R", 1], ...PHASE_B.map(([t]) => [t, 0]), ["S", 1], ...PHASE_B.map(([t]) => [t, 0]), ["S", 1], ...PHASE_C.map(([t]) => [t, 0]), ["S", 1]];
// 章3 五组：type=2 组与 type=1 组交替（70-79 type2, 80-89 type1, 90-99 type2, 100-109 type1, 110-119 type2）
const CH3_GROUP = [
  { type: 2, boss: 9, levels: [...PHASE_A.map(([t]) => [t, 0]), ["R", 1]] },
  { type: 1, boss: 9, levels: [...PHASE_B.map(([t]) => [t, 0]), ["S", 1]] },
  { type: 2, boss: 9, levels: [...PHASE_B.map(([t]) => [t, 0]), ["S", 1]] },
  { type: 1, boss: 9, levels: [...PHASE_C.map(([t]) => [t, 0]), ["S", 1]] },
  { type: 2, boss: 9, levels: [...PHASE_B.map(([t]) => [t, 0]), ["S", 1]] },
];

// ============ 章4（chapter_3.json）：60 关，index 120-179，难度再增一档 ============
// 6 组每 10 关轮换 type=2/1（120-129 type2 ... 170-179 type1），每组末关 boss（129/139/149/159/169/179）
// 对子数起步抬高：组1-2 36 起步、组3-4 40 起步、组5-6 44 起步，boss 全 56
// iconTypes 顶格 22，全部开启挤压玩法（shiftDir 随机 2-5，shiftEdge=2）
// 公式：
//  - type=2: starScore=[round(1.1p), p+round(0.6p), round(2.2p)]；boss [round(1.3p), p+round(0.8p), round(2.8p)]；targetScore=round(1.1p)/round(1.3p)
//  - type=1: totalTime=4p+15, starTime=[15, 1.5p+15, 2.5p+15]；boss totalTime=3p+15, starTime=[15, p+15, 1.5p+15]
const CH4_GROUP = [
  { type: 2, levels: [["M", 0], ["N", 0], ["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["S", 1]] },
  { type: 1, levels: [["N", 0], ["M", 0], ["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["Q", 0], ["R", 0], ["S", 1]] },
  { type: 2, levels: [["P", 0], ["O", 0], ["Q", 0], ["R", 0], ["S", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["S", 1]] },
  { type: 1, levels: [["O", 0], ["P", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["R", 0], ["Q", 0], ["S", 1]] },
  { type: 2, levels: [["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["S", 1]] },
  { type: 1, levels: [["R", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["Q", 0], ["R", 0], ["S", 0], ["R", 0], ["S", 1]] },
];

/**
 * 固定 seed 伪随机（mulberry32），保证生成结果可复现
 */
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = seededRandom(20260812);

// ============ 数值公式 ============
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function calcIcon(p, boss) {
  return clamp(Math.round(p * 0.35) + (boss ? 3 : 0), 6, 22);
}
function calcScoring(p, boss) {
  if (boss) {
    return {
      starScore: [p, p + Math.round(p * 0.7), Math.round(p * 2.5)],
      targetScore: Math.round(p * 1.2),
    };
  }
  return { starScore: [p, p + Math.round(p * 0.5), p * 2], targetScore: p };
}
function calcTiming(p, boss) {
  if (boss) {
    return { totalTime: 5 * p + 15, starTime: [15, 2 * p + 15, 3 * p + 15] };
  }
  return { totalTime: 6 * p + 15, starTime: [15, 2 * p + 15, 4 * p + 15] };
}
// 章4 进阶公式
function calcScoring4(p, boss) {
  if (boss) {
    return {
      starScore: [Math.round(p * 1.3), p + Math.round(p * 0.8), Math.round(p * 2.8)],
      targetScore: Math.round(p * 1.3),
    };
  }
  return { starScore: [Math.round(p * 1.1), p + Math.round(p * 0.6), Math.round(p * 2.2)], targetScore: Math.round(p * 1.1) };
}
function calcTiming4(p, boss) {
  if (boss) {
    return { totalTime: 3 * p + 15, starTime: [15, p + 15, 1.5 * p + 15] };
  }
  return { totalTime: 4 * p + 15, starTime: [15, 1.5 * p + 15, 2.5 * p + 15] };
}

// ============ 校验 ============
function countOnes(m) {
  let n = 0;
  for (let r = 0; r < 16; r++) for (let c = 0; c < 10; c++) if (m[r][c] === 1) n++;
  return n;
}
function validateMap(name, m) {
  if (m.length !== 16) throw new Error(`${name}: 行数 != 16`);
  for (const row of m) if (row.length !== 10) throw new Error(`${name}: 列数 != 10`);
  for (let c = 0; c < 10; c++) {
    if (m[0][c] !== 0 || m[15][c] !== 0) throw new Error(`${name}: 外圈(上下)非 0`);
  }
  for (let r = 0; r < 16; r++) {
    if (m[r][0] !== 0 || m[r][9] !== 0) throw new Error(`${name}: 外圈(左右)非 0`);
  }
  const n = countOnes(m);
  if (n % 2 !== 0) throw new Error(`${name}: 1 的个数 ${n} 不是双数`);
  return n;
}

const expectedTiles = { I: 48, K: 48, H: 56, L: 64, M: 72, N: 72, P: 80, O: 84, Q: 88, R: 100, S: 112 };
for (const [k, m] of Object.entries(T)) {
  const n = validateMap(`模板${k}`, m);
  if (n !== expectedTiles[k]) throw new Error(`模板${k}: 方块数 ${n} != 期望 ${expectedTiles[k]}`);
}

// ============ 生成 ============
function buildEntry(chapter, index, tmplName, boss, type) {
  const map = T[tmplName].map((r) => r.slice());
  const p = countOnes(map) / 2;
  const iconTypes = calcIcon(p, boss);
  const e = { chapter, index, map, iconTypes, type, boss, energy: 5 };
  if (type === 1) {
    const t = calcTiming(p, boss);
    const starTime = t.starTime.map((x) => Math.round(x));
    const totalTime = Math.round(t.totalTime);
    if (!(starTime[0] < starTime[1] && starTime[1] < starTime[2])) throw new Error(`L${index}: starTime 未递增`);
    if (!(starTime[2] < totalTime)) throw new Error(`L${index}: starTime[2] >= totalTime`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, totalTime, starTime };
  } else {
    const s = calcScoring(p, boss);
    const starScore = s.starScore.map((x) => Math.round(x));
    if (!(starScore[0] < starScore[1] && starScore[1] < starScore[2])) throw new Error(`L${index}: starScore 未严格递增`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, starScore, targetScore: Math.round(s.targetScore) };
  }
}

/**
 * 章4 关卡构建：难度再增一档 + 开启挤压玩法（shiftDir 随机 2-5，shiftEdge=2）
 */
function buildEntry4(index, tmplName, boss, type) {
  const map = T[tmplName].map((r) => r.slice());
  const p = countOnes(map) / 2;
  const iconTypes = 22; // 顶格
  const e = { chapter: 3, index, map, iconTypes, type, boss, energy: 5, shiftDir: 2 + Math.floor(rand() * 4), shiftEdge: 2 };
  if (type === 1) {
    const t = calcTiming4(p, boss);
    const starTime = t.starTime.map((x) => Math.round(x));
    const totalTime = Math.round(t.totalTime);
    if (!(starTime[0] < starTime[1] && starTime[1] < starTime[2])) throw new Error(`L${index}: starTime 未递增`);
    if (!(starTime[2] < totalTime)) throw new Error(`L${index}: starTime[2] >= totalTime`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, totalTime, starTime };
  } else {
    const s = calcScoring4(p, boss);
    const starScore = s.starScore.map((x) => Math.round(x));
    if (!(starScore[0] < starScore[1] && starScore[1] < starScore[2])) throw new Error(`L${index}: starScore 未严格递增`);
    if (iconTypes > p) throw new Error(`L${index}: iconTypes(${iconTypes}) > p(${p})`);
    return { ...e, starScore, targetScore: Math.round(s.targetScore) };
  }
}

const outDir = process.argv[2];
const files = [];
const allIndexes = [];

{
  const list = [];
  CH1.forEach(([t, b], i) => {
    const idx = i;
    allIndexes.push(idx);
    list.push(buildEntry(0, idx, t, b, 2));
  });
  files.push({ file: "chapter_0.json", list });
}
{
  const list = [];
  CH2.forEach(([t, b], i) => {
    const idx = 30 + i;
    allIndexes.push(idx);
    list.push(buildEntry(1, idx, t, b, 1));
  });
  files.push({ file: "chapter_1.json", list });
}
{
  const list = [];
  let base = 70;
  CH3_GROUP.forEach((g) => {
    g.levels.forEach(([t, b], i) => {
      const idx = base + i;
      allIndexes.push(idx);
      list.push(buildEntry(2, idx, t, b, g.type));
    });
    base += 10;
  });
  files.push({ file: "chapter_2.json", list });
}
{
  const list = [];
  let base = 120;
  CH4_GROUP.forEach((g) => {
    g.levels.forEach(([t, b], i) => {
      const idx = base + i;
      allIndexes.push(idx);
      list.push(buildEntry4(idx, t, b, g.type));
    });
    base += 10;
  });
  files.push({ file: "chapter_3.json", list });
}

// index 全局连续性校验
for (let i = 0; i < allIndexes.length; i++) {
  if (allIndexes[i] !== i) throw new Error(`index 不连续: ${allIndexes[i]} != ${i}`);
}
if (allIndexes.length !== 180) throw new Error(`关卡总数 ${allIndexes.length} != 180`);

// 写入
for (const f of files) {
  const filePath = path.join(outDir, f.file);
  fs.writeFileSync(filePath, JSON.stringify(f.list, null, 2) + "\n", "utf8");
  console.log(`写入 ${f.file}: ${f.list.length} 关`);
}

// 摘要
for (const f of files) {
  const list = f.list;
  console.log(`\n=== ${f.file} ===`);
  for (const e of list) {
    const extra = e.type === 1 ? `totalTime=${e.totalTime} starTime=[${e.starTime}]` : `starScore=[${e.starScore}] target=${e.targetScore}`;
    const shift = e.shiftDir !== undefined ? ` shiftDir=${e.shiftDir} edge=${e.shiftEdge}` : "";
    console.log(`L${String(e.index).padStart(3)} ${e.boss ? "BOSS " : "    "} type=${e.type} p=${countOnes(e.map) / 2} iconTypes=${e.iconTypes} ${extra}${shift}`);
  }
}
