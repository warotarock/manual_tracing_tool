
namespace ManualTracingTool {

    // これからやろうと思っていること (current tasks)
    // ・ファイル管理
    // 　・デフォルトの線の太さ設定の保存
    // 　・デフォルトのエクスポート倍率設定の保存
    // 　・デフォルトの設定のプリセットを選択できるようにする
    // 　・指定フォルダ以下のファイルの列挙表示、読み込み
    // 　・ファイルを指定してのドキュメント読み込み
    // 　・ファイルを指定してのドキュメント保存
    // 　・ドキュメントフレームの表示設定
    // ・ポージングツールの整備
    // 　・ポージングで入力後にキャラの移動、回転、拡大縮小を可能にする
    // 　・親の向きに合わせて子も回転してしまう（していい部位もある）のでどうにかする
    // 　・モデルを切り替えられるようにする
    // ・Web向け仕様
    // 　・Webで保存をダウンロード、読み込みをブロブにする
    // ・編集ツールの整備
    // 　・選択ツールのアイコンの作成
    // 　・ポージングツールのアイコンの作成
    // ・ミラー表示にＵＩがきちんとついてくるようにする
    // ・線スクラッチの線修正ツールを実用的な使いやすさにする
    // 　・影響範囲が感覚と合わないのでどうにかしたい
    // ・バッファリングによる編集中の描画の高速化とレイヤー合成モードの実装
    // 　・isVisibleの階層を考慮した反映
    // 　・合成モード
    // 　・描画計画の作成…バッファの持ち方…枝分かれしているところは全てバッファが必要
    // 　　　…枝分かれしているところは全てバッファが必要
    // 　　　…並列でも合成モードが変化しているところはバッファが必要
    // 　　　…非表示だとしてもバッファは作っておく…あるいはもう全てのレイヤーごとにバッファを用意しておくか
    // 　　　…そうすれば常に合成モードが実現可能…ひとまずそれでいいか
    // 　　　…バッファのサイズが問題？…画面のサイズと同じでよく、ビューの変更時に全再描画する
    // 　　　…あくまで作業の高速化であるならば、編集中のレイヤーの上下だけレイヤーであればよい

    // どこかでやる必要があること (nearest future tasks)
    // ・モバイル対応
    // 　・タッチ操作をきちんとする
    // 　・画面サイズによってはダイアログがまともに表示されない問題の対応
    // ・collectEditTargetViewKeyframeLayersは何度も実行する必要はないのだが、選択状態が変わったりするたびに更新する必要があり辛いので現状リストを生成しているのでなんとかしたい

    // 既知のバグ (remaining bugs)
    // ・グループレイヤー
    // 　・グループレイヤー下のレイヤーがレイヤーウィンドウで一番下にあるとき下移動でグループを抜け出せない
    // 　・グループレイヤー外のレイヤーを上移動でグループに入れるとき、グループの一番最後に挿入されるのでなく最初に挿入される
    // ・編集単位が辺のときでも線全体が選択色で表示される
    // ・レイヤーウィンドウでレイヤー移動時にグループの中に入れなくなっている
    // ・点の移動ツールなどで右クリックでキャンセルしたときに点の位置がモーダル中の位置で表示されつづけていた
    // ・線の連続塗りつぶしで後ろの線が削除されたときにフラグを解除していない
    // ・ドローツールで線の最後の点が重複しているときがある？（リサンプリングで最後と同じ位置に点が追加されている？）
    // ・セグメント単位の選択ツールで選択されているセグメント単位に色が変わらず線単位で色が変わっている

    // いつかやるかも (anytime tasks)
    // ・アクティブ線、レイヤによる絞り込み処理と可視化
    // ・ミラー（上下反転）表示
    // ・線の太さに変化がある線を品質よく描画する
    // ・筆圧を利用した何か
    // ・パレット機能の拡充
    // 　・パレット編集画面にカラーピッカーを自作する
    // 　・色データを単なるRGBAではなく、表現形式や混色のベースとなる色情報まで持てるようにする
    // 　・メインライト、バックライト、フィルライトのライティングによる色作成機能
    // ・レイヤーカラーをどこかに表示する
    // ・塗りつぶし関連
    // 　・既存の線を連続塗りつぶし設定するツール
    // ・編集操作
    // 　・線の複製
    // 　・グループの複製
    // 　・レイヤーの複製
    // 　・ラティス変形ツール
    // 　・アンカーの表示/非表示をツールで切り替えるようにする
    // 　・角度を指定した後での拡縮操作
    // ・ポージング
    // 　・ポージングレイヤーの透明度
    // 　・ポージングで頭の角度の入力で画面の回転に対応する
    // ・モディファイア
    // ・直線の点削減アルゴリズムの改良
    // 　・直線上の点は削減する
    // 　・曲線が曲がった量が一定を超えたところでそこまでの部分曲線の真ん中に点を配置するという方法、部分曲線に点が一つしかない場合どうするか？

    // 終わったもの (done)
    // ・パレット１、２ボタンをレイヤーウィンドウに置く
    // ・ファイル管理
    // 　・デフォルトのズーム倍率の設定の保存
    // 　・線の基本幅の倍率
    // ・ミラー（左右反転）表示
    // 　・キーフレームの編集がレイヤーごとにきちんと適用されているか確認
    // ・不具合
    // 　・ポージングツール以外のツールでパンしたとき３Ⅾが更新されない
    // 　・非表示時に入力スフィアをも非表示にする（不具合）
    // 　・点が一つしかない（あるいは同じ座標にある？）線が残ることがあるのを直したい
    // ・PNG出力、jpeg出力
    // 　・出力倍率を指定できるようにする、ドキュメントに記録する
    // 　・出力ファイル名を指定するダイアログを実装する。ついでに出力範囲の値指定も同じダイアログでできるようにする
    // ・編集ツールの整備
    // 　・グループレイヤーによる複数レイヤー同時編集
    // 　　・編集モード表示の複数レイヤー対応
    // 　　・編集モード用のツールを作成、モーダル状態にして複合した編集操作をまとめたコマンドにまとめるようにする。Enterで確定？
    // 　　・選択矩形の辺を掴んでの変形の実装
    // 　　　・ついでにドキュメントフレームの設定も同じ仕組みを利用して指定できるように考える
    // 　・複数レイヤー選択による複数レイヤー同時編集
    // ・メインツールUIの仕様変更
    // 　・現在のレイヤーが変わったときにメインツールを自動で変更する
    // 　・ヘッダ部のコントロールを「Drawing」「Edit」「Misc」の三つに変更、Editのとき今までの編集モードにする。ヘッダ部クリックかTabで切り替わるようにする。
    // ・線の太さを変えられるツールを追加
    // 　・固定の太さで上書きする機能、選択中の点に上書きする
    // 　・筆圧を線の太さに影響できるようにするとどうなるか試す
    // ・アニメーション機能
    // 　・キーフレームウィンドウを追加
    // 　　・キーフレームを削除できるようにする
    // 　　・キーフレームを移動できるようにする
    // 　・ドキュメントにキーフレーム情報を追加
    // 　・レイヤーのジオメトリにキーフレーム情報を追加
    // ・エクスポートの整備
    // 　・ファイル名を指定してのエクスポート
    // 　・拡大率を指定してエクスポート
    // 　・背景色を指定する
    // 　・エクスポートの描画位置がバグっているので直す（不具合）
    // ・ポージングツールの整備
    // 　・ポージングツール以外のツールでパンしたとき３Ⅾを更新する
    // 　・複数のポージングレイヤーの描画
    // ・塗りつぶし機能の追加
    // 　・連続する線として設定した線を接続して塗りつぶすことができる機能（複数の線の間を塗りつぶす機能の簡易版ともいえる）
    // ・描画ツールの追加
    // 　・点削除ブラシツール（線の点をブラシ選択の要領で削除できる）
    // 　・線の非表示ツール（線の幅を0にして描画のみしないようにできる）
    // ・ツールの整理
    // 　・ポージングツールのツールが表示しきれていないのでサブツールウィンドウをスクロール可能にする
    // ・パレット機能の実装
    // 　・線色と塗りつぶし色それぞれパレット色モードを選択できるようにする
    // 　・パレット編集ダイアログを実装する。２５色最初から生成されていて、そこから選ぶ。
    // ・レイヤーに線と塗りつぶしの描画オプションを実装する
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
    // 　・スクラッチツールで途中の点が一部だけギリギリ遠いために編集の対象にならないときがあるが、それをどうにかしたい→法線方向の影響範囲を大きくとることにした
    // ・線の太さを変えられるツールを追加
    // 　・基本の線の太さ、筆圧での最小最大幅（割合）を設定できるようにする。設定ダイアログに追加。
    // ・ファイル保存、読み込み
    // 　・ローカルストレージの設定のファイルに書き込む
    // 　・出力する範囲を設定するツールを実装する
    // ・PNG出力、jpeg出力
    // 　・出力用のCanvasを用意し、出力サイズにサイズを変更し、画像ファイルを保存する
    // ・リサンプリングツールで線の太さがビューのスケールに応じて変わってしまっている？→スムージング処理中の不具合だった
    // ・線スクラッチの点削減ツールの実現

    var _Main: App_Main;

    window.onload = () => {

        _Main = new App_Main();
        _Main.mainWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.mainCanvas);
        _Main.editorWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.editorCanvas);
        _Main.webglWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.webglCanvas);
        _Main.layerWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.layerCanvas);
        _Main.subtoolWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.subtoolCanvas);
        _Main.timeLineWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.timeLineCanvas);
        _Main.palletSelectorWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.palletSelectorCanvas);
        _Main.colorMixerWindow_colorCanvas.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.colorMixerWindow_colorCanvas);
        _Main.foreLayerRenderWindow.canvas = document.createElement('canvas');
        _Main.backLayerRenderWindow.canvas = document.createElement('canvas');
        _Main.pickingWindow.canvas = document.createElement('canvas');
        _Main.exportRenderWindow.canvas = document.createElement('canvas');
        _Main.palletColorModal_colorCanvas.canvas = <HTMLCanvasElement>document.getElementById(_Main.ID.palletColorModal_colorCanvas);

        var layerColorModal_colors = document.getElementById(_Main.ID.palletColorModal_colors);
        for (let palletColorIndex = 0; palletColorIndex < DocumentData.maxPalletColors; palletColorIndex++) {

            let colorItemDiv = document.createElement('div');
            colorItemDiv.classList.add(_Main.ID.palletColorModal_colorItemStyle);
            layerColorModal_colors.appendChild(colorItemDiv);

            let radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.id = _Main.ID.palletColorModal_colorIndex + palletColorIndex;
            radioInput.name = _Main.ID.palletColorModal_colorIndex;
            radioInput.value = palletColorIndex.toString();
            colorItemDiv.appendChild(radioInput);

            let colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.id = _Main.ID.palletColorModal_colorValue + palletColorIndex;
            colorInput.classList.add(_Main.ID.palletColorModal_colorItemStyle);
            colorItemDiv.appendChild(colorInput);
        }

        _Main.onInitializeSystemDevices();

        setTimeout(run, 1000 / 30);
    };

    function run() {

        try {

            if (_Main.mainProcessState == MainProcessStateID.pause) {

                setTimeout(run, 1000);
                return;
            }
            else if (_Main.mainProcessState == MainProcessStateID.running) {

                _Main.run();
                _Main.draw();
            }
            else if (_Main.mainProcessState == MainProcessStateID.systemResourceLoading) {

                _Main.processLoadingSystemResources();
            }
            else if (_Main.mainProcessState == MainProcessStateID.initialDocumentJSONLoading) {

                _Main.processLoadingDocumentJSON();
            }
            else if (_Main.mainProcessState == MainProcessStateID.documentResourceLoading
                || _Main.mainProcessState == MainProcessStateID.initialDocumentResourceLoading) {

                _Main.processLoadingDocumentResources();
            }

            if (_Main.toolContext != null && _Main.toolContext.animationPlaying) {

                setTimeout(run, 1000 / _Main.toolContext.animationPlayingFPS);
            }
            else {

                window.requestAnimationFrame(run);
            }
        }
        catch (e) {
            console.log(e);
            setTimeout(run, 1000);
        }
    }
}
