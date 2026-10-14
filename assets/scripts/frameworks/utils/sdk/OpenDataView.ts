/**
 * @file OpenDataView.ts
 * @description 开放数据域视图：把子域的 sharedCanvas 贴到 Cocos 节点上，并向子域转发触摸事件
 * @category 框架组件
 */

import { _decorator, Component, Node, Sprite, SpriteFrame, Texture2D, UITransform, EventTouch, Vec3 } from "cc";
import { MiniGameUtils } from "./MiniGameUtils";
import { Logger } from "../Utils";

const { ccclass } = _decorator;

/**
 * @class OpenDataView
 * @description 开放数据域视图组件：负责画布挂载、尺寸同步、触摸转发与销毁
 * @category 框架组件
 */
@ccclass("OpenDataView")
export class OpenDataView extends Component {
    /** 用于显示共享画布的精灵 */
    private _sprite: Sprite | null = null;
    /** 每帧从子域画布上传数据的纹理 */
    private _texture: Texture2D | null = null;
    /** 子域共享画布对象 */
    private _sharedCanvas: any = null;
    /** 视口宽高（Cocos UI 单位） */
    private _width: number = 0;
    private _height: number = 0;
    /** 坐标换算临时变量 */
    private _tempVec: Vec3 = new Vec3();

    /**
     * @method create
     * @description 在父节点下创建开放数据域视图
     * @param {Node} parent 父节点（通常是 FGUI loader 的节点）
     * @param {number} width 视口宽度
     * @param {number} height 视口高度
     * @returns {OpenDataView | null} 创建成功返回组件实例，失败返回 null
     * @static
     */
    public static create(parent: Node, width: number, height: number): OpenDataView | null {
        if (!MiniGameUtils.instance.isWeChatGame()) {
            Logger.warn("非微信小游戏环境，开放数据域不可用");
            return null;
        }

        const node = new Node("OpenDataView");
        node.parent = parent;
        const view = node.addComponent(OpenDataView);
        if (!view.mount(width, height)) {
            node.destroy();
            return null;
        }

        return view;
    }

    /**
     * @method mount
     * @description 挂载共享画布：创建纹理与精灵、同步视口、绑定触摸
     * @param {number} width 视口宽度
     * @param {number} height 视口高度
     * @returns {boolean} 是否挂载成功
     */
    public mount(width: number, height: number): boolean {
        const openDataContext = MiniGameUtils.instance.getOpenDataContext();
        const sharedCanvas = openDataContext && openDataContext.canvas;
        if (!sharedCanvas) {
            Logger.error("开放数据域画布不可用");
            return false;
        }

        this._sharedCanvas = sharedCanvas;
        this._width = width;
        this._height = height;
        sharedCanvas.width = width;
        sharedCanvas.height = height;

        const uiTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        uiTransform.setContentSize(width, height);
        uiTransform.setAnchorPoint(0.5, 0.5);
        this.node.setPosition(0, 0, 0);

        const texture = new Texture2D();
        texture.reset({ width: width, height: height });
        this._texture = texture;

        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        const sprite = this.node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.trim = false;
        sprite.spriteFrame = spriteFrame;
        this._sprite = sprite;

        this.bindTouch();
        this.postViewport();
        return true;
    }

    /**
     * @method setMode
     * @description 切换子域展示内容（好友榜 / 好友邀请列表）
     * @param {string} mode rank 表示好友排行榜；invite 表示好友邀请列表
     * @param {object} [options] 附加参数：roomId 房间号；title 分享标题；imageUrl 分享图片（本地路径）
     */
    public setMode(mode: string, options?: { roomId?: string; title?: string; imageUrl?: string }): void {
        MiniGameUtils.instance.postMessageToOpenData({
            type: "mode",
            mode: mode,
            roomId: (options && options.roomId) || "",
            title: (options && options.title) || "",
            imageUrl: (options && options.imageUrl) || "",
        });
    }

    /**
     * @method refresh
     * @description 通知子域重新拉取数据
     */
    public refresh(): void {
        MiniGameUtils.instance.postMessageToOpenData({ type: "refresh" });
    }

    /**
     * @method dispose
     * @description 销毁视图：移除节点与引用
     */
    public dispose(): void {
        this._sprite = null;
        this._texture = null;
        this._sharedCanvas = null;
        if (this.node && this.node.isValid) {
            this.node.destroy();
        }
    }

    /**
     * @method update
     * @description 每帧把子域画布内容上传到纹理
     * @protected
     */
    protected update(): void {
        if (!this._texture || !this._sharedCanvas) {
            return;
        }
        /* 说明：微信小游戏下 Texture2D.uploadData 支持直接上传共享画布；
           若引擎版本不支持，可改为用 ImageAsset 包装后重建 SpriteFrame */
        (this._texture as any).uploadData(this._sharedCanvas);
    }

    /**
     * @method bindTouch
     * @description 绑定触摸事件，把坐标换算到子域画布坐标系后转发
     * @private
     */
    private bindTouch(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private onTouchStart(event: EventTouch): void {
        this.postTouch("start", event);
    }

    private onTouchMove(event: EventTouch): void {
        this.postTouch("move", event);
    }

    private onTouchEnd(event: EventTouch): void {
        this.postTouch("end", event);
    }

    /**
     * @method postTouch
     * @description 把触摸事件换算为子域画布坐标并发送给子域
     * @param {string} type start / move / end
     * @param {EventTouch} event 触摸事件
     * @private
     */
    private postTouch(type: string, event: EventTouch): void {
        const uiLocation = event.getUILocation();
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }
        uiTransform.convertToNodeSpaceAR(new Vec3(uiLocation.x, uiLocation.y, 0), this._tempVec);
        MiniGameUtils.instance.postMessageToOpenData({
            type: "touch",
            event: type,
            x: this._width / 2 + this._tempVec.x,
            y: this._height / 2 - this._tempVec.y,
        });
    }

    /**
     * @method postViewport
     * @description 把视口尺寸同步给子域
     * @private
     */
    private postViewport(): void {
        MiniGameUtils.instance.postMessageToOpenData({
            type: "viewport",
            x: 0,
            y: 0,
            width: this._width,
            height: this._height,
        });
    }
}
