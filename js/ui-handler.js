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

        // データリセットボタン
        const resetDataButton = document.getElementById('reset-data-button');
        if (resetDataButton) {
            resetDataButton.addEventListener('click', () => this.handleDataReset());
        }

        // PowerShell Script Type Change
        const scriptTypeSelect = document.getElementById('script-type');
        if (scriptTypeSelect) {
            scriptTypeSelect.addEventListener('change', (e) => this.handleScriptTypeChange(e.target.value));
            this.handleScriptTypeChange(scriptTypeSelect.value); // Initial call
        }

        // Column Visibility Settings Button
        const saveColSettingsButton = document.getElementById('save-column-settings-button');
        if (saveColSettingsButton) {
            saveColSettingsButton.addEventListener('click', () => this.saveColumnVisibilitySettings());
        }
        
        // Setup Modal Close Listeners
        this.setupModalCloseListeners();
    }

    setupModalCloseListeners() {
        const modalCloseItems = [
            // Modal ID and array of button IDs that close it
            { modalId: 'task-modal', buttonIds: ['task-modal-close-icon', 'cancel-task-button'] },
            { modalId: 'error-modal', buttonIds: ['error-modal-close-icon', 'close-error-button'] },
            { modalId: 'success-modal', buttonIds: ['success-modal-close-icon', 'close-success-button'] },
            { modalId: 'script-modal', buttonIds: ['script-modal-close-icon'] }
            // Note: download-script-button in script-modal also closes it, handled separately.
        ];

        modalCloseItems.forEach(item => {
            item.buttonIds.forEach(buttonId => {
                const button = document.getElementById(buttonId);
                if (button) {
                    button.addEventListener('click', () => this.closeModal(item.modalId));
                }
            });
        });
    }

    handleScriptTypeChange(scriptType) {
        const filterOptionsDiv = document.getElementById('filter-options');
        const sortOptionsDiv = document.getElementById('sort-options');

        if (!filterOptionsDiv || !sortOptionsDiv) {
            console.warn('Script option divs not found'); // Warn if divs are missing
            return;
        }

        filterOptionsDiv.classList.add('hidden');
        sortOptionsDiv.classList.add('hidden');

        if (scriptType === 'filter') {
            filterOptionsDiv.classList.remove('hidden');
        } else if (scriptType === 'sort') {
            sortOptionsDiv.classList.remove('hidden');
            const sortFieldSelect = document.getElementById('sort-field');
            // Populate sort fields only if it's empty to avoid re-populating on every change
            // if the user switches back and forth.
            if (sortFieldSelect && sortFieldSelect.options.length <= 1) { 
                sortFieldSelect.innerHTML = ''; // Clear existing options (like the placeholder)
                 dataHandler.allTaskColumns.forEach(col => {
                    // Exclude non-sortable or less relevant fields for PowerShell context
                    if (col.key !== '操作' && col.key !== 'プロジェクト' && col.key !== 'トラッカー' && col.key !== '担当者' && col.key !== '作成者') { 
                        const option = document.createElement('option');
                        option.value = col.key;
                        option.textContent = col.label;
                        // Default selection can be set here if desired, e.g.,
                        if(col.key === '優先度') option.selected = true; 
                        sortFieldSelect.appendChild(option);
                    }
                });
            }
        }
        // 'report' type currently has no specific options div
    }
    
    handleDataReset() {
        if (confirm('すべてのタスク、時間記録、および設定をリセットしますか？この操作は元に戻せません。')) {
            dataHandler.resetAllData();
            this.showSuccessMessage('すべてのデータがリセットされました。');
            // Re-render all relevant UI parts
            this.renderTasks(dataHandler.tasks);
            this.renderTimeLogs(dataHandler.timelog);
            this.renderReportData();
            this.initializeColumnVisibilitySettings(); // Reset column visibility checkboxes
            this.applyColumnVisibility(); // Apply default visibility
             // Also, potentially reset filters if they are part of settings or UI state
            document.getElementById('status-filter').value = '';
            document.getElementById('priority-filter').value = '';
            document.getElementById('script-type').value = 'filter'; // Reset script type
            this.handleScriptTypeChange('filter'); // Update visibility of script options
            // Manually trigger showSection for settings to refresh its view if currently active
            if (document.getElementById('settings-section').classList.contains('active')) {
                this.showSection('settings-section');
            }
        }
    }

    constructor() {
        this.currentSortKey = '#'; // Default sort key
        this.sortDirection = 'asc'; // Default sort direction
        this.initializeEventListeners();
        this.initializeColumnVisibilitySettings(); // Initialize on load
        this.applyColumnVisibility(); // Apply visibility on load
    }

    // セクションの表示切り替え
    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active'); // Tailwind 'hidden' class could also be used
        });
        document.getElementById(sectionId).classList.add('active');

        if (sectionId === 'report-section') {
            this.renderReportData();
        }
        if (sectionId === 'settings-section') {
            this.initializeColumnVisibilitySettings(); // Refresh checkboxes when settings tab is opened
        }
        if (sectionId === 'tasks-section') {
            this.renderTasks(dataHandler.tasks); // Re-render tasks when switching to task section
        }
    }

    renderReportData() {
        this.renderStatusChart();
        this.renderPriorityChart();
        this.renderUpcomingTasks();
        this.renderTimeSummary();
    }


    // Status Chart Rendering
    renderStatusChart() {
        const container = document.getElementById('status-chart-container');
        if (!container) return;

        const tasks = dataHandler.tasks;
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-16">データがありません</p>';
            return;
        }

        const statusCounts = tasks.reduce((acc, task) => {
            const status = task['ステータス'] || '未定義';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        let html = '<div class="space-y-2">';
        const totalTasks = tasks.length;

        for (const status in statusCounts) {
            const count = statusCounts[status];
            const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
            html += `
                <div class="mb-1">
                    <div class="flex justify-between mb-1">
                        <span class="text-sm font-medium text-gray-700">${status}</span>
                        <span class="text-sm font-medium text-gray-700">${count}件</span>
                    </div>
                    <div class="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    }

    // Priority Chart Rendering
    renderPriorityChart() {
        const container = document.getElementById('priority-chart-container');
        if (!container) return;

        const tasks = dataHandler.tasks;
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-16">データがありません</p>';
            return;
        }

        const priorityCounts = tasks.reduce((acc, task) => {
            const priority = task['優先度'] || '未定義';
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
        }, {});
        
        let html = '<div class="space-y-2">';
        const totalTasks = tasks.length;

        const priorityColors = {
            '高': 'bg-red-500',
            '中': 'bg-yellow-500',
            '低': 'bg-green-500',
            '未定義': 'bg-gray-400'
        };

        for (const priority in priorityCounts) {
            const count = priorityCounts[priority];
            const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
            const color = priorityColors[priority] || 'bg-gray-400';
            html += `
                <div class="mb-1">
                     <div class="flex justify-between mb-1">
                        <span class="text-sm font-medium text-gray-700">${priority}</span>
                        <span class="text-sm font-medium text-gray-700">${count}件</span>
                    </div>
                    <div class="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div class="${color} h-2.5 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    }

    // Upcoming Tasks Rendering
    renderUpcomingTasks() {
        const container = document.getElementById('upcoming-tasks');
        if (!container) return;

        const tasks = dataHandler.tasks.filter(task => task['ステータス'] !== '完了');
        
        tasks.sort((a, b) => {
            const dateA = a['期日'] ? new Date(a['期日']) : null;
            const dateB = b['期日'] ? new Date(b['期日']) : null;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1; // Tasks without due dates at the end
            if (!dateB) return -1;
            return dateA - dateB;
        });

        if (tasks.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">今後のタスクはありません</p>';
            return;
        }

        let html = '<ul class="divide-y divide-gray-200">';
        tasks.slice(0, 10).forEach(task => { // Display top 10
            const dueDate = task['期日'] ? new Date(task['期日']).toLocaleDateString() : '未定';
            html += `
                <li class="py-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-900">${task['題名']}</span>
                        <span class="text-sm text-gray-500">期日: ${dueDate}</span>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        container.innerHTML = html;
    }

    // Time Summary Rendering
    renderTimeSummary() {
        const container = document.getElementById('time-summary-container');
        if (!container) return;

        const timelogs = dataHandler.timelog;
        if (!timelogs || timelogs.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">作業記録がありません</p>';
            return;
        }

        let totalHours = 0;
        let weeklyHours = 0;
        const taskHours = {};

        const { weekStart, weekEnd } = this.getCurrentWeekRange();

        timelogs.forEach(log => {
            const hours = parseFloat(log['時間']) || 0;
            totalHours += hours;

            const logDate = new Date(log['日付']);
            if (logDate >= weekStart && logDate <= weekEnd) {
                weeklyHours += hours;
            }
            
            const ticket = log['チケット'] || '未割り当てタスク';
            taskHours[ticket] = (taskHours[ticket] || 0) + hours;
        });

        const sortedTaskHours = Object.entries(taskHours)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5); // Top 5 tasks

        let html = `<div class="space-y-3">
            <p class="text-md text-gray-700">総作業時間: <span class="font-semibold">${totalHours.toFixed(2)} 時間</span></p>
            <p class="text-md text-gray-700">今週の作業時間: <span class="font-semibold">${weeklyHours.toFixed(2)} 時間</span></p>
            <h4 class="text-md font-semibold mt-3">タスク別作業時間 (トップ5):</h4>
            <ul class="list-disc pl-5 space-y-1">`;

        if (sortedTaskHours.length > 0) {
            sortedTaskHours.forEach(([task, hours]) => {
                html += `<li class="text-sm text-gray-600">${task}: ${hours.toFixed(2)} 時間</li>`;
            });
        } else {
            html += `<li class="text-sm text-gray-600">タスク別の記録はありません</li>`;
        }
        html += `</ul></div>`;
        container.innerHTML = html;
    }

    // Helper for week range
    getCurrentWeekRange() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Sunday) - 6 (Saturday)
        const numDay = now.getDate();

        // Assuming week starts on Sunday
        const weekStart = new Date(now);
        weekStart.setDate(numDay - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        return { weekStart, weekEnd };
    }

    // タスクのフィルタリング
    filterTasks(status, priority) {
        const filteredTasks = dataHandler.filterTasks(status, priority);
        this.renderTasks(filteredTasks); // Render with current sort and visibility
    }

    // --- Helper functions for styling ---
    getStatusClass(status) {
        switch (status) {
            case '未着手': return 'bg-gray-200 text-gray-800';
            case '進行中': return 'bg-blue-200 text-blue-800';
            case '完了': return 'bg-green-200 text-green-800';
            case '保留': return 'bg-yellow-200 text-yellow-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    getPriorityClass(priority) {
        switch (priority) {
            case '高': return 'bg-red-200 text-red-800';
            case '中': return 'bg-yellow-300 text-yellow-900'; // Adjusted for better contrast
            case '低': return 'bg-green-300 text-green-900'; // Adjusted for better contrast
            default: return 'bg-gray-100 text-gray-700';
        }
    }
    
    // --- Sorting Logic ---
    sortTasks(tasks) {
        const key = this.currentSortKey;
        const direction = this.sortDirection === 'asc' ? 1 : -1;
        const priorityOrder = { '高': 3, '中': 2, '低': 1 };

        return [...tasks].sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (key === '#') { // Numeric ID
                valA = parseInt(valA, 10) || 0;
                valB = parseInt(valB, 10) || 0;
            } else if (key === '進捗率' || key === '予定工数') { // Numeric Progress or Estimated Hours
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            } else if (key === '期日' || key === '開始日' || key === '作成日' || key === '更新日') { // Date
                valA = valA ? new Date(valA) : null;
                valB = valB ? new Date(valB) : null;
                if (!valA && !valB) return 0;
                if (!valA) return 1 * direction; // Nulls last for asc, first for desc
                if (!valB) return -1 * direction;
            } else if (key === '優先度') { // Custom sort for priority
                valA = priorityOrder[valA] || 0;
                valB = priorityOrder[valB] || 0;
            } else { // String comparison (default)
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return -1 * direction;
            if (valA > valB) return 1 * direction;
            return 0;
        });
    }
    
    // --- Task Rendering with Visibility and Styling ---
    renderTasks(tasksToRender) {
        const sortedTasks = this.sortTasks(tasksToRender); // Apply sorting
        const visibleColumns = dataHandler.userSettings.visibleColumns || dataHandler.defaultVisibleColumns;
        
        const tableHead = document.querySelector('#tasks-section table thead tr');
        const tbody = document.getElementById('tasks-table-body');

        if (!tableHead || !tbody) {
            console.error("Task table head or body not found!");
            return;
        }

        // Update header visibility and sort indicators
        tableHead.innerHTML = ''; // Clear existing headers
        dataHandler.allTaskColumns.forEach(col => {
            if (visibleColumns.includes(col.key)) {
                let sortIndicator = '';
                if (col.key === this.currentSortKey) {
                    sortIndicator = this.sortDirection === 'asc' ? ' &uarr;' : ' &darr;';
                }
                const th = document.createElement('th');
                th.className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer";
                th.dataset.columnKey = col.key;
                th.dataset.sortKey = col.key; // Ensure sortKey is present
                th.innerHTML = col.label + sortIndicator;
                if(col.key !== '操作') { // '操作' column is not sortable
                    th.addEventListener('click', () => this.handleSort(col.key));
                }
                tableHead.appendChild(th);
            }
        });


        tbody.innerHTML = sortedTasks.map(task => {
            let rowHtml = '<tr>';
            dataHandler.allTaskColumns.forEach(col => {
                if (visibleColumns.includes(col.key)) {
                    let cellContent = task[col.key] !== undefined && task[col.key] !== null ? task[col.key] : '';
                    
                    if (col.key === 'ステータス') {
                        cellContent = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusClass(task[col.key])}">${task[col.key]}</span>`;
                    } else if (col.key === '優先度') {
                        cellContent = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getPriorityClass(task[col.key])}">${task[col.key]}</span>`;
                    } else if (col.key === '進捗率') {
                        const progress = parseInt(task[col.key], 10) || 0;
                        cellContent = `
                            <div class="flex items-center">
                                <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
                                </div>
                                <span class="text-xs">${progress}%</span>
                            </div>`;
                    } else if (col.key === '期日' || col.key === '開始日' || col.key === '作成日' || col.key === '更新日') {
                        cellContent = task[col.key] ? new Date(task[col.key]).toLocaleDateString() : '';
                    } else if (col.key === '操作') {
                        cellContent = `
                            <button class="edit-task-button bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs" data-id="${task['#']}">編集</button>
                            <button class="delete-task-button bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded ml-1 text-xs" data-id="${task['#']}">削除</button>
                        `;
                    }
                    rowHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${cellContent}</td>`;
                }
            });
            rowHtml += '</tr>';
            return rowHtml;
        }).join('');
        this.applyColumnVisibility(); // Ensure styles are applied after rendering
    }

    handleSort(sortKey) {
        if (this.currentSortKey === sortKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortKey = sortKey;
            this.sortDirection = 'asc';
        }
        // Re-render tasks with current filter or all tasks if no filter applied
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        if (statusFilter || priorityFilter) {
            this.filterTasks(statusFilter, priorityFilter);
        } else {
            this.renderTasks(dataHandler.tasks);
        }
    }

    // --- Column Visibility ---
    initializeColumnVisibilitySettings() {
        const container = document.getElementById('column-visibility-settings');
        if (!container) return;

        const visibleColumns = dataHandler.userSettings.visibleColumns || dataHandler.defaultVisibleColumns;
        container.innerHTML = ''; // Clear previous checkboxes

        dataHandler.allTaskColumns.forEach(col => {
            if (col.key === '操作') return; // '操作' column is not toggleable

            constisChecked = visibleColumns.includes(col.key);
            const label = document.createElement('label');
            label.className = 'inline-flex items-center';
            label.innerHTML = `
                <input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600 column-toggle" data-column-key="${col.key}" ${isChecked ? 'checked' : ''}>
                <span class="ml-2 text-sm text-gray-700">${col.label}</span>
            `;
            container.appendChild(label);
        });
    }

    saveColumnVisibilitySettings() {
        const checkboxes = document.querySelectorAll('#column-visibility-settings .column-toggle');
        const visibleColumns = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                visibleColumns.push(checkbox.dataset.columnKey);
            }
        });
        if (!visibleColumns.includes('#')) { // Ensure ID is always visible as it's key for editing/deleting
            visibleColumns.unshift('#');
        }
        if (!visibleColumns.includes('操作')) { // Ensure Actions column is always visible
            visibleColumns.push('操作');
        }
        
        dataHandler.userSettings.visibleColumns = [...new Set(visibleColumns)]; // Ensure uniqueness
        dataHandler.saveUserSettings();
        this.showSuccessMessage('表示設定を保存しました。');
        this.applyColumnVisibility(); // Apply changes to table headers
        this.renderTasks(dataHandler.tasks); // Re-render tasks with new column visibility
    }

    applyColumnVisibility() {
        const visibleColumns = dataHandler.userSettings.visibleColumns || dataHandler.defaultVisibleColumns;
        const table = document.querySelector('#tasks-section table');
        if (!table) return;

        // Show/hide headers
        // renderTasks dynamically creates headers, so this ensures any static ones or
        // ones from a previous render state are correctly hidden if no longer visible.
        const headers = table.querySelectorAll('thead th');
        headers.forEach(th => {
            const columnKey = th.dataset.columnKey;
            if (columnKey && visibleColumns.includes(columnKey)) {
                th.style.display = ''; // Or 'table-cell'
            } else if (columnKey) {
                th.style.display = 'none';
            }
        });
        // Note: renderTasks is now responsible for creating only the visible <td> elements.
        // If <td> elements were created for all columns and then hidden, a similar loop
        // for tbody tr td would be needed here. But the current renderTasks implementation
        // only creates TDs for visible columns, making this part for tbody largely unnecessary.
    }


    // タスクモーダルの表示
    openTaskModal(taskId = null) {
        const modal = document.getElementById('task-modal');
        const title = taskId ? 'タスク編集' : '新規タスク';
        // modal.querySelector('h2').textContent = title; // Old way
        document.getElementById('task-modal-title').textContent = title; // New way
        
        document.getElementById('task-form').reset();
        
        if (taskId) {
            const task = dataHandler.tasks.find(t => t['#'] == taskId); // Use == for potential type coercion if IDs mix types
            if (task) {
                document.getElementById('task-title').value = task['題名'] || '';
                document.getElementById('task-status').value = task['ステータス'] || '未着手';
                document.getElementById('task-priority').value = task['優先度'] || '中';
                document.getElementById('task-due-date').value = task['期日'] ? new Date(task['期日']).toISOString().split('T')[0] : '';
                document.getElementById('task-progress').value = task['進捗率'] || 0;
                document.getElementById('task-project').value = task['プロジェクト'] || '';
                document.getElementById('task-tracker').value = task['トラッカー'] || '';
                document.getElementById('task-assignee').value = task['担当者'] || '';
                document.getElementById('task-creator').value = task['作成者'] || '';
                document.getElementById('task-start-date').value = task['開始日'] ? new Date(task['開始日']).toISOString().split('T')[0] : '';
                document.getElementById('task-estimated-hours').value = task['予定工数'] || '';
            }
        }
        
        const saveButton = document.getElementById('save-task-button');
        const newSaveButton = saveButton.cloneNode(true); // Clone to remove old listeners
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
        
        newSaveButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission if it's a submit button in a form
            this.saveTask(taskId);
        });
        
        modal.classList.remove('hidden');
    }

    // タスクの保存
    saveTask(taskId = null) {
        const task = {
            '題名': document.getElementById('task-title').value,
            'ステータス': document.getElementById('task-status').value,
            '優先度': document.getElementById('task-priority').value,
            '期日': document.getElementById('task-due-date').value,
            '進捗率': document.getElementById('task-progress').value,
            'プロジェクト': document.getElementById('task-project').value,
            'トラッカー': document.getElementById('task-tracker').value,
            '担当者': document.getElementById('task-assignee').value,
            '作成者': document.getElementById('task-creator').value,
            '開始日': document.getElementById('task-start-date').value,
            '予定工数': document.getElementById('task-estimated-hours').value
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
        this.renderReportData(); // Update reports
    }

    // タスクの削除
    deleteTask(taskId) {
        if (confirm('このタスクを削除しますか？')) {
            dataHandler.deleteTask(taskId);
            this.showSuccessMessage('タスクを削除しました');
            this.renderTasks(dataHandler.tasks);
            this.renderReportData(); // Update reports
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

        const logDetails = {
            taskId: taskId,
            hours: parseFloat(hours),
            comment: comment
        };

        const success = dataHandler.addTimeLog(logDetails);

        if (success) {
            this.showSuccessMessage('作業時間を記録しました');
            this.renderTimeLogs(dataHandler.timelog);
            this.renderTasks(dataHandler.tasks); // Re-render tasks as parent task is updated
            this.renderReportData(); // Update reports
            // Clear form fields
            document.getElementById('log-task-id').value = '';
            document.getElementById('log-hours').value = '';
            document.getElementById('log-comment').value = '';
        } else {
            this.showErrorMessage('作業時間の記録に失敗しました。タスクIDが見つからないか、データの保存に問題があります。');
        }
    }

    // 時間記録の表示
    renderTimeLogs(logs) {
        const tbody = document.getElementById('log-table-body');
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${log['日付'] ? new Date(log['日付']).toLocaleDateString() : 'N/A'}</td>
                <td>${log['チケット'] || 'N/A'}</td>
                <td>${log['時間'] !== undefined ? log['時間'] : 'N/A'}時間</td>
                <td>${log['コメント'] || ''}</td>
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
        this.renderReportData(); // Update reports after any CSV upload
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
            options.status = document.getElementById('filter-status').value || null;
            options.priority = document.getElementById('filter-priority').value || null;
        } else if (type === 'sort') {
            options.sortField = document.getElementById('sort-field').value;
            if (!options.sortField) {
                this.showErrorMessage('ソートするフィールドを選択してください。');
                return; // Stop script generation
            }
        }
        // No specific options for 'report' type currently needed from UI beyond the type itself.

        const script = dataHandler.generatePowerShellScript(type, options);
        
        if (!script) { 
            this.showErrorMessage('スクリプトの生成に失敗しました。入力オプションを確認してください。');
            return;
        }
        // スクリプトモーダルを表示
        const scriptModal = document.getElementById('script-modal');
        scriptModal.querySelector('#script-content').value = script;
        scriptModal.classList.remove('hidden');

        const downloadScriptButton = document.getElementById('download-script-button');
        const newDownloadScriptButton = downloadScriptButton.cloneNode(true);
        downloadScriptButton.parentNode.replaceChild(newDownloadScriptButton, downloadScriptButton);

        newDownloadScriptButton.addEventListener('click', () => {
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
        if (modal) { // Check if modal exists
            modal.classList.add('hidden');
        }
    }

    // エラーメッセージの表示
    showErrorMessage(message) {
        const modal = document.getElementById('error-modal');
        modal.querySelector('#error-message').textContent = message;
        modal.classList.remove('hidden');

        // The main close button listener is already set in initializeEventListeners
        // Specific button for this modal:
        const closeButton = document.getElementById('close-error-button');
        const newCloseButton = closeButton.cloneNode(true);
        closeButton.parentNode.replaceChild(newCloseButton, closeButton);
        newCloseButton.addEventListener('click', () => this.closeModal('error-modal'));
    }

    // 成功メッセージの表示
    showSuccessMessage(message) {
        const modal = document.getElementById('success-modal');
        modal.querySelector('#success-message').textContent = message;
        modal.classList.remove('hidden');
        
        // The main close button listener is already set in initializeEventListeners
        // Specific button for this modal:
        const closeButton = document.getElementById('close-success-button');
        const newCloseButton = closeButton.cloneNode(true);
        closeButton.parentNode.replaceChild(newCloseButton, closeButton);
        newCloseButton.addEventListener('click', () => this.closeModal('success-modal'));
    }
}

// UIハンドラーの初期化
const uiHandler = new UIHandler();
