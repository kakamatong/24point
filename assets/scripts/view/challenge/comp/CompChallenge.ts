import FGUICompChallenge from "@fgui/challenge/FGUICompChallenge";
import { ViewClass } from "@frameworks/Framework";
import * as fgui from "fairygui-cc";
import { ChallengeView } from "../ChallengeView";
import { BezierTween, Logger } from "@frameworks/utils/Utils";
import FGUICompStar from "@fgui/challenge/FGUICompStar";

@ViewClass({ curveScreenAdapt: true })
export class CompChallenge extends FGUICompChallenge {
    onConstruct() {
        super.onConstruct();
        this.show();
    }

    onDestroy() {
        super.onDestroy();
    }

    onBtnClose() {
        ChallengeView.hideView();
    }

    show(data?: any): void {
    }

    testBezier() {
        const node = fgui.UIPackage.createObject("challenge", "CompStar") as FGUICompStar;
        node.ctrl_status.selectedIndex = 1;
        this.addChild(node);
        BezierTween(node, 0, 0, 500, 500, 1, 300);
    }
}

fgui.UIObjectFactory.setExtension(CompChallenge.URL, CompChallenge);
