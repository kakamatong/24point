import { AddEventListener, DispatchEvent, LogColors, RemoveEventListener } from "./Framework";
import { SocketManager } from "./SocketManager";
import { FW_EVENT_NAMES } from "./config/Config";

export class GameSocketManager extends SocketManager {
    protected _name: string = "GameSocketManager";

    private _isLocalGame: boolean = false;

    private _eventListeners: { [key: string]: (data: any) => void } = {};
    //单例
    private static _instance: GameSocketManager;
    public static get instance(): GameSocketManager {
        if (!this._instance) {
            this._instance = new GameSocketManager();
        }
        return this._instance;
    }

    constructor() {
        super();
    }

    start(url: string | boolean, header?: string | string[], callBack?: (result: boolean) => void): void {
        if (typeof url === "boolean") {
            this._isLocalGame = true;
        } else {
            this._isLocalGame = false;
            super.start(url, header, callBack);
        }
    }

    onOpen(event: any): void {
        super.onOpen(event);
        // 游戏区链接没有agent，所以打开socket后，直接通过成功
        this.agentReady(null);
    }

    onClose(event: any) {
        if (this.isOpen()) {
            // 断线了
            DispatchEvent(FW_EVENT_NAMES.GAME_SOCKET_DISCONNECT, {});
        }
        super.onClose(event);
    }

    // 增加服务器广播监听
    addServerListen(proto: { Name: string }, callBack: (data: any) => void) {
        if (this._isLocalGame) {
            this._eventListeners[proto.Name] = callBack;
            AddEventListener(proto.Name, callBack, this);
        } else {
            super.addServerListen(proto, callBack);
        }
    }

    // 移除服务器广播监听
    removeServerListen(proto: { Name: string }) {
        if (this._isLocalGame) {
            RemoveEventListener(proto.Name, this._eventListeners[proto.Name]);
            delete this._eventListeners[proto.Name];
        } else {
            super.removeServerListen(proto);
        }
    }

    // 发送数据给服务器
    sendToServer(xy: { Name: string }, data: any, callBack?: (data: any) => void) {
        if (this._isLocalGame) {
            const func = (data) => {
                callBack && callBack(data);
                RemoveEventListener("resp" + xy.Name, func);
            };
            AddEventListener("resp" + xy.Name, func, this);
            DispatchEvent(xy.Name, data);
        } else {
            super.sendToServer(xy, data, callBack);
        }
    }

    isLocalGame(): boolean {
        return this._isLocalGame;
    }
}
