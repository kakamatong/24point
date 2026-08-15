import FGUIChallengeView from "@fgui/challenge/FGUIChallengeView";
import * as fgui from "fairygui-cc";
import { PackageLoad, ViewClass } from "@frameworks/Framework";

@PackageLoad(["challenge", "props"])
@ViewClass()
export class ChallengeView extends FGUIChallengeView {}

fgui.UIObjectFactory.setExtension(ChallengeView.URL, ChallengeView);
