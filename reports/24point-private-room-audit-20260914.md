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

## 2026-09-14 本次交付：单局积分与私人房总结算

- 基线：`d4fdff77048f9976f98df65b94a4ad33ea0a9ea5`；开始前 `git fetch origin`，工作区干净且 `origin/main` 同基线。
- 单局结算：`assets/scripts/games/game10003/view/result/ResultView.ts:216` 将 `gameEnd.scores[].delta` 写入真实生成的 `UI_TXT_SCORE`；正数加 `+`，零和负数原样显示；无 score 或未完成玩家均回退显示 `0`。
- 总结算：`assets/scripts/games/game10003/view/game/comp/CompGameMain.ts:58,1010` 导入并按连连看方式在收到 `totalResult` 后延迟 0.2 秒调用 `TotalResultView.showView(data)`。
- 顺序核查：服务端先发送 `totalResult`、后发送 `roomEnd`。`roomEnd` 的 `GAME_END` 分支仅记录日志，不销毁总结果；其他超时/解散分支维持既有弹窗逻辑。未新增状态机、点击锁或服务端改动。
- 上下文：现有 `TotalResultView` 通过 `GameData.getPlayerByUserid/getHeadurlByUserid` 补昵称和头像，使用生成字段 `userid/score/rank`，与当前生成物兼容。空数据不会设置列表数量，保持安全；未改生成基类、FGUI 工程、bin、协议或服务端。
- 验证：使用 OpenClaw 内置 TypeScript `transpileModule` 对上述三个真实源文件逐个转译，均 0 diagnostics。源码 SHA-256：ResultView `7015ef1377903e931d1640e09e517dfd506be821df4ae40e4259b37d01e1caad`；CompGameMain `ded151dd1c21c77702557484f22c2b4099f1c09520196d86a0c05ce7b497e491`；TotalResultView `f0cb3a1e76e4b0c1a315f7642141a93963009a36345ba77ab013e6cf8edb4efd`。另通过 `git diff --check`。
- 边界：未使用 Cocos Creator 实机，未验证 FairyGUI 实际布局、遮挡、触摸与真实多人网络时序；需在 Cocos Creator 预览/构建中确认。

## 2026-09-14 本次交付：运算完成后保留运算符选择

- `assets/scripts/games/game10003/view/game/comp/CompCtrl.ts:362-363`：卡片飞行动画完成后不再将 `_selSymbol` 置为 `-1`，也不再把 `ctrl_symbol.selectedIndex` 重置为 4；此前选中的运算符保持显示和可继续使用。
- `performOperation` 仍在动画开始前捕获 `opChar`，因此动画期间修改运算符选择不会改变当前已完成的运算；下一次点击数字时沿用当前保留的运算符。
- 未修改数字卡片 `_busy` 拦截、发牌/最终卡片动画、整局重置、协议、FGUI 生成物、bin 或服务端。
- 验证边界：已做真实 `CompCtrl.ts` TypeScript 转译和差异检查；未启动 Cocos，需实机确认运算符控制器保持选中页与连续运算触摸表现。
