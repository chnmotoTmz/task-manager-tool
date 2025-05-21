// データ管理用クラス
class DataHandler {
    constructor() {
        this.tasks = [];
        this.timelog = [];
        this.allTaskColumns = [
            { key: '#', label: 'ID' },
            { key: '題名', label: '題名' },
            { key: 'プロジェクト', label: 'プロジェクト' },
            { key: 'トラッカー', label: 'トラッカー' },
            { key: 'ステータス', label: 'ステータス' },
            { key: '優先度', label: '優先度' },
            { key: '担当者', label: '担当者' },
            { key: '作成者', label: '作成者' },
            { key: '開始日', label: '開始日' },
            { key: '期日', label: '期日' },
            { key: '予定工数', label: '予定工数' },
            { key: '進捗率', label: '進捗率' },
            { key: '作成日', label: '作成日' },
            { key: '更新日', label: '更新日' },
            { key: '操作', label: '操作' } // '操作' is special, not sortable/hideable in the same way
        ];
        this.defaultVisibleColumns = ['#', '題名', 'ステータス', '優先度', '期日', '進捗率', '操作'];
        this.userSettings = { visibleColumns: [...this.defaultVisibleColumns] }; // Initialize with defaults
        this.loadFromLocalStorage(); // This will load tasks, timelog, and overwrite userSettings if saved
    }

    // データのローカルストレージから読み込み
    loadFromLocalStorage() {
        try {
            const tasksData = localStorage.getItem('tasks');
            const timelogData = localStorage.getItem('timelog');
            const settingsData = localStorage.getItem('userSettings');
            
            if (tasksData) this.tasks = JSON.parse(tasksData);
            if (timelogData) this.timelog = JSON.parse(timelogData);
            if (settingsData) {
                this.userSettings = JSON.parse(settingsData);
                // Ensure '操作' column is always visible if settings are loaded
                if (!this.userSettings.visibleColumns.includes('操作')) {
                    this.userSettings.visibleColumns.push('操作');
                }
            } else {
                 // Ensure '操作' is in default if no settings are found
                if (!this.userSettings.visibleColumns.includes('操作')) {
                    this.userSettings.visibleColumns.push('操作');
                }
            }

        } catch (error) {
            console.error('データの読み込みエラー:', error);
            // If settings are corrupted, reset to default
            this.userSettings = { visibleColumns: [...this.defaultVisibleColumns] };
             if (!this.userSettings.visibleColumns.includes('操作')) {
                this.userSettings.visibleColumns.push('操作');
            }
        }
    }

    // データのローカルストレージに保存 (tasks and timelog)
    saveToLocalStorage() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            localStorage.setItem('timelog', JSON.stringify(this.timelog));
        } catch (error) {
            console.error('タスク/タイムログデータの保存エラー:', error);
        }
    }

    // ユーザー設定の保存
    saveUserSettings() {
        try {
            localStorage.setItem('userSettings', JSON.stringify(this.userSettings));
        } catch (error)
            {
            console.error('ユーザー設定の保存エラー:', error);
        }
    }

    // 全データのリセット
    resetAllData() {
        this.tasks = [];
        this.timelog = [];
        // Reset user settings to default, ensuring '操作' is included
        this.userSettings = { visibleColumns: [...this.defaultVisibleColumns] };
        if (!this.userSettings.visibleColumns.includes('操作')) {
            this.userSettings.visibleColumns.push('操作');
        }
        
        try {
            localStorage.removeItem('tasks');
            localStorage.removeItem('timelog');
            localStorage.removeItem('userSettings'); // Or save default settings: this.saveUserSettings();
            // To be safe, explicitly save default settings after removing
            this.saveUserSettings(); 

        } catch (error) {
            console.error('ローカルストレージのリセットエラー:', error);
        }
    }

    // CSVファイルの読み込み
    async loadFromCSV(file) {
        try {
            const result = await Papa.parse(file, {
                header: true,
                complete: (results) => {
                    if (file.name === 'issues.csv') {
                        this.tasks = results.data;
                    } else if (file.name === 'timelog.csv') {
                        this.timelog = results.data;
                    }
                    this.saveToLocalStorage();
                },
                error: (error) => {
                    console.error('CSVパースエラー:', error);
                }
            });
            return result;
        } catch (error) {
            console.error('CSV読み込みエラー:', error);
            throw error;
        }
    }

    // タスクの追加
    addTask(task) {
        const newId = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => parseInt(t['#'], 10))).filter(id => !isNaN(id)) + 1 : 1;
        const now = new Date().toISOString();
        const newTask = {
            '#': newId,
            ...task,
            '作成日': now,
            '更新日': now
        };

        if (newTask['ステータス'] === '完了') {
            newTask['進捗率'] = 100;
        }

        this.tasks.push(newTask);
        this.saveToLocalStorage();
        return newTask;
    }

    // タスクの更新
    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(t => t['#'] == id); // Use == for potential type coercion if IDs are numbers/strings
        if (taskIndex !== -1) {
            const now = new Date().toISOString();
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates,
                '更新日': now
            };

            if (this.tasks[taskIndex]['ステータス'] === '完了') {
                this.tasks[taskIndex]['進捗率'] = 100;
            }
            
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    // タスクの削除
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t['#'] !== id);
        this.saveToLocalStorage();
    }

    // Helper function to get week number
    getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        return weekNo;
    }

    // 時間記録の追加
    addTimeLog(logDetails) {
        const { taskId, hours, comment } = logDetails;

        const parentTaskIndex = this.tasks.findIndex(t => t['#'] == taskId);
        if (parentTaskIndex === -1) {
            console.error(`Task with ID ${taskId} not found.`);
            return false;
        }
        const parentTask = this.tasks[parentTaskIndex];
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentDateTime = now.toISOString(); // YYYY-MM-DDTHH:MM:SS.sssZ

        const newLogEntry = {
            'プロジェクト': parentTask['プロジェクト'] || 'N/A',
            '日付': currentDate,
            '作成日': currentDateTime,
            '週': this.getWeekNumber(now),
            '作成者': 'GUI User', // Default value
            'ユーザー': 'GUI User', // Default value
            '作業分類': parentTask['作業分類'] || 'タスク', // Default or from parent
            'チケット': `TASK #${taskId}`,
            'トラッカー': parentTask['トラッカー'] || 'N/A',
            '親チケット': parentTask['親チケット'] || '', // Default empty if not present
            'ステータス': parentTask['ステータス'] || 'N/A',
            'カテゴリ': parentTask['カテゴリ'] || 'N/A',
            '対象バージョン': parentTask['対象バージョン'] || 'N/A',
            'コメント': comment || '',
            '時間': parseFloat(hours) || 0,
        };

        this.timelog.push(newLogEntry);

        // Update Parent Task
        const currentWorkHours = parseFloat(parentTask['作業時間']) || 0;
        const currentTotalWorkHours = parseFloat(parentTask['合計作業時間']) || 0;
        const newWorkHours = parseFloat(hours) || 0;

        parentTask['作業時間'] = currentWorkHours + newWorkHours;
        parentTask['合計作業時間'] = currentTotalWorkHours + newWorkHours;
        parentTask['更新日'] = currentDateTime;

        const totalEstimatedHours = parseFloat(parentTask['合計予定工数'] || parentTask['予定工数']); // Allow '予定工数' as fallback

        if (!isNaN(totalEstimatedHours) && totalEstimatedHours > 0) {
            const newProgress = Math.round((parentTask['合計作業時間'] / totalEstimatedHours) * 100);
            parentTask['進捗率'] = Math.min(newProgress, 100);
        } else {
            if (parentTask['ステータス'] === '完了') {
                parentTask['進捗率'] = 100;
            } else {
                // If progress was already a number, keep it, otherwise set to 0 if undefined or null
                parentTask['進捗率'] = (typeof parentTask['進捗率'] === 'number') ? parentTask['進捗率'] : 0;
            }
        }
        
        // Ensure numeric fields are numbers
        parentTask['進捗率'] = parseFloat(parentTask['進捗率']) || 0;


        this.tasks[parentTaskIndex] = parentTask;
        this.saveToLocalStorage();
        return true;
    }

    // フィルタリング
    filterTasks(status = '', priority = '') {
        return this.tasks.filter(task => {
            const statusMatch = !status || task['ステータス'] === status;
            const priorityMatch = !priority || task['優先度'] === priority;
            return statusMatch && priorityMatch;
        });
    }

    // PowerShellスクリプトの生成
    generatePowerShellScript(type, options) {
        let script = `param (
    [string]$csvPath = "issues.csv"
)

$data = Import-Csv -Path $csvPath
`;

        switch (type) {
            case 'filter':
                script += `$filteredData = $data`;
                if (options.status) {
                    script += ` | Where-Object { $_."ステータス" -eq "${options.status}" }`;
                }
                if (options.priority) {
                    script += ` | Where-Object { $_."優先度" -eq "${options.priority}" }`;
                }
                script += `
$filteredData | Export-Csv -Path "filtered_issues.csv" -NoTypeInformation
`;
                break;

            case 'sort':
                script += `$sortedData = $data | Sort-Object -Property "${options.sortField}"`;
                script += `
$sortedData | Export-Csv -Path "sorted_issues.csv" -NoTypeInformation
`;
                break;

            case 'report':
                script += `$reportData = $data | Group-Object -Property "ステータス" | ForEach-Object {
    [PSCustomObject]@{
        ステータス = $_.Name
        タスク数 = $_.Count
    }
}
$reportData | Export-Csv -Path "task_report.csv" -NoTypeInformation
`;
                break;
        }

        return script;
    }

    // CSVエクスポート
    exportToCSV(data, filename) {
        try {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('CSVエクスポートエラー:', error);
            throw error;
        }
    }
}

// シングルトンインスタンス
const dataHandler = new DataHandler();

// データハンドラーのエクスポート
export default dataHandler;
