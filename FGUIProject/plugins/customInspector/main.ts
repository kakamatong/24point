/* eslint-disable */
import { FairyEditor, FairyGUI, System, Spine } from 'csharp';
import { $typeof } from 'puerts';

const App = FairyEditor.App;
const enum CompType {
    loader3D = 0,
    text = 1,
    list = 2,
}
const ALL_TYPE = ['loader3D', 'text', 'list'];
const FILL_MODE = ['none', 'scale', 'scaleNoBorder', 'scaleMatchHeight', 'scaleMatchWidth', 'scaleFree'];
const ALIGN = ['left', 'center', 'right'];
const V_ALIGN = ['top', 'middle', 'bottom'];
const FILL_MODE_CN = ['（无）', '等比缩放(显示全部)', '等比缩放(无边框)', '等比缩放(适应高度)', '等比缩放(适应宽度)', '自由缩放']; // 集合

App.pluginManager.LoadUIPackage(App.pluginManager.basePath + '/' + eval('__dirname') + '/CustomInspector');

/**编译ts到es6命令：tsc --target es6 --module commonjs main.ts */
class DemoInspector extends FairyEditor.View.PluginInspector {
    private cacheModeCombox: FairyGUI.GComboBox;
    private cView: FairyGUI.Controller;
    /**dragonbones */
    private combo: FairyGUI.GComboBox;
    private urlInput: FairyGUI.GTextInput;
    private clearOnPublish: FairyGUI.GButton;
    private autoSize: FairyGUI.GButton;
    private _play: FairyGUI.GButton; // 是否自动播放
    private _loop: FairyGUI.GButton; // 是否循环播放
    private _horizontal: FairyGUI.GComponent; // 水平方向
    private _vertical: FairyGUI.GComponent; // 垂直方向
    private _fillCombo: FairyGUI.GComboBox; // 填充方式
    private _reduce: FairyGUI.GButton; // 仅允许缩小
    private _inputFrame: FairyGUI.GLabel; // 帧输入框
    /**dragonbones */

    /**list */
    private customListBtn: FairyGUI.GButton;
    private isNowUpdateBtn: FairyGUI.GButton;
    private rowInputComp: FairyGUI.GComponent;
    private colInputComp: FairyGUI.GComponent;
    private _rowInput: FairyGUI.GTextInput;
    private _colInput: FairyGUI.GTextInput;
    private _reverseBtn: FairyGUI.GButton;
    private _designColInputComp: FairyGUI.GComponent;
    private _cCustomList: FairyGUI.Controller;
    /**list */

    // 当前选中的元件
    private _currItem: FairyEditor.FLoader3D | FairyEditor.FTextField | FairyEditor.FList;

    private _loader3dObj: {
        [key: string]: {
            curr: FairyEditor.FLoader3D;
            url: string;
            isClearOnPublish: boolean;
            isAutoSize: boolean;
            align: string;
            verticalAlign: string;
            fill: string;
            shrinkOnly: boolean;
            loop: boolean;
            play: boolean;
        };
    } = {};

    public constructor() {
        super();
        this.panel = FairyGUI.UIPackage.CreateObject('CustomInspector', 'Main').asCom;
        this.combo = this.panel.GetChild('animationName').asComboBox;
        this.urlInput = this.panel.GetChild('urlInput').asLabel.GetTextField().asTextInput;
        this.clearOnPublish = this.panel.GetChild('clearOnPublish').asButton;
        this.autoSize = this.panel.GetChild('autoSize').asButton;
        this.cacheModeCombox = this.panel.GetChild('cacheModeCombox').asComboBox;
        this.cView = this.panel.GetController('cView');
        this.customListBtn = this.panel.GetChild('customListBtn').asButton;
        this.isNowUpdateBtn = this.panel.GetChild('isNowUpdateBtn').asButton;
        this.rowInputComp = this.panel.GetChild('rowInputComp').asCom;
        this.colInputComp = this.panel.GetChild('colInputComp').asCom;
        this._play = this.panel.GetChild('play').asButton;
        this._loop = this.panel.GetChild('loop').asButton;
        this._horizontal = this.panel.GetChild('horizontal').asCom;
        this._vertical = this.panel.GetChild('vertical').asCom;
        this._fillCombo = this.panel.GetChild('fillCombo').asComboBox;
        this._reduce = this.panel.GetChild('reduce').asButton;
        this._inputFrame = this.panel.GetChild('inputFrame').asLabel;
        this._rowInput = this.rowInputComp.GetChild('input').asLabel.GetTextField().asTextInput;
        this._colInput = this.colInputComp.GetChild('input').asLabel.GetTextField().asTextInput;
        this._reverseBtn = this.panel.GetChild('reverseBtn').asButton;
        this._designColInputComp = this.panel.GetChild('designColInputComp').asCom;
        this._cCustomList = this.panel.GetController('cCustomList');

        this.combo.onChanged.Add(this.onLoad3DChanged.bind(this));
        this.cacheModeCombox.onChanged.Add(this.onCacheModeComboxClick.bind(this));
        this.urlInput.onSubmit.Add(this.onUrlInputChanged.bind(this));
        this.panel.GetChild('urlInput').asLabel.GetControllerAt(0).onChanged.Add(this.onUrlInputChanged.bind(this));
        this.panel.GetChild('save').asButton.onClick.Add(this.onSaveClick.bind(this));
        this.customListBtn.onClick.Set(this.onCustomListClick.bind(this));
        this._rowInput.onChanged.Set(this.onInputSubmit.bind(this));
        this._colInput.onChanged.Set(this.onInputSubmit.bind(this));
        this.autoSize.onClick.Set(this.onLoad3DChanged.bind(this));
        this._play.onClick.Set(this.onLoad3DChanged.bind(this));
        this._loop.onClick.Set(this.onLoad3DChanged.bind(this));
        this._horizontal.GetControllerAt(0).onChanged.Add(this.onLoad3DChanged.bind(this));
        this._vertical.GetControllerAt(0).onChanged.Add(this.onLoad3DChanged.bind(this));
        this._fillCombo.onChanged.Add(this.onLoad3DChanged.bind(this));
        this._reduce.onClick.Set(this.onLoad3DChanged.bind(this));
        this._reverseBtn.onClick.Set(this.onReverseBtnCLick.bind(this));
        // this._inputFrame.GetTextField().asTextInput.onChanged.Add(this.onLoad3DChanged.bind(this)); // 帧不能用，调整数值会闪退fgui

        this.isNowUpdateBtn.onClick.Set(() => {
            const selected = this.isNowUpdateBtn.selected;
            this._formatCustomData(['isNowUpdate=1'], !selected);
        });

        this.updateAction = () => {
            return this.updateUI();
        };
    }

    private initDB() {
        this._currItem = App.activeDoc.inspectingTarget as FairyEditor.FLoader3D;
        this.setUrl(this._currItem.url);
        this.clearOnPublish.selected = this._currItem.clearOnPublish;
        this.autoSize.selected = this._currItem.autoSize;

        //align="center" vAlign="bottom" fill="scale" shrinkOnly="true"
        this.updateAnimations();
        this.updateFillMode();

        this._loader3dObj[this._currItem.name] = {
            curr: this._currItem,
            url: this.urlInput.text,
            isClearOnPublish: this.clearOnPublish.selected,
            isAutoSize: this.autoSize.selected,
            align: ALIGN[this._horizontal.GetControllerAt(0).selectedIndex],
            verticalAlign: V_ALIGN[this._vertical.GetControllerAt(0).selectedIndex],
            fill: FILL_MODE[this._fillCombo.selectedIndex],
            shrinkOnly: this._reduce.selected,
            loop: this._loop.selected,
            play: this._play.selected,
        };
    }

    // 返回值表示是否显示该检查器
    private updateUI(): boolean {
        // all type: FairyEditor.FPackageItemType
        const currType = App.activeDoc.inspectingObjectType;
        // console.log('curr component type: ' + currType);
        if (ALL_TYPE.includes(App.activeDoc.inspectingObjectType)) {
            if (App.activeDoc.inspectingTarget != this._currItem) {
                if (currType == 'loader3D') {
                    this.initDB();
                    this.cView.selectedIndex = 0;
                } else if (currType == 'text') {
                    this._currItem = App.activeDoc.inspectingTarget as FairyEditor.FTextField;
                    this.cView.selectedIndex = 1;
                    const customData = App.activeDoc.inspectingTargets.get_Item(0).customData;
                    if (this.cacheModeCombox) {
                        const key = 'cacheMode=';
                        if (!customData || customData.indexOf(key + '0') > -1) {
                            this.cacheModeCombox.selectedIndex = 0;
                        } else if (customData.indexOf(key + '1') > -1) {
                            this.cacheModeCombox.selectedIndex = 1;
                        } else if (customData.indexOf(key + '2') > -1) {
                            this.cacheModeCombox.selectedIndex = 2;
                        }
                    }
                } else if (currType == 'list') {
                    this._currItem = App.activeDoc.inspectingTarget as FairyEditor.FList;
                    this.cView.selectedIndex = 2;
                    const customData = App.activeDoc.inspectingTargets.get_Item(0).customData;
                    const isYesForLayout = this._currItem.layout == FairyEditor.FList.SINGLE_COLUMN || this._currItem.layout == FairyEditor.FList.SINGLE_ROW;
                    this.customListBtn.selected = !!customData?.includes('"isCustomType":"1"') && isYesForLayout;
                    if (!this.customListBtn.selected) {
                        const obj = App.activeDoc.inspectingTarget;
                        obj.docElement.SetProperty('customData', '');
                    }
                    this._cCustomList.selectedIndex = this.customListBtn.selected ? 1 : 0;
                    if (this.customListBtn.selected && (customData.includes('rowCount') || customData.includes('colCount') || customData.includes('isNowUpdate') || customData.includes('isReverse'))) {
                        try {
                            const data = JSON.parse(customData);
                            this._rowInput.text = data['rowCount'] || '0';
                            this._colInput.text = data['colCount'] || '0';
                            this.isNowUpdateBtn.selected = data['isNowUpdate'] == 1;
                            this._reverseBtn.selected = data['isReverse'] == 1;
                            this.setListAlign();
                        } catch (err) {
                            //
                        }
                    }
                }
            }
            return true;
        }

        return false;
    }

    private onSaveClick() {
        // this._currItem.GetProp(index)：index取值：Text = 0, Icon = 1, Color = 2, OutlineColor = 3, Playing = 4, Frame = 5, DeltaTime = 6, TimeScale = 7, FontSize = 8, Selected = 9
        if (!(this._currItem instanceof FairyEditor.FLoader3D)) {
            return;
        }
        const loader = this._currItem;
        if (this.urlInput.text != loader.url) {
            loader.url = this.urlInput.text;
            loader.animationName = '';
            this.combo.title = '（无）';
        }
        if (this.clearOnPublish.selected != loader.clearOnPublish) {
            loader.clearOnPublish = this.clearOnPublish.selected;
        }
        if (this.autoSize.selected != loader.autoSize) {
            loader.autoSize = this.autoSize.selected;
        }
        if (this._fillCombo.selectedIndex != FILL_MODE.indexOf(loader.fill)) {
            loader.fill = FILL_MODE[this._fillCombo.selectedIndex];
        }
        if (this._horizontal.GetControllerAt(0).selectedIndex != ALIGN.indexOf(loader.align)) {
            loader.align = ALIGN[this._horizontal.GetControllerAt(0).selectedIndex];
        }
        if (this._vertical.GetControllerAt(0).selectedIndex != V_ALIGN.indexOf(loader.verticalAlign)) {
            loader.verticalAlign = V_ALIGN[this._vertical.GetControllerAt(0).selectedIndex];
        }
        if (this._reduce.selected != loader.shrinkOnly) {
            loader.shrinkOnly = this._reduce.selected;
        }
        if (this._loop.selected != loader.loop) {
            loader.loop = this._loop.selected;
        }
        if (this._play.selected != loader.playing) {
            loader.playing = this._play.selected;
        }

        // 重置选中此元件，达到刷新检查器的目的
        // App.activeDoc.SetSelection(loader);

        App.activeDoc.RefreshInspectors(0);
        if (this._currItem.url !== this.urlInput.text) {
            this.updateAnimations();
        }

        this.writeFile(
            {
                clearOnPublish: loader.clearOnPublish,
                animation: loader.animationName,
                url: loader.url,
                autoSize: loader.autoSize,
                fill: FILL_MODE[this._fillCombo.selectedIndex],
                align: ALIGN[this._horizontal.GetControllerAt(0).selectedIndex],
                verticalAlign: V_ALIGN[this._vertical.GetControllerAt(0).selectedIndex],
                shrinkOnly: this._reduce.selected,
                loop: this._loop.selected,
                playing: this._play.selected,
                // frame: this._inputFrame.GetTextField().text,
            },
            CompType.loader3D
        );
    }

    private onLoad3DChanged() {
        if (!(this._currItem instanceof FairyEditor.FLoader3D)) {
            return;
        }
        const loader = this._currItem;
        if (this.clearOnPublish.selected != loader.clearOnPublish) {
            loader.clearOnPublish = this.clearOnPublish.selected;
        }
        if (this.autoSize.selected != loader.autoSize) {
            loader.autoSize = this.autoSize.selected;
        }
        if (this._fillCombo.selectedIndex != FILL_MODE.indexOf(loader.fill)) {
            loader.fill = FILL_MODE[this._fillCombo.selectedIndex];
        }
        if (this._horizontal.GetControllerAt(0).selectedIndex != ALIGN.indexOf(loader.align)) {
            loader.align = ALIGN[this._horizontal.GetControllerAt(0).selectedIndex];
        }
        if (this._vertical.GetControllerAt(0).selectedIndex != V_ALIGN.indexOf(loader.verticalAlign)) {
            loader.verticalAlign = V_ALIGN[this._vertical.GetControllerAt(0).selectedIndex];
        }
        if (this._reduce.selected != loader.shrinkOnly) {
            loader.shrinkOnly = this._reduce.selected;
        }
        if (this._loop.selected != loader.loop) {
            loader.loop = this._loop.selected;
        }
        if (this._play.selected != loader.playing) {
            loader.playing = this._play.selected;
        }
        if (this.combo.title == '（无）') {
            loader.animationName = '';
        } else {
            loader.animationName = this.combo.title;
        }
        // if (isNaN(+this._inputFrame.text) || +this._inputFrame.text < 0) {
        //     this._inputFrame.GetTextField().text = '0';
        // }
        // if (+this._inputFrame.text != loader.frame) {
        //     loader.frame = +this._inputFrame.text;
        // }

        App.RefreshProject();
        App.activeDoc.SetSelection(loader);
    }

    // private onComboClick() {
    //     if (!(this._currItem instanceof FairyEditor.FLoader3D)) {
    //         return;
    //     }
    //     if (this.combo.title == '（无）') {
    //         this._currItem.animationName = '';
    //     } else {
    //         this._currItem.animationName = this.combo.title;
    //     }
    //     console.log(this._currItem.animationName);
    //     App.RefreshProject();
    //     App.activeDoc.SetSelection(this._currItem);

    //     // 设置自定义属性
    //     // let obj = App.activeDoc.inspectingTarget;
    //     // obj.docElement.SetProperty('customData', this.combo.value);
    // }

    private onCustomListClick() {
        const selected = this.customListBtn.selected;
        const obj = App.activeDoc.inspectingTarget;
        if (selected) {
            const list = this._currItem as FairyEditor.FList;
            const isYesForLayout = list.layout == FairyEditor.FList.SINGLE_COLUMN || list.layout == FairyEditor.FList.SINGLE_ROW;
            if (!isYesForLayout) {
                this.customListBtn.selected = false;
                App.Alert('自定义列表目前布局只支持：单行横排和单列竖排');
                return;
            }
            this._formatCustomData(['isCustomType=1', 'isNowUpdate=1'], !this.isNowUpdateBtn.selected);
            this._formatCustomData(['isCustomType=1', 'isReverse=1'], !this._reverseBtn.selected);
            this.setListAlign();
            this.onInputSubmit();
        } else {
            obj.docElement.SetProperty('customData', '');
        }
        this._cCustomList.selectedIndex = this.customListBtn.selected ? 1 : 0;
    }

    private onReverseBtnCLick(): void {
        const selected = this._reverseBtn.selected;
        this._formatCustomData(['isReverse=1'], !selected);
        this.setListAlign();
    }

    private setListAlign(): void {
        if (this._currItem instanceof FairyEditor.FList) {
            // align="right" vAlign="bottom"
            const isAdd = this._reverseBtn.selected && this.customListBtn.selected;
            this._currItem.align = isAdd ? FairyEditor.AlignConst.RIGHT : FairyEditor.AlignConst.LEFT;
            this._currItem.verticalAlign = isAdd ? FairyEditor.VerticalAlignConst.BOTTOM : FairyEditor.VerticalAlignConst.TOP;
            this.writeFile(
                {
                    align: this._currItem.align,
                    vAlign: this._currItem.verticalAlign,
                },
                CompType.list
            );
        }
    }

    private onCacheModeComboxClick() {
        // this.writeFile({ cacheMode: this.cacheModeCombox.value }, CompType.text);    // 写进去容易被fgui编辑器保存清除
        const value = +this.cacheModeCombox.value;
        let obj = App.activeDoc.inspectingTarget;
        obj.docElement.SetProperty('customData', value == 0 ? '' : `cacheMode=${value}`);
        App.RefreshProject();
        App.activeDoc.SetSelection(this._currItem);
    }

    private onUrlInputChanged() {
        this.updateAnimations(this.urlInput.text);
    }

    private onInputSubmit() {
        const row = this._rowInput.text || '0',
            col = this._colInput.text || '0';

        this._formatCustomData(['isCustomType=1', 'rowCount=' + row, 'colCount=' + col], false);
    }

    /**
     *
     * @param strArr ['key=value', 'key=value'...]
     * @param isDel 是否是删除
     */
    private _formatCustomData(strArr: string[], isDel: boolean): void {
        let customData = App.activeDoc.inspectingTargets.get_Item(0).customData;
        try {
            const dataJSON = JSON.parse(customData || '{}');
            for (let i = 0, len = strArr.length; i < len; i++) {
                const str = strArr[i].split('=');
                const key1 = str[0],
                    value = str[1];
                if (value == '0') {
                    delete dataJSON[key1];
                } else if (dataJSON[key1]) {
                    if (isDel) {
                        delete dataJSON[key1];
                    } else {
                        dataJSON[key1] = value;
                    }
                } else if (!isDel) {
                    dataJSON[key1] = value;
                }
            }
            let obj = App.activeDoc.inspectingTarget;
            let customDataStr = Object.keys(dataJSON).length == 0 ? '' : JSON.stringify(dataJSON);
            obj.docElement.SetProperty('customData', customDataStr);
            App.activeDoc.Save();
            App.RefreshProject();
        } catch (error) {
            console.warn('数据不是JSON格式的字符串');
        }
    }

    private updateAnimations(url?: string) {
        try {
            if (!(this._currItem instanceof FairyEditor.FLoader3D)) {
                return;
            }
            url = url ?? this._currItem?.url;
            const animationNames = ['（无）']; // 动画名集合
            
            if (url) {
                const pkgItem = FairyEditor.App.project.GetItemByURL(url);
                const filePath = pkgItem.file;
                const fileExt = System.IO.Path.GetExtension(filePath).toLowerCase();
                
                if (fileExt === '.json') {
                    // 解析 JSON 格式
                    const dbConfig = JSON.parse(System.IO.File.ReadAllText(filePath));
                    if (dbConfig.animations) {
                        animationNames.push(...Object.keys(dbConfig.animations));
                    } else {
                        for (const arm of dbConfig.armature) {
                            for (const ani of arm.animation) {
                                animationNames.push(ani.name);
                            }
                        }
                    }
                } else if (fileExt === '.skel') {
                    // 解析 .skel 二进制格式
                    try {
                       
                    } catch (err) {
                        console.error('解析 .skel 文件失败:', err);
                        App.Alert('解析 .skel 文件失败');
                    }
                }
            }

            const arr = System.Array.CreateInstance($typeof(System.String), animationNames.length) as System.Array$1<string>;
            for (let i = 0; i < animationNames.length; i++) {
                arr.SetValue(animationNames[i], i);
            }
            this.combo.items = arr;
            this.combo.title = this._currItem.animationName || animationNames[0];
        } catch (error) {
            App.Alert('请拖入正确的骨骼动画文件');
            this.setUrl('');
            console.error(error);
        }
    }

    private updateFillMode() {
        if (!(this._currItem instanceof FairyEditor.FLoader3D)) {
            return;
        }
        //  '', 'scale', 'scaleNoBorder', 'scaleMatchHeight', 'scaleMatchWidth', 'scaleFree'
        const fillModeNames = FILL_MODE_CN;
        const arr = System.Array.CreateInstance($typeof(System.String), fillModeNames.length) as System.Array$1<string>;
        for (let i = 0; i < fillModeNames.length; i++) {
            arr.SetValue(fillModeNames[i], i);
        }
        this._fillCombo.items = arr;
        this._fillCombo.selectedIndex = FILL_MODE.indexOf(this._currItem.fill || 'none');
        this._reduce.selected = this._currItem.shrinkOnly;
        //align="center" vAlign="bottom"
        this._horizontal.GetControllerAt(0).selectedIndex = ALIGN.indexOf(this._currItem.align || 'left');
        this._vertical.GetControllerAt(0).selectedIndex = V_ALIGN.indexOf(this._currItem.verticalAlign || 'top');
        this._play.selected = this._currItem.playing;
        this._loop.selected = this._currItem.loop;

        // this._inputFrame.text = (this._currItem.frame ?? 0).toString();
    }

    private setUrl(url: string) {
        const input = this.panel.GetChild('urlInput').asLabel,
            controller = input.GetControllerAt(0),
            nameText = input.GetChild('nameText').asTextField,
            urlInput = this.urlInput;
        if (!url) {
            controller.selectedIndex = 0;
            urlInput.text = '';
            input.icon = '';
            nameText.text = '';
            return;
        }
        const pkgItem = FairyEditor.App.project.GetItemByURL(url);
        if (pkgItem.type == FairyEditor.FPackageItemType.DRAGONBONES || pkgItem.type == FairyEditor.FPackageItemType.SPINE) {
            if (pkgItem.type == FairyEditor.FPackageItemType.DRAGONBONES) {
                input.icon = 'ui://Builder/icon_dragonbones';
            } else if (pkgItem.type == FairyEditor.FPackageItemType.SPINE) {
                input.icon = 'ui://Builder/icon_spine';
            }
            controller.selectedIndex = 1;
            nameText.text = pkgItem.fileName.split('.')[0] + ' @' + pkgItem.owner.name;
            nameText.x = input.GetChild('icon').asLoader.width + 5;
            urlInput.text = url;
        }
    }

    // 所有需要被替换的值
    private writeFile(all: any, type: CompType) {
        if (!all) {
            return;
        }
        const path = App.project.GetItemByURL(App.activeDoc.docURL).file;
        let xmlStr = System.IO.File.ReadAllText(path);
        let loader3D = '';
        if (type == CompType.loader3D) {
            const result = xmlStr.match(/<loader3D(.*)>/g);
            if (result?.length) {
                for (const str of result) {
                    if (str.indexOf(`name="${this._currItem.name}"`) > -1) {
                        loader3D = str;
                        break;
                    }
                }
            }
        } else if (type == CompType.text) {
            const result = xmlStr.match(/<text(.*)>/g);
            if (result?.length) {
                for (const str of result) {
                    if (str.indexOf(`name="${this._currItem.name}"`) > -1) {
                        loader3D = str;
                        break;
                    }
                }
            }
        } else if (type == CompType.list) {
            const result = xmlStr.match(/<list(.*)>/g);
            if (result?.length) {
                for (const str of result) {
                    if (str.indexOf(`name="${this._currItem.name}"`) > -1) {
                        loader3D = str;
                        break;
                    }
                }
            }
        }
        console.log('match str: ' + this._currItem.name + ', ' + loader3D);
        if (loader3D == '') {
            return;
        }

        const setValueByKey = (key: string, value: any, str: string) => {
            const pattern = new RegExp(`(${key}(\s*)=(\s*)"([^"]*)")`, 'g');
            return str.replace(pattern, `${key}="${value}"`);
        };

        let newLoader3D = loader3D;

        for (const key in all) {
            if (newLoader3D.indexOf(key) < 0) {
                if (newLoader3D.endsWith('/>')) {
                    newLoader3D = newLoader3D.substring(0, newLoader3D.length - 2) + ` ${key}="${all[key]}"/>`;
                } else {
                    newLoader3D = newLoader3D.substring(0, newLoader3D.length - 1) + ` ${key}="${all[key]}">`;
                }
            } else {
                newLoader3D = setValueByKey(key, all[key], newLoader3D);
            }
        }

        xmlStr = xmlStr.replace(loader3D, newLoader3D);
        System.IO.File.WriteAllText(path, xmlStr, System.Text.Encoding.UTF8);
        App.RefreshProject();
    }
}

//Register a inspector
App.inspectorView.AddInspector(() => new DemoInspector(), 'GLoad3DInspector', '自定义属性检查');

//Condition to show it
App.docFactory.ConnectInspector('GLoad3DInspector', 'mixed', false, false);
