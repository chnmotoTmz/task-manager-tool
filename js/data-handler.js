// データ管理用クラス
class DataHandler {
    constructor() {
        this.tasks = [];
        this.timelog = [];
        this.loadFromLocalStorage();
    }

    // データのローカルストレージから読み込み
    loadFromLocalStorage() {
        try {
            const tasksData = localStorage.getItem('tasks');
            const timelogData = localStorage.getItem('timelog');
            
            if (tasksData) this.tasks = JSON.parse(tasksData);
            if (timelogData) this.timelog = JSON.parse(timelogData);
        } catch (error) {
            console.error('データの読み込みエラー:', error);
        }
    }

    // データのローカルストレージに保存
    saveToLocalStorage() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            localStorage.setItem('timelog', JSON.stringify(this.timelog));
        } catch (error) {
            console.error('データの保存エラー:', error);
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
        const newId = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t['#'])) + 1 : 1;
        const newTask = {
            '#': newId,
            ...task
        };
        this.tasks.push(newTask);
        this.saveToLocalStorage();
        return newTask;
    }

    // タスクの更新
    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(t => t['#'] === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates
            };
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

    // 時間記録の追加
    addTimeLog(log) {
        this.timelog.push(log);
        this.saveToLocalStorage();
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
