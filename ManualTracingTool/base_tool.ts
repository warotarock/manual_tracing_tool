
namespace ManualTracingTool {

    export enum MainToolID {

        none = 0,
        drawLine = 1,
        scratchLine = 2,
        posing = 3
    }

    export enum OperationUnitID {

        none = 0,
        linePoint = 1,
        lineSegment = 2,
        line = 3,
        layer = 4,
        countOfID = 5
    }

    export enum Posing3DSubToolID {

        locateHead = 0,
        rotateHead = 1,
        locateBody = 2,
        rotateBody = 3,
        locateRightArm1 = 4,
        locateRightArm2 = 5,
        locateLeftArm1 = 6,
        locateLeftArm2 = 7,
        locateRightLeg1 = 8,
        locateRightLeg2 = 9,
        locateLeftLeg1 = 10,
        locateLeftLeg2 = 11,
        twistHead = 12,
    }

    export enum EditModeID {

        selectMode = 1,
        drawMode = 2
    }

    export interface MainEditor {

        setCurrentLayer(layer: Layer);
        endModalTool();
        cancelModalTool();
        openFileDialog();
        startLoadingDocumentResourcesProcess(document: DocumentData);
    }

    export interface MainEditorDrawer {

        drawMouseCursor();
        drawEditorEditLineStroke(line: VectorLine);
        drawEditorVectorLineStroke(line: VectorLine, color: Vec4, strokeWidth: float, useAdjustingLocation: boolean);
        drawEditorVectorLinePoints(line: VectorLine, color: Vec4, useAdjustingLocation: boolean);
        drawEditorVectorLineSegment(line: VectorLine, startIndex: int, endIndex: int, useAdjustingLocation: boolean);
    }

    export class PickingWindow extends CanvasWindow {

        maxDepth = 4.0;
    }

    export class OperatorCursor {

        location = vec3.fromValues(0.0, 0.0, 0.0);
        radius = 15.0;
    }

    export class ToolContext {

        mainEditor: MainEditor = null;

        mainToolID = MainToolID.none;
        subToolIndex = 0;
        editMode = EditModeID.drawMode;
        operationUnitID = OperationUnitID.linePoint;

        commandHistory: CommandHistory = null;

        document: DocumentData = null;
        currentLayer: Layer = null;

        currentVectorLayer: VectorLayer = null;
        currentVectorGroup: VectorGroup = null;
        currentVectorLine: VectorLine = null;

        currentPosingLayer: PosingLayer = null;
        currentPosingModel: PosingModel = null;
        currentPosingData: PosingData = null;

        currentImageFileReferenceLayer: ImageFileReferenceLayer = null;

        redrawMainWindow = false;
        redrawEditorWindow = false;
        redrawLayerWindow = false;
        updateLayerWindowItems = false;
        redrawWebGLWindow = false;
        redrawHeaderWindow = false;
        redrawFooterWindow = false;

        mainWindow: CanvasWindow = null;
        pickingWindow: PickingWindow = null;

        mouseCursorRadius = 20.0;

        resamplingUnitLength = 12.0

        operatorCursor = new OperatorCursor();

        shiftKey: boolean = false;
        altKey: boolean = false;
        ctrlKey: boolean = false;

        posing3DView: Posing3DView = null;
        posing3DLogic: Posing3DLogic = null;
    }

    export class ToolEnvironment {

        private toolContext: ToolContext = null;

        mainToolID = MainToolID.posing;
        subToolIndex = 0;
        editMode = EditModeID.drawMode;
        operationUnitID = OperationUnitID.linePoint;

        commandHistory: CommandHistory = null;

        operatorCursor: OperatorCursor = null;

        currentVectorLayer: VectorLayer = null;
        currentVectorGroup: VectorGroup = null;
        currentVectorLine: VectorLine = null;

        currentPosingLayer: PosingLayer = null;
        currentPosingModel: PosingModel = null;
        currentPosingData: PosingData = null;

        currentImageFileReferenceLayer: ImageFileReferenceLayer = null;

        mainWindow: CanvasWindow = null;
        pickingWindow: PickingWindow = null;

        posing3DView: Posing3DView = null;
        posing3DLogic: Posing3DLogic = null;

        mouseCursorViewRadius = 0.0;
        mouseCursorLocation = vec3.fromValues(0.0, 0.0, 0.0);

        viewScale = 0.0;

        constructor(toolContext: ToolContext) {

            this.toolContext = toolContext;
        }

        updateContext() {

            this.mainToolID = this.toolContext.mainToolID;
            this.subToolIndex = this.toolContext.subToolIndex;
            this.editMode = this.toolContext.editMode;
            this.operationUnitID = this.toolContext.operationUnitID;

            this.commandHistory = this.toolContext.commandHistory;

            this.operatorCursor = this.toolContext.operatorCursor;

            this.currentVectorLayer = this.toolContext.currentVectorLayer;
            this.currentVectorGroup = this.toolContext.currentVectorGroup;
            this.currentVectorLine = this.toolContext.currentVectorLine;

            if (this.toolContext.currentVectorLine != null) {

                if (this.toolContext.currentVectorLine.modifyFlag == VectorLineModifyFlagID.delete) {

                    this.toolContext.currentVectorLine = null;
                    this.currentVectorLine = null;
                }
            }

            this.currentPosingLayer = this.toolContext.currentPosingLayer;
            this.currentPosingModel = this.toolContext.currentPosingModel;
            this.currentPosingData = this.toolContext.currentPosingData;

            this.currentImageFileReferenceLayer = this.toolContext.currentImageFileReferenceLayer;

            this.mainWindow = this.toolContext.mainWindow;
            this.pickingWindow = this.toolContext.pickingWindow;
            this.posing3DView = this.toolContext.posing3DView;
            this.posing3DLogic = this.toolContext.posing3DLogic;

            this.viewScale = this.toolContext.mainWindow.viewScale;

            this.mouseCursorViewRadius = this.getViewScaledLength(this.toolContext.mouseCursorRadius);
        }

        setRedrawMainWindow() {

            this.toolContext.redrawMainWindow = true;
        }

        setRedrawEditorWindow() {

            this.toolContext.redrawEditorWindow = true;
        }

        setRedrawLayerWindow() {

            this.toolContext.redrawLayerWindow = true;
        }

        setUpadateLayerWindowItems() {

            this.toolContext.updateLayerWindowItems = true;
            this.toolContext.redrawLayerWindow = true;
        }

        setRedrawMainWindowEditorWindow() {

            this.setRedrawMainWindow();
            this.setRedrawEditorWindow();
            this.setRedrawWebGLWindow();
        }

        setRedrawAllWindows() {

            this.setRedrawMainWindowEditorWindow();
            this.setUpadateLayerWindowItems();
        }

        setRedrawWebGLWindow() {

            this.toolContext.redrawWebGLWindow = true;
        }

        isAnyModifierKeyPressing(): boolean {

            return (this.toolContext.shiftKey || this.toolContext.altKey || this.toolContext.ctrlKey);
        }

        isShiftKeyPressing(): boolean {

            return (this.toolContext.shiftKey);
        }

        isCtrlKeyPressing(): boolean {

            return (this.toolContext.ctrlKey);
        }

        isAltKeyPressing(): boolean {

            return (this.toolContext.altKey);
        }

        isDrawMode() {

            return (this.toolContext.editMode == EditModeID.drawMode);
        }

        isSelectMode() {

            return (this.toolContext.editMode == EditModeID.selectMode);
        }

        isCurrentLayerVectorLayer(): boolean {

            return (this.currentVectorLayer != null);
        }

        isCurrentLayerImageFileReferenceLayer(): boolean {

            return (this.currentImageFileReferenceLayer != null);
        }

        needsDrawOperatorCursor(): boolean {

            return (this.isSelectMode() || this.isCurrentLayerImageFileReferenceLayer());
        }

        setCurrentLayer(layer: Layer) {

            this.toolContext.mainEditor.setCurrentLayer(layer);
        }

        setCurrentVectorLine(line: VectorLine, isEditTarget: boolean) {

            this.toolContext.currentVectorLine = line;
            this.currentVectorLine = line;

            this.currentVectorLine.isEditTarget = isEditTarget;
        }

        endModalTool() {

            this.toolContext.mainEditor.endModalTool();
        }

        cancelModalTool() {

            this.toolContext.mainEditor.cancelModalTool();
        }

        openFileDialog() {

            this.toolContext.mainEditor.openFileDialog();
        }

        startLoadingCurrentDocumentResources() {

            this.toolContext.mainEditor.startLoadingDocumentResourcesProcess(this.toolContext.document);
        }

        getViewScaledLength(length: float) {

            return length / this.viewScale;
        }
    }

    export class ToolDrawingStyle {

        linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        testColor = vec4.fromValues(0.0, 0.7, 0.0, 1.0);
        sampledPointColor = vec4.fromValues(0.0, 0.5, 1.0, 1.0);
        extrutePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        editingLineColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
        selectedVectorLineColor = vec4.fromValues(0.8, 0.3, 0.0, 0.5);

        linePointVisualBrightnessAdjustRate = 0.3;

        mouseCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);
        operatorCursorCircleColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);

        modalToolSelectedAreaLineColor = vec4.fromValues(1.0, 0.5, 0.5, 1.0);

        generalLinePointRadius = 2.0;
        selectedLinePointRadius = 3.0;
        viewZoomAdjustingSpeedRate = 3.0;
    }

    export class ToolDrawingEnvironment {

        canvasWindow: CanvasWindow = null;
        editorDrawer: MainEditorDrawer = null;
        render: CanvasRender = null;
        style: ToolDrawingStyle = null;

        setEnvironment(editorDrawer: MainEditorDrawer, render: CanvasRender, style: ToolDrawingStyle) {

            this.editorDrawer = editorDrawer;
            this.render = render;
            this.style = style;
        }

        setVariables(canvasWindow: CanvasWindow) {

            this.canvasWindow = canvasWindow;
        }
    }

    export class ToolMouseEvent {

        button = 0;
        buttons = 0;
        offsetX = 0.0;
        offsetY = 0.0;
        wheelDelta = 0.0;

        isMouseDragging = false;
        location = [0.0, 0.0, 0.0];
        mouseDownLocation = [0.0, 0.0, 0.0];
        mouseMovedVector = [0.0, 0.0, 0.0];

        isLeftButtonPressing(): boolean {

            return (this.buttons == 1);
        }

        isRightButtonPressing(): boolean {

            return (this.buttons == 2);
        }

        isLeftButtonReleased(): boolean {

            return (this.button == 0);
        }

        isRightButtonReleased(): boolean {

            return (this.button == 2);
        }
    }

    export class ToolBase {

        helpText = '';

        isAvailable(env: ToolEnvironment): boolean { // @virtual

            return true;
        }

        mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @virtual
        }

        keydown(e: KeyboardEvent, env: ToolEnvironment) { // @virtual
        }

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @virtual
        }

        onOpenFile(filePath: string, env: ToolEnvironment) { // @virtual
        }
    }

    export class ModalToolBase extends ToolBase {

        prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @virtual

            return false;
        }

        startModal(env: ToolEnvironment) { // @virtual

        }

        endModal(env: ToolEnvironment) { // @virtual
        }

        cancelModal(env: ToolEnvironment) { // @virtual

            env.setRedrawMainWindowEditorWindow();
        }
    }

    export class MainTool {

        mainToolID = MainToolID.none;
        subTools = new List<ToolBase>();
        subToolImage: ImageResource = null;
        currentSubToolIndex = 0;

        id(mainToolID: MainToolID): MainTool {

            this.mainToolID = mainToolID;
            return this;
        }

        subTool(tool: ToolBase): MainTool {

            this.subTools.push(tool);
            return this;
        }

        subToolImg(image: ImageResource): MainTool {

            this.subToolImage = image;

            return this;
        }
    }
}
