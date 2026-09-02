# 24点游戏「进房流程」图

由 archify 生成（sequence 序列图，zh-CN，浅色/深色主题可切换，支持缩放/搜索/导出）。

## 产物

| 文件 | 内容 |
|---|---|
| `进房流程图-快速匹配-大厅侧.html` / `.png` | 主干：点击开始匹配 → 匹配入队/确认 → 建房 → 推送 gameRoomReady |
| `进房流程图-快速匹配-游戏侧.html` / `.png` | 主干续：连接游戏网关(wsGameGate) → 认证 → clientReady → 房间数据初始化 → 开局 |
| `进房流程图-私房与重连.html` / `.png` | 分支：创建私房 / 加入私房(含热启动分享链接) / 已在游戏中返回与断线重连 |
| `*.candidate.json` | archify 源规格（改动后可用 `archify validate/deliver` 重新生成） |
| `*.visual-check.*` | 浏览器证据：四张视口截图（浅/深色 × 1440/2048）与 receipt |

## 关键协议（客户端 24point ↔ 服务端 freeGame）

- 大厅协议（`proto/lobby`，经 wsGate → agent.lua）：
  - c2s：`matchJoin(5)`、`matchLeave(6)`、`matchOnSure(7)`、`joinPrivateRoom(13)`、`createPrivateRoom(14)`、`userStatus(4)`
  - s2c：`matchOnSure(3)`、`matchOnSureFail(2)`、`gameRoomReady(4)`、`agentReady(6)`
- 游戏区协议（`proto/game10003`，经 wsGameGate → room）：
  - c2s：`clientReady(4)`、`gameReady(5)`、`leaveRoom(6)`、`ownerStartGame(27)`、`submitAnswer(21)` 等
  - s2c：`roomInfo(2)`、`playerInfos(4)`、`playerEnter(5)`、`playerStatusUpdate(6)`、`privateInfo(12)`、`gameStart(31)`、`stepId(32)`、`dealCards(33)` 等

## 服务端调用链（skynet cluster call）

- 匹配：agent `REQUEST:matchJoin` → `svrMatch.matchJoin`（match.lua：enterQueue/setUserStatus(MATCHING)/tick/checkQueue）→ `matchOnSure.lua`（startOnSure/onSure/checkOnSure）→ `svrGame.createMatchGameRoom`
- 建房：games/server.lua `createGameRoom` → newservice(`games/10003/room`) → `start`(roomType=MATCH/PRIVATE) → room:init → 每玩家 `svrUser.setUserStatus(GAMEING,…)`
- 推送：matchOnSure.lua `sendSvrMsg`（查 redis GATE_AGENT）→ wsGate `CMD.sendSvrMsg` → s2c `gameRoomReady`
- 游戏侧：wsGameGate `handshake(getGame)` → `connectGame`(绑定fd) → `auth.authGame`(token校验) → room `clientReady` → s2c `roomInfo/playerInfos/playerEnter`
- 私房：agent → `svrPrivateRoom.createPrivateRoom/joinPrivateRoom` → `svrGame.createPrivateGameRoom` / `db.getPrivateRoomid`(短号→长房号) → room `joinPrivateRoom`

## 进房链路要点

1. **两段式连接**：先走大厅 Socket（match/私房/状态），拿到 `gameRoomReady` 后切换到游戏 Socket（`gatewayUrl?ver=1&userid&gameid&roomid&token(DES)`）。
2. **状态机**：用户 ONLINE→MATCHING→GAMEING；房内玩家 LOADING→READY→PLAYING；匹配房全员 READY 才开局，私房需房主 `ownerStartGame(27)` 或全员 `gameReady(5)`。
3. **异常分支**：匹配确认超时/拒绝 → `matchOnSureFail(2)`；匹配失败过多 → 机器人补位（`getRobots`）；已在游戏中 → 弹窗返回房间（`userStatus` + `checkHaveRoom`）；断线重连 → `clientReady` → `relink`。

## 备注

- 三张序列图均通过 `archify validate --quality showcase`（9 项 artifact 检查，0 错误 0 警告）并 `deliver` 成功。
- visual-check 浏览器证据：可读性/视口 chrome/截图均通过；桌面视口（1440×900 等）下页面纵向可滚动属该 viewer 对高密度序列图的常态（archify 自带示例 sequence-cache-miss-request.html 行为相同），HTML 内可用滚轮/缩放查看。
- 未改动 `assets/scripts/fgui/` 自动生成代码与两项目任何源码。
