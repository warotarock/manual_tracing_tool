
namespace ManualTracingTool {

    // Base layer class

    export enum LayerTypeID {

        none = 0,
        rootLayer = 1,
        vectorLayer = 2,
        groupLayer = 3,
        imageFileReferenceLayer = 4,
        posingLayer = 5,
    }

    export class Layer {

        type = LayerTypeID.none;
        name: string = null;
        isVisible = true;
        isSelected = false;

        childLayers = List<Layer>();

        layerColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    }

    // Vector layer

    export enum LinePointModifyFlagID {

        none = 0,
        selectedToUnselected = 1,
        unselectedToSelected = 2,
        delete = 3,
    }

    export class LinePoint {

        location = vec3.fromValues(0.0, 0.0, 0.0);
        lineWidth = 1.0;
        isSelected = false;

        // runtime
        modifyFlag = LinePointModifyFlagID.none;
        tempLocation = vec3.fromValues(0.0, 0.0, 0.0);
        adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
        adjustingLineWidth = 0.0;
        totalLength = 0.0;
        curvature = 0.0;
    }

    export enum VectorLineModifyFlagID {

        none = 0,
        selectedToUnselected = 1,
        unselectedToSelected = 2,
        delete = 3,
        deletePoints = 4,
        transform = 5,
        reampling = 6
    }

    export class VectorLine {

        points = new List<LinePoint>();

        isCloseToMouse = false;
        isEditTarget = false;
        isSelected = false;

        strokeWidth = 1.0;

        // runtime
        modifyFlag = VectorLineModifyFlagID.none;

        left = 999999.0;
        top = 999999.0;

        right = -999999.0;
        bottom = -999999.0;

        totalLength = 0.0;
    }

    export enum VectorGroupModifyFlagID {

        none = 0,
        modifyLines = 1,
        deleteLines = 2,
        delete = 3,
    }

    export class VectorGroup {

        lines = new List<VectorLine>();
        isSelected = false;

        // runtime
        modifyFlag = VectorGroupModifyFlagID.none;
        linePointModifyFlag = VectorGroupModifyFlagID.none;
    }

    export enum DrawLineTypeID {

        none = 1,
        solid = 2,
    }

    export enum FillAreaTypeID {

        none = 1,
        byFillColor = 2,
    }

    export class VectorLayer extends Layer {

        type = LayerTypeID.vectorLayer;

        groups = new List<VectorGroup>();

        drawLineType = DrawLineTypeID.solid;

        fillAreaType = FillAreaTypeID.none;
        fillColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
    }

    // Group layer
    export class GroupLayer extends Layer {

        type = LayerTypeID.groupLayer;
    }

    // Image file reference layer
    export class ImageFileReferenceLayer extends Layer {

        type = LayerTypeID.imageFileReferenceLayer;

        imageFilePath: string = null;

        location = vec3.fromValues(0.0, 0.0, 0.0);
        rotation = vec3.fromValues(0.0, 0.0, 0.0);
        scale = vec3.fromValues(1.0, 1.0, 1.0);

        // runtime

        imageResource: ImageResource = null;

        adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
        adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0);
        adjustingScale = vec3.fromValues(1.0, 1.0, 1.0);
    }

    // Posing
    export class PosingModel {

        // Head to body
        headSphereSize = 0.17; // 14cm
        headTwistSphereSize = 0.26; //

        bodySphereSize = 0.44; // 44cm
        bodySphereLocation = vec3.fromValues(0.0, -0.03, -0.15);
        neckSphereLocation = vec3.fromValues(0.0, -0.03, -0.13);

        bodyRotationSphereSize = 0.22; // 11cm
        bodyRotationSphereLocation = vec3.fromValues(0.0, 0.0, -0.31);

        // Arms
        leftArm1Location = vec3.fromValues(-0.135, 0.0, -0.05);
        rightArm1Location = vec3.fromValues(+0.135, 0.0, -0.05);

        leftArm1HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);
        rightArm1HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);

        leftArm2HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);
        rightArm2HeadLocation = vec3.fromValues(0.0, 0.0, -0.27);

        // Legs
        leftLeg1Location = vec3.fromValues(-0.11, 0.0, -0.46);
        rightLeg1Location = vec3.fromValues(+0.11, 0.0, -0.46);

        leftLeg1HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
        rightLeg1HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);

        leftLeg2HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
        rightLeg2HeadLocation = vec3.fromValues(0.0, 0.0, -0.39);
    }

    export enum InputSideID {
        none = 0,
        front = 1,
        back = 2
    }

    export class PosingInputData {

        inputDone = false;
    }

    export class HeadLocationInputData extends PosingInputData {

        center = vec3.fromValues(0.0, 0.0, 0.0);
        radius = 0.0;
        editLine: VectorLine = null;

        matrix = mat4.create();

        headMatrix = mat4.create();
        bodyRootMatrix = mat4.create();
        neckSphereMatrix = mat4.create();
    }

    export class HeadRotationInputData extends PosingInputData {

        inputSideID = InputSideID.front;
        inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
        editLine: VectorLine = null;

        matrix = mat4.create();
    }

    export class DirectionInputData extends PosingInputData {

        inputSideID = InputSideID.front;
        inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
        editLine: VectorLine = null;

        matrix = mat4.create();
    }

    export class BodyLocationInputData extends DirectionInputData {

        bodyMatrix = mat4.create();

        rotationCenterMatrix = mat4.create();

        leftArm1RootMatrix = mat4.create();
        rightArm1RootMatrix = mat4.create();
        leftLeg1RootMatrix = mat4.create();
        rightLeg1RootMatrix = mat4.create();
    }

    export class BodyRotationInputData extends PosingInputData {

        inputSideID = InputSideID.front;
        inputLocation = vec3.fromValues(0.0, 0.0, 0.0);
        editLine: VectorLine = null;

        matrix = mat4.create();
    }

    export class JointPartInputData extends DirectionInputData {

        childJointRootMatrix = mat4.create();
    }

    export class PosingData {

        real3DViewHalfWidth = 1.0;
        headLocationInputData = new HeadLocationInputData();
        headRotationInputData = new HeadRotationInputData();
        headTwistInputData = new HeadRotationInputData();

        bodyLocationInputData = new BodyLocationInputData();
        bodyRotationInputData = new BodyRotationInputData();

        leftArm1LocationInputData = new JointPartInputData();
        leftArm2LocationInputData = new JointPartInputData();

        rightArm1LocationInputData = new JointPartInputData();
        rightArm2LocationInputData = new JointPartInputData();

        leftLeg1LocationInputData = new JointPartInputData();
        leftLeg2LocationInputData = new JointPartInputData();

        rightLeg1LocationInputData = new JointPartInputData();
        rightLeg2LocationInputData = new JointPartInputData();
    }

    export class PosingLayer extends Layer {

        type = LayerTypeID.posingLayer;

        posingModel = new PosingModel();
        posingData = new PosingData();
    }

    // Document

    export class DocumentData {

        loaded = false;

        rootLayer = new Layer();
        documentFrame = vec4.fromValues(-512.0, -512.0, 512.0, 512.0);
    }
}
