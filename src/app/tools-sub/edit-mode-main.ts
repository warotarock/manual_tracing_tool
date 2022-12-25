import { Tool_Transform_Lattice_StrokePoint } from './transform-line-point'

export class Tool_EditModeMain extends Tool_Transform_Lattice_StrokePoint {

  helpText = '左クリックで矩形の辺や角を操作して、選択中の線または点を変形できます。<br />Aキーで全選択／解除します。G、R、Sキーで移動、回転、拡縮します。'

  //toolWindowItemClick(e: ToolPointerEvent, ctx: ToolEnvironment) { // @override

  //    ctx.setCurrentOperationUnitID(OperationUnitID.line);
  //}

  //prepareModal(e: ToolPointerEvent, ctx: ToolEnvironment): boolean { // @override

  //    this.clearEditData(e, ctx);

  //    if (!this.checkTarget(e, ctx)) {

  //        return false;
  //    }

  //    // Current cursor location
  //    vec3.copy(this.mouseAnchorLocation, e.location);

  //    // Create edit info
  //    this.prepareEditData(e, ctx);

  //    return this.existsEditData();
  //}
}
