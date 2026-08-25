import { ViewClass } from "@frameworks/Framework";
import FGUICompTalk from "@fgui/game10003/FGUICompTalk";
import * as fgui from "fairygui-cc";

@ViewClass()
export class CompTalk extends FGUICompTalk {
    private _talkMsg: string = "";

    public set talkMsg(value: string) {
        this._talkMsg = value;
        this.visible = true;

        this.unscheduleAllCallbacks();
        this.scheduleOnce(() => {
            // 使用父类的 UI_TXT_0 文本节点
            if (this.UI_TXT_0) {
                this.UI_TXT_0.text = value;
            }
        }, 0);

        this.scheduleOnce(() => {
            this._talkMsg = "";
            this.visible = false;
        }, 3);
    }

    public get talkMsg(): string {
        return this._talkMsg;
    }
}
fgui.UIObjectFactory.setExtension(CompTalk.URL, CompTalk);
