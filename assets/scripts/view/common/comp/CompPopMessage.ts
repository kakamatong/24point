import FGUICompPopMessage from "@fgui/common/FGUICompPopMessage";
import { ENUM_POP_MESSAGE_TYPE } from "@datacenter/InterfaceConfig";
import * as fgui from "fairygui-cc";
import { ViewClass } from "@frameworks/Framework";
import { PopMessageView } from "../PopMessageView";

@ViewClass({ enableAnimation: true })
export class CompMessage extends FGUICompPopMessage {
    private _data: any | null = null;
    show(data?: any) {
        this._data = data;
        this.ctrl_btn_type.selectedIndex = data.type ?? ENUM_POP_MESSAGE_TYPE.NUM2; // 默认为2个按钮
        this.UI_TXT_TITLE.text = data.title ?? "";
        this.UI_TXT_CONTENT.text = data.content ?? "";
    }

    onBtnClose(): void {
        this._data && this._data.closeBack && this._data.closeBack();
        //this.hideAnimation(() => {
        PopMessageView.hideView();
        //});
    }

    onBtnCancel(): void {
        this._data && this._data.cancelBack && this._data.cancelBack();
        //this.hideAnimation(() => {
        PopMessageView.hideView();
        //});
    }

    onBtnSure(): void {
        this._data && this._data.sureBack && this._data.sureBack();
        //this.hideAnimation(() => {
        PopMessageView.hideView();
        //});
    }
}
fgui.UIObjectFactory.setExtension(CompMessage.URL, CompMessage);
