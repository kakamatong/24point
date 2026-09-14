// 无引擎行为夹具：验证 CompCtrl 输入门控的关键时序契约。
// 该夹具不加载 Cocos/FGUI，不替代实机验收。
const assert = require('node:assert/strict');

function scenario() {
  const state = { busy: true, first: 0, symbol: -1, operations: 0, result: null };
  const clickNumber = (i) => {
    if (state.busy) return;
    if (state.first < 0) state.first = i;
    else if (state.symbol >= 0) { state.operations++; state.result = `${state.first}${state.symbol}${i}`; }
  };
  const clickSymbol = (s) => {
    if (state.first < 0) return;
    state.symbol = state.symbol === s ? -1 : s;
  };
  // 运算飞行期间：数字仍被锁，符号可以改变选择 UI。
  clickNumber(1);
  clickSymbol(2);
  assert.equal(state.operations, 0);
  assert.equal(state.symbol, 2);
  // performOperation 已捕获 opChar；之后的符号点击不改变本次结果。
  const captured = state.symbol;
  state.busy = true;
  clickSymbol(3);
  const completed = `${state.first}${captured}1`;
  state.busy = false;
  state.operations++;
  state.result = completed;
  assert.equal(state.result, '021');
  assert.equal(state.operations, 1);
  // 动画完成后下一次数字运算仍可正常进入。
  clickNumber(2);
  assert.equal(state.operations, 2);
}

scenario();
console.log('CompCtrl busy-input harness: PASS');
