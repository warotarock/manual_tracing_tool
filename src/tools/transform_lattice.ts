﻿import { List, float, int } from '../base/conversion';
import { Layer, } from '../base/data';

import {
    ToolEnvironment, ToolMouseEvent,
    ModalToolBase,
    LatticePoint,
    LatticePointEditTypeID,
    ToolDrawingEnvironment,
} from '../base/tool';

import { Logic_Edit_Points, Logic_Edit_Points_RectangleArea } from '../logics/edit_vector_layer';
import { Logic_Points } from '../logics/points';

export enum SelectedLatticePartID {

    none, latticePoint, latticeEdge
}

export enum LatticeStateID {

    invalid = 0,
    initialState = 1,
    modified = 2,
}

export enum TransformType {

    none = 0,
    grabMove = 1,
    rotate = 2,
    scale = 3
}

export enum TransformLockType {

    none = 0,
    x = 1,
    y = 2,
}

export enum TransformModifyType {

    none = 0,
    zero = 1,
    slow = 2,
    one = 3,
}

export class Tool_Transform_Lattice extends ModalToolBase {

    isEditTool = true; // @override

    latticeState = LatticeStateID.invalid;
    baseRectangleArea = new Logic_Edit_Points_RectangleArea();
    rectangleArea = new Logic_Edit_Points_RectangleArea();

    latticePoints: List<LatticePoint> = null;
    latticePointCount = 4;
    latticePadding = 0.0;

    transformType = TransformType.none;
    transformLockType = TransformLockType.none;
    transformModifyType = TransformModifyType.none;
    transformCalculator: ITool_Transform_Lattice_Calculator = null;
    grabMove_Calculator = new GrabMove_Calculator();
    rotate_Calculator = new Rotate_Calculator();
    scale_Calculator = new Scale_Calculator();

    mouseOver_SelectedLatticePart = SelectedLatticePartID.none;
    mouseOver_PartIndex = -1;
    mouseOver_PartIndexTo = -1;

    constructor() {
        super();

        this.createLatticePoints();
    }

    mouseAnchorLocation = vec3.create();

    isAvailable(env: ToolEnvironment): boolean { // @override

        return (
            //env.currentVectorLayer != null
            //&& Layer.isEditTarget(env.currentVectorLayer)
            env.currentLayer != null
            && Layer.isEditTarget(env.currentLayer)
        );
    }

    onActivated(env: ToolEnvironment) { // @override

        this.latticeState = LatticeStateID.invalid;
        this.mouseOver_SelectedLatticePart = SelectedLatticePartID.none;

        let available = this.prepareLatticePoints(env);

        if (available) {

            this.latticeState = LatticeStateID.initialState;
        }
        else {
            this.latticeState = LatticeStateID.invalid;
        }
    }

    // Preparing for operation

    prepareModal(e: ToolMouseEvent, env: ToolEnvironment): boolean { // @override

        this.clearEditData();

        this.latticeState = LatticeStateID.invalid;
        this.transformLockType = TransformLockType.none;
        this.transformModifyType = TransformModifyType.none;

        if (!this.checkTarget(env)) {

            return false;
        }

        // Create lattie points
        if (this.latticePoints == null) {

            this.createLatticePoints();
        }

        // Current cursor location
        vec3.copy(this.mouseAnchorLocation, e.location);

        // Caluclate surrounding rectangle of all selected points
        let available = this.prepareLatticePoints(env);

        if (!available) {
            this.latticeState = LatticeStateID.invalid;
            return false;
        }

        this.latticeState = LatticeStateID.initialState;
        this.setLatticeLocation(env);

        this.selectTransformCalculator(env);

        // Create edit info
        this.prepareEditData(env);

        this.prepareModalExt(env);

        return this.existsEditData();
    }

    protected createLatticePoints() {

        this.latticePoints = new List<LatticePoint>();

        for (let i = 0; i < this.latticePointCount; i++) {

            this.latticePoints.push(new LatticePoint());
        }
    }

    protected addPaddingToRectangle(result: Logic_Edit_Points_RectangleArea, rectangle: Logic_Edit_Points_RectangleArea, padding: float, env: ToolEnvironment) {

        let viewPadding = env.getViewScaledLength(padding);

        result.left = rectangle.left - viewPadding;
        result.top = rectangle.top - viewPadding;
        result.right = rectangle.right + viewPadding;
        result.bottom = rectangle.bottom + viewPadding;
    }

    protected setLatticePointsByRectangle(rectangle: Logic_Edit_Points_RectangleArea) {

        vec3.set(this.latticePoints[0].baseLocation, rectangle.left, rectangle.top, 0.0);
        vec3.set(this.latticePoints[1].baseLocation, rectangle.right, rectangle.top, 0.0);
        vec3.set(this.latticePoints[2].baseLocation, rectangle.right, rectangle.bottom, 0.0);
        vec3.set(this.latticePoints[3].baseLocation, rectangle.left, rectangle.bottom, 0.0);

        this.resetLatticePointLocationToBaseLocation();
    }

    protected setLatticeLocation(env: ToolEnvironment) { // @virtual

        this.latticePadding = env.drawStyle.latticePointPadding;

        this.addPaddingToRectangle(this.rectangleArea, this.baseRectangleArea, this.latticePadding, env);

        this.setLatticePointsByRectangle(this.rectangleArea);
    }

    protected resetLatticePointLocationToBaseLocation() {

        for (let latticePoint of this.latticePoints) {

            vec3.copy(latticePoint.location, latticePoint.baseLocation);
        }
    }

    protected applytLatticePointBaseLocation() {

        for (let latticePoint of this.latticePoints) {

            vec3.copy(latticePoint.baseLocation, latticePoint.location);
        }
    }

    // Preparing for operation (Override methods)

    protected checkTarget(env: ToolEnvironment): boolean { // @virtual

        return (this.transformType != TransformType.none);
    }

    protected prepareLatticePoints(env: ToolEnvironment): boolean { // @virtual

        let available = false;

        return available;
    }

    protected clearEditData() { // @virtual
    }

    protected selectTransformCalculator(env: ToolEnvironment) { // @virtual
    }

    protected prepareEditData(env: ToolEnvironment) { // @virtual
    }

    protected prepareModalExt(env: ToolEnvironment) { // @override
    }

    protected existsEditData(): boolean { // @virtual

        return Logic_Edit_Points.existsRectangleArea(this.baseRectangleArea);
    }

    // Operation functions

    protected setLatticeAffineTransform(transformType: TransformType, env: ToolEnvironment) {

        for (let latticePoint of this.latticePoints) {

            latticePoint.latticePointEditType = LatticePointEditTypeID.allDirection;
        }

        if (transformType == TransformType.grabMove) {

            this.transformType = TransformType.grabMove;
            this.transformCalculator = this.grabMove_Calculator;
        }
        else if (transformType == TransformType.rotate) {

            this.transformType = TransformType.rotate;
            this.transformCalculator = this.rotate_Calculator;
        }
        else if (transformType == TransformType.scale) {

            this.transformType = TransformType.scale;
            this.transformCalculator = this.scale_Calculator;
        }

        this.transformCalculator.prepare(env);
    }

    protected startLatticeAffineTransform(transformType: TransformType, isContinueEdit: boolean, env: ToolEnvironment) {

        this.setLatticeAffineTransform(transformType, env);

        vec3.copy(this.mouseAnchorLocation, env.mouseCursorLocation);

        if (isContinueEdit) {

            this.applytLatticePointBaseLocation();
        }
        else {

            env.startModalTool(this);
        }
    }

    protected startLatticeTransform(env: ToolEnvironment) {

        for (let latticePoint of this.latticePoints) {

            latticePoint.latticePointEditType = LatticePointEditTypeID.none;
        }

        if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticePoint) {

            let pointIndexH = -1;
            let pointIndexV = -1;
            if (this.mouseOver_PartIndex == 0) {

                pointIndexH = 3;
                pointIndexV = 1;
            }
            else if (this.mouseOver_PartIndex == 1) {

                pointIndexH = 2;
                pointIndexV = 0;
            }
            else if (this.mouseOver_PartIndex == 2) {

                pointIndexH = 1;
                pointIndexV = 3;
            }
            else if (this.mouseOver_PartIndex == 3) {

                pointIndexH = 0;
                pointIndexV = 2;
            }

            this.latticePoints[this.mouseOver_PartIndex].latticePointEditType = LatticePointEditTypeID.allDirection;
            this.latticePoints[pointIndexH].latticePointEditType = LatticePointEditTypeID.horizontalOnly;
            this.latticePoints[pointIndexV].latticePointEditType = LatticePointEditTypeID.verticalOnly;

            this.transformType = TransformType.grabMove;
            this.transformCalculator = this.grabMove_Calculator;
            this.latticeState = LatticeStateID.initialState;

            this.transformCalculator.prepare(env);

            env.startModalTool(this);
        }

        else if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticeEdge) {

            let latticePointEditType: LatticePointEditTypeID;
            if (this.mouseOver_PartIndex == 0 || this.mouseOver_PartIndex == 2) {

                latticePointEditType = LatticePointEditTypeID.verticalOnly;
            }
            else {

                latticePointEditType = LatticePointEditTypeID.horizontalOnly;
            }

            this.latticePoints[this.mouseOver_PartIndex].latticePointEditType = latticePointEditType;
            this.latticePoints[this.mouseOver_PartIndexTo].latticePointEditType = latticePointEditType;

            this.transformType = TransformType.grabMove;
            this.transformCalculator = this.grabMove_Calculator;
            this.latticeState = LatticeStateID.initialState;

            this.transformCalculator.prepare(env);

            env.startModalTool(this);
        }
    }

    protected endTransform(env: ToolEnvironment) {

        this.processTransform(env);

        this.executeCommand(env);

        this.transformType = TransformType.none;
        this.transformCalculator = null;

        env.endModalTool();
    }

    protected cancelTransform(env: ToolEnvironment) {

        this.transformType = TransformType.none;
        this.transformCalculator = null;

        env.cancelModalTool();
    }

    // Operation inputs

    mouseDown(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        if (!env.isModalToolRunning() && e.isLeftButtonPressing()) {

            this.startLatticeTransform(env);
        }
        else {

            if (e.isRightButtonPressing()) {

                this.cancelTransform(env);
            }
        }
    }

    mouseMove(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        if (env.isModalToolRunning()) {

            // Move lattice points

            this.processLatticePointMouseMove(env);

            // Transform edit data

            this.processTransform(env);

            env.setRedrawCurrentLayer();
            env.setRedrawEditorWindow();
        }
        else {

            this.processMouseOver(e, env);

            env.setRedrawEditorWindow(); // redraw cursor
        }
    }

    protected processMouseOver(e: ToolMouseEvent, env: ToolEnvironment) {

        this.mouseOver_SelectedLatticePart = SelectedLatticePartID.none;
        this.mouseOver_PartIndex = -1;
        this.mouseOver_PartIndexTo = -1;

        let partIndex = this.getMouseOverLatticePointIndex(e, env);

        if (partIndex != -1) {

            this.mouseOver_SelectedLatticePart = SelectedLatticePartID.latticePoint;
            this.mouseOver_PartIndex = partIndex;
        }
        else {

            partIndex = this.getMouseOverLatticeEdgeIndex(e, env);

            if (partIndex != -1) {

                this.mouseOver_SelectedLatticePart = SelectedLatticePartID.latticeEdge;
                this.mouseOver_PartIndex = partIndex;
                this.mouseOver_PartIndexTo = (partIndex + 1) % this.latticePoints.length;
            }
        }
    }

    protected getMouseOverLatticePointIndex(e: ToolMouseEvent, env: ToolEnvironment): int {

        let resultIndex = -1;

        let scaledHitRadius = env.getViewScaledLength(env.drawStyle.latticePointHitRadius);

        for (let index = 0; index < this.latticePoints.length; index++) {

            let latticePoint = this.latticePoints[index];

            let distance = vec3.distance(latticePoint.location, e.location);

            if (distance <= scaledHitRadius) {

                resultIndex = index;
                break;
            }
        }

        return resultIndex;
    }

    protected getMouseOverLatticeEdgeIndex(e: ToolMouseEvent, env: ToolEnvironment): int {

        let resultIndex = -1;

        let scaledHitRadius = env.getViewScaledLength(env.drawStyle.latticePointHitRadius);

        for (let index = 0; index < this.latticePoints.length; index++) {

            let indexTo = (index + 1) % this.latticePoints.length;

            let latticePoint1 = this.latticePoints[index];
            let latticePoint2 = this.latticePoints[indexTo];

            let distance = Logic_Points.pointToLineSegment_SorroundingDistance(
                latticePoint1.location,
                latticePoint2.location,
                e.location);

            if (distance <= scaledHitRadius) {

                resultIndex = index;
                break;
            }
        }

        return resultIndex;
    }

    keydown(e: KeyboardEvent, env: ToolEnvironment): boolean { // @override

        if (!env.isModalToolRunning()) {

            if (e.key == 'g') {

                this.startLatticeAffineTransform(TransformType.grabMove, false, env);
                return true;
            }
            else if (e.key == 'r') {

                this.startLatticeAffineTransform(TransformType.rotate, false, env);
                return true;
            }
            else if (e.key == 's') {

                this.startLatticeAffineTransform(TransformType.scale, false, env);
                return true;
            }
        }
        else {

            if (e.key == 'Enter') {

                this.endTransform(env);
                return true;
            }
            else if (e.key == 'Escape') {

                this.cancelTransform(env);
                return true;
            }
            else if (e.key == 'g') {

                this.startLatticeAffineTransform(TransformType.grabMove, true, env);
                return true;
            }
            else if (e.key == 'r') {

                this.startLatticeAffineTransform(TransformType.rotate, true, env);
                return true;
            }
            else if (e.key == 's') {

                this.startLatticeAffineTransform(TransformType.scale, true, env);
                return true;
            }
            else if (e.key == 'x') {

                if (this.transformLockType != TransformLockType.x) {

                    this.transformLockType = TransformLockType.x;
                }
                else {

                    this.transformLockType = TransformLockType.none;
                }

                this.processLatticePointMouseMove(env);
                this.processTransform(env);

                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
            else if (e.key == 'y') {

                if (this.transformLockType != TransformLockType.y) {

                    this.transformLockType = TransformLockType.y;
                }
                else {

                    this.transformLockType = TransformLockType.none;
                }

                this.processLatticePointMouseMove(env);
                this.processTransform(env);

                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
            else if (e.key == '0') {

                if (this.transformModifyType != TransformModifyType.zero) {

                    this.transformModifyType = TransformModifyType.zero;
                }
                else {

                    this.transformModifyType = TransformModifyType.none;
                }

                this.processLatticePointMouseMove(env);
                this.processTransform(env);

                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
            else if (e.key == '1') {

                if (this.transformModifyType != TransformModifyType.one) {

                    this.transformModifyType = TransformModifyType.one;
                }
                else {

                    this.transformModifyType = TransformModifyType.none;
                }

                this.processLatticePointMouseMove(env);
                this.processTransform(env);

                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
            else if (e.key == 'Shift') {

                if (this.transformModifyType != TransformModifyType.slow) {

                    this.transformModifyType = TransformModifyType.slow;
                }
                else {

                    this.transformModifyType = TransformModifyType.none;
                }

                env.setRedrawCurrentLayer();
                env.setRedrawEditorWindow();
            }
        }

        return false;
    }

    mouseUp(e: ToolMouseEvent, env: ToolEnvironment) { // @override

        if (!env.isModalToolRunning()) {

        }
        else {

            if (e.isLeftButtonReleased()) {

                if (this.latticeState == LatticeStateID.modified) {

                    this.endTransform(env);
                }
            }
        }
    }

    protected processLatticePointMouseMove(env: ToolEnvironment) {

        this.transformCalculator.transformLockType = this.transformLockType;
        this.transformCalculator.transformModifyType = this.transformModifyType;
        this.transformCalculator.processLatticePointMouseMove(this.latticePoints, env);

        this.latticeState = LatticeStateID.modified;
    }

    // Operation process implementation (Override methods)

    protected processTransform(env: ToolEnvironment) { // @virtual

    }

    protected executeCommand(env: ToolEnvironment) { // @virtual
    }

    // Drawing

    onDrawEditor(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) { // @override

        if (this.latticeState != LatticeStateID.invalid) {

            if (this.latticeState == LatticeStateID.initialState) {

                this.setLatticeLocation(env);
            }

            this.drawLatticeRectangle(env, drawEnv);
            this.drawLatticePoints(env, drawEnv);
        }
    }

    private operatorCurosrLineDash = [2.0, 2.0];
    private operatorCurosrLineDashScaled = [0.0, 0.0];
    private operatorCurosrLineDashNone = [];

    protected drawLatticeRectangle(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

        if (this.latticePoints == null) {
            return;
        }

        drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
        drawEnv.render.setStrokeWidth(env.getViewScaledLength(1.0));

        // Set dash
        let viewScale = env.getViewScaledLength(1.0);
        this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
        this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
        drawEnv.render.setLineDash(this.operatorCurosrLineDashScaled);

        // Draw lattice line

        drawEnv.render.beginPath();

        let firstPoint = this.latticePoints[0];
        drawEnv.render.moveTo(firstPoint.location[0], firstPoint.location[1]);

        for (let i = 1; i < this.latticePoints.length; i++) {
            let latticePoint = this.latticePoints[i];

            if (latticePoint.latticePointEditType != LatticePointEditTypeID.none) {
            }

            drawEnv.render.lineTo(latticePoint.location[0], latticePoint.location[1]);
        }

        drawEnv.render.lineTo(firstPoint.location[0], firstPoint.location[1]);
        drawEnv.render.stroke();
        drawEnv.render.setLineDash(this.operatorCurosrLineDashNone);

        if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticeEdge) {

            let latticePoint1 = this.latticePoints[this.mouseOver_PartIndex];
            let latticePoint2 = this.latticePoints[this.mouseOver_PartIndexTo];

            drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
            drawEnv.render.setStrokeWidth(env.getViewScaledLength(3.0));

            drawEnv.render.beginPath();

            drawEnv.render.moveTo(latticePoint1.location[0], latticePoint1.location[1]);
            drawEnv.render.lineTo(latticePoint2.location[0], latticePoint2.location[1]);

            drawEnv.render.stroke();
        }
    }

    protected drawLatticePoints(env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

        // Draw lattice

        for (let latticePoint of this.latticePoints) {

            this.drawLatticePoint(latticePoint, 1.0, env, drawEnv);
        }

        if (this.mouseOver_SelectedLatticePart == SelectedLatticePartID.latticePoint) {

            let latticePoint = this.latticePoints[this.mouseOver_PartIndex];

            this.drawLatticePoint(latticePoint, 3.0, env, drawEnv);
        }
    }

    drawLatticePoint(latticePoint: LatticePoint, lineWidth: float, env: ToolEnvironment, drawEnv: ToolDrawingEnvironment) {

        drawEnv.render.beginPath();

        drawEnv.render.setStrokeColorV(drawEnv.style.modalToolSelectedAreaLineColor);
        drawEnv.render.setStrokeWidth(env.getViewScaledLength(lineWidth));

        drawEnv.render.circle(
            latticePoint.location[0], latticePoint.location[1]
            , env.getViewScaledLength(drawEnv.style.latticePointRadius)
        );

        drawEnv.render.stroke();
    }
}

export interface ITool_Transform_Lattice_Calculator {

    transformLockType: TransformLockType;
    transformModifyType: TransformModifyType;

    prepare(env: ToolEnvironment);
    processLatticePointMouseMove(latticePoints: List<LatticePoint>, env: ToolEnvironment);
}

export class GrabMove_Calculator implements ITool_Transform_Lattice_Calculator {

    transformLockType: TransformLockType.none;
    transformModifyType = TransformModifyType.none;

    private lastLocation = vec3.create();
    private moveAmount = vec3.create();

    private dLocation = vec3.create();

    prepare(env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

        vec3.copy(this.lastLocation, env.mouseCursorLocation);
        vec3.set(this.moveAmount, 0.0, 0.0, 0.0);
    }

    processLatticePointMouseMove(latticePoints: List<LatticePoint>, env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

        vec3.subtract(this.dLocation, env.mouseCursorLocation, this.lastLocation);

        if (this.transformModifyType == TransformModifyType.slow) {

            vec3.scale(this.dLocation, this.dLocation, 0.25);
        }

        vec3.add(this.moveAmount, this.moveAmount, this.dLocation);
        vec3.copy(this.lastLocation, env.mouseCursorLocation);

        for (let latticePoint of latticePoints) {

            if (latticePoint.latticePointEditType == LatticePointEditTypeID.horizontalOnly) {

                latticePoint.location[0] = latticePoint.baseLocation[0] + this.moveAmount[0];
            }
            else if (latticePoint.latticePointEditType == LatticePointEditTypeID.verticalOnly) {

                latticePoint.location[1] = latticePoint.baseLocation[1] + this.moveAmount[1];
            }
            else if (latticePoint.latticePointEditType == LatticePointEditTypeID.allDirection) {

                if (this.transformLockType == TransformLockType.none) {

                    vec3.add(latticePoint.location, latticePoint.baseLocation, this.moveAmount);
                }
                else if (this.transformLockType == TransformLockType.x) {

                    latticePoint.location[0] = latticePoint.baseLocation[0] + this.moveAmount[0];
                    latticePoint.location[1] = latticePoint.baseLocation[1];
                }
                else if (this.transformLockType == TransformLockType.y) {

                    latticePoint.location[0] = latticePoint.baseLocation[0];
                    latticePoint.location[1] = latticePoint.baseLocation[1] + this.moveAmount[1];
                }
            }
        }
    }
}

export class Rotate_Calculator implements ITool_Transform_Lattice_Calculator {

    transformLockType: TransformLockType.none;
    transformModifyType = TransformModifyType.none;

    private lastAngle = 0.0;
    private rotationAmount = 0.0;

    private dLocation = vec3.create();
    private direction = vec3.create();
    private centerLocation = vec3.create();
    private rotationMatrix = mat4.create();

    prepare(env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

        this.lastAngle = this.calulateInputAngle(env);
        this.rotationAmount = 0.0;
    }

    private calulateInputAngle(env: ToolEnvironment): float {

        vec3.subtract(this.direction, env.mouseCursorLocation, env.operatorCursor.location);
        let angle = Math.atan2(this.direction[1], this.direction[0]);

        return angle;
    }

    processLatticePointMouseMove(latticePoints: List<LatticePoint>, env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

        let inputedAngle = this.calulateInputAngle(env);
        let movedAngle = inputedAngle - this.lastAngle;
        if (movedAngle >= Math.PI) {
            movedAngle -= Math.PI * 2;
        }
        if (movedAngle <= -Math.PI) {
            movedAngle += Math.PI * 2;
        }

        if (this.transformModifyType == TransformModifyType.slow) {

            movedAngle *= 0.25;
        }

        this.rotationAmount += movedAngle;
        this.lastAngle = inputedAngle;

        vec3.copy(this.centerLocation, env.operatorCursor.location);
        vec3.scale(this.dLocation, this.centerLocation, -1.0);

        mat4.identity(this.rotationMatrix);
        mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
        mat4.rotateZ(this.rotationMatrix, this.rotationMatrix, this.rotationAmount);
        mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation);

        for (let latticePoint of latticePoints) {

            vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix);
        }
    }
}

export class Scale_Calculator implements ITool_Transform_Lattice_Calculator {

    transformLockType: TransformLockType.none;
    transformModifyType = TransformModifyType.none;

    private initialDistance = 0.0;
    private lastDistance = 0.0;
    private scalingAmount = 0.0;

    private dLocation = vec3.create();
    private direction = vec3.create();
    private centerLocation = vec3.create();
    private rotationMatrix = mat4.create();

    private scaling = vec3.create();

    prepare(env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

        this.initialDistance = this.calulateDistance(env);

        if (this.initialDistance == 0.0) {

            this.initialDistance = 1.0;
        }

        this.lastDistance = this.initialDistance;
        this.scalingAmount = 1.0;
    }

    calulateDistance(env: ToolEnvironment): float {

        vec3.subtract(this.direction, env.mouseCursorLocation, env.operatorCursor.location);

        let distance = vec3.length(this.direction);

        return distance;
    }

    processLatticePointMouseMove(latticePoints: List<LatticePoint>, env: ToolEnvironment) { // @implements ITool_Transform_Lattice_Calculator

        if (latticePoints.length == 0) {
            return;
        }

        let distance = this.calulateDistance(env);
        let movedDistance = distance - this.lastDistance;

        if (this.transformModifyType == TransformModifyType.slow) {

            movedDistance *= 0.25;
        }

        this.scalingAmount += movedDistance / this.initialDistance;
        this.lastDistance = distance;

        vec3.set(this.scaling, 1.0, 1.0, 1.0);

        let scale = this.scalingAmount;

        let firstLatticePoint = latticePoints[0];
        if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.horizontalOnly) {

            this.scaling[0] = scale;
        }
        else if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.verticalOnly) {

            this.scaling[1] = scale;
        }
        else if (firstLatticePoint.latticePointEditType == LatticePointEditTypeID.allDirection) {

            if (this.transformLockType == TransformLockType.none) {

                vec3.set(this.scaling, scale, scale, 1.0);
            }
            else if (this.transformLockType == TransformLockType.x) {

                if (this.transformModifyType == TransformModifyType.zero) {
                    vec3.set(this.scaling, 0.0, 1.0, 1.0);
                }
                else {
                    vec3.set(this.scaling, scale, 1.0, 1.0);
                }
            }
            else if (this.transformLockType == TransformLockType.y) {

                if (this.transformModifyType == TransformModifyType.zero) {
                    vec3.set(this.scaling, 1.0, 0.0, 1.0);
                }
                else {
                    vec3.set(this.scaling, 1.0, scale, 1.0);
                }
            }
        }

        vec3.copy(this.centerLocation, env.operatorCursor.location);
        vec3.scale(this.dLocation, this.centerLocation, -1.0);

        mat4.identity(this.rotationMatrix);
        mat4.translate(this.rotationMatrix, this.rotationMatrix, this.centerLocation);
        mat4.scale(this.rotationMatrix, this.rotationMatrix, this.scaling);
        mat4.translate(this.rotationMatrix, this.rotationMatrix, this.dLocation);

        for (let latticePoint of latticePoints) {

            vec3.transformMat4(latticePoint.location, latticePoint.baseLocation, this.rotationMatrix);
        }
    }
}
