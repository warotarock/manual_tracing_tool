
declare var Custombox: any;

namespace ManualTracingTool {

    // 今やること (current tasks)
    // ・線スクラッチの線修正ツールを実用的な使いやすさにする
    // 　・スクラッチツールで途中の点が一部だけギリギリ遠いために編集の対象にならないときがあるが、それをどうにかしたい
    // ・線の太さを変えられるツールを追加
    // 　・基本の線の太さ、筆圧での最小最大幅（割合）を設定できるようにする。設定ダイアログに追加。
    // 　・線を何度もなぞって太くするツール追加→編集線の方向に太さを足すという考え方→編集線への距離が近いほど、その距離に等しい分の太さを足す。足した太さ分だけ点の位置を編集線の方向に移動する。
    // 　・線を何度もなぞって細くするツール追加→編集線で削るという考え方をする→逆のようで微妙に違うかも
    // ・筆圧を線の太さに影響できるようにするとどうなるか試す
    // ・ドローツールで線の最後の点が重複している（リサンプリングで最後と同じ位置に点が追加されている？）

    // どこかでやる必要があること (nearest future tasks)
    // ・アクティブ線、レイヤによる絞り込み処理と可視化
    // ・ファイル保存、読み込み
    // ・PNG出力、jpeg出力
    // ・現在のレイヤーが変わったときにメインツールを自動で変更する。ベクターレイヤーならスクラッチツールとドローツールのどちらかを記憶、ポージングレイヤーならポーズにする

    // 既知のバグ (remaining bugs)
    // ・現在のレイヤーが移動したときにカーソルが変な位置に出る
    // ・点の移動ツールなどで右クリックでキャンセルしたときに点の位置がモーダル中の位置で表示されつづけていた
    // ・ポージングツール以外のツールでパンしたとき３Ⅾが更新されない

    // いつかやる (anytime tasks)
    // ・ラティス変形ツール
    // ・レイヤーカラーをどこかに表示する
    // ・レイヤーカラーとレイヤーの透明度の関係を考え直す
    // ・レイヤー削除時に削除前に次に表示されていたレイヤーを選択する
    // ・塗りつぶし
    // ・複数のポージングレイヤーの描画
    // ・ポージングレイヤーの表示/非表示、透明度
    // ・ポージングで入力後にキャラの拡大縮小を可能にする
    // ・ポージングで頭の角度の入力で画面の回転に対応する
    // ・Logic_VectorLayerをどこかよいファイルに移動する
    // ・線の複製
    // ・グループの複製
    // ・レイヤーの複製
    // ・モディファイアスタック
    // ・線スクラッチの点削減ツールの実現
    // 　直線上の点は削減する
    // 　曲線が曲がった量が一定を超えたところでそこまでの部分曲線の真ん中に点を配置するという方法、部分曲線に点が一つしかない場合どうするか？
    // ・レイヤーを選択変更したときレイヤーに応じたコンテキストの状態になるようにする

    // 終わったもの (done)
    // ・頂点ごとの全選択、全選択解除
    // ・変形ツール
    //   平行移動、回転、拡大縮小
    //     モーダルツールの仕組みを作る→currentToolを一時的に変える→現在のツールを一時対比する変数→モーダル用のツールイベントを用意
    // ・スクラッチツールで選択中の点のみ対象にできるよう修正
    // ・編集単位ロジック
    //   ・共通のアクティブ線
    // ・線が１本もないときにエラーが出るためなんとかしる！→線の削除処理でグループの線のリストがnullになる場合があったため。直した。
    // ・編集単位選択UIの作成
    // ・編集単位ロジック
    //   ・点、線、変、レイヤーそれぞれの選択ツールクラスの作成
    //   ・編集単位選択UIの状態で選択ツールを切り替える
    // ・レイヤーカラーの設定（カラーピッカー）→レイヤーの設定ウィンドウを出して設定するようにしてみた→モーダルウィンドウの中身を実装する→絵を見ながら設定できるように
    // ・レイヤーの表示/非表示の切り替え（レイヤー名の左に目のマークを表示）
    // ・メインツールを変更したときレイヤーに応じたコンテキストの状態になるようにする
    // ・アフィン変換ツール
    // ・点の移動ツール
    // ・線スクラッチの線修正ツールの編集線のサンプリングにビューのスケールを反映
    // ・線の延長にビューのスケールが反映されていないらしい？
    // ・現在のツールに応じた全選択、全選択解除処理
    // ・移動ツールなどで操作をするたびに縦方向に小さくなっていくバグを直す
    // 　・線の延長を別ツールにする
    // ・線スクラッチの線修正ツールを実用的な使いやすさにする
    // 　・編集線上に近接位置がない点への影響度のフォールオフを無くしたり、大きくしたりしてみる
    // 　・線の延長の最初の点の扱いを調整する

    enum MainProcessStateID {

        none = 0,
        SystemResourceLoading = 1,
        InitialDocumentLoading = 2,
        Running = 3,
        DocumentLoading = 4
    }

    class Main implements MainEditor, MainEditorDrawer {

        mainProcessState = MainProcessStateID.none;

        // UI elements

        mainWindow = new CanvasWindow();
        editorWindow = new CanvasWindow();
        layerWindow = new LayerWindow();
        webglWindow = new CanvasWindow();
        pickingWindow = new PickingWindow();

        canvasRender = new CanvasRender();
        webGLRender = new WebGLRender();

        ID = new HTMLElementID();

        // Resources

        systemImage: ImageResource = null;
        subToolImages = new List<ImageResource>();
        layerButtonImage: ImageResource = null;

        // Integrated tool system

        toolContext: ToolContext = null;
        toolEnv: ToolEnvironment = null;
        toolDrawEnv: ToolDrawingEnvironment = null;
        toolMouseEvent = new ToolMouseEvent();

        mainTools = new List<MainTool>();

        currentTool: ToolBase = null;
        currentSelectTool: ToolBase = null;

        //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);

        // Modal tools
        currentModalTool: ModalToolBase = null;
        modalBeforeTool: ToolBase = null;
        modalTools = List<ModalToolBase>(<int>ModalToolID.countOfID);

        // Selection tools
        selectionTools = List<ToolBase>(<int>OperationUnitID.countOfID);
        tool_LinePointBrushSelect = new Tool_Select_BrushSelet_LinePoint();
        tool_LineSegmentBrushSelect = new Tool_Select_BrushSelet_LineSegment();
        tool_LineBrushSelect = new Tool_Select_BrushSelet_Line();
        tool_SelectAllPoints = new Tool_Select_All_LinePoint();

        // Transform tools
        tool_Transform_Lattice_GrabMove = new Tool_Transform_Lattice_GrabMove();
        tool_Transform_Lattice_Rotate = new Tool_Transform_Lattice_Rotate();
        tool_Transform_Lattice_Scale = new Tool_Transform_Lattice_Scale();

        // Drawing tools
        tool_DrawLine = new Tool_DrawLine();
        tool_AddPoint = new Tool_AddPoint();
        tool_ScratchLine = new Tool_ScratchLine();
        tool_ExtrudeLine = new Tool_ExtrudeLine();
        tool_ScratchLineWidth = new Tool_ScratchLineWidth();
        tool_ResampleSegment = new Tool_Resample_Segment();

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

        loadingDocumentImageResources: List<ImageResource> = null;

        // Setting values
        drawStyle = new ToolDrawingStyle();

        // Work variable
        view2DMatrix = mat4.create();
        invView2DMatrix = mat4.create();
        tempVec3 = vec3.create();

        editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);

        tempEditorLinePointColor1 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        tempEditorLinePointColor2 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

        constructor() {

            this.modelFile.file('models.json');

            this.imageResurces.push(new ImageResource().file('texture01.png'));
            this.imageResurces.push(new ImageResource().file('system_image01.png').tex(false));
            this.imageResurces.push(new ImageResource().file('toolbar_image01.png').tex(false));
            this.imageResurces.push(new ImageResource().file('toolbar_image02.png').tex(false));
            this.imageResurces.push(new ImageResource().file('toolbar_image03.png').tex(false));
            this.imageResurces.push(new ImageResource().file('layerbar_image01.png').tex(false));

            this.systemImage = this.imageResurces[1];
            this.subToolImages.push(this.imageResurces[2]);
            this.subToolImages.push(this.imageResurces[3]);
            this.subToolImages.push(this.imageResurces[4]);
            this.layerButtonImage = this.imageResurces[5];
        }

        onLoad() {

            this.initializeDevices();

            this.startLoadingSystemResources();

            this.mainProcessState = MainProcessStateID.SystemResourceLoading;
        }

        private initializeDevices() {

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
        }

        // Loading

        private startLoadingSystemResources() {

            // Start loading

            this.loadModels(this.modelFile, './res/' + this.modelFile.fileName);

            for (let imageResource of this.imageResurces) {

                this.loadTexture(imageResource, './res/' + imageResource.fileName);
            }
        }

        processLoadingSystemResources() {

            if (!this.modelFile.loaded) {
                return;
            }

            for (let imageResource of this.imageResurces) {

                if (!imageResource.loaded) {
                    return;
                }
            }

            // Loading finished
            this.document = this.loadInitialDocumentData();
            this.startLoadingDocumentResources(this.document);

            _Main.mainProcessState = MainProcessStateID.InitialDocumentLoading;
        }

        private startLoadingDocumentResources(document: DocumentData) {

            this.loadingDocumentImageResources = new List<ImageResource>();

            for (let layer of document.rootLayer.childLayers) {

                this.startLoadingDocumentResourcesRecursive(layer, this.loadingDocumentImageResources);
            }
        }

        private startLoadingDocumentResourcesRecursive(layer: Layer, loadingDocumentImageResources: List<ImageResource>) {

            if (layer.type == LayerTypeID.imageFileReferenceLayer) {

                // Create an image resource

                let imageFileReferenceLayer = <ImageFileReferenceLayer>layer;

                if (imageFileReferenceLayer.imageResource == null) {

                    imageFileReferenceLayer.imageResource = new ImageResource();
                }

                // Load an image file

                let imageResource = imageFileReferenceLayer.imageResource;

                imageResource.fileName = imageFileReferenceLayer.imageFilePath;

                this.loadTexture(imageResource, imageResource.fileName);

                loadingDocumentImageResources.push(imageResource);
            }

            for (let chldLayer of layer.childLayers) {

                this.startLoadingDocumentResourcesRecursive(chldLayer, loadingDocumentImageResources);
            }
        }

        processLoadingDocumentResources() {

            for (let imageResource of this.loadingDocumentImageResources) {

                if (!imageResource.loaded) {
                    return;
                }
            }

            // Loading finished
            if (this.mainProcessState == MainProcessStateID.InitialDocumentLoading) {

                this.start();
            }
            else {

                this.mainProcessState = MainProcessStateID.Running;
            }
        }

        private isWhileLoading(): boolean {

            return (this.mainProcessState == MainProcessStateID.SystemResourceLoading
                || this.mainProcessState == MainProcessStateID.DocumentLoading);
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

        private start() {

            this.initializeContext();
            this.initializeTools();
            this.initializeViews();
            this.initializeModals();

            this.mainProcessState = MainProcessStateID.Running;

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

        private loadInitialDocumentData(): DocumentData {

            let saveData = window.localStorage.getItem(this.tempFileName);
            if (saveData) {

                let document= JSON.parse(saveData);
                return document;
            }

            let document = new DocumentData();

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

        private initializeModals() {

            this.setRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, LayerTypeID.vectorLayer);
        }

        private initializeTools() {

            // Resoures
            this.posing3dView.storeResources(this.modelFile, this.imageResurces);

            // Constructs main tools and sub tools structure
            this.mainTools.push(
                new MainTool().id(MainToolID.none)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.drawLine)
                    .subToolImg(this.subToolImages[0])
                    .subTool(this.tool_DrawLine)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.scratchLine)
                    .subToolImg(this.subToolImages[1])
                    .subTool(this.tool_ScratchLine)
                    .subTool(this.tool_ExtrudeLine)
                    .subTool(this.tool_ScratchLineWidth)
                    .subTool(this.tool_ResampleSegment)
            );

            this.mainTools.push(
                new MainTool().id(MainToolID.posing)
                    .subToolImg(this.subToolImages[2])
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

            // Modal tools
            this.modalTools[<int>ModalToolID.none] = null;
            this.modalTools[<int>ModalToolID.grabMove] = this.tool_Transform_Lattice_GrabMove;
            this.modalTools[<int>ModalToolID.ratate] = this.tool_Transform_Lattice_Rotate;
            this.modalTools[<int>ModalToolID.scale] = this.tool_Transform_Lattice_Scale;

            // Selection tools
            this.selectionTools[<int>OperationUnitID.none] = null;
            this.selectionTools[<int>OperationUnitID.linePoint] = this.tool_LinePointBrushSelect;
            this.selectionTools[<int>OperationUnitID.lineSegment] = this.tool_LineSegmentBrushSelect;
            this.selectionTools[<int>OperationUnitID.line] = this.tool_LineBrushSelect;

            // Constructs tool environment variables
            this.toolEnv = new ToolEnvironment(this.toolContext);
            this.toolDrawEnv = new ToolDrawingEnvironment();

            this.toolDrawEnv.setEnvironment(this, this.canvasRender, this.drawStyle);

            //this.currentTool = this.tool_DrawLine;
            //this.currentTool = this.tool_AddPoint;
            //this.currentTool = this.tool_ScratchLine;
            this.currentTool = this.tool_Posing3d_LocateHead;

            // TODO: ツールを作るたびに忘れるのでなんとかしる
            this.tool_DrawLine.resamplingUnitLength = this.toolContext.resamplingUnitLength;
            this.tool_ScratchLine.resamplingUnitLength = this.toolContext.resamplingUnitLength * 1.5;
            this.tool_ExtrudeLine.resamplingUnitLength = this.toolContext.resamplingUnitLength * 1.5;
            this.tool_ScratchLineWidth.resamplingUnitLength = this.toolContext.resamplingUnitLength * 1.5;
            this.tool_ResampleSegment.resamplingUnitLength = this.toolContext.resamplingUnitLength;
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
                this.toolEnv.setRedrawMainWindowEditorWindow()
                this.toolEnv.setRedrawLayerWindow()
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnScratchTool).addEventListener('mousedown', (e: Event) => {

                this.setCurrentMainTool(MainToolID.scratchLine);
                this.toolEnv.setRedrawMainWindowEditorWindow()
                this.toolEnv.setRedrawLayerWindow()
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnPoseTool).addEventListener('mousedown', (e: Event) => {

                this.setCurrentMainTool(MainToolID.posing);
                this.toolEnv.setRedrawMainWindowEditorWindow()
                this.toolEnv.setRedrawLayerWindow()
                e.preventDefault();
            });

            this.getElement(this.ID.menu_btnOperationOption).addEventListener('mousedown', (e: Event) => {

                this.openOperationOptionModal();
                e.preventDefault();
            });

            // Modal window

            document.addEventListener('custombox:content:close', () => {

                this.onModalWindowClosed();
            });

            this.setEvents_ModalCloseButton(this.ID.newLayerCommandOptionModal_ok);
            this.setEvents_ModalCloseButton(this.ID.newLayerCommandOptionModal_cancel);
        }

        private setEvents_ModalCloseButton(id: string) {

            this.getElement(id).addEventListener('click', (e: Event) => {

                this.currentModalDialogResult = id;

                this.closeModal();

                e.preventDefault();
            });
        }

        // Continuous processes

        run() {

        }

        // Events

        private mainWindow_mousedown() {

            if (!this.mainProcessState) {
                return;
            }

            let context = this.toolContext;
            this.toolEnv.updateContext();

            // Execute current tool
            if (this.isModalToolRunning()) {

                this.currentTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }
            else if (this.toolEnv.isDrawMode()) {

                this.currentTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }
            else if (this.toolEnv.isSelectMode()) {

                this.currentSelectTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }

            // View operation
            if (this.toolMouseEvent.isRightButtonPressing()) {

                this.mainWindow_MouseViewOperationStart();
            }
            else {

                this.mainWindow_MouseViewOperationEnd();
            }

            if (this.toolEnv.isSelectMode() && this.toolEnv.isCtrlKeyPressing()) {

                vec3.copy(this.toolContext.operatorCursor.location, this.toolMouseEvent.location);
                this.toolEnv.setRedrawEditorWindow();
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

            if (this.isWhileLoading()) {
                return;
            }

            let context = this.toolContext;
            this.toolEnv.updateContext();

            // Execute current tool
            if (this.isModalToolRunning()) {

                if (!this.toolMouseEvent.isMouseDragging) {

                    this.currentTool.mouseMove(this.toolMouseEvent, this.toolEnv);
                }
            }
            else if (this.toolEnv.isDrawMode()) {

                this.currentTool.mouseMove(this.toolMouseEvent, this.toolEnv);
            }
            else if (this.toolEnv.isSelectMode()) {

                let isHitChanged = this.mousemoveHittest(this.toolMouseEvent.location[0], this.toolMouseEvent.location[1], this.toolEnv.mouseCursorViewRadius, false);
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

            if (this.isWhileLoading()) {
                return;
            }

            let context = this.toolContext;
            this.toolEnv.updateContext();

            // Draw mode
            if (this.toolEnv.isDrawMode()) {

                this.currentTool.mouseUp(this.toolMouseEvent, this.toolEnv);
            }
            // Select mode
            else if (this.toolEnv.isSelectMode()) {

                this.currentSelectTool.mouseUp(this.toolMouseEvent, this.toolEnv);
            }

            this.mainWindow_MouseViewOperationEnd();
        }

        private layerWindow_mousedown() {

            if (this.isWhileLoading()) {
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

                // Select command
                let layerCommand: Command_Layer_CommandBase = null;

                if (hitedButton.buttonID == LayerWindowButtonID.addLayer) {

                    layerCommand = new Command_Layer_AddVectorLayerToCurrentPosition();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.deleteLayer) {

                    layerCommand = new Command_Layer_Delete();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveUp) {

                    layerCommand = new Command_Layer_MoveUp();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveDown) {

                    layerCommand = new Command_Layer_MoveDown();
                }

                if (layerCommand == null) {

                    return;
                }

                // Execute command
                this.executeLayerCommand(layerCommand);
            }
        }

        private setLayerCommandParameters(layerCommand: Command_Layer_CommandBase, currentLayerWindowItem: LayerWindowItem) {

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

            layerCommand.setPrameters(
                currentLayer
                , currentLayerParent
                , previousLayer
                , previousLayerParent
                , nextLayer
                , nextLayerParent
            );
        }

        private executeLayerCommand(layerCommand: Command_Layer_CommandBase) {

            let currentLayerWindowItem = this.findCurrentLayerLayerWindowItem();

            if (currentLayerWindowItem == null) {

                return;
            }

            this.setLayerCommandParameters(layerCommand, currentLayerWindowItem);

            if (layerCommand.isAvailable(this.toolEnv)) {

                layerCommand.execute(this.toolEnv);

                this.toolContext.commandHistory.addCommand(layerCommand);
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

                        if (this.toolEnv.isSelectMode()) {

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

            if (this.isWhileLoading()) {
                return;
            }

            // View operation
            if (this.toolMouseEvent.wheelDelta != 0.0
                && !this.toolMouseEvent.isMouseDragging) {

                this.mainWindow.addViewScale(this.toolMouseEvent.wheelDelta * 0.3);

                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        }

        private document_keydown(e: KeyboardEvent) {

            if (this.isWhileLoading()) {
                return;
            }

            let context = this.toolContext;

            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;

            if (e.key == 'Tab') {

                // Change mode
                if (this.toolEnv.isDrawMode()) {

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

                if (this.toolEnv.isDrawMode()) {

                    this.setCurrentMainTool(MainToolID.drawLine);
                    this.setCurrentSubTool(<int>DrawLineToolSubToolID.drawLine);

                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindowEditorWindow()
                    this.toolEnv.setRedrawLayerWindow()
                }

                return;
            }

            if (e.key == 'e') {

                if (this.toolEnv.isDrawMode()) {

                    this.setCurrentMainTool(MainToolID.scratchLine);
                    this.setCurrentSubTool(<int>ScrathLineToolSubToolID.scratchLine);

                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindowEditorWindow()
                    this.toolEnv.setRedrawLayerWindow()
                }

                return;
            }

            if (e.key == 'p') {

                if (this.toolEnv.isDrawMode()) {

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

                if (this.toolEnv.isSelectMode()) {

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

            if (e.key == 's') {

                if (this.toolEnv.isCtrlKeyPressing()) {

                    window.localStorage.setItem(this.tempFileName, JSON.stringify(this.document));

                    e.preventDefault();
                    return;
                }
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

                if (this.toolEnv.isDrawMode()) {

                    let rot = 10.0;
                    if (e.key == 't') {
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
            }

            if (e.key == 'f' || e.key == 'd') {

                let addScale = 0.1 * this.drawStyle.viewZoomAdjustingSpeedRate;
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

            if (e.key == 'a') {

                if (this.toolEnv.isSelectMode()) {

                    this.toolEnv.updateContext();
                    this.tool_SelectAllPoints.execute(this.toolEnv);
                    e.preventDefault();
                }
            }

            if (e.key == 'g') {

                if (this.toolEnv.isDrawMode()) {

                    this.toolEnv.updateContext();
                    this.currentTool.keydown(e, this.toolEnv);
                }
                else {

                    this.startModalTool(ModalToolID.grabMove);
                    e.preventDefault();
                }
            }

            if (e.key == 'r') {

                if (this.toolEnv.isSelectMode()) {

                    this.startModalTool(ModalToolID.ratate);
                    e.preventDefault();
                }
            }

            if (e.key == 's') {

                if (this.toolEnv.isSelectMode()) {

                    this.startModalTool(ModalToolID.scale);
                    e.preventDefault();
                }
            }

            if (e.key == 'Escape') {

                if (this.isModalToolRunning()) {

                    this.cancelModalTool();
                }
            }

            if (e.key == 'Enter') {

                this.toolEnv.updateContext();
                this.currentTool.keydown(e, this.toolEnv);
            }

            if (e.key == '1') {

                this.openOperationOptionModal();
            }

            if (e.key == '2') {

                this.openNewLayerCommandOptionModal();
            }
        }

        private document_keyup(e: KeyboardEvent) {

            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;

            if (e.key == ' ') {

                this.mainWindow_MouseViewOperationEnd();
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

            this.cancelModalTool();

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

        public setCurrentLayer(layer: Layer) { //@implements MainEditor

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

        private startModalTool(modalToolID: ModalToolID) {

            let modalTool = this.modalTools[<int>modalToolID];

            this.toolEnv.updateContext();
            let available = modalTool.prepareModal(this.toolMouseEvent, this.toolEnv);

            if (!available) {
                return;
            }

            modalTool.startModal(this.toolEnv);

            this.modalBeforeTool = this.currentTool;
            this.currentModalTool = modalTool;
            this.currentTool = modalTool;
        }

        public endModalTool() { //@implements MainEditor

            this.toolEnv.updateContext();
            this.currentModalTool.endModal(this.toolEnv);

            this.setModalToolBefore();

            this.toolEnv.setRedrawMainWindowEditorWindow();
        }

        public cancelModalTool() { //@implements MainEditor

            if (!this.isModalToolRunning()) {

                return;
            }

            this.toolEnv.updateContext();
            this.currentModalTool.cancelModal(this.toolEnv);

            this.setModalToolBefore();
        }

        private setModalToolBefore() {

            this.currentTool = this.modalBeforeTool;
            this.currentModalTool = null;
            this.modalBeforeTool = null;
        }

        private isModalToolRunning(): boolean {

            return (this.currentModalTool != null);
        }

        // View operations

        private resizeWindows() {

            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow);
            this.fitCanvas(this.webglWindow, this.mainWindow);
            this.fitCanvas(this.pickingWindow, this.mainWindow);

            this.resizeCanvasToParent(this.layerWindow);

            if (this.isWhileLoading()) {

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

            vec3.copy(this.toolEnv.mouseCursorLocation, this.toolMouseEvent.location);
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

        currentModalDialogID: string = null;
        currentModalDialogResult: string = null;
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

        private isModalShown(): boolean {

            return (this.currentModalDialogID != null && this.currentModalDialogID != this.ID.none);
        }

        private closeModal() {

            Custombox.modal.closeAll();
        }

        private openLayerPropertyModal(layer: Layer, layerWindowItem: LayerWindowItem) {

            if (this.isModalShown()) {
                return;
            }

            // name
            this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);

            // layer color
            this.setInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);

            this.layerPropertyWindow_EditLayer = layer;

            this.currentModalDialogID = this.ID.layerPropertyModal;

            var modal: any = new Custombox.modal(
                this.createModalOptionObject(this.currentModalDialogID)
            );

            modal.open();
        }

        private openOperationOptionModal() {

            if (this.isModalShown()) {
                return;
            }

            this.setRadioElementIntValue(this.ID.operationOptionModal_operationUnit, this.toolContext.operationUnitID);

            this.currentModalDialogID = this.ID.operationOptionModal;

            var modal: any = new Custombox.modal(
                this.createModalOptionObject(this.currentModalDialogID)
            );

            modal.open();
        }

        private openNewLayerCommandOptionModal() {

            if (this.isModalShown()) {
                return;
            }

            let layerTypeID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, LayerTypeID.vectorLayer);


            this.currentModalDialogID = this.ID.newLayerCommandOptionModal;

            var modal: any = new Custombox.modal(
                this.createModalOptionObject(this.currentModalDialogID)
            );

            modal.open();
        }

        private onModalWindowClosed() {

            if (this.currentModalDialogID == this.ID.layerPropertyModal) {

                let layer = this.layerPropertyWindow_EditLayer;

                // name
                let layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);

                if (!StringIsNullOrEmpty(layerName)) {

                    layer.name = layerName;
                }

                // layer color
                this.getInputElementColor(this.ID.layerPropertyModal_layerColor, this.layerPropertyWindow_LayerClolor);
                vec4.copy(layer.layerColor, this.layerPropertyWindow_LayerClolor);

                this.layerPropertyWindow_EditLayer = null;
            }
            else if (this.currentModalDialogID == this.ID.operationOptionModal) {

                this.toolContext.operationUnitID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, OperationUnitID.linePoint);

                this.setCurrentSelectionTool(this.toolContext.operationUnitID);
            }
            else if (this.currentModalDialogID == this.ID.newLayerCommandOptionModal) {

                if (this.currentModalDialogResult == this.ID.newLayerCommandOptionModal_ok) {

                    var layerType = this.getRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, LayerTypeID.vectorLayer);

                    // Select command

                    let layerCommand: Command_Layer_CommandBase = null;

                    if (layerType == LayerTypeID.vectorLayer) {

                        layerCommand = new Command_Layer_AddVectorLayerToCurrentPosition();
                    }
                    else if (layerType == LayerTypeID.groupLayer) {

                        layerCommand = new Command_Layer_AddGroupLayerToCurrentPosition();
                    }
                    else if (layerType == LayerTypeID.posingLayer) {

                        layerCommand = new Command_Layer_AddPosingLayerToCurrentPosition();
                    }
                    else if (layerType == LayerTypeID.imageFileReferenceLayer) {

                        layerCommand = new Command_Layer_AddImageFileReferenceLayerToCurrentPosition ();
                    }

                    if (layerCommand == null) {

                        return;
                    }

                    // Execute command

                    this.executeLayerCommand(layerCommand);
                }
            }

            this.currentModalDialogID = this.ID.none;
            this.currentModalDialogResult = this.ID.none;

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

            let useAdjustingLocation = this.isModalToolRunning();

            for (let group of layer.groups) {

                for (let line of group.lines) {

                    if (line.points.length == 0) {
                        continue;
                    }

                    if (this.toolEnv.isDrawMode()) {

                        this.drawVectorLineStroke(line, layer.layerColor, line.strokeWidth, useAdjustingLocation);
                    }
                    else if (this.toolEnv.isSelectMode()) {

                        if (!isCurrentLayer) {

                            this.drawVectorLineStroke(line, this.editOtherLayerLineColor, line.strokeWidth, useAdjustingLocation);
                        }
                        else {

                            if (this.toolContext.operationUnitID == OperationUnitID.linePoint) {

                                this.drawVectorLineStroke(line, layer.layerColor, line.strokeWidth, useAdjustingLocation);

                                this.drawVectorLinePoints(line, layer.layerColor, useAdjustingLocation);
                            }
                            else if (this.toolContext.operationUnitID == OperationUnitID.lineSegment) {

                                this.drawVectorLineStroke(line, layer.layerColor, line.strokeWidth, useAdjustingLocation);

                                this.drawVectorLinePoints(line, layer.layerColor, useAdjustingLocation);
                            }
                            else if (this.toolContext.operationUnitID == OperationUnitID.line) {

                                let color = layer.layerColor;
                                if (line.isSelected) {
                                    color = this.drawStyle.selectedVectorLineColor;
                                }

                                if (line.isCloseToMouse) {

                                    this.drawVectorLineStroke(line, color, line.strokeWidth + 2.0, useAdjustingLocation);
                                }
                                else {

                                    this.drawVectorLineStroke(line, color, line.strokeWidth, useAdjustingLocation);
                                }

                                //this.drawAdjustingLinePoints(canvasWindow, line);
                            }
                        }
                    }
                }
            }
        }

        private drawVectorLineStroke(line: VectorLine, color: Vec4, strokeWidth: float, useAdjustingLocation: boolean) {

            if (line.points.length == 0) {
                return;
            }

            this.canvasRender.setStrokeWidth(strokeWidth);
            this.canvasRender.setStrokeColorV(color);

            this.drawVectorLineSegment(line, 0, line.points.length - 1, useAdjustingLocation);
        }

        private drawVectorLinePoints(line: VectorLine, color: Vec4, useAdjustingLocation: boolean) { //@implements MainEditorDrawer

            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            // make color darker or lighter than original to visible on line color
            ColorLogic.rgbToHSV(this.tempEditorLinePointColor1, color);
            if (this.tempEditorLinePointColor1[2] > 0.5) {

                this.tempEditorLinePointColor1[2] -= this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            else {

                this.tempEditorLinePointColor1[2] += this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            ColorLogic.hsvToRGB(this.tempEditorLinePointColor2, this.tempEditorLinePointColor1);

            for (let point of line.points) {

                this.drawVectorLinePoint(point, this.tempEditorLinePointColor2, useAdjustingLocation);
            }
        }

        private lineWidthAdjust(width: float) {

            return Math.floor(width * 5) / 5;
        }

        private drawVectorLineSegment(line: VectorLine, startIndex: int, endIndex: int, useAdjustingLocation: boolean) { //@implements MainEditorDrawer

            // debug
            for (let point of line.points) {

                if (point.lineWidth == undefined) {

                    point.lineWidth = 1.0;
                    point.adjustingLineWidth = 1.0;
                }

                if (point.adjustingLocation == undefined) {

                    point.adjustingLocation = vec3.create();
                    vec3.copy(point.adjustingLocation, point.location);
                    delete point.adjustedLocation;
                }
            }
            // debug

            this.canvasRender.setLineCap(CanvasRenderLineCap.round)
            this.canvasRender.beginPath()

            let firstPoint = line.points[startIndex];

            if (useAdjustingLocation) {

                this.canvasRender.moveTo(firstPoint.adjustingLocation[0], firstPoint.adjustingLocation[1]);
            }
            else {

                this.canvasRender.moveTo(firstPoint.location[0], firstPoint.location[1]);
            }

            let currentLineWidth = this.lineWidthAdjust(firstPoint.lineWidth);
            this.canvasRender.setStrokeWidth(currentLineWidth);

            for (let i = startIndex + 1; i <= endIndex; i++) {

                let point1 = line.points[i];

                if (useAdjustingLocation) {

                    this.canvasRender.lineTo(point1.adjustingLocation[0], point1.adjustingLocation[1]);
                }
                else {

                    this.canvasRender.lineTo(point1.location[0], point1.location[1]);
                }

                if (point1.lineWidth != currentLineWidth) {

                    this.canvasRender.stroke();
                    this.canvasRender.beginPath();

                    currentLineWidth = this.lineWidthAdjust(point1.lineWidth);
                    this.canvasRender.setStrokeWidth(currentLineWidth);

                    if (useAdjustingLocation) {

                        this.canvasRender.moveTo(point1.adjustingLocation[0], point1.adjustingLocation[1]);
                    }
                    else {

                        this.canvasRender.moveTo(point1.location[0], point1.location[1]);
                    }
                    continue;
                }
            }

            this.canvasRender.stroke();
        }

        private drawVectorLinePoint(point: LinePoint, color: Vec4, useAdjustingLocation: boolean) {

            let viewScale = this.canvasRender.getViewScale();

            this.canvasRender.beginPath()

            let radius = this.drawStyle.generalLinePointRadius / viewScale;

            if (point.isSelected) {

                radius = this.drawStyle.selectedLinePointRadius / viewScale;
                this.canvasRender.setStrokeColorV(this.drawStyle.selectedVectorLineColor);
                this.canvasRender.setFillColorV(this.drawStyle.selectedVectorLineColor);
            }
            else {

                this.canvasRender.setStrokeColorV(color);
                this.canvasRender.setFillColorV(color);
            }

            if (useAdjustingLocation) {

                this.canvasRender.circle(point.adjustingLocation[0], point.adjustingLocation[1], radius);
            }
            else {

                this.canvasRender.circle(point.location[0], point.location[1], radius);
            }

            this.canvasRender.fill();
        }

        private drawEditLineStroke(line: VectorLine) {

            this.drawVectorLineStroke(
                line
                , this.drawStyle.editingLineColor
                , this.getCurrentViewScaleLineWidth(3.0)
                , false
            );
        }

        private drawEditLinePoints(canvasWindow: CanvasWindow, line: VectorLine, color: Vec4) {

            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            this.canvasRender.setStrokeColorV(color);
            this.canvasRender.setFillColorV(color);

            for (let point of line.points) {

                this.drawVectorLinePoint(point, color, false);
            }
        }

        private getCurrentViewScaleLineWidth(width: float) {

            return width / this.canvasRender.getViewScale();
        }

        private getViewScaledSize(width: float) {

            return width / this.canvasRender.getViewScale();
        }

        // Editor window drawing

        private drawEditorWindow(editorWindow: CanvasWindow, mainWindow: CanvasWindow) {

            let context = this.toolContext;

            mainWindow.updateViewMatrix();
            mainWindow.copyTransformTo(editorWindow);

            this.canvasRender.setContext(editorWindow);

            if (this.toolEnv.isSelectMode()) {

                this.drawOperatorCursor();

                this.drawMouseCursor();
            }

            if (this.toolEnv.isDrawMode()) {

                if (this.currentTool == this.tool_DrawLine) {

                    if (this.tool_DrawLine.editLine != null) {

                        this.drawEditLineStroke(this.tool_DrawLine.editLine);
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

                        this.drawEditLineStroke(this.tool_Posing3d_LocateHead.editLine);
                    }
                }
            }

            if (this.currentTool != null) {

                this.toolEnv.updateContext();
                this.toolDrawEnv.setVariables(editorWindow);
                this.currentTool.onDrawEditor(this.toolEnv, this.toolDrawEnv);
            }
        }

        private operatorCurosrLineDash = [2.0, 2.0];
        private operatorCurosrLineDashScaled = [0.0, 0.0];
        private operatorCurosrLineDashNone = [];

        private drawOperatorCursor() {

            this.canvasRender.beginPath();

            this.canvasRender.setStrokeColorV(this.drawStyle.operatorCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            let viewScale = this.getViewScaledSize(1.0);

            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            this.canvasRender.setLineDash(this.operatorCurosrLineDashScaled);

            this.canvasRender.circle(
                this.toolContext.operatorCursor.location[0]
                , this.toolContext.operatorCursor.location[1]
                , this.toolContext.operatorCursor.radius * viewScale
            );

            this.canvasRender.stroke();

            let centerX = this.toolContext.operatorCursor.location[0];
            let centerY = this.toolContext.operatorCursor.location[1];
            let clossBeginPosition = this.toolContext.operatorCursor.radius * viewScale * 1.5;
            let clossEndPosition = this.toolContext.operatorCursor.radius * viewScale * 0.5;

            this.canvasRender.drawLine(centerX - clossBeginPosition, centerY, centerX - clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX + clossBeginPosition, centerY, centerX + clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX, centerY - clossBeginPosition, centerX, centerY - clossEndPosition);
            this.canvasRender.drawLine(centerX, centerY + clossBeginPosition, centerX, centerY + clossEndPosition);

            this.canvasRender.setLineDash(this.operatorCurosrLineDashNone);
        }

        // MainEditorDrawer implementations

        drawMouseCursor() {

            this.canvasRender.beginPath();

            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));

            this.canvasRender.circle(
                this.toolMouseEvent.location[0]
                , this.toolMouseEvent.location[1]
                , this.getCurrentViewScaleLineWidth(this.toolContext.mouseCursorRadius)
            );

            this.canvasRender.stroke();
        }

        drawEditorEditLineStroke(line: VectorLine) { //@implements MainEditorDrawer

            this.drawEditLineStroke(line);
        }

        drawEditorVectorLineStroke(line: VectorLine, color: Vec4, strokeWidth: float, useAdjustingLocation: boolean) { //@implements MainEditorDrawer

            this.drawVectorLineStroke(line, color, strokeWidth, useAdjustingLocation);
        }

        drawEditorVectorLinePoints(line: VectorLine, color: Vec4, useAdjustingLocation: boolean) { //@implements MainEditorDrawer

            this.drawVectorLinePoints(line, color, useAdjustingLocation);
        }

        drawEditorVectorLineSegment(line: VectorLine, startIndex: int, endIndex: int, useAdjustingLocation: boolean) { //@implements MainEditorDrawer

            this.drawVectorLineSegment(line, startIndex, endIndex, useAdjustingLocation);
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

            let currentMainTool = this.getCurrentMainTool();
            let srcImage = currentMainTool.subToolImage;

            if (srcImage == null) {
                return;
            }

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

            if (this.toolEnv.isDrawMode()) {

                modeText = 'DrawMode';
            }
            else if (this.toolEnv.isSelectMode()) {

                modeText = 'SelectMode';
            }

            let toolText = '';

            if (this.toolEnv.isDrawMode()) {

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
            else if (this.toolEnv.isSelectMode()) {

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

        getRadioElementIntValue<T>(elementName: string, defaultValue: T): T {

            let value = defaultValue;

            let elements = document.getElementsByName(elementName);

            for (var i = 0; i < elements.length; i++) {
                let radio = <HTMLInputElement>elements[i];

                if (radio.checked) {

                    value = <any>(Number(radio.value));
                }
            }

            return value;
        }

        getInputElementText(id: string): string {

            let element = <HTMLInputElement>(document.getElementById(id));

            return element.value;
        }

        setInputElementColor(id: string, color: Vec4): Vec4 {

            let colorText = '#' + ColorLogic.rgbToHex2String(color);

            let element = <HTMLInputElement>(document.getElementById(id));

            element.value = colorText;

            return color;
        }

        getInputElementColor(id: string, result: Vec4): Vec4 {

            let element = <HTMLInputElement>(document.getElementById(id));

            let colorText = element.value;

            ColorLogic.hex2StringToRGB(result, colorText);

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

    class HTMLElementID {

        menu_btnDrawTool = 'menu_btnDrawTool';
        menu_btnScratchTool = 'menu_btnScratchTool';
        menu_btnPoseTool = 'menu_btnPoseTool';
        menu_btnOperationOption = 'menu_btnOperationOption';

        unselectedMainButton = 'unselectedMainButton';
        selectedMainButton = 'selectedMainButton';

        none = 'none';

        layerPropertyModal = '#layerPropertyModal';
        layerPropertyModal_layerName = 'layerPropertyModal.layerName';
        layerPropertyModal_layerColor = 'layerPropertyModal.layerColor';

        operationOptionModal = '#operationOptionModal';
        operationOptionModal_operationUnit = 'operationOptionModal.operationUnit'

        newLayerCommandOptionModal = '#newLayerCommandOptionModal';
        newLayerCommandOptionModal_layerType = 'newLayerCommandOptionModal.layerType';
        newLayerCommandOptionModal_ok = 'newLayerCommandOptionModal.ok';
        newLayerCommandOptionModal_cancel = 'newLayerCommandOptionModal.cancel';
    }

    enum DrawLineToolSubToolID {

        drawLine = 0,
    }

    enum ScrathLineToolSubToolID {

        scratchLine = 0,
    }

    enum ModalToolID {

        none = 0,
        grabMove = 1,
        ratate = 2,
        scale = 3,
        latticeMove = 4,
        countOfID = 5,
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

        _Main.onLoad();

        setTimeout(run, 1000 / 30);
    };

    function run() {

        if (_Main.mainProcessState == MainProcessStateID.Running) {

            _Main.run();
            _Main.draw();
        }
        else if (_Main.mainProcessState == MainProcessStateID.SystemResourceLoading) {

            _Main.processLoadingSystemResources();
        }
        else if (_Main.mainProcessState == MainProcessStateID.DocumentLoading
            || _Main.mainProcessState == MainProcessStateID.InitialDocumentLoading) {

            _Main.processLoadingDocumentResources();
        }

        setTimeout(run, 1000 / 60);
    }
}
