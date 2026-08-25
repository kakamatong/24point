/**
 * @file Expression.ts
 * @description 算24点(10003)表达式校验模块（服务端 expression.lua 的 TypeScript 移植）
 * @category 游戏 10003
 */

/**
 * @interface FRACTION
 * @description 分数统一用 {n=分子, d=分母} 表示，始终约分且分母为正
 */
export interface FRACTION {
    n: number;
    d: number;
}

/**
 * @interface VALIDATE_RESULT
 * @description 表达式校验结果
 */
export interface VALIDATE_RESULT {
    ok: boolean;
    msg: string | null;
    value: FRACTION | null;
}

/** token 类型：num 数字 / op 运算符 / lparen 左括号 / rparen 右括号 */
type TOKEN =
    | { type: "num"; value: number }
    | { type: "op"; value: string }
    | { type: "lparen" }
    | { type: "rparen" };

/**
 * @method gcd
 * @description 最大公约数（欧几里得算法）
 * @param {number} a - 数值a
 * @param {number} b - 数值b
 * @returns {number} 最大公约数
 * @private
 */
function gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const t = a % b;
        a = b;
        b = t;
    }
    return a;
}

/**
 * @method fraction
 * @description 构造分数（约分），分母为0返回 null
 * @param {number} n - 分子
 * @param {number} d - 分母
 * @returns {FRACTION | null} 约分后的分数，分母为0时返回 null
 * @private
 */
function fraction(n: number, d: number): FRACTION | null {
    if (d === 0) {
        return null;
    }
    if (d < 0) {
        n = -n;
        d = -d;
    }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
}

/**
 * @method fractionAdd
 * @description 分数加法
 * @param {FRACTION} a - 分数a
 * @param {FRACTION} b - 分数b
 * @returns {FRACTION | null} 结果分数
 * @private
 */
function fractionAdd(a: FRACTION, b: FRACTION): FRACTION | null {
    return fraction(a.n * b.d + b.n * a.d, a.d * b.d);
}

/**
 * @method fractionSub
 * @description 分数减法
 * @param {FRACTION} a - 分数a
 * @param {FRACTION} b - 分数b
 * @returns {FRACTION | null} 结果分数
 * @private
 */
function fractionSub(a: FRACTION, b: FRACTION): FRACTION | null {
    return fraction(a.n * b.d - b.n * a.d, a.d * b.d);
}

/**
 * @method fractionMul
 * @description 分数乘法
 * @param {FRACTION} a - 分数a
 * @param {FRACTION} b - 分数b
 * @returns {FRACTION | null} 结果分数
 * @private
 */
function fractionMul(a: FRACTION, b: FRACTION): FRACTION | null {
    return fraction(a.n * b.n, a.d * b.d);
}

/**
 * @method fractionDiv
 * @description 分数除法，除数为0返回 null
 * @param {FRACTION} a - 分数a
 * @param {FRACTION} b - 分数b
 * @returns {FRACTION | null} 结果分数，除数为0时返回 null
 * @private
 */
function fractionDiv(a: FRACTION, b: FRACTION): FRACTION | null {
    if (b.n === 0) {
        return null;
    }
    return fraction(a.n * b.d, a.d * b.n);
}

/**
 * @method tokenize
 * @description 分词器：将表达式字符串拆分为 token 列表
 * @param {string} str - 表达式字符串
 * @returns {{ tokens: TOKEN[] } | { err: string }} token 列表或错误信息
 * @private
 */
function tokenize(str: string): { tokens: TOKEN[] } | { err: string } {
    const tokens: TOKEN[] = [];
    let i = 0;
    const len = str.length;
    while (i < len) {
        const c = str[i];
        if (/\s/.test(c)) {
            i = i + 1;
        } else if (/\d/.test(c)) {
            const start = i;
            while (i < len && /\d/.test(str[i])) {
                i = i + 1;
            }
            const num = parseInt(str.substring(start, i), 10);
            if (isNaN(num)) {
                return { err: "数字解析失败" };
            }
            tokens.push({ type: "num", value: num });
        } else if (c === "+" || c === "-" || c === "*" || c === "/") {
            tokens.push({ type: "op", value: c });
            i = i + 1;
        } else if (c === "(") {
            tokens.push({ type: "lparen" });
            i = i + 1;
        } else if (c === ")") {
            tokens.push({ type: "rparen" });
            i = i + 1;
        } else {
            return { err: `包含非法字符: ${c}` };
        }
    }
    return { tokens };
}

/**
 * @class Parser
 * @description 递归下降解析器，语法：expr := term (('+'|'-') term)*，term := factor (('*'|'/') factor)*，factor := ('+'|'-') factor | number | '(' expr ')'
 * @private
 */
class Parser {
    private _tokens: TOKEN[];
    private _pos = 0;

    constructor(tokens: TOKEN[]) {
        this._tokens = tokens;
    }

    peek(): TOKEN | undefined {
        return this._tokens[this._pos];
    }

    next(): TOKEN | undefined {
        const t = this._tokens[this._pos];
        this._pos = this._pos + 1;
        return t;
    }

    parseExpr(): FRACTION | null {
        let left = this.parseTerm();
        if (!left) {
            return null;
        }
        while (true) {
            const t = this.peek();
            if (!t || t.type !== "op" || (t.value !== "+" && t.value !== "-")) {
                return left;
            }
            this.next();
            const right = this.parseTerm();
            if (!right) {
                return null;
            }
            left = t.value === "+" ? fractionAdd(left, right) : fractionSub(left, right);
            if (!left) {
                return null;
            }
        }
    }

    parseTerm(): FRACTION | null {
        let left = this.parseFactor();
        if (!left) {
            return null;
        }
        while (true) {
            const t = this.peek();
            if (!t || t.type !== "op" || (t.value !== "*" && t.value !== "/")) {
                return left;
            }
            this.next();
            const right = this.parseFactor();
            if (!right) {
                return null;
            }
            left = t.value === "*" ? fractionMul(left, right) : fractionDiv(left, right);
            if (!left) {
                return null;
            }
        }
    }

    parseFactor(): FRACTION | null {
        const t = this.peek();
        if (!t) {
            return null;
        }
        if (t.type === "op" && (t.value === "+" || t.value === "-")) {
            this.next();
            const v = this.parseFactor();
            if (!v) {
                return null;
            }
            if (t.value === "-") {
                return fraction(-v.n, v.d);
            }
            return v;
        } else if (t.type === "num") {
            this.next();
            return fraction(t.value, 1);
        } else if (t.type === "lparen") {
            this.next();
            const v = this.parseExpr();
            if (!v) {
                return null;
            }
            const r = this.next();
            if (!r || r.type !== "rparen") {
                return null;
            }
            return v;
        }
        return null;
    }
}

/**
 * @method evaluate
 * @description 解析并求值表达式
 * @param {string} str - 表达式字符串
 * @returns {{ value: FRACTION | null; err: string | null }} 成功返回分数，失败返回错误信息
 */
export function evaluate(str: string): { value: FRACTION | null; err: string | null } {
    if (!str || str === "") {
        return { value: null, err: "表达式为空" };
    }
    const tokenized = tokenize(str);
    if ("err" in tokenized) {
        return { value: null, err: tokenized.err };
    }
    const parser = new Parser(tokenized.tokens);
    const value = parser.parseExpr();
    if (!value) {
        return { value: null, err: "表达式语法错误" };
    }
    // 必须消费完所有token（防 "1+2)" 这类尾部多余字符）
    if (parser.peek()) {
        return { value: null, err: "表达式语法错误" };
    }
    return { value, err: null };
}

/**
 * @method validate
 * @description 校验玩家提交的算式：结果必须等于整数24，且使用的数字与发牌数字集合完全一致（每个数字恰好用一次）
 * @param {string} exprStr - 玩家提交的算式
 * @param {number[]} numbers - 本局发牌数字
 * @returns {VALIDATE_RESULT} 校验结果（ok 是否通过，msg 失败原因，value 成功时的结果分数）
 */
export function validate(exprStr: string, numbers: number[]): VALIDATE_RESULT {
    if (!exprStr || exprStr === "") {
        return { ok: false, msg: "表达式为空", value: null };
    }
    // 长度保护，防超大输入（正常算式远小于此长度）
    if (exprStr.length > 200) {
        return { ok: false, msg: "表达式过长", value: null };
    }

    const tokenized = tokenize(exprStr);
    if ("err" in tokenized) {
        return { ok: false, msg: tokenized.err, value: null };
    }

    // 解析求值
    const parser = new Parser(tokenized.tokens);
    const value = parser.parseExpr();
    if (!value || parser.peek()) {
        return { ok: false, msg: "表达式语法错误", value: null };
    }

    // 检查结果是否等于24
    if (!(value.n === 24 && value.d === 1)) {
        return { ok: false, msg: "结果不等于24", value: null };
    }

    // 检查使用的数字与发牌数字集合一致（每个数字恰好用一次，不允许其他数字）
    const usedCount = new Map<number, number>();
    const expectedCount = new Map<number, number>();
    for (const n of numbers) {
        expectedCount.set(n, (expectedCount.get(n) || 0) + 1);
    }
    for (const t of tokenized.tokens) {
        if (t.type === "num") {
            const n = t.value;
            const expected = expectedCount.get(n);
            if (expected === undefined) {
                return { ok: false, msg: `使用了未发牌的数字: ${n}`, value: null };
            }
            const used = (usedCount.get(n) || 0) + 1;
            usedCount.set(n, used);
            if (used > expected) {
                return { ok: false, msg: `数字 ${n} 使用次数超过发牌次数`, value: null };
            }
        }
    }
    for (const [n, cnt] of expectedCount) {
        if ((usedCount.get(n) || 0) !== cnt) {
            return { ok: false, msg: `数字 ${n} 未全部使用`, value: null };
        }
    }

    return { ok: true, msg: null, value };
}
