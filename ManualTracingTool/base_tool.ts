
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
    }

    export class PickingWindow extends CanvasWindow {

        maxDepth = 4.0;
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

        currentVectorLayer: VectorLayer = null;
        currentVectorGroup: VectorGroup = null;
        currentVectorLine: VectorLine = null;

        currentPosingLayer: PosingLayer = null;
        currentPosingModel: PosingModel = null;
        currentPosingData: PosingData = null;

        mainWindow: CanvasWindow = null;
        pickingWindow: PickingWindow = null;

        posing3DView: Posing3DView = null;
        posing3DLogic: Posing3DLogic = null;

        mouseCursorRadius= 0.0;
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

            this.mainWindow = this.toolContext.mainWindow;
            this.pickingWindow = this.toolContext.pickingWindow;
            this.posing3DView = this.toolContext.posing3DView;
            this.posing3DLogic = this.toolContext.posing3DLogic;

            this.viewScale = this.toolContext.mainWindow.viewScale;

            this.mouseCursorRadius = this.toolContext.mouseCursorRadius / this.viewScale;
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

        setCurrentLayer(layer: Layer) {

            this.toolContext.mainEditor.setCurrentLayer(layer);
        }

        setCurrentVectorLine(line: VectorLine, isEditTarget: boolean) {

            this.toolContext.currentVectorLine = line;
            this.currentVectorLine = line;

            this.currentVectorLine.isEditTarget = isEditTarget;
        }
    }

    export class ToolDrawingEnvironment {

        canvasWindow: CanvasWindow = null;
        render: CanvasRender = null;
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

        onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

        }
    }

    export class ModalToolBase extends ToolBase {

        prepareModal(env: ToolEnvironment): boolean { // @virtual

            return false;
        }

        startModal(env: ToolEnvironment) { // @virtual

        }

        endModal(env: ToolEnvironment) { // @virtual
        }
    }

    export class MainTool {

        mainToolID = MainToolID.none;
        subTools = new List<ToolBase>();
        currentSubToolIndex = 0;

        id(mainToolID: MainToolID): MainTool {

            this.mainToolID = mainToolID;
            return this;
        }

        subTool(tool: ToolBase): MainTool {

            this.subTools.push(tool);
            return this;
        }
    }
}
