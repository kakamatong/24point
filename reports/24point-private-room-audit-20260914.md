# 24点私人房链路核查补充：CompCtrl 运算飞行期间输入（2026-09-14）

## 修改
- `assets/scripts/games/game10003/view/game/comp/CompCtrl.ts:301-312`：保留 `onNumClicked` 的 `_busy` 拦截；移除 `onSymbolClicked` 开头的 `_busy` 拦截。
- 目的：两张数字卡片运算飞行期间，数字不能触发第二次运算，但四个运算符入口仍可处理选择 UI。
- `performOperation` 在开始飞行前捕获 `opChar`，因此飞行期间后续符号点击不会改变当前已捕获运算；完成回调仍清理符号选择并产出结果。
- 未修改发牌动画、最终卡片移动、重置、FGUI 生成物、协议、bin 或服务端。

## 无引擎验证
- 新增 `tests/compctrl-busy-input.harness.js`：覆盖发牌/运算飞行期间数字点击被拦截、运算符点击可处理、已捕获运算不被后续符号选择破坏、动画完成后可继续运算。
- `node tests/compctrl-busy-input.harness.js`：PASS。
- `typescript@6.0.3 transpileModule` 解析 CompCtrl.ts：PASS，无 diagnostics。
- `git diff --check`：PASS。
- 未声称 Cocos 实机通过；夹具不覆盖真实触摸命中、FairyGUI tween 时序和多人网络时序。
