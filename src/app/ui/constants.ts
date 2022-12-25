
export enum MainCommandButtonID {

  none = 0,
  openFile,
  newFile,
  saveFile,
  saveAs,
  export,
  shortcutKeys,
  undo,
  redo,
  copy,
  paste,
  cut,
  touchOperationPanel,
  layerWindow,
  layer_addLayer,
  layer_deleteLayer,
  layer_moveUp,
  layer_moveDown,
  paletteWindow,
  colorMixerWindow,
  timeLineWindow,
  timeLine_inertKeyframe,
  timeLine_deleteKeyframe,
  timeLine_moveKeyframe_minus,
  timeLine_moveKeyframe_plus,
  timeLine_changeMaxFrame_minus,
  timeLine_changeMaxFrame_plus,
  timeLine_changeLoopStartFrame_minus,
  timeLine_changeLoopStartFrame_plus,
  timeLine_changeLoopEndFrame_minus,
  timeLine_changeLoopEndFrame_plus,
  timeLine_changeOnionSkinBackwardLevel_minus,
  timeLine_changeOnionSkinBackwardLevel_plus,
  timeLine_changeOnionSkinForwardLevel_minus,
  timeLine_changeOnionSkinForwardLevel_plus,
}

export enum NumberInputControlID {

  none = 0,
  onionSkinMode,
}

export enum RibbonUIControlID {

  none = 0,
  pointerBaseSize,
  brushBaseSize,
  brushMinSize,
  edit_operationUnit,
  edit_operationOrigin,
  document_lineWidthBiasRate,
  document_hideOuterArea,
  layer_name,
  vectorLayer_drawLineType,
  vectorLayer_fillAreaType,
  vectorLayer_lineWidthBiasRate,
  layer_isRenderTarget,
  layer_isMaskedByBelowLayer,
  vectorLayer_enableEyesSymmetry,
  vectorLayer_eyesSymmetryInputSide,
  vectorLayer_posingLayer,
  imageFileRef_openImageFile,
}

export enum SideBarContentID {

  none = 0,
  layerWindow,
  paletteWindow,
  colorMixerWindow,
}

export enum NewLayerTypeID {

  none = 0,
  vectorLayer,
  surroundingFill,
  autoFill,
  pointBrushFill,
  vectorLayerReferenceLayer,
  imageFileReferenceLayer,
  posingLayer,
  groupLayer,
}

export enum NewKeyframeTypeID {

  none = 0,
  insertToCurrentFrameAllLayer,
  insertToCurrentFrameActiveLayer,
  insertEmptyToAllLayer,
  insertEmptyToActiveLayer,
}

export enum DeleteKeyframeTypeID {

  none = 0,
  deleteCurrentFrameAllLayer,
  deleteCurrentFrameActiveLayer,
}

export enum OpenFileDialogTargetID {

  none,
  openDocument = 1,
  saveDocument = 2,
  imageFileReferenceLayerFilePath = 3
}
