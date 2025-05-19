// UI操作用のクラス
class UIHandler {
    constructor() {
        this.initializeEventListeners();
    }

    // イベントリスナーの初期化
    initializeEventListeners() {
        // ナビゲーションの切り替え
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-target');
                this.showSection(target);
                document.querySelector('.active-nav')?.classList.remove('active-nav');
                link.classList.add('active-nav');
            });
        });

        // タスクのフィルタリング
        document.getElementById('filter-button').addEventListener('click', () => {
            const status = document.getElementById('status-filter').value;
            const priority = document.getElementById('priority-filter').value;
            this.filterTasks(status, priority);
        });

        // タスクの追加
        document.getElementById('add-task-button').addEventListener('click', () => {
            this.openTaskModal();
        });

        // タスクの編集
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-task-button')) {
                const taskId = e.target.getAttribute('data-id');
                this.openTaskModal(taskId);
            }
        });

        // タスクの削除
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-task-button')) {
                const taskId = e.target.getAttribute('data-id');
                this.deleteTask(taskId);
            }
        });

        // 時間記録の保存
        document.getElementById('save-log-button').addEventListener('click', () => {
            this.saveTimeLog();
        });

        // CSVファイルのアップロード
        document.getElementById('upload-csv-button').addEventListener('click', () => {
            this.uploadCSVFiles();
        });

        // CSVファイルのダウンロード
        document.getElementById('download-issues-button').addEventListener('click', () => {
            this.downloadCSV('issues.csv');
        });
        document.getElementById('download-timelog-button').addEventListener('click', () => {
            this.downloadCSV('timelog.csv');
        });

        // PowerShellスクリプトの生成
        document.getElementById('generate-script-button').addEventListener('click', () => {
            this.generatePowerShellScript();
        });
    }

    // セクションの表示切り替え
    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
    }

    // タスクのフィルタリング
    filterTasks(status, priority) {
        const filteredTasks = dataHandler.filterTasks(status, priority);
        this.renderTasks(filteredTasks);
    }

    // タスクの表示
    renderTasks(tasks) {
        const tbody = document.getElementById('tasks-table-body');
        tbody.innerHTML = tasks.map(task => `
            <tr>
                <td>${task['#']}</td>
                <td>${task['題名']}</td>
                <td>${task['ステータス']}</td>
                <td>${task['優先度']}</td>
                <td>${task['期日'] ? new Date(task['期日']).toLocaleDateString() : ''}</td>
                <td>${task['進捗率']}%</td>
                <td>
                    <button class="edit-task-button bg-blue-500 text-white px-2 py-1 rounded" data-id="${task['#']}">
                        編集
                    </button>
                    <button class="delete-task-button bg-red-500 text-white px-2 py-1 rounded ml-2" data-id="${task['#']}">
                        削除
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // タスクモーダルの表示
    openTaskModal(taskId = null) {
        const modal = document.getElementById('task-modal');
        const title = taskId ? 'タスク編集' : '新規タスク';
        modal.querySelector('h2').textContent = title;
        
        // フォームのリセット
        document.getElementById('task-form').reset();
        
        // 既存のタスクの場合、フォームを初期化
        if (taskId) {
            const task = dataHandler.tasks.find(t => t['#'] === taskId);
            if (task) {
                document.getElementById('task-title').value = task['題名'];
                document.getElementById('task-status').value = task['ステータス'];
                document.getElementById('task-priority').value = task['優先度'];
                document.getElementById('task-due-date').value = task['期日'] ? new Date(task['期日']).toISOString().split('T')[0] : '';
                document.getElementById('task-progress').value = task['進捗率'];
            }
        }
        
        // イベントリスナーの設定
        document.getElementById('save-task-button').addEventListener('click', () => {
            this.saveTask(taskId);
        });
        
        modal.style.display = 'block';
    }

    // タスクの保存
    saveTask(taskId = null) {
        const task = {
            '題名': document.getElementById('task-title').value,
            'ステータス': document.getElementById('task-status').value,
            '優先度': document.getElementById('task-priority').value,
            '期日': document.getElementById('task-due-date').value,
            '進捗率': document.getElementById('task-progress').value
        };

        if (taskId) {
            dataHandler.updateTask(taskId, task);
            this.showSuccessMessage('タスクを更新しました');
        } else {
            dataHandler.addTask(task);
            this.showSuccessMessage('新しいタスクを追加しました');
        }

        this.closeModal('task-modal');
        this.renderTasks(dataHandler.tasks);
    }

    // タスクの削除
    deleteTask(taskId) {
        if (confirm('このタスクを削除しますか？')) {
            dataHandler.deleteTask(taskId);
            this.showSuccessMessage('タスクを削除しました');
            this.renderTasks(dataHandler.tasks);
        }
    }

    // 時間記録の保存
    saveTimeLog() {
        const taskId = document.getElementById('log-task-id').value;
        const hours = document.getElementById('log-hours').value;
        const comment = document.getElementById('log-comment').value;
        
        if (!taskId || !hours) {
            this.showErrorMessage('タスクと作業時間を入力してください');
            return;
        }

        const log = {
            'タスク': taskId,
            '時間': parseFloat(hours),
            'コメント': comment,
            '日付': new Date().toISOString().split('T')[0]
        };

        dataHandler.addTimeLog(log);
        this.showSuccessMessage('作業時間を記録しました');
        this.renderTimeLogs(dataHandler.timelog);
    }

    // 時間記録の表示
    renderTimeLogs(logs) {
        const tbody = document.getElementById('log-table-body');
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${new Date(log['日付']).toLocaleDateString()}</td>
                <td>${log['タスク']}</td>
                <td>${log['時間']}時間</td>
                <td>${log['コメント']}</td>
            </tr>
        `).join('');
    }

    // CSVファイルのアップロード
    async uploadCSVFiles() {
        const issuesFile = document.getElementById('issues-csv-file').files[0];
        const timelogFile = document.getElementById('timelog-csv-file').files[0];

        if (issuesFile) {
            try {
                await dataHandler.loadFromCSV(issuesFile);
                this.showSuccessMessage('タスクデータをアップロードしました');
                this.renderTasks(dataHandler.tasks);
            } catch (error) {
                this.showErrorMessage('タスクデータのアップロードに失敗しました');
            }
        }

        if (timelogFile) {
            try {
                await dataHandler.loadFromCSV(timelogFile);
                this.showSuccessMessage('作業ログをアップロードしました');
                this.renderTimeLogs(dataHandler.timelog);
            } catch (error) {
                this.showErrorMessage('作業ログのアップロードに失敗しました');
            }
        }
    }

    // CSVファイルのダウンロード
    downloadCSV(filename) {
        try {
            if (filename === 'issues.csv') {
                dataHandler.exportToCSV(dataHandler.tasks, filename);
            } else if (filename === 'timelog.csv') {
                dataHandler.exportToCSV(dataHandler.timelog, filename);
            }
            this.showSuccessMessage(`${filename}をダウンロードしました`);
        } catch (error) {
            this.showErrorMessage('CSVファイルのダウンロードに失敗しました');
        }
    }

    // PowerShellスクリプトの生成
    generatePowerShellScript() {
        const type = document.getElementById('script-type').value;
        const options = {};
        
        if (type === 'filter') {
            options.status = document.getElementById('filter-status').value;
            options.priority = document.getElementById('filter-priority').value;
        } else if (type === 'sort') {
            options.sortField = document.getElementById('sort-field').value;
        }

        const script = dataHandler.generatePowerShellScript(type, options);
        
        // スクリプトモーダルを表示
        const scriptModal = document.getElementById('script-modal');
        scriptModal.querySelector('#script-content').value = script;
        scriptModal.style.display = 'block';

        // ダウンロードボタンのイベントリスナー
        document.getElementById('download-script-button').addEventListener('click', () => {
            const blob = new Blob([script], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'task_script.ps1';
            a.click();
            URL.revokeObjectURL(url);
            this.closeModal('script-modal');
        });
    }

    // モーダルの閉じる処理
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
    }

    // エラーメッセージの表示
    showErrorMessage(message) {
        const modal = document.getElementById('error-modal');
        modal.querySelector('#error-message').textContent = message;
        modal.style.display = 'block';

        document.getElementById('close-error-button').addEventListener('click', () => {
            this.closeModal('error-modal');
        });
    }

    // 成功メッセージの表示
    showSuccessMessage(message) {
        const modal = document.getElementById('success-modal');
        modal.querySelector('#success-message').textContent = message;
        modal.style.display = 'block';

        document.getElementById('close-success-button').addEventListener('click', () => {
            this.closeModal('success-modal');
        });
    }
}

// UIハンドラーの初期化
const uiHandler = new UIHandler();
