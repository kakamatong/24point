# AGENTS.md

## 项目概述

Cocos Creator 3.8.8 游戏项目，TypeScript + FairyGUI 开发的算24点游戏（微信小游戏）

## 构建

- **没有 npm 构建脚本**，完全通过 Cocos Creator IDE 构建/预览/发布
- `npm install` 仅用于 `extensions/` 下的 Cocos Creator 编辑器扩展（如 `runmore`）
- 目标平台：Web、微信小游戏

## 路径别名

`import-map.json` 和 `tsconfig.json` 中定义，代码中一律使用 `@` 别名代替相对路径：

| 别名            | 映射                            |
| --------------- | ------------------------------- |
| `@frameworks/*` | `./assets/scripts/frameworks/*` |
| `@datacenter/*` | `./assets/scripts/datacenter/*` |
| `@fgui/*`       | `./assets/scripts/fgui/*`       |
| `@modules/*`    | `./assets/scripts/modules/*`    |
| `@view/*`       | `./assets/scripts/view/*`       |
| `@localGame/*`  | `./assets/scripts/localGame/*`  |

## 目录约定

```
assets/scripts/
├── datacenter/     # 全局数据（单例 DataCenter，接口/常量定义）
├── frameworks/     # 核心框架（Socket、声音、事件系统、工具）
├── fgui/           # FairyGUI 自动生成的 UI 基类（每个包一个目录）
├── games/          # 游戏逻辑（如 game10003/）
├── localGame/      # 本地单机模式（LocalSvr, mapGenerator）
├── modules/        # 业务模块（Auth、Match、SignIn、Rank 等）
├── scene/          # 场景入口脚本（LobbyScene, GameScene）
├── view/           # UI 视图层（lobby, login, match, bag 等）

FGUIProject/        # FairyGUI 编辑器资源目录（UI 布局、图片等）
```

### FairyGUI 两层架构

项目使用 **FGUI 基类 + 业务子类** 的继承模式：

| 层            | 目录                                            | 说明                                                                                       |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **FGUI 基类** | `assets/scripts/fgui/`                          | FairyGUI 编辑器自动生成，声明所有子节点引用（`ctrl_*`、`UI_BTN_*`、`UI_TXT_*` 等）和控制器 |
| **业务子类**  | `assets/scripts/view/`、`assets/scripts/games/` | 继承 FGUI 基类，通过 `@ViewClass()` 添加游戏逻辑                                           |

**FGUI 基类禁止修改**，所有逻辑写在业务子类中。修改 UI 组件前，必须先阅读对应的 FGUI 基类及其子类的代码。

### 新增 View 模块流程

以 `gm` 包为例，新增一个 View 模块的步骤：

1. **FairyGUI 编辑器**中创建 UI 布局（`GmView.xml` + `comp/CompGm.xml`），按钮命名遵循 `UI_BTN_*` 前缀（_由用户操作_）
2. **Cocos Creator 中发布** FGUI 包 → 自动生成 `assets/scripts/fgui/{包名}/` 下的 TS 基类（含 `onBtnXxx()` 空方法存根、`UI_*` 对象引用、`showView/hideView` 静态方法）（_由用户操作_）
3. **创建业务子类**，遵循 `View入口 + comp/子组件` 的目录结构：

```
assets/scripts/view/{包名}/
├── XxxView.ts          # 视图入口，继承 FGUIXxxView，声明 @PackageLoad
└── comp/
    └── CompXxx.ts      # 子组件，继承 FGUICompXxx，重写 onBtnXxx() 添加逻辑
```

4. `fgui.UIObjectFactory.setExtension(类名.URL, 类名)` 注册组件，使 FGUI 引擎使用业务子类实例化

## 必须遵守的约定

### 命名

- **类**：PascalCase（`DataCenter`）
- **接口**：UPPER_SNAKE_CASE（`LOGIN_INFO`、`USER_DATA`）——**非标准 TS 约定，不要用 I-prefix**
- **枚举**：UPPER_SNAKE_CASE（`ENUM_CHANNEL_ID`）
- **私有属性**：`_` 前缀（`_instance`、`_userData`）
- **方法**：camelCase（`getInstance`）
- **文件名**：与类名匹配的 PascalCase（`DataCenter.ts`）

### 语言

**所有内容必须用中文**：注释、JSDoc、日志、UI 文本。变量名优先使用中文语义。

### 注释（JSDoc）

**主要逻辑和接口必须补充 JSDoc 注释**，格式如下：

```typescript
/**
 * @file 文件名.ts
 * @description 文件功能描述
 * @category 分类名称
 */

/**
 * @class 类名
 * @description 类功能描述
 * @category 分类名称
 */

/**
 * @method 方法名
 * @description 方法功能描述
 * @param {类型} 参数名 - 参数说明
 * @returns {类型} 返回值说明
 * @private
 */

/**
 * @property {类型} 属性名 - 属性说明
 * @private
 */
```

- 文件头注释必须包含 `@file` 和 `@description`
- 公共类和接口必须包含 `@class` / `@interface` 和 `@description`
- 主要方法必须包含 `@method`、`@description`、`@param`（如有参数）、`@returns`（如有返回值）
- 私有方法/属性标注 `@private`
- 自动生成的文件（`fgui/`、`types/protocol/`）不需要补充注释

### 格式化（Prettier）

- 双引号、分号必需、4 空格缩进、打印宽度 140

### 日志

使用 `Logger` 模块打印日志，**禁止使用 `console.log`**：

```typescript
import { Logger } from "@frameworks/utils/Utils";

Logger.log("普通日志");
Logger.warn("警告信息");
Logger.error("错误信息");
Logger.debug("调试信息");
```

### 单例模式

所有管理器类（DataCenter、SoundManager、SocketManager 等）使用标准单例：

```typescript
private static _instance: XxxManager;
public static get instance(): XxxManager { ... }
private constructor() { ... }
```

### 导入顺序

```typescript
import { _decorator, Component, sys } from "cc"; // 1. Cocos Creator
import * as fgui from "fairygui-cc"; // 2. 第三方
import { DataCenter } from "@datacenter/Datacenter"; // 3. 项目（用 @ 别名）
```

### 事件系统

使用框架事件，在 `onDestroy` 中必须清理：

```typescript
import { AddEventListener, RemoveEventListener, DispatchEvent } from "@frameworks/Framework";

AddEventListener("事件名", this.onHandler, this);
RemoveEventListener("事件名", this.onHandler);
DispatchEvent("事件名", ...args);
```

### 装饰器

每个 View 组件必须使用：

```typescript
@ViewClass({ curveScreenAdapt: true }) // 或 @ViewClass()
@PackageLoad(["包名1", "包名2"]) // 声明依赖的 FGUI 包
@ccclass("组件名")
export class XxxView extends Component {}
```

## 关键框架

| 组件                          | 用途                                             |
| ----------------------------- | ------------------------------------------------ |
| `SoundManager.instance`       | 播放所有音频                                     |
| `LobbySocketManager.instance` | 大厅 Socket 连接                                 |
| `GameSocketManager.instance`  | 游戏服 Socket 连接（支持传入 `true` 走本地模式） |
| `DataCenter.instance`         | 全局用户/游戏数据                                |
| `PackageManager.instance`     | 加载 FairyGUI 包                                 |
| `ChangeScene("场景名")`       | 场景切换                                         |
| `sys.localStorage`            | 持久化存储                                       |
| `MiniGameUtils`               | 微信小游戏平台 API 封装                          |

## 协议

- 协议文件在 `assets/types/protocol/` 中自动生成（sproto 编译），**不要手动修改**
- 每个游戏模式用数字 ID 标识（如 10001、10002）

## 常见陷阱

- 访问 UI 前确认 FGUI 包已加载（通过 `@PackageLoad` 声明依赖）
- `onDestroy` 中清理事件监听器和定时器
- 平台特定代码（微信）必须用 `MiniGameUtils`，不要直接调 `wx.*` API
