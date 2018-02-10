var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    // ・選択モードでは現在のレイヤーの点と線だけを選択可能にする。見た目も区別がつくようにする。
    // ・線スクラッチの線修正ツールで選択中の点だけを修正できるようにする
    // ・現在のツールに応じた全選択、全選択解除処理
    // ・線スクラッチで点の削減ツール
    // ・線スクラッチの線修正ツールを実用的な使いやすさにする
    // ・ファイル保存、読み込み
    // ・PNG出力、jpeg出力
    // ・現在のレイヤーが変わったときにメインツールを自動で変更する。ベクターレイヤーならスクラッチツールとドローツールのどちらかを記憶、ポージングレイヤーならポーズにする
    // ・レイヤーカラーをどこかに表示する
    // ・レイヤーカラーとレイヤーの透明度の関係を考え直す
    // ・レイヤー削除時に削除前に次に表示されていたレイヤーを選択する
    // ・塗りつぶし
    // ・複数のポージングレイヤーの描画
    // ・ポージングレイヤーの表示/非表示、透明度
    // ・ポージングで入力後にキャラの拡大縮小を可能にする
    // ・ポージングで頭の角度の入力で画面の回転に対応する
    // ・現在のレイヤーが移動したときにカーソルが変な位置に出る
    // ・レイヤーカラーの設定（カラーピッカー）→レイヤーの設定ウィンドウを出して設定するようにしてみた→モーダルウィンドウの中身を実装する→絵を見ながら設定できるように
    // ・レイヤーの表示/非表示の切り替え（レイヤー名の左に目のマークを表示）
    // ・メインツールを変更したときレイヤーに応じたコンテキストの状態になるようにする
    // ・線の移動移動ツール
    // ・点の移動ツール
    // ・アフィン変換ツール
    // ・ラティス変換ツール
    // ・線のコ複製
    // ・グループの複製
    // ・レイヤーの複製
    // ・モディファイアスタック
    // ・レイヤーを選択変更したときレイヤーに応じたコンテキストの状態になるようにする
    var Main = (function () {
        function Main() {
            this.mainWindow = new ManualTracingTool.CanvasWindow();
            this.editorWindow = new ManualTracingTool.CanvasWindow();
            this.layerWindow = new LayerWindow();
            this.webglWindow = new ManualTracingTool.CanvasWindow();
            this.pickingWindow = new PickingWindow();
            this.canvasRender = new ManualTracingTool.CanvasRender();
            this.webGLRender = new WebGLRender();
            this.ID = new HTMLElementID();
            // Integrated tool system
            this.mainTools = new List();
            this.toolContext = null;
            this.toolEnv = null;
            this.toolMouseEvent = new ManualTracingTool.ToolMouseEvent();
            this.systemImage = null;
            this.subToolImages = new List();
            this.layerButtonImage = null;
            //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);
            // Drawing tools
            this.currentTool = null;
            this.tool_DrawLine = new ManualTracingTool.Tool_DrawLine();
            this.tool_AddPoint = new ManualTracingTool.Tool_AddPoint();
            this.tool_ScratchLine = new ManualTracingTool.Tool_ScratchLine();
            this.currentSelectTool = null;
            this.tool_BrushSelect = new ManualTracingTool.Tool_Select_BrushSelet();
            this.selector_LineClosingHitTest = new ManualTracingTool.Selector_LinePoint_LineClosingHitTest();
            // Posing tools
            this.posing3dView = new ManualTracingTool.Posing3DView();
            this.posing3DLogic = new ManualTracingTool.Posing3DLogic();
            this.tool_Posing3d_LocateHead = new ManualTracingTool.Tool_Posing3d_LocateHead();
            this.tool_Posing3d_RotateHead = new ManualTracingTool.Tool_Posing3d_RotateHead();
            this.tool_Posing3d_TwistHead = new ManualTracingTool.Tool_Posing3d_TwistHead();
            this.tool_Posing3d_LocateBody = new ManualTracingTool.Tool_Posing3d_LocateBody();
            this.tool_Posing3d_RatateBody = new ManualTracingTool.Tool_Posing3d_RatateBody();
            this.tool_Posing3d_LocateLeftArm1 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm1();
            this.tool_Posing3d_LocateLeftArm2 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm2();
            this.tool_Posing3d_LocateRightArm1 = new ManualTracingTool.Tool_Posing3d_LocateRightArm1();
            this.tool_Posing3d_LocateRightArm2 = new ManualTracingTool.Tool_Posing3d_LocateRightArm2();
            this.tool_Posing3d_LocateLeftLeg1 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg1();
            this.tool_Posing3d_LocateLeftLeg2 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg2();
            this.tool_Posing3d_LocateRightLeg1 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg1();
            this.tool_Posing3d_LocateRightLeg2 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg2();
            this.imageResurces = new List();
            this.modelFile = new ManualTracingTool.ModelFile();
            this.modelResources = new List();
            // Document data
            this.document = null;
            this.tempFileName = 'Manual tracing tool save data';
            // Work variable
            this.view2DMatrix = mat4.create();
            this.invView2DMatrix = mat4.create();
            this.tempVec3 = vec3.create();
            this.linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.testColor = vec4.fromValues(0.0, 0.7, 0.0, 1.0);
            this.sampleColor = vec4.fromValues(0.0, 0.5, 1.0, 1.0);
            this.extColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.isLoaded = false;
            // Dialogs
            this.currentDialogID = ModalWindowID.none;
            this.layerPropertyWindow_EditLayer = null;
            this.layerPropertyWindow_LayerClolor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            // Main window drawing
            this.dragBeforeTransformMatrix = mat4.create();
            this.dragBeforeViewLocation = vec3.create();
            // Editor window drawing
            this.tool_ScratchLine_EditLine_Visible = true;
            this.tool_ScratchLine_TargetLine_Visible = true;
            this.tool_ScratchLine_SampledLine_Visible = true;
            this.tool_ScratchLine_CandidatePoints_Visible = false;
            // Layer window drawing
            this.layerWindowLayoutArea = new RectangleLayoutArea();
            this.layerWindowItems = null;
            this.layerWindowButtons = null;
            this.subToolViewItems = null;
            this.layerWindowBackgroundColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            this.layerWindowItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            this.subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            this.subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);
            // Footer window drawing
            this.footerText = '';
            this.footerTextBefore = '';
        }
        // Loading
        Main.prototype.startLoading = function () {
            this.resizeWindows();
            this.mainWindow.context = this.mainWindow.canvas.getContext('2d');
            this.editorWindow.context = this.editorWindow.canvas.getContext('2d');
            this.layerWindow.context = this.layerWindow.canvas.getContext('2d');
            this.pickingWindow.context = this.pickingWindow.canvas.getContext('2d');
            this.canvasRender.setContext(this.layerWindow);
            this.canvasRender.setFontSize(18.0);
            if (this.webGLRender.initializeWebGL(this.webglWindow.canvas)) {
                throw ('３Ｄ機能を初期化できませんでした。');
            }
            this.posing3dView.initialize(this.webGLRender, this.pickingWindow);
            // Start loading
            this.modelFile.file('models.json');
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('texture01.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('system_image01.png').tex(false));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image01.png').tex(false));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('layerbar_image01.png').tex(false));
            this.loadModels(this.modelFile, './res/' + this.modelFile.fileName);
            for (var _i = 0, _a = this.imageResurces; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                this.loadTexture(imageResource, './res/' + imageResource.fileName);
            }
        };
        Main.prototype.processLoading = function () {
            if (!this.modelFile.loaded) {
                return;
            }
            for (var _i = 0, _a = this.imageResurces; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                if (!imageResource.loaded) {
                    return;
                }
            }
            // Loading finished
            this.start();
        };
        Main.prototype.loadTexture = function (imageResource, url) {
            var _this = this;
            var image = new Image();
            imageResource.image.imageData = image;
            image.addEventListener('load', function () {
                if (imageResource.isGLTexture) {
                    _this.webGLRender.initializeImageTexture(imageResource.image);
                }
                imageResource.loaded = true;
                imageResource.image.width = image.width;
                imageResource.image.height = image.height;
            });
            image.src = url;
        };
        Main.prototype.loadModels = function (modelFile, url) {
            var _this = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';
            xhr.addEventListener('load', function (e) {
                var data;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                }
                else {
                    data = JSON.parse(xhr.response);
                }
                for (var _i = 0, _a = data.static_models; _i < _a.length; _i++) {
                    var modelData = _a[_i];
                    var modelResource = new ManualTracingTool.ModelResource();
                    modelResource.modelName = modelData.name;
                    _this.webGLRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride); // 4 = size of float
                    modelFile.modelResources.push(modelResource);
                    modelFile.modelResourceDictionary[modelData.name] = modelResource;
                }
                modelFile.loaded = true;
            });
            xhr.send();
        };
        // Starting ups
        Main.prototype.start = function () {
            this.initializeDocument();
            this.initializeContext();
            this.initializeTools();
            this.initializeViews();
            this.isLoaded = true;
            this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
            //this.setCurrentMainTool(MainToolID.posing);
            // debug
            this.setCurrentLayer(this.document.rootLayer.childLayers[0]);
            this.toolEnv.updateContext();
            // 初回描画
            this.resizeWindows(); // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。
            this.updateHeaderButtons();
            this.updateFooterMessage();
            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.toolEnv.setRedrawLayerWindow();
            this.setEvents();
        };
        Main.prototype.initializeDocument = function () {
            var saveData = window.localStorage.getItem(this.tempFileName);
            if (saveData) {
                this.document = JSON.parse(saveData);
                return;
            }
            this.document = new ManualTracingTool.DocumentData();
            var rootLayer = this.document.rootLayer;
            rootLayer.type = ManualTracingTool.LayerTypeID.rootLayer;
            {
                var layer1 = new ManualTracingTool.VectorLayer();
                layer1.name = 'layer1';
                rootLayer.childLayers.push(layer1);
                var group1 = new ManualTracingTool.VectorGroup();
                layer1.groups.push(group1);
            }
            {
                var layer1 = new ManualTracingTool.GroupLayer();
                layer1.name = 'group1';
                rootLayer.childLayers.push(layer1);
                var layer2 = new ManualTracingTool.VectorLayer();
                layer2.name = 'child1';
                layer1.childLayers.push(layer2);
                var group2 = new ManualTracingTool.VectorGroup();
                layer2.groups.push(group2);
            }
            {
                var layer1 = new ManualTracingTool.VectorLayer();
                layer1.name = 'background';
                rootLayer.childLayers.push(layer1);
                var group1 = new ManualTracingTool.VectorGroup();
                layer1.groups.push(group1);
            }
            {
                var layer1 = new ManualTracingTool.PosingLayer();
                layer1.name = 'posing1';
                rootLayer.childLayers.push(layer1);
            }
        };
        Main.prototype.initializeContext = function () {
            this.toolContext = new ManualTracingTool.ToolContext();
            this.toolContext.mainWindow = this.mainWindow;
            this.toolContext.pickingWindow = this.pickingWindow;
            this.toolContext.posing3DView = this.posing3dView;
            this.toolContext.posing3DLogic = this.posing3DLogic;
            this.toolContext.document = this.document;
            this.toolContext.commandHistory = new ManualTracingTool.CommandHistory();
            this.toolContext.mainEditor = this;
        };
        Main.prototype.initializeViews = function () {
            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;
            this.collectLayerWindowButtons();
            this.collectLayerWindowItems();
        };
        Main.prototype.initializeTools = function () {
            // Constructs main tools and sub tools structure
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.none));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.drawLine)
                .subTool(this.tool_DrawLine));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.scratchLine)
                .subTool(this.tool_ScratchLine));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.posing)
                .subTool(this.tool_Posing3d_LocateHead)
                .subTool(this.tool_Posing3d_RotateHead)
                .subTool(this.tool_Posing3d_LocateBody)
                .subTool(this.tool_Posing3d_RatateBody)
                .subTool(this.tool_Posing3d_LocateRightArm1)
                .subTool(this.tool_Posing3d_LocateRightArm2)
                .subTool(this.tool_Posing3d_LocateLeftArm1)
                .subTool(this.tool_Posing3d_LocateLeftArm2)
                .subTool(this.tool_Posing3d_LocateRightLeg1)
                .subTool(this.tool_Posing3d_LocateRightLeg2)
                .subTool(this.tool_Posing3d_LocateLeftLeg1)
                .subTool(this.tool_Posing3d_LocateLeftLeg2)
                .subTool(this.tool_Posing3d_TwistHead));
            // Constructs current tool states
            this.toolEnv = new ManualTracingTool.ToolEnvironment(this.toolContext);
            //this.currentTool = this.tool_DrawLine;
            //this.currentTool = this.tool_AddPoint;
            //this.currentTool = this.tool_ScratchLine;
            this.currentTool = this.tool_Posing3d_LocateHead;
            this.currentSelectTool = this.tool_BrushSelect;
            this.systemImage = this.imageResurces[1];
            this.subToolImages.push(this.imageResurces[2]);
            this.layerButtonImage = this.imageResurces[3];
            this.posing3dView.storeResources(this.modelFile, this.imageResurces);
        };
        Main.prototype.setEvents = function () {
            var _this = this;
            this.editorWindow.canvas.addEventListener('mousedown', function (e) {
                _this.getMouseInfo(e, false, _this.mainWindow);
                _this.mainWindow_mousedown();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mousemove', function (e) {
                _this.getMouseInfo(e, false, _this.mainWindow);
                _this.mainWindow_mousemove();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mouseup', function (e) {
                _this.getMouseInfo(e, true, _this.mainWindow);
                _this.mainWindow_mouseup();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchstart', function (e) {
                _this.getTouchInfo(e, true, false, _this.mainWindow);
                _this.mainWindow_mousedown();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchmove', function (e) {
                _this.getTouchInfo(e, false, false, _this.mainWindow);
                _this.mainWindow_mousemove();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchend', function (e) {
                _this.getTouchInfo(e, false, true, _this.mainWindow);
                _this.mainWindow_mouseup();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mousewheel', function (e) {
                _this.getWheelInfo(e);
                _this.editorWindow_mousewheel();
                e.preventDefault();
            });
            this.layerWindow.canvas.addEventListener('mousedown', function (e) {
                _this.getMouseInfo(e, false, _this.layerWindow);
                _this.layerWindow_mousedown();
                e.preventDefault();
            });
            document.addEventListener('keydown', function (e) {
                _this.document_keydown(e);
            });
            document.addEventListener('keyup', function (e) {
                _this.document_keyup(e);
            });
            window.addEventListener('resize', function (e) {
                _this.htmlWindow_resize(e);
            });
            window.addEventListener('contextmenu', function (e) {
                return _this.htmlWindow_contextmenu(e);
            });
            this.getElement(this.ID.menu_btnDrawTool).addEventListener('mousedown', function (e) {
                _this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                _this.toolEnv.setRedrawLayerWindow();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnScratchTool).addEventListener('mousedown', function (e) {
                _this.setCurrentMainTool(ManualTracingTool.MainToolID.scratchLine);
                _this.toolEnv.setRedrawLayerWindow();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnPoseTool).addEventListener('mousedown', function (e) {
                _this.setCurrentMainTool(ManualTracingTool.MainToolID.posing);
                _this.toolEnv.setRedrawLayerWindow();
                e.preventDefault();
            });
            document.addEventListener('custombox:content:close', function () {
                // Content closed
                _this.onModalWindowClosed();
            });
        };
        // Continuous processes
        Main.prototype.run = function () {
        };
        // Events
        Main.prototype.mainWindow_mousedown = function () {
            if (!this.isLoaded) {
                return;
            }
            var context = this.toolContext;
            this.toolEnv.updateContext();
            // Draw mode
            if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                this.currentTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }
            else if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                this.currentSelectTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }
            // View operation
            if (this.toolMouseEvent.isRightButtonPressing()) {
                this.mainWindow_MouseViewOperationStart();
            }
            else {
                this.mainWindow_MouseViewOperationEnd();
            }
        };
        Main.prototype.mainWindow_MouseViewOperationStart = function () {
            this.toolMouseEvent.isMouseDragging = true;
            mat4.copy(this.dragBeforeTransformMatrix, this.invView2DMatrix);
            vec3.copy(this.dragBeforeViewLocation, this.mainWindow.viewLocation);
            vec3.copy(this.toolMouseEvent.mouseDownLocation, this.toolMouseEvent.location);
            vec3.set(this.toolMouseEvent.mouseMovedVector, 0.0, 0.0, 0.0);
        };
        Main.prototype.mainWindow_MouseViewOperationEnd = function () {
            this.toolMouseEvent.isMouseDragging = false;
        };
        Main.prototype.mainWindow_mousemove = function () {
            if (!this.isLoaded) {
                return;
            }
            var context = this.toolContext;
            this.toolEnv.updateContext();
            // Draw mode
            if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                this.currentTool.mouseMove(this.toolMouseEvent, this.toolEnv);
            }
            else if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                var isSelectionChanged = this.mousemoveHittest(this.toolMouseEvent.location[0], this.toolMouseEvent.location[1], this.toolContext.mouseCursorRadius, false);
                if (isSelectionChanged) {
                    this.toolEnv.setRedrawMainWindow();
                }
                this.currentSelectTool.mouseMove(this.toolMouseEvent, this.toolEnv);
            }
            // View operation
            if (this.toolMouseEvent.isMouseDragging) {
                vec3.set(this.tempVec3, this.toolMouseEvent.offsetX, this.toolMouseEvent.offsetY, 0.0);
                vec3.transformMat4(this.tempVec3, this.tempVec3, this.dragBeforeTransformMatrix);
                vec3.subtract(this.toolMouseEvent.mouseMovedVector, this.toolMouseEvent.mouseDownLocation, this.tempVec3);
                vec3.add(this.mainWindow.viewLocation, this.dragBeforeViewLocation, this.toolMouseEvent.mouseMovedVector);
                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        };
        Main.prototype.mainWindow_mouseup = function () {
            if (!this.isLoaded) {
                return;
            }
            var context = this.toolContext;
            this.toolEnv.updateContext();
            // Draw mode
            if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                this.currentTool.mouseUp(this.toolMouseEvent, this.toolEnv);
            }
            else if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                this.currentSelectTool.mouseUp(this.toolMouseEvent, this.toolEnv);
            }
            this.mainWindow_MouseViewOperationEnd();
        };
        Main.prototype.layerWindow_mousedown = function () {
            if (!this.isLoaded) {
                return;
            }
            var context = this.toolContext;
            var layerWindow = this.layerWindow;
            this.toolEnv.updateContext();
            var doubleClicked = this.hundleDoubleClick(layerWindow, this.toolMouseEvent.offsetX, this.toolMouseEvent.offsetY);
            var clickedX = this.toolMouseEvent.location[0];
            var clickedY = this.toolMouseEvent.location[1];
            if (this.toolMouseEvent.location[1] <= layerWindow.layerItemButtonButtom) {
                // Layer window button click
                this.layerWindow_mousedown_LayerItemButton(clickedX, clickedY, doubleClicked);
            }
            else if (this.toolMouseEvent.location[1] < layerWindow.layerWindowPainY) {
                // Layer window item click
                this.layerWindow_mousedown_LayerItem(clickedX, clickedY, doubleClicked);
            }
            else {
                // Sub tool click
                this.layerWindow_mousedown_Subtool(clickedX, clickedY, doubleClicked);
            }
        };
        Main.prototype.layerWindow_mousedown_LayerItemButton = function (clickedX, clickedY, doubleClicked) {
            var hitedButton = this.hitTestLayout(this.layerWindowButtons, clickedX, clickedY);
            if (hitedButton != null) {
                var currentLayerWindowItem = this.findCurrentLayerLayerWindowItem();
                if (currentLayerWindowItem == null) {
                    return;
                }
                // Collects layer items for command
                var currentLayer = currentLayerWindowItem.layer;
                var currentLayerParent = currentLayerWindowItem.parentLayer;
                var previousLayer = null;
                var previousLayerParent = null;
                if (currentLayerWindowItem.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                    if (currentLayerWindowItem.previousSiblingItem != null) {
                        previousLayer = currentLayerWindowItem.previousSiblingItem.layer;
                        previousLayerParent = currentLayerWindowItem.previousSiblingItem.parentLayer;
                    }
                }
                else {
                    if (currentLayerWindowItem.previousItem != null) {
                        previousLayer = currentLayerWindowItem.previousItem.layer;
                        previousLayerParent = currentLayerWindowItem.previousItem.parentLayer;
                    }
                }
                var nextLayer = null;
                var nextLayerParent = null;
                if (currentLayerWindowItem.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                    if (currentLayerWindowItem.nextSiblingItem != null) {
                        nextLayer = currentLayerWindowItem.nextSiblingItem.layer;
                        nextLayerParent = currentLayerWindowItem.nextSiblingItem.parentLayer;
                    }
                }
                else {
                    if (currentLayerWindowItem.nextItem != null) {
                        nextLayer = currentLayerWindowItem.nextItem.layer;
                        nextLayerParent = currentLayerWindowItem.nextItem.parentLayer;
                    }
                }
                // Select command
                var layerCommand = null;
                if (hitedButton.buttonID == LayerWindowButtonID.addLayer) {
                    layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.deleteLayer) {
                    layerCommand = new ManualTracingTool.Command_Layer_Delete();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveUp) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveUp();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveDown) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveDown();
                }
                if (layerCommand == null) {
                    return;
                }
                // Execute command
                layerCommand.setPrameters(currentLayer, currentLayerParent, previousLayer, previousLayerParent, nextLayer, nextLayerParent);
                if (layerCommand.isAvailable(this.toolEnv)) {
                    layerCommand.execute(this.toolEnv);
                    this.toolContext.commandHistory.addCommand(layerCommand);
                }
            }
        };
        Main.prototype.layerWindow_mousedown_LayerItem = function (clickedX, clickedY, doubleClicked) {
            if (this.layerWindowItems.length == 0) {
                return;
            }
            var firstItem = this.layerWindowItems[0];
            var selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());
            if (selectedIndex >= 0 && selectedIndex < this.layerWindowItems.length) {
                var selectedItem = this.layerWindowItems[selectedIndex];
                var selectedLayer = selectedItem.layer;
                if (clickedX <= selectedItem.textLeft) {
                    selectedItem.layer.isVisible = !selectedItem.layer.isVisible;
                    this.toolEnv.setRedrawMainWindowEditorWindow();
                }
                else {
                    if (doubleClicked) {
                        // Layer property
                        this.openLayerPropertyModal(selectedLayer, selectedItem);
                    }
                    else {
                        // Select layer content
                        this.setCurrentLayer(selectedLayer);
                        if (this.toolContext.editMode == ManualTracingTool.EditModeID.selectMode) {
                            this.toolEnv.setRedrawMainWindowEditorWindow();
                        }
                    }
                }
            }
            this.toolEnv.setRedrawLayerWindow();
        };
        Main.prototype.layerWindow_mousedown_Subtool = function (clickedX, clickedY, doubleClicked) {
            var context = this.toolContext;
            if (context.mainToolID == ManualTracingTool.MainToolID.none || this.subToolViewItems.length == 0) {
                return;
            }
            var firstItem = this.subToolViewItems[0];
            var selectedIndex = Math.floor((clickedY - firstItem.top) / (firstItem.getHeight()));
            if (selectedIndex < 0 || selectedIndex >= this.subToolViewItems.length) {
                return;
            }
            var viewItem = this.subToolViewItems[selectedIndex];
            var tool = viewItem.tool;
            if (tool.isAvailable(this.toolEnv)) {
                // Change current sub tool
                this.setCurrentSubTool(selectedIndex);
                this.updateFooterMessage();
                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawLayerWindow();
                // Option button click
                for (var _i = 0, _a = viewItem.buttons; _i < _a.length; _i++) {
                    var button = _a[_i];
                    if (clickedX >= button.left && clickedX <= button.right
                        && clickedY >= button.top && clickedY <= button.bottom) {
                        var inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                        if (tool.setInputSide(button.index, inpuSideID, this.toolEnv)) {
                            this.toolEnv.setRedrawMainWindowEditorWindow();
                            this.toolEnv.setRedrawLayerWindow();
                        }
                    }
                }
            }
        };
        Main.prototype.editorWindow_mousewheel = function () {
            if (!this.isLoaded) {
                return;
            }
            // View operation
            if (this.toolMouseEvent.wheelDelta != 0.0
                && !this.toolMouseEvent.isMouseDragging) {
                this.mainWindow.addViewScale(this.toolMouseEvent.wheelDelta * 0.1);
                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        };
        Main.prototype.document_keydown = function (e) {
            if (!this.isLoaded) {
                return;
            }
            var context = this.toolContext;
            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;
            if (e.key == 'Tab') {
                // Change mode
                if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                    context.editMode = ManualTracingTool.EditModeID.selectMode;
                }
                else {
                    context.editMode = ManualTracingTool.EditModeID.drawMode;
                }
                /// Update footer message
                this.updateFooterMessage();
                this.toolEnv.setRedrawMainWindowEditorWindow();
                return e.preventDefault();
            }
            if (e.key == 'b') {
                if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                    this.setCurrentSubTool(ManualTracingTool.DrawLineToolSubToolID.drawLine);
                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindow();
                    this.toolEnv.setRedrawLayerWindow();
                }
                return;
            }
            if (e.key == 'e') {
                if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.scratchLine);
                    this.setCurrentSubTool(ManualTracingTool.ScrathLineToolSubToolID.scratchLine);
                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindow();
                    this.toolEnv.setRedrawLayerWindow();
                }
                return;
            }
            if (e.key == 'p') {
                if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.posing);
                    if (this.currentTool == this.tool_Posing3d_LocateHead) {
                        this.setCurrentSubTool(ManualTracingTool.Posing3DSubToolID.rotateHead);
                    }
                    else {
                        this.setCurrentSubTool(ManualTracingTool.Posing3DSubToolID.locateHead);
                    }
                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindow();
                    this.toolEnv.setRedrawLayerWindow();
                }
                return;
            }
            if (e.key == 'z') {
                this.toolEnv.updateContext();
                this.toolContext.commandHistory.undo(this.toolEnv);
                this.toolEnv.setRedrawMainWindow();
                return;
            }
            if (e.key == 'y') {
                this.toolEnv.updateContext();
                this.toolContext.commandHistory.redo(this.toolEnv);
                this.toolEnv.setRedrawMainWindow();
                return;
            }
            if (e.key == 'Delete' || e.key == 'x') {
                if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                    if (this.toolContext.currentLayer != null
                        && this.toolContext.currentLayer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                        var command = new ManualTracingTool.Command_DeletePoints();
                        if (command.collectEditTargets((this.toolContext.currentLayer))) {
                            this.toolEnv.updateContext();
                            command.execute(this.toolEnv);
                            this.toolContext.commandHistory.addCommand(command);
                        }
                        this.toolEnv.setRedrawMainWindow();
                    }
                }
                return;
            }
            if (e.key == 's' && this.toolEnv.isCtrlKeyPressing()) {
                window.localStorage.setItem(this.tempFileName, JSON.stringify(this.document));
                e.preventDefault();
                return;
            }
            if (e.key == 'Home' || e.key == 'q') {
                this.mainWindow.viewLocation[0] = 0.0;
                this.mainWindow.viewLocation[1] = 0.0;
                this.mainWindow.viewScale = 1.0;
                this.mainWindow.viewRotation = 0.0;
                this.toolEnv.setRedrawMainWindowEditorWindow();
                e.preventDefault();
                return;
            }
            if (e.key == 't' || e.key == 'r') {
                var rot = 10.0;
                if (e.key == 'r') {
                    rot = -rot;
                }
                this.mainWindow.viewRotation += rot;
                if (this.mainWindow.viewRotation >= 360.0) {
                    this.mainWindow.viewRotation -= 360.0;
                }
                if (this.mainWindow.viewRotation <= 0.0) {
                    this.mainWindow.viewRotation += 360.0;
                }
                this.toolEnv.setRedrawMainWindowEditorWindow();
                e.preventDefault();
                return;
            }
            if (e.key == 'f' || e.key == 'd') {
                var addScale = 0.1;
                if (e.key == 'd') {
                    addScale = -addScale;
                }
                this.mainWindow.addViewScale(addScale);
                this.toolEnv.setRedrawMainWindowEditorWindow();
                e.preventDefault();
                return;
            }
            if (e.key == 'ArrowLeft' || e.key == 'ArrowRight' || e.key == 'ArrowUp' || e.key == 'ArrowDown') {
                var x = 0.0;
                var y = 0.0;
                if (e.key == 'ArrowLeft') {
                    x = -10.0;
                }
                if (e.key == 'ArrowRight') {
                    x = 10.0;
                }
                if (e.key == 'ArrowUp') {
                    y = -10.0;
                }
                if (e.key == 'ArrowDown') {
                    y = 10.0;
                }
                this.mainWindow.calculateViewUnitMatrix(this.view2DMatrix);
                mat4.invert(this.invView2DMatrix, this.view2DMatrix);
                vec3.set(this.tempVec3, x, y, 0.0);
                vec3.transformMat4(this.tempVec3, this.tempVec3, this.invView2DMatrix);
                vec3.add(this.mainWindow.viewLocation, this.mainWindow.viewLocation, this.tempVec3);
                var leftLimit = this.mainWindow.width * (-0.5);
                var rightLimit = this.mainWindow.width * 1.5;
                var topLimit = this.mainWindow.height * (-0.5);
                var bottomLimit = this.mainWindow.height * 1.5;
                if (this.mainWindow.viewLocation[0] < leftLimit) {
                    this.mainWindow.viewLocation[0] = leftLimit;
                }
                if (this.mainWindow.viewLocation[0] > rightLimit) {
                    this.mainWindow.viewLocation[0] = rightLimit;
                }
                if (this.mainWindow.viewLocation[1] < topLimit) {
                    this.mainWindow.viewLocation[1] = topLimit;
                }
                if (this.mainWindow.viewLocation[1] > bottomLimit) {
                    this.mainWindow.viewLocation[1] = bottomLimit;
                }
                this.toolEnv.setRedrawMainWindowEditorWindow();
                e.preventDefault();
                return;
            }
            if (e.key == ' ') {
                this.mainWindow_MouseViewOperationStart();
                e.preventDefault();
                return;
            }
        };
        Main.prototype.document_keyup = function (e) {
            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;
            if (e.key == ' ') {
                this.mainWindow_MouseViewOperationEnd();
            }
        };
        Main.prototype.htmlWindow_resize = function (e) {
            this.resizeWindows();
            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.toolEnv.setRedrawLayerWindow();
        };
        Main.prototype.htmlWindow_contextmenu = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }
            return false;
        };
        // Tools and context operations
        Main.prototype.getCurrentMainTool = function () {
            return this.mainTools[this.toolContext.mainToolID];
        };
        Main.prototype.setCurrentMainTool = function (id) {
            var isChanged = (this.toolContext.mainToolID != id);
            this.toolContext.mainToolID = id;
            var mainTool = this.getCurrentMainTool();
            this.setCurrentSubTool(mainTool.currentSubToolIndex);
            if (isChanged) {
                this.collectSubToolViewItems();
                this.caluculateLayerWindowLayout(this.layerWindow);
                this.toolContext.redrawHeaderWindow = true;
            }
        };
        Main.prototype.setCurrentSubTool = function (subToolIndex) {
            var mainTool = this.getCurrentMainTool();
            if (this.toolContext.mainToolID != subToolIndex) {
                this.toolContext.redrawFooterWindow = true;
            }
            mainTool.currentSubToolIndex = subToolIndex;
            this.toolContext.subToolIndex = subToolIndex;
            this.currentTool = mainTool.subTools[subToolIndex];
        };
        Main.prototype.setCurrentLayer = function (layer) {
            this.toolContext.currentLayer = layer;
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                this.toolContext.currentVectorLayer = vectorLayer;
                this.toolContext.currentVectorGroup = vectorLayer.groups[0];
            }
            else {
                this.toolContext.currentVectorGroup = null;
            }
            if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                var posingLayer = layer;
                this.toolContext.currentPosingData = posingLayer.posingData;
                this.toolContext.currentPosingModel = posingLayer.posingModel;
            }
            else {
                this.toolContext.currentPosingData = null;
            }
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.layer.isSelected = false;
            }
            layer.isSelected = true;
        };
        // View operations
        Main.prototype.resizeWindows = function () {
            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow);
            this.fitCanvas(this.webglWindow, this.mainWindow);
            this.fitCanvas(this.pickingWindow, this.mainWindow);
            this.resizeCanvasToParent(this.layerWindow);
            if (this.isLoaded) {
                this.caluculateLayerWindowLayout(this.layerWindow);
            }
        };
        Main.prototype.resizeCanvasToParent = function (canvasWindow) {
            canvasWindow.width = canvasWindow.canvas.parentElement.clientWidth;
            canvasWindow.height = canvasWindow.canvas.parentElement.clientHeight;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        Main.prototype.fitCanvas = function (canvasWindow, fitToWindow) {
            canvasWindow.width = fitToWindow.width;
            canvasWindow.height = fitToWindow.height;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        Main.prototype.getMouseInfo = function (e, touchUp, canvasWindow) {
            this.toolMouseEvent.button = e.button;
            this.toolMouseEvent.buttons = e.buttons;
            if (touchUp) {
                this.toolMouseEvent.button = 0;
                this.toolMouseEvent.buttons = 0;
            }
            this.toolMouseEvent.offsetX = e.offsetX;
            this.toolMouseEvent.offsetY = e.offsetY;
            this.calculateTransfomredMouseParams(canvasWindow);
            //console.log(e.offsetX.toFixed(2) + ',' + e.offsetY.toFixed(2) + '  ' + this.toolMouseEvent.offsetX.toFixed(2) + ',' + this.toolMouseEvent.offsetY.toFixed(2));
        };
        Main.prototype.getTouchInfo = function (e, touchDown, touchUp, canvasWindow) {
            if (e.touches == undefined || e.touches.length == 0) {
                this.toolMouseEvent.button = 0;
                this.toolMouseEvent.buttons = 0;
                return;
            }
            var rect = canvasWindow.canvas.getBoundingClientRect();
            var touch = e.touches[0];
            if (!touchDown && touch.force < 0.1) {
                return;
            }
            if (touchDown) {
                this.toolMouseEvent.button = 1;
                this.toolMouseEvent.buttons = 1;
            }
            if (touchUp) {
                this.toolMouseEvent.button = 0;
                this.toolMouseEvent.buttons = 0;
            }
            this.toolMouseEvent.offsetX = touch.clientX - rect.left;
            this.toolMouseEvent.offsetY = touch.clientY - rect.top;
            this.calculateTransfomredMouseParams(canvasWindow);
            //console.log(touch.clientX.toFixed(2) + ',' + touch.clientY.toFixed(2) + '(' + ')'  + '  ' + this.toolMouseEvent.offsetX.toFixed(2) + ',' + this.toolMouseEvent.offsetY.toFixed(2));
        };
        Main.prototype.calculateTransfomredMouseParams = function (canvasWindow) {
            canvasWindow.caluclateViewMatrix(this.view2DMatrix);
            mat4.invert(this.invView2DMatrix, this.view2DMatrix);
            vec3.set(this.tempVec3, this.toolMouseEvent.offsetX, this.toolMouseEvent.offsetY, 0.0);
            vec3.transformMat4(this.toolMouseEvent.location, this.tempVec3, this.invView2DMatrix);
        };
        Main.prototype.hundleDoubleClick = function (wnd, offsetX, offsetY) {
            if (wnd.clickCount == 0) {
                wnd.clickCount++;
                wnd.clickedX = offsetX;
                wnd.clickedY = offsetY;
                setTimeout(function () {
                    wnd.clickCount = 0;
                }, 350);
                return false;
            }
            else {
                wnd.clickCount = 0;
                if (Math.pow(offsetX - wnd.clickedX, 2) + Math.pow(offsetY - wnd.clickedY, 2) < 9.0) {
                    return true;
                }
                else {
                    return false;
                }
            }
        };
        Main.prototype.getWheelInfo = function (e) {
            var wheelDelta = 0.0;
            if ('wheelDelta' in e) {
                wheelDelta = e['wheelDelta'];
            }
            else if ('deltaY' in e) {
                wheelDelta = e['deltaY'];
            }
            else if ('wheelDeltaY' in e) {
                wheelDelta = e['wheelDeltaY'];
            }
            if (wheelDelta > 0) {
                wheelDelta = 1.0;
            }
            else if (wheelDelta < 0) {
                wheelDelta = -1.0;
            }
            this.toolMouseEvent.wheelDelta = wheelDelta;
        };
        Main.prototype.openLayerPropertyModal = function (layer, layerWindowItem) {
            this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);
            this.currentDialogID = ModalWindowID.layerPropertyModal;
            this.layerPropertyWindow_EditLayer = layer;
            var modal = new Custombox.modal({
                content: {
                    target: '#layerPropertyModal',
                    close: true,
                    speedIn: 0,
                    delay: 0,
                    speedOut: 100
                },
                overlay: {
                    speedIn: 0,
                    speedOut: 100,
                    opacity: 0.0
                },
                loader: {
                    active: false
                }
            });
            modal.open();
        };
        Main.prototype.onModalWindowClosed = function () {
            if (this.currentDialogID == ModalWindowID.layerPropertyModal) {
                var layer = this.layerPropertyWindow_EditLayer;
                // name
                var layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);
                if (!StringIsNullOrEmpty(layerName)) {
                    layer.name = layerName;
                }
                // layer color
                this.getInputElementColor(this.layerPropertyWindow_LayerClolor, this.ID.layerPropertyModal_layerColor);
                vec4.copy(layer.layerColor, this.layerPropertyWindow_LayerClolor);
                this.layerPropertyWindow_EditLayer = null;
                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawLayerWindow();
            }
            this.currentDialogID = ModalWindowID.none;
        };
        // Drawings
        Main.prototype.draw = function () {
            this.toolEnv.updateContext();
            if (this.footerText != this.footerTextBefore) {
                this.getElement('footer').innerHTML = this.footerText;
                this.footerTextBefore = this.footerText;
            }
            if (this.toolContext.redrawMainWindow) {
                this.toolContext.redrawMainWindow = false;
                this.clearWindow(this.mainWindow);
                this.drawMainWindow(this.mainWindow);
            }
            if (this.toolContext.redrawEditorWindow) {
                this.toolContext.redrawEditorWindow = false;
                this.clearWindow(this.editorWindow);
                this.drawEditorWindow(this.editorWindow, this.mainWindow);
            }
            if (this.toolContext.updateLayerWindowItems) {
                this.toolContext.updateLayerWindowItems = false;
                this.collectLayerWindowItems();
                this.caluculateLayerWindowLayout(this.layerWindow);
            }
            if (this.toolContext.redrawLayerWindow) {
                this.toolContext.redrawLayerWindow = false;
                this.clearWindow(this.layerWindow);
                this.drawLayerWindow(this.layerWindow);
            }
            if (this.toolContext.redrawWebGLWindow) {
                this.toolContext.redrawWebGLWindow = false;
                this.drawWebGLWindow(this.mainWindow, this.webglWindow, this.pickingWindow);
            }
            if (this.toolContext.redrawHeaderWindow) {
                this.toolContext.redrawHeaderWindow = false;
                this.updateHeaderButtons();
            }
            if (this.toolContext.redrawFooterWindow) {
                this.toolContext.redrawFooterWindow = false;
                this.updateFooterMessage();
            }
        };
        Main.prototype.clearWindow = function (canvasWindow) {
            this.canvasRender.setContext(canvasWindow);
            this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
        };
        Main.prototype.drawMainWindow = function (canvasWindow) {
            this.canvasRender.setContext(canvasWindow);
            for (var i = this.document.rootLayer.childLayers.length - 1; i >= 0; i--) {
                var layer = this.document.rootLayer.childLayers[i];
                this.drawLayerRecursive(canvasWindow, layer);
            }
        };
        Main.prototype.drawLayerRecursive = function (canvasWindow, layer) {
            if (!layer.isVisible) {
                return;
            }
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                this.drawVectorLayer(canvasWindow, vectorLayer);
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                for (var i = layer.childLayers.length - 1; i >= 0; i--) {
                    var childLayer = layer.childLayers[i];
                    this.drawLayerRecursive(canvasWindow, childLayer);
                }
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                // No drawing
            }
        };
        Main.prototype.drawVectorLayer = function (canvasWindow, layer) {
            var context = this.toolContext;
            var isCurrentLayer = (layer == context.currentVectorLayer);
            for (var _i = 0, _a = layer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (line.points.length == 0) {
                        continue;
                    }
                    //this.drawRawLine(canvasWindow, line);
                    this.drawArangedLine(canvasWindow, line, layer.layerColor, isCurrentLayer);
                    if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                        if (line.isClosingToMouse || line.isSelected) {
                            if (isCurrentLayer) {
                                this.drawLinePoints(canvasWindow, line);
                            }
                        }
                    }
                }
            }
        };
        Main.prototype.drawRawLine = function (canvasWindow, line, strokeWidth) {
            if (line.points.length == 0) {
                return;
            }
            this.canvasRender.setStrokeWidth(strokeWidth);
            this.canvasRender.setStrokeColor(0.5, 0.5, 0.5, 1.0);
            this.canvasRender.beginPath();
            this.canvasRender.moveTo(line.points[0].location[0], line.points[0].location[1]);
            for (var i = 0; i < line.points.length; i++) {
                var point = line.points[i];
                this.canvasRender.lineTo(point.location[0], point.location[1]);
            }
            this.canvasRender.stroke();
        };
        Main.prototype.drawEditLine = function (canvasWindow, line) {
            this.drawRawLine(canvasWindow, line, 3.0 / canvasWindow.viewScale);
        };
        Main.prototype.drawArangedLine = function (canvasWindow, line, color, isCurrentLayer) {
            if (line.points.length == 0) {
                return;
            }
            var context = this.toolContext;
            this.canvasRender.setStrokeWidth(0.0);
            if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                if (isCurrentLayer && line.isSelected) {
                    this.canvasRender.setStrokeColor(0.8, 0.3, 0.0, 1.0);
                }
                else {
                    this.canvasRender.setStrokeColorV(color);
                }
            }
            else {
                if (line.isEditTarget && this.currentTool == this.tool_ScratchLine) {
                    this.canvasRender.setStrokeColor(0.0, 0.5, 0.0, 1.0);
                }
                else {
                    this.canvasRender.setStrokeColorV(color);
                }
            }
            this.drawLineSegment(line, 0, line.points.length - 1);
        };
        Main.prototype.drawLinePoints = function (canvasWindow, line) {
            for (var i = 0; i < line.points.length; i++) {
                var point = line.points[i];
                this.drawPoint(point, this.linePointColor, canvasWindow.viewScale);
            }
        };
        Main.prototype.drawPoint = function (point, color, scale) {
            this.canvasRender.beginPath();
            var radius = 2.0;
            if (point.isSelected) {
                radius = 3.0;
                this.canvasRender.setStrokeColor(0.8, 0.3, 0.0, 1.0);
                this.canvasRender.setFillColor(0.8, 0.3, 0.0, 1.0);
            }
            else {
                this.canvasRender.setStrokeColorV(color);
                this.canvasRender.setFillColorV(color);
            }
            this.canvasRender.setStrokeWidth(1.0 / scale);
            this.canvasRender.circle(point.adjustedLocation[0], point.adjustedLocation[1], radius / scale);
            this.canvasRender.fill();
        };
        Main.prototype.drawLineSegment = function (line, startIndex, endIndex) {
            this.canvasRender.beginPath();
            this.canvasRender.moveTo(line.points[startIndex].location[0], line.points[startIndex].location[1]);
            for (var i = startIndex + 1; i <= endIndex; i++) {
                var point1 = line.points[i];
                this.canvasRender.lineTo(point1.adjustedLocation[0], point1.adjustedLocation[1]);
            }
            this.canvasRender.stroke();
        };
        Main.prototype.drawEditorWindow = function (editorWindow, mainWindow) {
            var context = this.toolContext;
            mainWindow.copyTransformTo(editorWindow);
            this.canvasRender.setContext(editorWindow);
            this.canvasRender.setTransform(mainWindow);
            if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                this.drawCursor(editorWindow);
            }
            if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                if (this.currentTool == this.tool_DrawLine) {
                    if (this.tool_DrawLine.editLine != null) {
                        this.drawEditLine(editorWindow, this.tool_DrawLine.editLine);
                    }
                }
                else if (this.currentTool == this.tool_ScratchLine) {
                    this.drawCursor(editorWindow);
                    if (this.tool_ScratchLine_EditLine_Visible) {
                        if (this.tool_ScratchLine.editLine != null) {
                            this.drawEditLine(editorWindow, this.tool_ScratchLine.editLine);
                        }
                    }
                    if (this.tool_ScratchLine_TargetLine_Visible) {
                        if (this.tool_ScratchLine.targetLine != null) {
                            for (var _i = 0, _a = this.tool_ScratchLine.targetLine.points; _i < _a.length; _i++) {
                                var point = _a[_i];
                                this.drawPoint(point, this.testColor, editorWindow.viewScale);
                            }
                        }
                    }
                    if (this.tool_ScratchLine_SampledLine_Visible) {
                        if (this.tool_ScratchLine.resampledLine != null) {
                            for (var _b = 0, _c = this.tool_ScratchLine.resampledLine.points; _b < _c.length; _b++) {
                                var point = _c[_b];
                                this.drawPoint(point, this.sampleColor, editorWindow.viewScale);
                            }
                        }
                        if (this.tool_ScratchLine.extrudeLine != null) {
                            for (var _d = 0, _e = this.tool_ScratchLine.extrudeLine.points; _d < _e.length; _d++) {
                                var point = _e[_d];
                                this.drawPoint(point, this.extColor, editorWindow.viewScale);
                            }
                        }
                    }
                    if (this.tool_ScratchLine_CandidatePoints_Visible) {
                        if (this.tool_ScratchLine.candidateLine != null) {
                            for (var _f = 0, _g = this.tool_ScratchLine.candidateLine.points; _f < _g.length; _f++) {
                                var point = _g[_f];
                                this.drawPoint(point, this.linePointColor, editorWindow.viewScale);
                            }
                        }
                    }
                }
                else if (context.mainToolID == ManualTracingTool.MainToolID.posing) {
                    //for (let subtool of this.mainTools[<int>MainToolID.posing].subTools) {
                    //    let posingTools = <Tool_Posing3d_ToolBase>subtool;
                    //    if (posingTools.editLine != null) {
                    //        this.drawRawLine(editorWindow, posingTools.editLine);
                    //    }
                    //}
                    if (this.currentTool == this.tool_Posing3d_LocateHead
                        && this.tool_Posing3d_LocateHead.editLine != null) {
                        this.drawEditLine(editorWindow, this.tool_Posing3d_LocateHead.editLine);
                    }
                }
            }
        };
        Main.prototype.drawCursor = function (canvasWindow) {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColor(1.0, 0.5, 0.5, 1.0);
            this.canvasRender.setStrokeWidth(1.0 / canvasWindow.viewScale);
            this.canvasRender.circle(this.toolMouseEvent.location[0], this.toolMouseEvent.location[1], this.toolContext.mouseCursorRadius / canvasWindow.viewScale);
            this.canvasRender.stroke();
        };
        // WebGL window drawing
        Main.prototype.drawWebGLWindow = function (mainWindow, webglWindow, pickingWindow) {
            if (this.toolContext.currentPosingData == null) {
                return;
            }
            mainWindow.copyTransformTo(pickingWindow);
            this.webGLRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height);
            this.posing3dView.drawPickingImage(this.toolEnv);
            pickingWindow.context.clearRect(0, 0, pickingWindow.width, pickingWindow.height);
            pickingWindow.context.drawImage(webglWindow.canvas, 0, 0, webglWindow.width, webglWindow.height);
            this.posing3dView.drawVisualImage(this.toolEnv);
        };
        Main.prototype.collectLayerWindowButtons = function () {
            this.layerWindowButtons = new List();
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.addLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.deleteLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveUp));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveDown));
        };
        Main.prototype.collectLayerWindowItems = function () {
            this.layerWindowItems = new List();
            this.collectLayerWindowItemsRecursive(this.layerWindowItems, this.document.rootLayer, 0);
            var previousItem = null;
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.previousItem = previousItem;
                if (previousItem != null) {
                    previousItem.nextItem = item;
                }
                previousItem = item;
            }
        };
        Main.prototype.collectLayerWindowItemsRecursive = function (result, parentLayer, currentDepth) {
            var siblingItem = null;
            for (var _i = 0, _a = parentLayer.childLayers; _i < _a.length; _i++) {
                var layer = _a[_i];
                var item = new LayerWindowItem();
                item.layer = layer;
                item.parentLayer = parentLayer;
                item.hierarchyDepth = currentDepth;
                item.previousSiblingItem = siblingItem;
                if (siblingItem != null) {
                    siblingItem.nextSiblingItem = item;
                }
                result.push(item);
                if (layer.childLayers.length > 0) {
                    this.collectLayerWindowItemsRecursive(this.layerWindowItems, layer, currentDepth + 1);
                }
                siblingItem = item;
            }
        };
        Main.prototype.findCurrentLayerLayerWindowItem = function () {
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.layer == this.toolContext.currentLayer) {
                    return item;
                }
            }
            return null;
        };
        Main.prototype.caluculateLayerWindowLayout = function (layerWindow) {
            layerWindow.layerWindowPainY = layerWindow.height * layerWindow.layerWindowPainRate;
            // layer item buttons
            this.layerWindowLayoutArea.copyRectangle(layerWindow);
            this.layerWindowLayoutArea.bottom = layerWindow.layerWindowPainY - 1.0;
            this.caluculateLayerWindowLayout_LayerButtons(layerWindow, this.layerWindowLayoutArea);
            if (this.layerWindowButtons.length > 0) {
                var lastButton = this.layerWindowButtons[this.layerWindowButtons.length - 1];
                layerWindow.layerItemButtonButtom = lastButton.bottom;
                this.layerWindowLayoutArea.top = lastButton.bottom + 1.0;
            }
            // layer items
            this.caluculateLayerWindowLayout_LayerWindowItem(layerWindow, this.layerWindowLayoutArea);
            // subtools
            this.layerWindowLayoutArea.top = layerWindow.layerWindowPainY;
            this.caluculateLayerWindowLayout_SubToolViewItem(layerWindow, this.layerWindowLayoutArea);
        };
        Main.prototype.caluculateLayerWindowLayout_LayerButtons = function (layerWindow, layoutArea) {
            var currentX = layoutArea.left;
            var currentY = layoutArea.top;
            var unitWidth = layerWindow.layerItemButtonWidth * layerWindow.layerItemButtonScale;
            var unitHeight = layerWindow.layerItemButtonHeight * layerWindow.layerItemButtonScale;
            for (var _i = 0, _a = this.layerWindowButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                button.left = currentX;
                button.right = currentX + unitWidth - 1;
                button.top = currentY;
                button.bottom = currentY + unitHeight - 1;
                currentX += unitWidth;
            }
        };
        Main.prototype.caluculateLayerWindowLayout_LayerWindowItem = function (layerWindow, layoutArea) {
            var currentY = layoutArea.top;
            var itemHeight = layerWindow.layerItemHeight;
            var margine = itemHeight * 0.1;
            var iconWidth = (itemHeight - margine * 2);
            var textLeftMargin = itemHeight * 0.3;
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.left = 0.0;
                item.top = currentY;
                item.right = layerWindow.width - 1;
                item.bottom = currentY + itemHeight - 1;
                item.marginLeft = margine;
                item.marginTop = margine;
                item.marginRight = margine;
                item.marginBottom = margine;
                item.visibilityIconWidth = iconWidth;
                item.textLeft = item.left + margine + iconWidth + textLeftMargin;
                currentY += itemHeight;
            }
        };
        Main.prototype.drawLayerWindow = function (layerWindow) {
            this.canvasRender.setContext(layerWindow);
            this.drawLayerWindow_LayerWindowButtons(layerWindow);
            this.drawLayerWindow_LayerItems(layerWindow);
            this.drawLayerWindow_SubTools(layerWindow);
        };
        Main.prototype.drawLayerWindow_LayerWindowButtons = function (layerWindow) {
            for (var _i = 0, _a = this.layerWindowButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                this.drawLayerWindow_LayerWindowButton(button);
            }
        };
        Main.prototype.drawLayerWindow_LayerWindowButton = function (button) {
            var srcWidth = 64.0;
            var srcHeight = 64.0;
            var srcX = 0.0;
            var srcY = (button.buttonID - 1) * srcHeight;
            var dstX = button.left;
            var dstY = button.top;
            var scale = 1.0;
            var dstWidth = button.getWidth() * scale;
            var dstHeight = button.getHeight() * scale;
            var srcImage = this.layerButtonImage;
            this.canvasRender.drawImage(srcImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight);
        };
        Main.prototype.drawLayerWindow_LayerItems = function (layerWindow) {
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                this.drawLayerWindowItem(item, layerWindow.layerItemFontSize);
            }
        };
        Main.prototype.drawLayerWindowItem = function (item, fontSize) {
            var layer = item.layer;
            var left = item.left;
            var top = item.top;
            var bottom = item.bottom;
            var itemWidth = item.getWidth();
            var itemHeight = item.getHeight();
            var bottomMargin = itemHeight * 0.3;
            var depthOffset = 10.0 * item.hierarchyDepth;
            if (layer.isSelected) {
                this.canvasRender.setFillColorV(this.layerWindowItemSelectedColor);
            }
            else {
                this.canvasRender.setFillColorV(this.layerWindowBackgroundColor);
            }
            this.canvasRender.fillRect(left, top, itemWidth, itemHeight);
            // Visible/Unvisible icon
            var srcImage = this.systemImage.image;
            var iconIndex = (item.layer.isVisible ? 0.0 : 1.0);
            var srcWidth = srcImage.width * 0.125;
            var srcHeight = srcImage.height * 0.125;
            var srcX = srcWidth * iconIndex;
            var srcY = srcImage.height * 0.25;
            var dstX = item.marginLeft;
            var dstY = top + item.marginTop;
            var dstWidth = item.visibilityIconWidth;
            var dstHeigh = item.visibilityIconWidth;
            this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeigh);
            // Text
            this.canvasRender.setFontSize(fontSize);
            this.canvasRender.setFillColor(0.0, 0.0, 0.0, 1.0);
            this.canvasRender.fillText(layer.name, item.textLeft + depthOffset, bottom - bottomMargin);
        };
        Main.prototype.collectSubToolViewItems = function () {
            this.subToolViewItems = new List();
            var currentMainTool = this.getCurrentMainTool();
            for (var i = 0; i < currentMainTool.subTools.length; i++) {
                var tool = currentMainTool.subTools[i];
                var viewItem = new SubToolViewItem();
                viewItem.toolIndex = i;
                viewItem.tool = tool;
                for (var buttonIndex = 0; buttonIndex < tool.inputSideOptionCount; buttonIndex++) {
                    var button = new SubToolViewItemOptionButton();
                    button.index = buttonIndex;
                    viewItem.buttons.push(button);
                }
                this.subToolViewItems.push(viewItem);
            }
        };
        Main.prototype.caluculateLayerWindowLayout_SubToolViewItem = function (layerWindow, layoutArea) {
            var scale = layerWindow.subToolItemScale;
            var fullWidth = layerWindow.width - 1;
            var unitHeight = layerWindow.subToolItemUnitHeight * scale - 1;
            var currentY = layoutArea.top;
            for (var _i = 0, _a = this.subToolViewItems; _i < _a.length; _i++) {
                var viewItem = _a[_i];
                viewItem.left = 0.0;
                viewItem.top = currentY;
                viewItem.right = fullWidth;
                viewItem.bottom = currentY + unitHeight - 1;
                currentY += unitHeight;
            }
        };
        Main.prototype.drawLayerWindow_SubTools = function (layerWindow) {
            var context = this.toolContext;
            if (context.mainToolID != ManualTracingTool.MainToolID.posing) {
                return;
            }
            var currentMainTool = this.getCurrentMainTool();
            var srcImage = this.subToolImages[0];
            var scale = layerWindow.subToolItemScale;
            var fullWidth = layerWindow.width - 1;
            var unitWidth = layerWindow.subToolItemUnitWidth;
            var unitHeight = layerWindow.subToolItemUnitHeight;
            var lastY = 0.0;
            for (var _i = 0, _a = this.subToolViewItems; _i < _a.length; _i++) {
                var viewItem = _a[_i];
                var tool = viewItem.tool;
                var srcY = viewItem.toolIndex * unitHeight;
                var dstY = viewItem.top;
                // Draw subtool image
                if (tool == this.currentTool) {
                    this.canvasRender.setFillColorV(this.subToolItemSelectedColor);
                }
                else {
                    this.canvasRender.setFillColorV(this.layerWindowBackgroundColor);
                }
                this.canvasRender.fillRect(0, dstY, fullWidth, unitHeight * scale);
                if (tool.isAvailable(this.toolEnv)) {
                    this.canvasRender.setGlobalAlpha(1.0);
                }
                else {
                    this.canvasRender.setGlobalAlpha(0.5);
                }
                this.canvasRender.drawImage(srcImage.image.imageData, 0, srcY, unitWidth, unitHeight, 0, dstY, unitWidth * scale, unitHeight * scale);
                // Draw subtool option buttons
                for (var _b = 0, _c = viewItem.buttons; _b < _c.length; _b++) {
                    var button = _c[_b];
                    var buttonWidth = 128 * scale;
                    var buttonHeight = 128 * scale;
                    button.left = unitWidth * scale * 0.8;
                    button.top = dstY;
                    button.right = button.left + buttonWidth - 1;
                    button.bottom = button.top + buttonHeight - 1;
                    var inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                    if (inpuSideID == ManualTracingTool.InputSideID.front) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 0, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                    else if (inpuSideID == ManualTracingTool.InputSideID.back) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 128, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                }
                this.canvasRender.setStrokeWidth(0.0);
                this.canvasRender.setStrokeColorV(this.subToolItemSeperatorLineColor);
                this.canvasRender.drawLine(0, dstY, fullWidth, dstY);
                lastY = dstY + unitHeight * scale;
            }
            this.canvasRender.setGlobalAlpha(1.0);
            this.canvasRender.drawLine(0, lastY, fullWidth, lastY);
        };
        // Header window drawing
        Main.prototype.updateHeaderButtons = function () {
            this.setHeaderButtonVisual(this.ID.menu_btnDrawTool, this.toolContext.mainToolID == ManualTracingTool.MainToolID.drawLine);
            this.setHeaderButtonVisual(this.ID.menu_btnScratchTool, this.toolContext.mainToolID == ManualTracingTool.MainToolID.scratchLine);
            this.setHeaderButtonVisual(this.ID.menu_btnPoseTool, this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing);
        };
        Main.prototype.setHeaderButtonVisual = function (elementID, isSelected) {
            var element = this.getElement(elementID);
            if (isSelected) {
                element.classList.remove(this.ID.unselectedMainButton);
                element.classList.add(this.ID.selectedMainButton);
            }
            else {
                element.classList.remove(this.ID.selectedMainButton);
                element.classList.add(this.ID.unselectedMainButton);
            }
        };
        Main.prototype.updateFooterMessage = function () {
            var context = this.toolContext;
            var modeText = '';
            if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                modeText = 'DrawMode';
            }
            else if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                modeText = 'SelectMode';
            }
            var toolText = '';
            if (context.editMode == ManualTracingTool.EditModeID.drawMode) {
                if (this.currentTool == this.tool_DrawLine) {
                    toolText = 'Draw line';
                }
                else if (this.currentTool == this.tool_ScratchLine) {
                    toolText = 'Scratch line';
                }
                else if (this.currentTool == this.tool_Posing3d_LocateHead) {
                    toolText = 'Posing(Head location)';
                }
            }
            else if (context.editMode == ManualTracingTool.EditModeID.selectMode) {
                toolText = '';
            }
            this.footerText = modeText + ' ' + toolText;
            this.footerText = this.currentTool.helpText;
        };
        // UI management
        Main.prototype.hitTestLayout = function (areas, x, y) {
            for (var _i = 0, areas_1 = areas; _i < areas_1.length; _i++) {
                var area = areas_1[_i];
                if (x >= area.left
                    && x <= area.right
                    && y >= area.top
                    && y <= area.bottom) {
                    return area;
                }
            }
            return null;
        };
        // Selection management
        Main.prototype.mousemoveHittest = function (x, y, minDistance, recursive) {
            if (recursive) {
                this.selector_LineClosingHitTest.processLayerRecursive(this.document.rootLayer.childLayers, x, y, minDistance);
            }
            else {
                this.selector_LineClosingHitTest.processLayer(this.toolEnv.currentVectorLayer, x, y, minDistance);
            }
            return this.selector_LineClosingHitTest.isChanged;
        };
        // HTML helper
        Main.prototype.getElement = function (id) {
            return document.getElementById(id);
        };
        Main.prototype.setInputElementText = function (id, text) {
            var element = (document.getElementById(id));
            element.value = text;
            return element;
        };
        Main.prototype.getInputElementText = function (id) {
            var element = (document.getElementById(id));
            return element.value;
        };
        Main.prototype.getInputElementColor = function (result, id) {
            var element = (document.getElementById(id));
            var color = element.value;
            result[0] = parseInt(color.substring(1, 3), 16) / 255.0;
            result[1] = parseInt(color.substring(3, 5), 16) / 255.0;
            result[2] = parseInt(color.substring(5, 7), 16) / 255.0;
            return result;
        };
        return Main;
    }());
    var LayerWindow = (function (_super) {
        __extends(LayerWindow, _super);
        function LayerWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.clickCount = 0;
            _this.clickedX = 0;
            _this.clickedY = 0;
            _this.layerWindowPainRate = 0.5;
            _this.layerWindowPainY = 0.0;
            _this.layerItemButtonScale = 0.375;
            _this.layerItemButtonWidth = 64.0;
            _this.layerItemButtonHeight = 64.0;
            _this.layerItemButtonButtom = 64.0;
            _this.layerItemHeight = 24.0;
            _this.layerItemFontSize = 16.0;
            _this.layerItemVisibilityIconWidth = 24.0;
            _this.layerItemVisibilityIconRight = 24.0;
            _this.subToolItemScale = 0.5;
            _this.subToolItemUnitWidth = 256;
            _this.subToolItemUnitHeight = 128;
            return _this;
        }
        return LayerWindow;
    }(ManualTracingTool.CanvasWindow));
    var RectangleLayoutArea = (function () {
        function RectangleLayoutArea() {
            this.index = -1;
            this.marginTop = 0.0;
            this.marginRight = 0.0;
            this.marginBottom = 0.0;
            this.marginLeft = 0.0;
            this.top = 0.0;
            this.right = 0.0;
            this.bottom = 0.0;
            this.left = 0.0;
            this.borderTop = 0.0;
            this.borderRight = 0.0;
            this.borderBottom = 0.0;
            this.borderLeft = 0.0;
            this.paddingTop = 0.0;
            this.paddingRight = 0.0;
            this.paddingBottom = 0.0;
            this.paddingLeft = 0.0;
        }
        RectangleLayoutArea.prototype.getWidth = function () {
            return (this.right - this.left + 1.0);
        };
        RectangleLayoutArea.prototype.getHeight = function () {
            return (this.bottom - this.top + 1.0);
        };
        RectangleLayoutArea.prototype.copyRectangle = function (canvasWindow) {
            this.left = 0.0;
            this.top = 0.0;
            this.right = canvasWindow.width - 1.0;
            this.bottom = canvasWindow.width - 1.0;
        };
        return RectangleLayoutArea;
    }());
    var LayerWindowButtonID;
    (function (LayerWindowButtonID) {
        LayerWindowButtonID[LayerWindowButtonID["none"] = 0] = "none";
        LayerWindowButtonID[LayerWindowButtonID["addLayer"] = 1] = "addLayer";
        LayerWindowButtonID[LayerWindowButtonID["deleteLayer"] = 2] = "deleteLayer";
        LayerWindowButtonID[LayerWindowButtonID["moveUp"] = 3] = "moveUp";
        LayerWindowButtonID[LayerWindowButtonID["moveDown"] = 4] = "moveDown";
    })(LayerWindowButtonID || (LayerWindowButtonID = {}));
    var LayerWindowButton = (function (_super) {
        __extends(LayerWindowButton, _super);
        function LayerWindowButton() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LayerWindowButton.prototype.ID = function (id) {
            this.buttonID = id;
            return this;
        };
        return LayerWindowButton;
    }(RectangleLayoutArea));
    var LayerWindowItem = (function (_super) {
        __extends(LayerWindowItem, _super);
        function LayerWindowItem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.layer = null;
            _this.parentLayer = null;
            _this.previousItem = null;
            _this.nextItem = null;
            _this.previousSiblingItem = null;
            _this.nextSiblingItem = null;
            _this.hierarchyDepth = 0;
            _this.margine = 0.0;
            _this.visibilityIconWidth = 0.0;
            _this.textLeft = 0.0;
            return _this;
        }
        return LayerWindowItem;
    }(RectangleLayoutArea));
    var SubToolViewItem = (function (_super) {
        __extends(SubToolViewItem, _super);
        function SubToolViewItem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.toolIndex = 0;
            _this.tool = null;
            _this.buttons = new List();
            return _this;
        }
        return SubToolViewItem;
    }(RectangleLayoutArea));
    var SubToolViewItemOptionButton = (function (_super) {
        __extends(SubToolViewItemOptionButton, _super);
        function SubToolViewItemOptionButton() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return SubToolViewItemOptionButton;
    }(RectangleLayoutArea));
    var PickingWindow = (function (_super) {
        __extends(PickingWindow, _super);
        function PickingWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.maxDepth = 4.0;
            return _this;
        }
        return PickingWindow;
    }(ManualTracingTool.CanvasWindow));
    ManualTracingTool.PickingWindow = PickingWindow;
    var ModalWindowID;
    (function (ModalWindowID) {
        ModalWindowID[ModalWindowID["none"] = 0] = "none";
        ModalWindowID[ModalWindowID["layerPropertyModal"] = 1] = "layerPropertyModal";
    })(ModalWindowID || (ModalWindowID = {}));
    var HTMLElementID = (function () {
        function HTMLElementID() {
            this.menu_btnDrawTool = 'menu_btnDrawTool';
            this.menu_btnScratchTool = 'menu_btnScratchTool';
            this.menu_btnPoseTool = 'menu_btnPoseTool';
            this.unselectedMainButton = 'unselectedMainButton';
            this.selectedMainButton = 'selectedMainButton';
            this.layerPropertyModal_layerName = 'layerPropertyModal.layerName';
            this.layerPropertyModal_layerColor = 'layerPropertyModal.layerColor';
        }
        return HTMLElementID;
    }());
    var _Main;
    window.onload = function () {
        _Main = new Main();
        _Main.mainWindow.canvas = document.getElementById('mainCanvas');
        _Main.editorWindow.canvas = document.getElementById('editorCanvas');
        _Main.layerWindow.canvas = document.getElementById('layerCanvas');
        _Main.webglWindow.canvas = document.getElementById('webglCanvas');
        _Main.pickingWindow.canvas = document.createElement('canvas');
        //document.getElementById('footer').appendChild(_Main.pickingWindow.canvas);
        _Main.startLoading();
        setTimeout(run, 1000 / 30);
    };
    function run() {
        if (_Main.isLoaded) {
            _Main.run();
            _Main.draw();
        }
        else {
            _Main.processLoading();
        }
        setTimeout(run, 1000 / 60);
    }
})(ManualTracingTool || (ManualTracingTool = {}));
