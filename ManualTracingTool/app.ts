
declare var Custombox: any;

namespace ManualTracingTool {

    // 今やること (current tasks)
    // ・編集単位ロジック
    //   ・共通のアクティブ線
    // ・アクティブ線、レイヤによる絞り込み処理と可視化
    //   →スクラッチツールで実装
    // ・スクラッチツールで選択中の点のみ対象にできるよう修正
    // ・変形ツール
    //   平行移動、回転、拡大縮小、ラティス変形

    // どこかでやる必要があること (nearest future tasks)
    // ・現在のツールに応じた全選択、全選択解除処理
    // ・線スクラッチで点の削減ツール
    // ・線スクラッチの線修正ツールを実用的な使いやすさにする
    // ・ファイル保存、読み込み
    // ・PNG出力、jpeg出力
    // ・現在のレイヤーが変わったときにメインツールを自動で変更する。ベクターレイヤーならスクラッチツールとドローツールのどちらかを記憶、ポージングレイヤーならポーズにする

    // いつかやる (anytime do)
    // ・レイヤーカラーをどこかに表示する
    // ・レイヤーカラーとレイヤーの透明度の関係を考え直す
    // ・レイヤー削除時に削除前に次に表示されていたレイヤーを選択する
    // ・塗りつぶし
    // ・複数のポージングレイヤーの描画
    // ・ポージングレイヤーの表示/非表示、透明度
    // ・ポージングで入力後にキャラの拡大縮小を可能にする
    // ・ポージングで頭の角度の入力で画面の回転に対応する
    // ・Logic_VectorLayerをどこかよいファイルに移動する

    // 既知のバグ (remaining bugs)
    // ・現在のレイヤーが移動したときにカーソルが変な位置に出る

    // 終わったもの (done)
    // ・線が１本もないときにエラーが出るためなんとかしる！→線の削除処理でグループの線のリストがnullになる場合があったため。直した。
    // ・編集単位選択UIの作成
    // ・編集単位ロジック
    //   ・点、線、変、レイヤーそれぞれの選択ツールクラスの作成
    //   ・編集単位選択UIの状態で選択ツールを切り替える
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

    class Main implements MainEditor {

        mainWindow = new CanvasWindow();
        editorWindow = new CanvasWindow();
        layerWindow = new LayerWindow();
        webglWindow = new CanvasWindow();
        pickingWindow = new PickingWindow();

        canvasRender = new CanvasRender();
        webGLRender = new WebGLRender();

        ID = new HTMLElementID();

        // Integrated tool system

        mainTools = new List<MainTool>();

        toolContext: ToolContext = null;
        toolEnv: ToolEnvironment = null;
        toolMouseEvent = new ToolMouseEvent();

        systemImage: ImageResource = null;
        subToolImages = new List<ImageResource>();
        layerButtonImage: ImageResource = null;

        //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);

        // Drawing tools
        currentTool: ToolBase = null;
        tool_DrawLine = new Tool_DrawLine();
        tool_AddPoint = new Tool_AddPoint();
        tool_ScratchLine = new Tool_ScratchLine();

        currentSelectTool: ToolBase = null;
        selectionTools = List<ToolBase>(<int>(OperationUnitID.layer) + 1);
        tool_LinePointBrushSelect = new Tool_Select_BrushSelet_LinePoint();
        tool_LineSegmentBrushSelect = new Tool_Select_BrushSelet_LineSegment();
        tool_LineBrushSelect = new Tool_Select_BrushSelet_Line();

        hittest_Line_IsCloseTo = new HitTest_Line_IsCloseToMouse();

        // Posing tools
        posing3dView = new Posing3DView();
        posing3DLogic = new Posing3DLogic();
        tool_Posing3d_LocateHead = new Tool_Posing3d_LocateHead();
        tool_Posing3d_RotateHead = new Tool_Posing3d_RotateHead();
        tool_Posing3d_TwistHead = new Tool_Posing3d_TwistHead();
        tool_Posing3d_LocateBody = new Tool_Posing3d_LocateBody();
        tool_Posing3d_RatateBody = new Tool_Posing3d_RatateBody();
        tool_Posing3d_LocateLeftArm1 = new Tool_Posing3d_LocateLeftArm1();
        tool_Posing3d_LocateLeftArm2 = new Tool_Posing3d_LocateLeftArm2();
        tool_Posing3d_LocateRightArm1 = new Tool_Posing3d_LocateRightArm1();
        tool_Posing3d_LocateRightArm2 = new Tool_Posing3d_LocateRightArm2();
        tool_Posing3d_LocateLeftLeg1 = new Tool_Posing3d_LocateLeftLeg1();
        tool_Posing3d_LocateLeftLeg2 = new Tool_Posing3d_LocateLeftLeg2();
        tool_Posing3d_LocateRightLeg1 = new Tool_Posing3d_LocateRightLeg1();
        tool_Posing3d_LocateRightLeg2 = new Tool_Posing3d_LocateRightLeg2();
        imageResurces = new List<ImageResource>();
        modelFile = new ModelFile();
        modelResources = new List<ModelResource>();

        // Document data
        document: DocumentData = null;
        tempFileName = 'Manual tracing tool save data';

        // Work variable
        view2DMatrix = mat4.create();
        invView2DMatrix = mat4.create();
        tempVec3 = vec3.create();

        linePointColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        testColor = vec4.fromValues(0.0, 0.7, 0.0, 1.0);
        sampleColor = vec4.fromValues(0.0, 0.5, 1.0, 1.0);
        extColor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        editingLineColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
        editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);
        selectedVectorLineColor = vec4.fromValues(0.8, 0.3, 0.0, 0.5);

        isLoaded = false;

        // Loading

        startLoading() {

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
            this.imageResurces.push(new ImageResource().file('texture01.png'));
            this.imageResurces.push(new ImageResource().file('system_image01.png').tex(false));
            this.imageResurces.push(new ImageResource().file('toolbar_image01.png').tex(false));
            this.imageResurces.push(new ImageResource().file('layerbar_image01.png').tex(false));

            this.loadModels(this.modelFile, './res/' + this.modelFile.fileName);

            for (let imageResource of this.imageResurces) {

                this.loadTexture(imageResource, './res/' + imageResource.fileName);
            }
        }

        processLoading() {

            if (!this.modelFile.loaded) {
                return;
            }

            for (let imageResource of this.imageResurces) {

                if (!imageResource.loaded) {
                    return;
                }
            }

            // Loading finished
            this.start();
        }

        loadTexture(imageResource: ImageResource, url: string) {

            let image = new Image();

            imageResource.image.imageData = image;

            image.addEventListener('load',
                () => {
                    if (imageResource.isGLTexture) {
                        this.webGLRender.initializeImageTexture(imageResource.image);
                    }
                    imageResource.loaded = true;
                    imageResource.image.width = image.width;
                    imageResource.image.height = image.height;
                }
            );

            image.src = url;
        }

        loadModels(modelFile: ModelFile, url: string) {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';

            xhr.addEventListener('load',
                (e: Event) => {

                    let data: any;
                    if (xhr.responseType == 'json') {
                        data = xhr.response;
                    }
                    else {
                        data = JSON.parse(xhr.response);
                    }

                    for (let modelData of data.static_models) {

                        let modelResource = new ModelResource();
                        modelResource.modelName = modelData.name;

                        this.webGLRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride); // 4 = size of float

                        modelFile.modelResources.push(modelResource);
                        modelFile.modelResourceDictionary[modelData.name] = modelResource;
                    }

                    modelFile.loaded = true;
                }
            );

            xhr.send();
        }

        // Starting ups

        start() {

            this.initializeDocument();
            this.initializeContext();
            this.initializeTools();
            this.initializeViews();

            this.isLoaded = true;

            this.setCurrentMainTool(MainToolID.drawLine);
            //this.setCurrentMainTool(MainToolID.posing);

            this.setCurrentSelectionTool(this.toolContext.operationUnitID);

            // debug
            this.setCurrentLayer(this.document.rootLayer.childLayers[0]);

            this.toolEnv.updateContext();

            // 初回描画
            this.resizeWindows();   // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。

            this.updateHeaderButtons();

            this.updateFooterMessage();

            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.toolEnv.setRedrawLayerWindow();

            this.setEvents();
        }

        private initializeDocument() {

            let saveData = window.localStorage.getItem(this.tempFileName);
            if (saveData) {

                this.document = JSON.parse(saveData);
                return;
            }

            this.document = new DocumentData();

            let rootLayer = this.document.rootLayer;
            rootLayer.type = LayerTypeID.rootLayer;

            {
                let layer1 = new VectorLayer();
                layer1.name = 'layer1'
                rootLayer.childLayers.push(layer1);
                let group1 = new VectorGroup();
                layer1.groups.push(group1);
            }

            {
                let layer1 = new GroupLayer();
                layer1.name = 'group1'
                rootLayer.childLayers.push(layer1);

                let layer2 = new VectorLayer();
                layer2.name = 'child1'
                layer1.childLayers.push(layer2);
                let group2 = new VectorGroup();
                layer2.groups.push(group2);
            }

            {
                let layer1 = new VectorLayer();
                layer1.name = 'background'
                rootLayer.childLayers.push(layer1);
                let group1 = new VectorGroup();
                layer1.groups.push(group1);
            }

            {
                let layer1 = new PosingLayer();
                layer1.name = 'posing1'
                rootLayer.childLayers.push(layer1);
            }
        }

        private initializeContext() {

            this.toolContext = new ToolContext();

            this.toolContext.mainWindow = this.mainWindow;
            this.toolContext.pickingWindow = this.pickingWindow;

            this.toolContext.posing3DView = this.posing3dView;
            this.toolContext.posing3DLogic = this.posing3DLogic;

            this.toolContext.document = this.document;

            this.toolContext.commandHistory = new CommandHistory();
            this.toolContext.mainEditor = this;
        }

        private initializeViews() {

            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;

            this.collectLayerWindowButtons();

            this.collectLayerWindowItems();
        }

        private initializeTools() {

            // Constructs main tools and sub tools structure
            this.mainTools.push(
                new MainTool().id(MainToolID.none)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.drawLine)
                .subTool(this.tool_DrawLine)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.scratchLine)
                    .subTool(this.tool_ScratchLine)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.posing)
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
                    .subTool(this.tool_Posing3d_TwistHead)
            );

            // Constructs current tool states
            this.toolEnv = new ToolEnvironment(this.toolContext);

            //this.currentTool = this.tool_DrawLine;
            //this.currentTool = this.tool_AddPoint;
            //this.currentTool = this.tool_ScratchLine;
            this.currentTool = this.tool_Posing3d_LocateHead;

            // Selection tools
            this.selectionTools[<int>OperationUnitID.none] = null;  
            this.selectionTools[<int>OperationUnitID.linePoint] = this.tool_LinePointBrushSelect;
            this.selectionTools[<int>OperationUnitID.lineSegment] = this.tool_LineSegmentBrushSelect;
            this.selectionTools[<int>OperationUnitID.line] = this.tool_LineBrushSelect;

            this.systemImage = this.imageResurces[1];
            this.subToolImages.push(this.imageResurces[2]);
            this.layerButtonImage = this.imageResurces[3];

            this.posing3dView.storeResources(this.modelFile, this.imageResurces);
        }

        private setEvents() {

            this.editorWindow.canvas.addEventListener('mousedown', (e: MouseEvent) => {

                this.getMouseInfo(e, false, this.mainWindow);
                this.mainWindow_mousedown();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('mousemove', (e: MouseEvent) => {

                this.getMouseInfo(e, false, this.mainWindow);
                this.mainWindow_mousemove();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('mouseup', (e: MouseEvent) => {

                this.getMouseInfo(e, true, this.mainWindow);
                this.mainWindow_mouseup();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('touchstart', (e: TouchEvent) => {

                this.getTouchInfo(e, true, false, this.mainWindow);
                this.mainWindow_mousedown();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('touchmove', (e: TouchEvent) => {

                this.getTouchInfo(e, false, false, this.mainWindow);
                this.mainWindow_mousemove();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('touchend', (e: TouchEvent) => {

                this.getTouchInfo(e, false, true, this.mainWindow);
                this.mainWindow_mouseup();
                e.preventDefault();
            });

            this.editorWindow.canvas.addEventListener('mousewheel', (e: MouseEvent) => {

                this.getWheelInfo(e);
                this.editorWindow_mousewheel();
                e.preventDefault();
            });

            this.layerWindow.canvas.addEventListener('mousedown', (e: MouseEvent) => {

                this.getMouseInfo(e, false, this.layerWindow);
                this.layerWindow_mousedown();
                e.preventDefault();
            });

            document.addEventListener('keydown', (e: KeyboardEvent) => {
                this.document_keydown(e);
            });

            document.addEventListener('keyup', (e: KeyboardEvent) => {
                this.document_keyup(e);
            });

            window.addEventListener('resize', (e: Event) => {
                this.htmlWindow_resize(e);
            });

            window.addEventListener('contextmenu', (e: Event) => {
                return this.htmlWindow_contextmenu(e);
            });

            // Menu buttons

            this.getElement(this.ID.menu_btnDrawTool).addEventListener('mousedown', (e: Event) => {

                this.setCurrentMainTool(MainToolID.drawLine);
                this.toolEnv.setRedrawLayerWindow()
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnScratchTool).addEventListener('mousedown', (e: Event) => {

                this.setCurrentMainTool(MainToolID.scratchLine);
                this.toolEnv.setRedrawLayerWindow()
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnPoseTool).addEventListener('mousedown', (e: Event) => {

                this.setCurrentMainTool(MainToolID.posing);
                this.toolEnv.setRedrawLayerWindow()
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnOperationOption).addEventListener('mousedown', (e: Event) => {

                this.openOperationOptionModal();
                e.preventDefault();
            });

            document.addEventListener('custombox:content:close', () => {
                // Content closed
                this.onModalWindowClosed();
            });
        }

        // Continuous processes

        run() {

        }

        // Events

        private mainWindow_mousedown() {

            if (!this.isLoaded) {
                return;
            }

            let context = this.toolContext;
            this.toolEnv.updateContext();

            // Draw mode
            if (context.editMode == EditModeID.drawMode) {

                this.currentTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }
            // Select mode
            else if (context.editMode == EditModeID.selectMode) {

                this.currentSelectTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }

            // View operation
            if (this.toolMouseEvent.isRightButtonPressing()) {

                this.mainWindow_MouseViewOperationStart();
            }
            else {

                this.mainWindow_MouseViewOperationEnd();
            }
        }

        private mainWindow_MouseViewOperationStart() {

            this.toolMouseEvent.isMouseDragging = true;

            mat4.copy(this.dragBeforeTransformMatrix, this.invView2DMatrix);
            vec3.copy(this.dragBeforeViewLocation, this.mainWindow.viewLocation);

            vec3.copy(this.toolMouseEvent.mouseDownLocation, this.toolMouseEvent.location);
            vec3.set(this.toolMouseEvent.mouseMovedVector, 0.0, 0.0, 0.0);
        }

        private mainWindow_MouseViewOperationEnd() {

            this.toolMouseEvent.isMouseDragging = false;
        }

        private mainWindow_mousemove() {

            if (!this.isLoaded) {
                return;
            }

            let context = this.toolContext;
            this.toolEnv.updateContext();

            if (context.editMode == EditModeID.drawMode) {

                this.currentTool.mouseMove(this.toolMouseEvent, this.toolEnv);
            }
            else if (context.editMode == EditModeID.selectMode) {

                let isHitChanged = this.mousemoveHittest(this.toolMouseEvent.location[0], this.toolMouseEvent.location[1], this.toolContext.mouseCursorRadius, false);
                if (isHitChanged) {
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
        }

        private mainWindow_mouseup() {

            if (!this.isLoaded) {
                return;
            }

            let context = this.toolContext;
            this.toolEnv.updateContext();

            // Draw mode
            if (context.editMode == EditModeID.drawMode) {

                this.currentTool.mouseUp(this.toolMouseEvent, this.toolEnv);
            }
            // Select mode
            else if (context.editMode == EditModeID.selectMode) {

                this.currentSelectTool.mouseUp(this.toolMouseEvent, this.toolEnv);
            }

            this.mainWindow_MouseViewOperationEnd();
        }

        private layerWindow_mousedown() {

            if (!this.isLoaded) {
                return;
            }

            let context = this.toolContext;
            let layerWindow = this.layerWindow;

            this.toolEnv.updateContext();

            let doubleClicked = this.hundleDoubleClick(layerWindow, this.toolMouseEvent.offsetX, this.toolMouseEvent.offsetY);

            let clickedX = this.toolMouseEvent.location[0];
            let clickedY = this.toolMouseEvent.location[1];

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
        }

        private layerWindow_mousedown_LayerItemButton(clickedX: float, clickedY: float, doubleClicked: boolean) {

            let hitedButton = <LayerWindowButton>this.hitTestLayout(this.layerWindowButtons, clickedX, clickedY);

            if (hitedButton != null) {

                let currentLayerWindowItem = this.findCurrentLayerLayerWindowItem();

                if (currentLayerWindowItem == null) {

                    return;
                }

                // Collects layer items for command
                let currentLayer: Layer = currentLayerWindowItem.layer;
                let currentLayerParent: Layer = currentLayerWindowItem.parentLayer;

                let previousLayer: Layer = null;
                let previousLayerParent: Layer = null;
                if (currentLayerWindowItem.layer.type == LayerTypeID.groupLayer) {

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

                let nextLayer: Layer = null;
                let nextLayerParent: Layer = null;
                if (currentLayerWindowItem.layer.type == LayerTypeID.groupLayer) {

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
                let layerCommand: Command_Layer_CommandBase = null;

                if (hitedButton.buttonID == <int>LayerWindowButtonID.addLayer) {

                    layerCommand = new Command_Layer_AddVectorLayerToCurrentPosition();
                }
                else if (hitedButton.buttonID == <int>LayerWindowButtonID.deleteLayer) {

                    layerCommand = new Command_Layer_Delete();
                }
                else if (hitedButton.buttonID == <int>LayerWindowButtonID.moveUp) {

                    layerCommand = new Command_Layer_MoveUp();
                }
                else if (hitedButton.buttonID == <int>LayerWindowButtonID.moveDown) {

                    layerCommand = new Command_Layer_MoveDown();
                }

                if (layerCommand == null) {

                    return;
                }

                // Execute command
                layerCommand.setPrameters(
                    currentLayer
                    , currentLayerParent
                    , previousLayer
                    , previousLayerParent
                    , nextLayer
                    , nextLayerParent
                );

                if (layerCommand.isAvailable(this.toolEnv)) {

                    layerCommand.execute(this.toolEnv);

                    this.toolContext.commandHistory.addCommand(layerCommand);
                }
            }
        }

        private layerWindow_mousedown_LayerItem(clickedX: float, clickedY: float, doubleClicked: boolean) {

            if (this.layerWindowItems.length == 0) {
                return;
            }

            let firstItem = this.layerWindowItems[0];
            let selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());

            if (selectedIndex >= 0 && selectedIndex < this.layerWindowItems.length) {

                let selectedItem = this.layerWindowItems[selectedIndex];
                let selectedLayer = selectedItem.layer;

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

                        if (this.toolContext.editMode == EditModeID.selectMode) {

                            this.toolEnv.setRedrawMainWindowEditorWindow();
                        }
                    }
                }
            }

            this.toolEnv.setRedrawLayerWindow();
        }

        private layerWindow_mousedown_Subtool(clickedX: float, clickedY: float, doubleClicked: boolean) {

            let context = this.toolContext;

            if (context.mainToolID == MainToolID.none || this.subToolViewItems.length == 0) {

                return;
            }

            let firstItem = this.subToolViewItems[0];
            let selectedIndex = Math.floor((clickedY - firstItem.top) / (firstItem.getHeight()));

            if (selectedIndex < 0 || selectedIndex >= this.subToolViewItems.length) {

                return;
            }

            let viewItem = this.subToolViewItems[selectedIndex];
            let tool = viewItem.tool;

            if (tool.isAvailable(this.toolEnv)) {

                // Change current sub tool
                this.setCurrentSubTool(selectedIndex)
                this.updateFooterMessage();
                this.toolEnv.setRedrawMainWindowEditorWindow()
                this.toolEnv.setRedrawLayerWindow()

                // Option button click
                for (let button of viewItem.buttons) {

                    if (clickedX >= button.left && clickedX <= button.right
                        && clickedY >= button.top && clickedY <= button.bottom) {

                        let inpuSideID = tool.getInputSideID(button.index, this.toolEnv);

                        if (tool.setInputSide(button.index, inpuSideID, this.toolEnv)) {

                            this.toolEnv.setRedrawMainWindowEditorWindow();
                            this.toolEnv.setRedrawLayerWindow();
                        }
                    }
                }
            }
        }

        private editorWindow_mousewheel() {

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
        }

        private document_keydown(e: KeyboardEvent) {

            if (!this.isLoaded) {
                return;
            }

            let context = this.toolContext;

            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;

            if (e.key == 'Tab') {

                // Change mode
                if (context.editMode == EditModeID.drawMode) {

                    context.editMode = EditModeID.selectMode;
                }
                else {

                    context.editMode = EditModeID.drawMode;
                }

                /// Update footer message
                this.updateFooterMessage();

                this.toolEnv.setRedrawMainWindowEditorWindow();

                return e.preventDefault();
            }

            if (e.key == 'b') {

                if (context.editMode == EditModeID.drawMode) {

                    this.setCurrentMainTool(MainToolID.drawLine);
                    this.setCurrentSubTool(<int>DrawLineToolSubToolID.drawLine);

                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindow()
                    this.toolEnv.setRedrawLayerWindow()
                }

                return;
            }

            if (e.key == 'e') {

                if (context.editMode == EditModeID.drawMode) {

                    this.setCurrentMainTool(MainToolID.scratchLine);
                    this.setCurrentSubTool(<int>ScrathLineToolSubToolID.scratchLine);

                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindow()
                    this.toolEnv.setRedrawLayerWindow()
                }

                return;
            }

            if (e.key == 'p') {

                if (context.editMode == EditModeID.drawMode) {

                    this.setCurrentMainTool(MainToolID.posing);
                    if (this.currentTool == this.tool_Posing3d_LocateHead) {

                        this.setCurrentSubTool(<int>Posing3DSubToolID.rotateHead);
                    }
                    else {

                        this.setCurrentSubTool(<int>Posing3DSubToolID.locateHead);
                    }

                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindow()
                    this.toolEnv.setRedrawLayerWindow()
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

                if (context.editMode == EditModeID.selectMode) {

                    if (this.toolContext.currentLayer != null
                        && this.toolContext.currentLayer.type == LayerTypeID.vectorLayer) {

                        let command = new Command_DeletePoints();
                        if (command.collectEditTargets(<VectorLayer>(this.toolContext.currentLayer))) {

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

                let rot = 10.0;
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

                let addScale = 0.1;
                if (e.key == 'd') {
                    addScale = -addScale;
                }

                this.mainWindow.addViewScale(addScale);

                this.toolEnv.setRedrawMainWindowEditorWindow();

                e.preventDefault();
                return;
            }

            if (e.key == 'ArrowLeft' || e.key == 'ArrowRight' || e.key == 'ArrowUp' || e.key == 'ArrowDown') {

                let x = 0.0;
                let y = 0.0;
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

                let leftLimit = this.mainWindow.width * (-0.5);
                let rightLimit = this.mainWindow.width * 1.5
                let topLimit = this.mainWindow.height * (-0.5);
                let bottomLimit = this.mainWindow.height * 1.5

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
        }

        private document_keyup(e: KeyboardEvent) {

            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;

            if (e.key == ' ') {

                this.mainWindow_MouseViewOperationEnd();
            }

            if (e.key == '1') {

                this.openOperationOptionModal();
            }
        }

        private htmlWindow_resize(e: Event) {

            this.resizeWindows();

            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.toolEnv.setRedrawLayerWindow();
        }

        private htmlWindow_contextmenu(e): boolean {

            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }

            return false;
        }

        // Tools and context operations

        private getCurrentMainTool(): MainTool {

            return this.mainTools[<int>this.toolContext.mainToolID];
        }

        private setCurrentMainTool(id: MainToolID) {

            let isChanged = (this.toolContext.mainToolID != id);

            this.toolContext.mainToolID = id;

            let mainTool = this.getCurrentMainTool();

            this.setCurrentSubTool(mainTool.currentSubToolIndex);

            if (isChanged) {

                this.collectSubToolViewItems();
                this.caluculateLayerWindowLayout(this.layerWindow);

                this.toolContext.redrawHeaderWindow = true;
            }
        }

        private setCurrentSubTool(subToolIndex: int) {

            let mainTool = this.getCurrentMainTool();

            if (this.toolContext.mainToolID != subToolIndex) {

                this.toolContext.redrawFooterWindow = true;
            }

            mainTool.currentSubToolIndex = subToolIndex;

            this.toolContext.subToolIndex = subToolIndex;

            this.currentTool = mainTool.subTools[subToolIndex];
        }

        private setCurrentSelectionTool(operationUnitID: OperationUnitID) {

            this.currentSelectTool = this.selectionTools[<int>(operationUnitID)];
        }

        public setCurrentLayer(layer: Layer) {

            this.toolContext.currentLayer = layer;

            if (layer.type == LayerTypeID.vectorLayer) {

                let vectorLayer = <VectorLayer>layer;

                this.toolContext.currentVectorLayer = vectorLayer;
                this.toolContext.currentVectorGroup = vectorLayer.groups[0];
            }
            else {

                this.toolContext.currentVectorGroup = null;
            }

            if (layer.type == LayerTypeID.posingLayer) {

                let posingLayer = <PosingLayer>layer;

                this.toolContext.currentPosingData = posingLayer.posingData;
                this.toolContext.currentPosingModel = posingLayer.posingModel;
            }
            else {

                this.toolContext.currentPosingData = null;
            }

            for (let item of this.layerWindowItems) {

                item.layer.isSelected = false;
            }

            layer.isSelected = true;
        }

        // View operations

        private resizeWindows() {

            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow);
            this.fitCanvas(this.webglWindow, this.mainWindow);
            this.fitCanvas(this.pickingWindow, this.mainWindow);

            this.resizeCanvasToParent(this.layerWindow);

            if (this.isLoaded) {

                this.caluculateLayerWindowLayout(this.layerWindow);
            }
        }

        private resizeCanvasToParent(canvasWindow: CanvasWindow) {

            canvasWindow.width = canvasWindow.canvas.parentElement.clientWidth;
            canvasWindow.height = canvasWindow.canvas.parentElement.clientHeight;

            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        }

        private fitCanvas(canvasWindow: CanvasWindow, fitToWindow: CanvasWindow) {

            canvasWindow.width = fitToWindow.width;
            canvasWindow.height = fitToWindow.height;

            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        }

        private getMouseInfo(e: MouseEvent, touchUp: boolean, canvasWindow: CanvasWindow) {

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
        }

        private getTouchInfo(e: TouchEvent, touchDown: boolean, touchUp: boolean, canvasWindow: CanvasWindow) {

            if (e.touches == undefined || e.touches.length == 0) {
                this.toolMouseEvent.button = 0;
                this.toolMouseEvent.buttons = 0;
                return;
            }

            var rect = canvasWindow.canvas.getBoundingClientRect();

            let touch: any = e.touches[0];

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
        }

        private calculateTransfomredMouseParams(canvasWindow: CanvasWindow) {

            canvasWindow.caluclateViewMatrix(this.view2DMatrix);
            mat4.invert(this.invView2DMatrix, this.view2DMatrix);

            vec3.set(this.tempVec3, this.toolMouseEvent.offsetX, this.toolMouseEvent.offsetY, 0.0);
            vec3.transformMat4(this.toolMouseEvent.location, this.tempVec3, this.invView2DMatrix);
        }

        private hundleDoubleClick(wnd: LayerWindow, offsetX: float, offsetY: float): boolean {

            if (wnd.clickCount == 0) {

                wnd.clickCount++;
                wnd.clickedX = offsetX;
                wnd.clickedY = offsetY;

                setTimeout(() => {
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
        }

        private getWheelInfo(e: MouseEvent) {

            let wheelDelta = 0.0;
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
        }

        // Dialogs

        currentDialogID = ModalWindowID.none;
        layerPropertyWindow_EditLayer: Layer = null;
        layerPropertyWindow_LayerClolor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        modalOverlayOption = {
            speedIn: 0,
            speedOut: 100,
            opacity: 0.0
        };
        modalLoaderOption = {
            active: false
        };

        private createModalOptionObject(targetElementId: string): any {

            return {
                content: {
                    target: targetElementId,
                    close: true,
                    speedIn: 0,
                    delay: 0,
                    speedOut: 100
                },
                overlay: this.modalOverlayOption,
                loader: this.modalLoaderOption
            };
        }

        private openLayerPropertyModal(layer: Layer, layerWindowItem: LayerWindowItem) {

            if (this.currentDialogID != ModalWindowID.none) {
                return;
            }

            this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);

            this.currentDialogID = ModalWindowID.layerPropertyModal;
            this.layerPropertyWindow_EditLayer = layer;

            var modal: any = new Custombox.modal(
                this.createModalOptionObject(this.ID.layerPropertyModal)
            );

            modal.open();
        }

        private openOperationOptionModal() {

            if (this.currentDialogID != ModalWindowID.none) {
                return;
            }

            this.currentDialogID = ModalWindowID.operationOprionModal;

            this.setRadioElementIntValue(this.ID.operationOptionModal_operationUnit, this.toolContext.operationUnitID);

            var modal: any = new Custombox.modal(
                this.createModalOptionObject(this.ID.operationOptionModal)
            );

            modal.open();
        }

        private onModalWindowClosed() {

            if (this.currentDialogID == ModalWindowID.layerPropertyModal) {

                let layer = this.layerPropertyWindow_EditLayer;

                // name
                let layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);

                if (!StringIsNullOrEmpty(layerName)) {

                    layer.name = layerName;
                }

                // layer color
                this.getInputElementColor(this.layerPropertyWindow_LayerClolor, this.ID.layerPropertyModal_layerColor);
                vec4.copy(layer.layerColor, this.layerPropertyWindow_LayerClolor);

                this.layerPropertyWindow_EditLayer = null;
            }
            if (this.currentDialogID == ModalWindowID.operationOprionModal) {

                this.toolContext.operationUnitID = <OperationUnitID>(
                    this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, <int>(OperationUnitID.linePoint))
                );

                this.setCurrentSelectionTool(this.toolContext.operationUnitID);
            }

            this.currentDialogID = ModalWindowID.none;

            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.toolEnv.setRedrawLayerWindow();
        }

        // Drawings

        draw() {

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
        }

        // Main window drawing

        dragBeforeTransformMatrix = mat4.create();
        dragBeforeViewLocation = vec3.create();

        private clearWindow(canvasWindow: CanvasWindow) {

            this.canvasRender.setContext(canvasWindow);

            this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
        }

        private drawMainWindow(canvasWindow: CanvasWindow) {

            this.canvasRender.setContext(canvasWindow);

            for (let i = this.document.rootLayer.childLayers.length - 1; i >= 0; i--) {
                let layer = this.document.rootLayer.childLayers[i];

                this.drawLayerRecursive(canvasWindow, layer)
            }
        }

        private drawLayerRecursive(canvasWindow: CanvasWindow, layer: Layer) {

            if (!layer.isVisible) {

                return;
            }

            if (layer.type == LayerTypeID.vectorLayer) {

                let vectorLayer = <VectorLayer>layer;
                this.drawVectorLayer(canvasWindow, vectorLayer);
            }
            else if (layer.type == LayerTypeID.groupLayer) {

                for (let i = layer.childLayers.length - 1; i >= 0; i--) {
                    let childLayer = layer.childLayers[i];

                    this.drawLayerRecursive(canvasWindow, childLayer);
                }
            }
            else if (layer.type == LayerTypeID.posingLayer) {

                // No drawing
            }
        }

        private drawVectorLayer(canvasWindow: CanvasWindow, layer: VectorLayer) {

            let context = this.toolContext;

            let isCurrentLayer = (layer == context.currentVectorLayer);

            vec4.copy(this.editOtherLayerLineColor, layer.layerColor);
            this.editOtherLayerLineColor[3] *= 0.3;

            for (let group of layer.groups) {

                for (let line of group.lines) {

                    if (line.points.length == 0) {
                        continue;
                    }

                    if (context.editMode == EditModeID.drawMode) {

                        this.drawVectorLine(canvasWindow, line, layer.layerColor, line.strokeWidth);
                    }
                    else if (context.editMode == EditModeID.selectMode) {

                        if (isCurrentLayer) {

                            if (this.toolContext.operationUnitID == OperationUnitID.linePoint) {

                                this.drawVectorLine(canvasWindow, line, layer.layerColor, line.strokeWidth);

                                this.drawAdjustingLinePoints(canvasWindow, line);
                            }
                            else if (this.toolContext.operationUnitID == OperationUnitID.lineSegment) {

                                this.drawVectorLine(canvasWindow, line, layer.layerColor, line.strokeWidth);

                                this.drawAdjustingLinePoints(canvasWindow, line);
                            }
                            else if (this.toolContext.operationUnitID == OperationUnitID.line) {

                                let color = layer.layerColor;
                                if (line.isSelected) {
                                    color = this.selectedVectorLineColor;
                                }

                                if (line.isCloseToMouse) {

                                    this.drawVectorLine(canvasWindow, line, color, line.strokeWidth + 2.0);
                                }
                                else {

                                    this.drawVectorLine(canvasWindow, line, color, line.strokeWidth);
                                }

                                //this.drawAdjustingLinePoints(canvasWindow, line);
                            }
                        }
                        else {

                            this.drawVectorLine(canvasWindow, line, this.editOtherLayerLineColor, line.strokeWidth);
                        }
                    }
                }
            }
        }

        private drawVectorLine(canvasWindow: CanvasWindow, line: VectorLine, color: Vec4, strokeWidth: float) {

            if (line.points.length == 0) {
                return;
            }

            this.canvasRender.setStrokeWidth(strokeWidth);
            this.canvasRender.setStrokeColorV(color);

            this.drawVectorLineSegment(line, 0, line.points.length - 1, false);
        }

        private drawEditLine(canvasWindow: CanvasWindow, line: VectorLine) {

            this.drawVectorLine(
                canvasWindow
                , line
                , this.editingLineColor
                , this.getViewScaleLineWidth(canvasWindow, 3.0)
            );
        }

        private drawAdjustingLine(canvasWindow: CanvasWindow, line: VectorLine, color: Vec4, isCurrentLayer: boolean) {

            if (line.points.length == 0) {
                return;
            }

            let context = this.toolContext;

            this.canvasRender.setStrokeWidth(line.strokeWidth);

            if (context.editMode == EditModeID.selectMode) {

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

            this.drawVectorLineSegment(line, 0, line.points.length - 1, true);
        }

        private drawAdjustingLinePoints(canvasWindow: CanvasWindow, line: VectorLine) {

            this.canvasRender.setStrokeWidth(this.getViewScaleLineWidth(canvasWindow, 1.0));

            for (let i = 0; i < line.points.length; i++) {
                let point = line.points[i];

                this.drawAdjustingLinePoint(point, this.linePointColor, canvasWindow.viewScale);
            }
        }

        private drawAdjustingLinePoint(point: LinePoint, color: Vec4, viewScale: float) {

            this.canvasRender.beginPath()

            let radius = 2.0;
            if (point.isSelected) {

                radius = 3.0;
                this.canvasRender.setStrokeColorV(this.selectedVectorLineColor);
                this.canvasRender.setFillColorV(this.selectedVectorLineColor);
            }
            else {

                this.canvasRender.setStrokeColorV(color);
                this.canvasRender.setFillColorV(color);
            }

            this.canvasRender.circle(point.adjustedLocation[0], point.adjustedLocation[1], radius / viewScale);

            this.canvasRender.fill();
        }

        private drawVectorLineSegment(line: VectorLine, startIndex: int, endIndex: int, useAdjustingLocation: boolean) {

            this.canvasRender.beginPath()

            this.canvasRender.moveTo(line.points[startIndex].location[0], line.points[startIndex].location[1]);

            for (let i = startIndex + 1; i <= endIndex; i++) {

                let point1 = line.points[i];

                if (useAdjustingLocation) {

                    this.canvasRender.lineTo(point1.adjustedLocation[0], point1.adjustedLocation[1]);
                }
                else {

                    this.canvasRender.lineTo(point1.location[0], point1.location[1]);
                }
            }

            this.canvasRender.stroke()
        }

        private getViewScaleLineWidth(canvasWindow: CanvasWindow, width: float) {

            return width / canvasWindow.viewScale;
        }

        // Editor window drawing

        tool_ScratchLine_EditLine_Visible = true;
        tool_ScratchLine_TargetLine_Visible = true;
        tool_ScratchLine_SampledLine_Visible = true;
        tool_ScratchLine_CandidatePoints_Visible = false;

        private drawEditorWindow(editorWindow: CanvasWindow, mainWindow: CanvasWindow) {

            let context = this.toolContext;

            mainWindow.copyTransformTo(editorWindow);

            this.canvasRender.setContext(editorWindow);
            this.canvasRender.setTransform(mainWindow);

            if (context.editMode == EditModeID.selectMode) {

                this.drawCursor(editorWindow);
            }

            if (context.editMode == EditModeID.drawMode) {

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

                            for (let point of this.tool_ScratchLine.targetLine.points) {

                                this.drawAdjustingLinePoint(point, this.testColor, editorWindow.viewScale);
                            }
                        }
                    }

                    if (this.tool_ScratchLine_SampledLine_Visible) {

                        if (this.tool_ScratchLine.resampledLine != null) {

                            for (let point of this.tool_ScratchLine.resampledLine.points) {

                                this.drawAdjustingLinePoint(point, this.sampleColor, editorWindow.viewScale);
                            }
                        }

                        if (this.tool_ScratchLine.extrudeLine != null) {

                            for (let point of this.tool_ScratchLine.extrudeLine.points) {

                                this.drawAdjustingLinePoint(point, this.extColor, editorWindow.viewScale);
                            }
                        }
                    }

                    if (this.tool_ScratchLine_CandidatePoints_Visible) {

                        if (this.tool_ScratchLine.candidateLine != null) {

                            for (let point of this.tool_ScratchLine.candidateLine.points) {

                                this.drawAdjustingLinePoint(point, this.linePointColor, editorWindow.viewScale);
                            }
                        }
                    }
                }
                else if (context.mainToolID == MainToolID.posing) {

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
        }

        private drawCursor(canvasWindow: CanvasWindow) {

            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColor(1.0, 0.5, 0.5, 1.0);
            this.canvasRender.setStrokeWidth(this.getViewScaleLineWidth(canvasWindow, 1.0));
            this.canvasRender.circle(
                this.toolMouseEvent.location[0]
                , this.toolMouseEvent.location[1]
                , this.getViewScaleLineWidth(canvasWindow, this.toolContext.mouseCursorRadius)
            );
            this.canvasRender.stroke();
        }

        // WebGL window drawing

        private drawWebGLWindow(mainWindow: CanvasWindow, webglWindow: CanvasWindow, pickingWindow: CanvasWindow) {

            if (this.toolContext.currentPosingData == null) {
                return;
            }

            mainWindow.copyTransformTo(pickingWindow);
            this.webGLRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height);

            this.posing3dView.drawPickingImage(this.toolEnv);

            pickingWindow.context.clearRect(0, 0, pickingWindow.width, pickingWindow.height);
            pickingWindow.context.drawImage(webglWindow.canvas, 0, 0, webglWindow.width, webglWindow.height);

            this.posing3dView.drawVisualImage(this.toolEnv);
        }

        // Layer window drawing

        layerWindowLayoutArea = new RectangleLayoutArea();
        layerWindowItems: List<LayerWindowItem> = null;
        layerWindowButtons: List<LayerWindowButton> = null;
        subToolViewItems: List<SubToolViewItem> = null;

        private collectLayerWindowButtons() {

            this.layerWindowButtons = new List<LayerWindowButton>();

            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.addLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.deleteLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveUp));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveDown));
        }

        private collectLayerWindowItems() {

            this.layerWindowItems = new List<LayerWindowItem>();
            this.collectLayerWindowItemsRecursive(this.layerWindowItems, this.document.rootLayer, 0);

            let previousItem: LayerWindowItem = null;
            for (let item of this.layerWindowItems) {

                item.previousItem = previousItem;

                if (previousItem != null) {

                    previousItem.nextItem = item;
                }

                previousItem = item;
            }
        }

        private collectLayerWindowItemsRecursive(result: List<LayerWindowItem>, parentLayer: Layer, currentDepth: int) {

            let siblingItem = null;

            for (let layer of parentLayer.childLayers) {

                let item = new LayerWindowItem();
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
        }

        private findCurrentLayerLayerWindowItem(): LayerWindowItem {

            for (let item of this.layerWindowItems) {

                if (item.layer == this.toolContext.currentLayer) {

                    return item;
                }
            }

            return null;
        }

        private caluculateLayerWindowLayout(layerWindow: LayerWindow) {

            layerWindow.layerWindowPainY = layerWindow.height * layerWindow.layerWindowPainRate;

            // layer item buttons
            this.layerWindowLayoutArea.copyRectangle(layerWindow);
            this.layerWindowLayoutArea.bottom = layerWindow.layerWindowPainY - 1.0;

            this.caluculateLayerWindowLayout_LayerButtons(layerWindow, this.layerWindowLayoutArea);

            if (this.layerWindowButtons.length > 0) {

                let lastButton = this.layerWindowButtons[this.layerWindowButtons.length - 1];

                layerWindow.layerItemButtonButtom = lastButton.bottom;

                this.layerWindowLayoutArea.top = lastButton.bottom + 1.0;
            }

            // layer items
            this.caluculateLayerWindowLayout_LayerWindowItem(layerWindow, this.layerWindowLayoutArea);

            // subtools
            this.layerWindowLayoutArea.top = layerWindow.layerWindowPainY;

            this.caluculateLayerWindowLayout_SubToolViewItem(layerWindow, this.layerWindowLayoutArea);
        }

        private caluculateLayerWindowLayout_LayerButtons(layerWindow: LayerWindow, layoutArea: RectangleLayoutArea) {

            let currentX = layoutArea.left;
            let currentY = layoutArea.top;
            let unitWidth = layerWindow.layerItemButtonWidth * layerWindow.layerItemButtonScale;
            let unitHeight = layerWindow.layerItemButtonHeight * layerWindow.layerItemButtonScale;

            for (let button of this.layerWindowButtons) {

                button.left = currentX;
                button.right = currentX + unitWidth - 1;
                button.top = currentY;
                button.bottom = currentY + unitHeight - 1;

                currentX += unitWidth;
            }
        }

        private caluculateLayerWindowLayout_LayerWindowItem(layerWindow: LayerWindow, layoutArea: RectangleLayoutArea) {

            let currentY = layoutArea.top;

            let itemHeight = layerWindow.layerItemHeight;

            let margine = itemHeight * 0.1;
            let iconWidth = (itemHeight - margine * 2);
            let textLeftMargin = itemHeight * 0.3;

            for (let item of this.layerWindowItems) {

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
        }

        private drawLayerWindow(layerWindow: LayerWindow) {

            this.canvasRender.setContext(layerWindow);

            this.drawLayerWindow_LayerWindowButtons(layerWindow);

            this.drawLayerWindow_LayerItems(layerWindow);

            this.drawLayerWindow_SubTools(layerWindow);
        }

        layerWindowBackgroundColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
        layerWindowItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);

        private drawLayerWindow_LayerWindowButtons(layerWindow: LayerWindow) {

            for (let button of this.layerWindowButtons) {

                this.drawLayerWindow_LayerWindowButton(button);
            }
        }

        private drawLayerWindow_LayerWindowButton(button: LayerWindowButton) {

            let srcWidth = 64.0;
            let srcHeight = 64.0;
            let srcX = 0.0;
            let srcY = (<int>button.buttonID - 1) * srcHeight;
            let dstX = button.left;
            let dstY = button.top;
            let scale = 1.0;
            let dstWidth = button.getWidth() * scale;
            let dstHeight = button.getHeight() * scale;

            let srcImage = this.layerButtonImage;

            this.canvasRender.drawImage(srcImage.image.imageData
                , srcX, srcY, srcWidth, srcHeight
                , dstX, dstY, dstWidth, dstHeight);
        }

        private drawLayerWindow_LayerItems(layerWindow: LayerWindow) {

            for (let item of this.layerWindowItems) {

                this.drawLayerWindowItem(item, layerWindow.layerItemFontSize);
            }
        }

        private drawLayerWindowItem(item: LayerWindowItem, fontSize: float) {

            let layer = item.layer;

            let left = item.left;
            let top = item.top;
            let bottom = item.bottom;

            let itemWidth = item.getWidth();
            let itemHeight = item.getHeight();

            let bottomMargin = itemHeight * 0.3;

            let depthOffset = 10.0 * item.hierarchyDepth;

            if (layer.isSelected) {

                this.canvasRender.setFillColorV(this.layerWindowItemSelectedColor);
            }
            else {

                this.canvasRender.setFillColorV(this.layerWindowBackgroundColor);
            }
            this.canvasRender.fillRect(left, top, itemWidth, itemHeight);

            // Visible/Unvisible icon
            let srcImage = this.systemImage.image;
            let iconIndex = (item.layer.isVisible ? 0.0 : 1.0);
            let srcWidth = srcImage.width * 0.125;
            let srcHeight = srcImage.height * 0.125;
            let srcX = srcWidth * iconIndex;
            let srcY = srcImage.height * 0.25;
            let dstX = item.marginLeft;
            let dstY = top + item.marginTop;
            let dstWidth = item.visibilityIconWidth;
            let dstHeigh = item.visibilityIconWidth;
            this.canvasRender.drawImage(this.systemImage.image.imageData
                , srcX, srcY, srcWidth, srcHeight
                , dstX, dstY, dstWidth, dstHeigh);

            // Text
            this.canvasRender.setFontSize(fontSize);
            this.canvasRender.setFillColor(0.0, 0.0, 0.0, 1.0);
            this.canvasRender.fillText(layer.name, item.textLeft + depthOffset, bottom - bottomMargin);
        }

        private collectSubToolViewItems() {

            this.subToolViewItems = new List<SubToolViewItem>();

            let currentMainTool = this.getCurrentMainTool();

            for (let i = 0; i < currentMainTool.subTools.length; i++) {

                let tool = <Tool_Posing3d_ToolBase>currentMainTool.subTools[i];

                let viewItem = new SubToolViewItem();
                viewItem.toolIndex = i;
                viewItem.tool = tool;

                for (let buttonIndex = 0; buttonIndex < tool.inputSideOptionCount; buttonIndex++) {

                    let button = new SubToolViewItemOptionButton();
                    button.index = buttonIndex;

                    viewItem.buttons.push(button);
                }

                this.subToolViewItems.push(viewItem);
            }
        }

        private caluculateLayerWindowLayout_SubToolViewItem(layerWindow: LayerWindow, layoutArea: RectangleLayoutArea) {

            let scale = layerWindow.subToolItemScale;
            let fullWidth = layerWindow.width - 1;
            let unitHeight = layerWindow.subToolItemUnitHeight * scale - 1;

            let currentY = layoutArea.top;

            for (let viewItem of this.subToolViewItems) {

                viewItem.left = 0.0;
                viewItem.top = currentY;
                viewItem.right = fullWidth;
                viewItem.bottom = currentY + unitHeight - 1;

                currentY += unitHeight;
            }
        }

        subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
        subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);

        private drawLayerWindow_SubTools(layerWindow: LayerWindow) {

            let context = this.toolContext;

            if (context.mainToolID != MainToolID.posing) {
                return;
            }

            let currentMainTool = this.getCurrentMainTool();
            let srcImage = this.subToolImages[0];

            let scale = layerWindow.subToolItemScale;
            let fullWidth = layerWindow.width - 1;
            let unitWidth = layerWindow.subToolItemUnitWidth;
            let unitHeight = layerWindow.subToolItemUnitHeight;

            let lastY = 0.0;

            for (let viewItem of this.subToolViewItems) {

                let tool = viewItem.tool;

                let srcY = viewItem.toolIndex * unitHeight;
                let dstY = viewItem.top;

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

                this.canvasRender.drawImage(srcImage.image.imageData
                    , 0, srcY, unitWidth, unitHeight
                    , 0, dstY, unitWidth * scale, unitHeight * scale);

                // Draw subtool option buttons
                for (let button of viewItem.buttons) {

                    let buttonWidth = 128 * scale;
                    let buttonHeight = 128 * scale;

                    button.left = unitWidth * scale * 0.8;
                    button.top = dstY;
                    button.right = button.left + buttonWidth - 1;
                    button.bottom = button.top + buttonHeight - 1;

                    let inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                    if (inpuSideID == InputSideID.front) {

                        this.canvasRender.drawImage(this.systemImage.image.imageData
                            , 0, 0, 128, 128
                            , button.left, button.top, buttonWidth, buttonHeight);
                    }
                    else if (inpuSideID == InputSideID.back) {

                        this.canvasRender.drawImage(this.systemImage.image.imageData
                            , 128, 0, 128, 128
                            , button.left, button.top, buttonWidth, buttonHeight);
                    }
                }

                this.canvasRender.setStrokeWidth(0.0);
                this.canvasRender.setStrokeColorV(this.subToolItemSeperatorLineColor);
                this.canvasRender.drawLine(0, dstY, fullWidth, dstY);

                lastY = dstY + unitHeight * scale;
            }

            this.canvasRender.setGlobalAlpha(1.0);

            this.canvasRender.drawLine(0, lastY, fullWidth, lastY);
        }

        // Header window drawing

        private updateHeaderButtons() {

            this.setHeaderButtonVisual(this.ID.menu_btnDrawTool, this.toolContext.mainToolID == MainToolID.drawLine);
            this.setHeaderButtonVisual(this.ID.menu_btnScratchTool, this.toolContext.mainToolID == MainToolID.scratchLine);
            this.setHeaderButtonVisual(this.ID.menu_btnPoseTool, this.toolContext.mainToolID == MainToolID.posing);
        }

        private setHeaderButtonVisual(elementID: string, isSelected: boolean) {

            var element = this.getElement(elementID);

            if (isSelected) {

                element.classList.remove(this.ID.unselectedMainButton);
                element.classList.add(this.ID.selectedMainButton);
            }
            else {

                element.classList.remove(this.ID.selectedMainButton);
                element.classList.add(this.ID.unselectedMainButton);
            }
        }

        // Footer window drawing

        footerText: string = '';
        footerTextBefore: string = '';

        private updateFooterMessage() {

            let context = this.toolContext;
            let modeText = '';

            if (context.editMode == EditModeID.drawMode) {

                modeText = 'DrawMode';
            }
            else if (context.editMode == EditModeID.selectMode) {

                modeText = 'SelectMode';
            }

            let toolText = '';

            if (context.editMode == EditModeID.drawMode) {

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
            else if (context.editMode == EditModeID.selectMode) {

                toolText = '';
            }


            this.footerText = modeText + ' ' + toolText;

            this.footerText = this.currentTool.helpText;
        }

        // UI management

        private hitTestLayout(areas: List<RectangleLayoutArea>, x: float, y: float): RectangleLayoutArea {

            for (let area of areas) {

                if (x >= area.left
                    && x <= area.right
                    && y >= area.top
                    && y <= area.bottom) {

                    return area;
                }
            }

            return null;
        }

        // Selection management

        private mousemoveHittest(x: float, y: float, minDistance: float, recursive: boolean): boolean {

            this.hittest_Line_IsCloseTo.startProcess();

            if (recursive) {

                this.hittest_Line_IsCloseTo.processLayerRecursive(this.document.rootLayer.childLayers, x, y, minDistance);
            }
            else {

                this.hittest_Line_IsCloseTo.processLayer(this.toolEnv.currentVectorLayer, x, y, minDistance);
            }

            this.hittest_Line_IsCloseTo.endProcess();

            return this.hittest_Line_IsCloseTo.isChanged;
        }

        // HTML helper

        getElement(id: string): HTMLElement {

            return document.getElementById(id);
        }

        setInputElementText(id: string, text: string): HTMLElement {

            let element = <HTMLInputElement>(document.getElementById(id));

            element.value = text;

            return element;
        }

        setRadioElementIntValue(elementName: string, value: int) {

            let valueText = value.toString();

            let elements = document.getElementsByName(elementName);

            for (var i = 0; i < elements.length; i++) {
                let radio = <HTMLInputElement>elements[i];

                radio.checked = (radio.value == valueText);
            }
        }

        getRadioElementIntValue(elementName: string, defaultValue: int): int {

            let value = defaultValue;

            let elements = document.getElementsByName(elementName);

            for (var i = 0; i < elements.length; i++) {
                let radio = <HTMLInputElement>elements[i];

                if (radio.checked) {

                    value = <int>(Number(radio.value));
                }
            }

            return value;
        }

        getInputElementText(id: string): string {

            let element = <HTMLInputElement>(document.getElementById(id));

            return element.value;
        }

        getInputElementColor(result: Vec4, id: string): Vec4 {

            let element = <HTMLInputElement>(document.getElementById(id));

            let color = element.value;

            result[0] = parseInt(color.substring(1, 3), 16) / 255.0;
            result[1] = parseInt(color.substring(3, 5), 16) / 255.0;
            result[2] = parseInt(color.substring(5, 7), 16) / 255.0;

            return result;
        }
    }

    class LayerWindow extends CanvasWindow {

        clickCount = 0;
        clickedX = 0;
        clickedY = 0;

        layerWindowPainRate = 0.5;
        layerWindowPainY = 0.0;

        layerItemButtonScale = 0.375;
        layerItemButtonWidth = 64.0;
        layerItemButtonHeight = 64.0;
        layerItemButtonButtom = 64.0;

        layerItemHeight = 24.0;
        layerItemFontSize = 16.0;

        layerItemVisibilityIconWidth = 24.0;
        layerItemVisibilityIconRight = 24.0;

        subToolItemScale = 0.5;
        subToolItemUnitWidth = 256;
        subToolItemUnitHeight = 128;
    }

    class RectangleLayoutArea {

        index = -1;

        marginTop = 0.0;
        marginRight = 0.0;
        marginBottom = 0.0;
        marginLeft = 0.0;

        top = 0.0;
        right = 0.0;
        bottom = 0.0;
        left = 0.0;

        borderTop = 0.0;
        borderRight = 0.0;
        borderBottom = 0.0;
        borderLeft = 0.0;

        paddingTop = 0.0;
        paddingRight = 0.0;
        paddingBottom = 0.0;
        paddingLeft = 0.0;

        getWidth(): float {

            return (this.right - this.left + 1.0);
        }

        getHeight(): float {

            return (this.bottom - this.top + 1.0);
        }

        copyRectangle(canvasWindow: LayerWindow) {

            this.left = 0.0;
            this.top = 0.0;
            this.right = canvasWindow.width - 1.0;
            this.bottom = canvasWindow.width - 1.0;
        }
    }

    enum LayerWindowButtonID {

        none = 0,
        addLayer = 1,
        deleteLayer = 2,
        moveUp = 3,
        moveDown = 4,
    }

    class LayerWindowButton extends RectangleLayoutArea {

        buttonID: LayerWindowButtonID;

        ID(id: LayerWindowButtonID): LayerWindowButton {

            this.buttonID = id;

            return this;
        }
    }

    class LayerWindowItem extends RectangleLayoutArea {

        layer: Layer = null;
        parentLayer: Layer = null;
        previousItem: LayerWindowItem = null;
        nextItem: LayerWindowItem = null;
        previousSiblingItem: LayerWindowItem = null;
        nextSiblingItem: LayerWindowItem = null;
        hierarchyDepth = 0;

        margine = 0.0;
        visibilityIconWidth = 0.0;
        textLeft = 0.0;
    }

    class SubToolViewItem extends RectangleLayoutArea {

        toolIndex = 0;
        tool: Tool_Posing3d_ToolBase = null;
        buttons = new List<SubToolViewItemOptionButton>();
    }

    class SubToolViewItemOptionButton extends RectangleLayoutArea {

    }

    export class PickingWindow extends CanvasWindow {

        maxDepth = 4.0;
    }

    enum ModalWindowID {

        none = 0,
        layerPropertyModal = 1,
        operationOprionModal = 2,
    }


    class HTMLElementID {

        menu_btnDrawTool = 'menu_btnDrawTool';
        menu_btnScratchTool = 'menu_btnScratchTool';
        menu_btnPoseTool = 'menu_btnPoseTool';
        menu_btnOperationOption = 'menu_btnOperationOption';

        unselectedMainButton = 'unselectedMainButton';
        selectedMainButton = 'selectedMainButton';

        layerPropertyModal = '#layerPropertyModal';
        layerPropertyModal_layerName = 'layerPropertyModal.layerName';
        layerPropertyModal_layerColor = 'layerPropertyModal.layerColor';

        operationOptionModal = '#operationOptionModal';
        operationOptionModal_operationUnit = 'operationOptionModal.operationUnit'
    }

    var _Main: Main;

    window.onload = () => {

        _Main = new Main();
        _Main.mainWindow.canvas = <HTMLCanvasElement>document.getElementById('mainCanvas');
        _Main.editorWindow.canvas = <HTMLCanvasElement>document.getElementById('editorCanvas');
        _Main.layerWindow.canvas = <HTMLCanvasElement>document.getElementById('layerCanvas');
        _Main.webglWindow.canvas = <HTMLCanvasElement>document.getElementById('webglCanvas');
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
}
