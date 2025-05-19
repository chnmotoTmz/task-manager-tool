# タスク管理ツールGUI化提案書

## 1. 概要

本提案書は、既存のPowerShellベースのタスク管理CLIツールにHTML/JSベースのGUIを追加するための設計案を提示します。現状のPowerShellモデルレイヤーを活かしつつ、ブラウザベースで動作するGUIを構築し、ローカルCSVファイルとの連携を実現します。

## 2. 現状分析

### 2.1 既存システムの構成

現在のシステムは以下の要素で構成されています：

- **データ構造**: CSVファイル（issues.csv、timelog.csv）
- **処理ロジック**: Python/PowerShellスクリプト
- **インターフェース**: コマンドライン（CLI）
- **主な機能**: タスク一覧表示、作業時間記録、進捗レポート、計画提案、ステータス更新

### 2.2 CSVファイル構造

**issues.csv（タスク情報）**:
- 主要フィールド: #(ID)、プロジェクト、トラッカー、ステータス、優先度、題名、担当者、開始日、期日、予定工数、作業時間、進捗率など

**timelog.csv（作業ログ）**:
- 主要フィールド: プロジェクト、日付、作成日、ユーザー、チケット、コメント、時間など

## 3. GUI化の要件

1. **サーバーレス**: ブラウザ内で完結し、サーバー接続不要
2. **データ管理**: ローカルCSVファイルとの連携
3. **処理機能**: フィルタリング、ソーティングなどの操作
4. **PowerShell連携**: 処理設定に基づくPowerShellスクリプト生成
5. **RPA対応**: UI-PathやPower Automateでの自動化対応

## 4. アーキテクチャ提案

以下、3つの実装アプローチを提案します。それぞれ複雑さと機能性のバランスが異なります。

### 4.1 シンプル実装（localStorage + PapaParse）

![シンプル実装アーキテクチャ](https://via.placeholder.com/800x400?text=Simple+Architecture)

**構成要素**:
- **フロントエンド**: HTML5 + CSS3 + JavaScript (ES6+)
- **データ処理**: PapaParse（CSVパース/生成）
- **データ保存**: localStorage（ブラウザ内ストレージ）
- **PowerShell連携**: スクリプト生成・エクスポート機能

**処理フロー**:
1. ユーザーがCSVファイルをブラウザにアップロード
2. PapaParseでCSVをJSONに変換
3. JSONデータをlocalStorageに保存
4. ブラウザ内で処理（フィルタリング、ソーティングなど）
5. 処理結果をCSVとしてエクスポート、または処理設定をPowerShellスクリプトとして生成

**メリット**:
- 実装が簡単で迅速に開発可能
- 外部ライブラリへの依存が少ない
- 学習コストが低い

**デメリット**:
- 複雑なデータ操作に制限あり
- ストレージ容量に制限（5-10MB程度）
- リアルタイム同期機能の実装が複雑

### 4.2 拡張実装（RxDB/PouchDB + PapaParse）

![拡張実装アーキテクチャ](https://via.placeholder.com/800x400?text=Advanced+Architecture)

**構成要素**:
- **フロントエンド**: HTML5 + CSS3 + JavaScript (ES6+)
- **データ処理**: PapaParse（CSVパース/生成）
- **データベース**: RxDB/PouchDB（クライアントサイドDB）
- **PowerShell連携**: スクリプト生成・エクスポート機能

**処理フロー**:
1. ユーザーがCSVファイルをブラウザにアップロード
2. PapaParseでCSVをJSONに変換
3. JSONデータをRxDB/PouchDBに保存
4. データベースクエリで高度な処理（複雑なフィルタリング、リレーション処理など）
5. 処理結果をCSVとしてエクスポート、または処理設定をPowerShellスクリプトとして生成

**メリット**:
- 複雑なデータ操作が可能
- より大きなデータセットを処理可能（50-100MB程度）
- リアルタイム同期機能の実装が容易
- オフライン対応が容易

**デメリット**:
- 実装の複雑さが増す
- 学習コストが高い（RxDB/PouchDBの知識が必要）
- 外部ライブラリへの依存が増える

### 4.3 ハイブリッド実装（段階的アプローチ）

![ハイブリッド実装アーキテクチャ](https://via.placeholder.com/800x400?text=Hybrid+Architecture)

**構成要素**:
- **フェーズ1**: localStorage + PapaParseでの基本実装
- **フェーズ2**: 必要に応じてRxDB/PouchDBへの移行
- **PowerShell連携**: 各フェーズで対応

**処理フロー**:
1. フェーズ1でシンプル実装を完成
2. ユーザーフィードバックを収集
3. 必要に応じてフェーズ2で拡張機能を追加

**メリット**:
- 段階的な開発で初期リリースが早い
- ユーザーフィードバックを反映しやすい
- 必要な機能のみを追加可能

**デメリット**:
- アーキテクチャの変更が発生する可能性
- 全体設計の見直しが必要になる場合がある

## 5. PowerShellスクリプト生成機能

GUI内でPowerShellスクリプトを生成する機能は、以下のように実装します：

```javascript
function generatePowerShell() {
    const statusFilter = document.getElementById('statusFilter').value;
    const script = `
param (
    [string]$csvPath = "issues.csv"
)
$data = Import-Csv -Path $csvPath
$filteredData = $data | Where-Object { $_."ステータス" -eq "${statusFilter}" }
$filteredData | Export-Csv -Path "filtered_issues.csv" -NoTypeInformation
    `;
    // スクリプトをダウンロード
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'process.ps1';
    a.click();
    URL.revokeObjectURL(url);
}
```

この機能により、GUIで設定した条件をPowerShellスクリプトとしてエクスポートし、ローカル環境で実行できます。

## 6. UI設計案

### 6.1 基本レイアウト

![UI設計案](https://via.placeholder.com/800x600?text=UI+Design)

**主要コンポーネント**:
1. **ヘッダー**: アプリケーション名、ユーザー情報
2. **サイドバー**: 機能メニュー（タスク一覧、時間記録、レポート、設定など）
3. **メインコンテンツ**: 選択した機能に応じた表示領域
4. **フッター**: バージョン情報、ヘルプリンクなど

### 6.2 主要画面

**タスク一覧画面**:
- フィルター機能（ステータス、優先度、期日など）
- ソート機能
- タスク詳細表示
- 新規タスク追加
- ステータス更新

**時間記録画面**:
- タスク選択
- 作業時間入力
- コメント入力
- 記録履歴表示

**レポート画面**:
- 進捗状況グラフ
- 作業時間集計
- カスタムレポート生成

**設定画面**:
- CSVファイルパス設定
- 表示設定
- PowerShellスクリプト生成設定

## 7. データ連携方式

### 7.1 CSVファイルとの連携

**読み込み**:
1. ファイル選択ダイアログでCSVを選択
2. PapaParseでパース
3. JSONデータをブラウザ内に保存

**書き込み**:
1. ブラウザ内のデータをPapaParseでCSV形式に変換
2. ダウンロードリンクを生成
3. ユーザーがCSVをダウンロードして保存

### 7.2 PowerShellスクリプトとの連携

**スクリプト生成**:
1. GUIで処理条件を設定
2. 条件に基づくPowerShellコードを生成
3. .ps1ファイルとしてダウンロード
4. ユーザーがローカルで実行

### 7.3 RPA連携

**UI-Path/Power Automate対応**:
1. 一貫したHTML要素ID/クラスを設定
2. RPAツールで認識しやすい構造を維持
3. ファイル選択、ボタンクリック、ダウンロードなどの操作を自動化可能に

## 8. 技術スタック比較

| 項目 | シンプル実装 | 拡張実装 | ハイブリッド実装 |
|------|------------|----------|--------------|
| **フロントエンド** | HTML5 + CSS3 + JS | HTML5 + CSS3 + JS | HTML5 + CSS3 + JS |
| **CSS Framework** | Tailwind CSS | Tailwind CSS | Tailwind CSS |
| **データ処理** | PapaParse | PapaParse | PapaParse |
| **データ保存** | localStorage | RxDB/PouchDB | フェーズ1: localStorage<br>フェーズ2: RxDB/PouchDB |
| **開発難易度** | 低 | 中〜高 | 中 |
| **拡張性** | 低 | 高 | 中〜高 |
| **データ容量** | 5-10MB | 50-100MB | フェーズに依存 |
| **オフライン対応** | 基本的 | 高度 | フェーズに依存 |
| **実装期間** | 短期 | 長期 | 中期 |

## 9. 実装計画

### 9.1 フェーズ1（基本機能）

1. **プロジェクト設定**:
   - 基本HTML/CSS/JSファイル作成
   - PapaParseの統合
   - localStorageの設定

2. **UI実装**:
   - 基本レイアウト
   - タスク一覧画面
   - 時間記録画面
   - 簡易レポート画面

3. **データ処理**:
   - CSVアップロード/ダウンロード
   - 基本フィルタリング/ソーティング
   - PowerShellスクリプト生成（基本）

### 9.2 フェーズ2（拡張機能）

1. **データベース統合**:
   - RxDB/PouchDBの導入
   - データモデル定義
   - 移行ロジック実装

2. **高度な機能**:
   - 複雑なフィルタリング/クエリ
   - リアルタイム更新
   - 高度なレポート機能

3. **PowerShell連携強化**:
   - 複雑な処理条件のスクリプト生成
   - バッチ処理対応

### 9.3 フェーズ3（最適化）

1. **パフォーマンス改善**:
   - データ処理の最適化
   - UI応答性の向上

2. **ユーザビリティ向上**:
   - ドラッグ&ドロップ対応
   - キーボードショートカット
   - テーマカスタマイズ

3. **拡張機能**:
   - カスタムフィールド対応
   - プラグイン機能

## 10. サンプル実装コード

### 10.1 基本HTML構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>タスク管理ツール</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js"></script>
</head>
<body class="bg-gray-100">
    <div class="flex h-screen">
        <!-- サイドバー -->
        <div class="w-64 bg-gray-800 text-white p-4">
            <h1 class="text-2xl font-bold mb-6">タスク管理</h1>
            <nav>
                <ul>
                    <li class="mb-2"><a href="#" class="block p-2 rounded hover:bg-gray-700" id="nav-tasks">タスク一覧</a></li>
                    <li class="mb-2"><a href="#" class="block p-2 rounded hover:bg-gray-700" id="nav-log">時間記録</a></li>
                    <li class="mb-2"><a href="#" class="block p-2 rounded hover:bg-gray-700" id="nav-report">レポート</a></li>
                    <li class="mb-2"><a href="#" class="block p-2 rounded hover:bg-gray-700" id="nav-settings">設定</a></li>
                </ul>
            </nav>
        </div>
        
        <!-- メインコンテンツ -->
        <div class="flex-1 p-6 overflow-auto">
            <div id="content-tasks" class="content-section">
                <h2 class="text-xl font-bold mb-4">タスク一覧</h2>
                <div class="mb-4 flex space-x-2">
                    <select id="status-filter" class="p-2 border rounded">
                        <option value="">すべてのステータス</option>
                        <option value="TODO">TODO</option>
                        <option value="進行中">進行中</option>
                        <option value="完了">完了</option>
                    </select>
                    <select id="priority-filter" class="p-2 border rounded">
                        <option value="">すべての優先度</option>
                        <option value="高">高</option>
                        <option value="中">中</option>
                        <option value="低">低</option>
                    </select>
                    <button id="filter-button" class="bg-blue-500 text-white p-2 rounded">フィルター適用</button>
                    <button id="export-ps-button" class="bg-green-500 text-white p-2 rounded">PowerShellスクリプト生成</button>
                </div>
                <div class="bg-white p-4 rounded shadow">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="p-2 text-left">#</th>
                                <th class="p-2 text-left">題名</th>
                                <th class="p-2 text-left">ステータス</th>
                                <th class="p-2 text-left">優先度</th>
                                <th class="p-2 text-left">期日</th>
                                <th class="p-2 text-left">進捗率</th>
                                <th class="p-2 text-left">操作</th>
                            </tr>
                        </thead>
                        <tbody id="tasks-table-body">
                            <!-- タスクデータがここに挿入されます -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 他のコンテンツセクション（非表示） -->
            <div id="content-log" class="content-section hidden">
                <!-- 時間記録コンテンツ -->
            </div>
            <div id="content-report" class="content-section hidden">
                <!-- レポートコンテンツ -->
            </div>
            <div id="content-settings" class="content-section hidden">
                <!-- 設定コンテンツ -->
            </div>
        </div>
    </div>
    
    <!-- ファイルアップロードモーダル -->
    <div id="upload-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg w-1/2">
            <h3 class="text-lg font-bold mb-4">CSVファイルアップロード</h3>
            <div class="mb-4">
                <input type="file" id="csv-file" accept=".csv" class="p-2 border rounded w-full">
            </div>
            <div class="flex justify-end">
                <button id="cancel-upload" class="bg-gray-300 text-gray-800 p-2 rounded mr-2">キャンセル</button>
                <button id="confirm-upload" class="bg-blue-500 text-white p-2 rounded">アップロード</button>
            </div>
        </div>
    </div>
    
    <script src="app.js"></script>
</body>
</html>
```

### 10.2 基本JavaScript処理

```javascript
// app.js
document.addEventListener('DOMContentLoaded', function() {
    // 初期データ
    let tasksData = [];
    let timelogData = [];
    
    // ナビゲーション処理
    const navLinks = document.querySelectorAll('nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.id.replace('nav-', 'content-');
            
            // コンテンツ切り替え
            contentSections.forEach(section => {
                section.classList.add('hidden');
            });
            document.getElementById(targetId).classList.remove('hidden');
            
            // アクティブナビゲーション
            navLinks.forEach(navLink => {
                navLink.classList.remove('bg-gray-700');
            });
            this.classList.add('bg-gray-700');
        });
    });
    
    // CSVアップロード処理
    document.getElementById('nav-settings').addEventListener('click', function() {
        document.getElementById('upload-modal').classList.remove('hidden');
    });
    
    document.getElementById('cancel-upload').addEventListener('click', function() {
        document.getElementById('upload-modal').classList.add('hidden');
    });
    
    document.getElementById('confirm-upload').addEventListener('click', function() {
        const fileInput = document.getElementById('csv-file');
        const file = fileInput.files[0];
        
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: function(results) {
                    // ファイル名でデータ種別を判断
                    if (file.name.includes('issues')) {
                        tasksData = results.data;
                        localStorage.setItem('tasksData', JSON.stringify(tasksData));
                        renderTasksTable();
                    } else if (file.name.includes('timelog')) {
                        timelogData = results.data;
                        localStorage.setItem('timelogData', JSON.stringify(timelogData));
                    }
                    
                    document.getElementById('upload-modal').classList.add('hidden');
                    alert('CSVファイルが正常にアップロードされました。');
                },
                error: function(error) {
                    alert('エラー: ' + error.message);
                }
            });
        } else {
            alert('ファイルを選択してください。');
        }
    });
    
    // タスクテーブル描画
    function renderTasksTable() {
        const tableBody = document.getElementById('tasks-table-body');
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        
        // フィルタリング
        let filteredData = tasksData;
        if (statusFilter) {
            filteredData = filteredData.filter(task => task['ステータス'] === statusFilter);
        }
        if (priorityFilter) {
            filteredData = filteredData.filter(task => task['優先度'] === priorityFilter);
        }
        
        // テーブル描画
        tableBody.innerHTML = '';
        filteredData.forEach(task => {
            const row = document.createElement('tr');
            row.classList.add('border-b', 'hover:bg-gray-100');
            
            row.innerHTML = `
                <td class="p-2">${task['#'] || ''}</td>
                <td class="p-2">${task['題名'] || ''}</td>
                <td class="p-2">${task['ステータス'] || ''}</td>
                <td class="p-2">${task['優先度'] || ''}</td>
                <td class="p-2">${task['期日'] || ''}</td>
                <td class="p-2">${task['進捗率'] || '0'}%</td>
                <td class="p-2">
                    <button class="bg-yellow-500 text-white p-1 rounded text-sm edit-task" data-id="${task['#']}">編集</button>
                    <button class="bg-green-500 text-white p-1 rounded text-sm log-time" data-id="${task['#']}">時間記録</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // イベントリスナー追加
        document.querySelectorAll('.edit-task').forEach(button => {
            button.addEventListener('click', function() {
                const taskId = this.getAttribute('data-id');
                editTask(taskId);
            });
        });
        
        document.querySelectorAll('.log-time').forEach(button => {
            button.addEventListener('click', function() {
                const taskId = this.getAttribute('data-id');
                logTime(taskId);
            });
        });
    }
    
    // フィルター適用
    document.getElementById('filter-button').addEventListener('click', renderTasksTable);
    
    // PowerShellスクリプト生成
    document.getElementById('export-ps-button').addEventListener('click', function() {
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        
        if (!statusFilter && !priorityFilter) {
            alert('フィルター条件を少なくとも1つ指定してください。');
            return;
        }
        
        let filterCondition = '';
        if (statusFilter) {
            filterCondition += `$_."ステータス" -eq "${statusFilter}" `;
        }
        if (priorityFilter) {
            if (statusFilter) filterCondition += 'AND ';
            filterCondition += `$_."優先度" -eq "${priorityFilter}" `;
        }
        
        const script = `
param (
    [string]$csvPath = "issues.csv"
)
$data = Import-Csv -Path $csvPath
$filteredData = $data | Where-Object { ${filterCondition} }
$filteredData | Export-Csv -Path "filtered_issues.csv" -NoTypeInformation
        `;
        
        const blob = new Blob([script], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'filter_tasks.ps1';
        a.click();
        URL.revokeObjectURL(url);
    });
    
    // 初期データロード
    const savedTasksData = localStorage.getItem('tasksData');
    if (savedTasksData) {
        tasksData = JSON.parse(savedTasksData);
        renderTasksTable();
    }
    
    const savedTimelogData = localStorage.getItem('timelogData');
    if (savedTimelogData) {
        timelogData = JSON.parse(savedTimelogData);
    }
    
    // タスク編集関数
    function editTask(taskId) {
        const task = tasksData.find(t => t['#'] == taskId);
        if (task) {
            // 編集モーダル表示などの処理
            alert(`タスク #${taskId} (${task['題名']}) の編集機能は開発中です。`);
        }
    }
    
    // 時間記録関数
    function logTime(taskId) {
        const task = tasksData.find(t => t['#'] == taskId);
        if (task) {
            // 時間記録モーダル表示などの処理
            alert(`タスク #${taskId} (${task['題名']}) の時間記録機能は開発中です。`);
        }
    }
});
```

## 11. 推奨実装アプローチ

現状の要件と将来的な拡張性を考慮し、**ハイブリッド実装**を推奨します。

**理由**:
1. 初期段階では、localStorageとPapaParseを使用したシンプルな実装で基本機能を迅速に提供
2. ユーザーフィードバックを収集しながら、必要に応じてRxDB/PouchDBへの移行を検討
3. PowerShellスクリプト生成機能は初期段階から実装し、既存のCLIツールとの連携を確保
4. 段階的なアプローチにより、開発リスクを低減しつつ、ユーザーニーズに合わせた拡張が可能

## 12. 次のステップ

1. **要件確認**: 本提案内容の確認と優先機能の決定
2. **プロトタイプ開発**: 基本UI/機能の実装
3. **テスト**: 既存CSVデータを使用した動作検証
4. **フィードバック収集**: ユーザーからの意見収集と改善点の特定
5. **本格開発**: 確定した要件に基づく開発

## 13. 質問事項

1. 初期実装として、どのアプローチ（シンプル、拡張、ハイブリッド）が最適と考えますか？
2. PowerShellスクリプト生成機能について、特に重要な処理パターンはありますか？
3. RPA連携について、具体的な自動化シナリオはありますか？
4. 将来的な拡張機能として、特に優先度の高いものはありますか？
5. 既存のCSVファイル構造に変更の予定はありますか？

## 14. まとめ

本提案書では、既存のPowerShellベースのタスク管理CLIツールにHTML/JSベースのGUIを追加するための複数のアプローチを提示しました。シンプル実装、拡張実装、ハイブリッド実装の3つの選択肢から、段階的な開発が可能なハイブリッド実装を推奨します。

ご確認いただき、フィードバックをいただければ、次のステップに進みたいと思います。
