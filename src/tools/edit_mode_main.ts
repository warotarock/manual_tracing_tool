import { Tool_Transform_Lattice_LinePoint } from 'tools/tool_transform_line_point';


export class Tool_EditModeMain extends Tool_Transform_Lattice_LinePoint {

    helpText = '左クリックで矩形の辺や角を操作して、選択中の線または点を変形できます。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。';

    //toolWindowItemClick(e: ToolMouseEvent, env: ToolEnvironment) { // @override

    //    env.setCurrentOperationUnitID(OperationUnitID.line);
    //}

    //prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

    //    this.clearEditData(e, env);

    //    if (!this.checkTarget(e, env)) {

    //        return false;
    //    }

    //    // Current cursor location
    //    vec3.copy(this.mouseAnchorLocation, e.location);

    //    // Create edit info
    //    this.prepareEditData(e, env);

    //    return this.existsEditData();
    //}
}
