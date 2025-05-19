# -*- coding: utf-8 -*-
import pandas as pd
import os
import datetime

class DataManager:
    def __init__(self, issues_file='issues.csv', timelog_file='timelog.csv', base_dir='/home/ubuntu/upload'):
        self.issues_path = os.path.join(base_dir, issues_file)
        self.timelog_path = os.path.join(base_dir, timelog_file)
        self.issues_df = None
        self.timelog_df = None
        self.load_data()

    def load_data(self):
        """Load data from CSV files into pandas DataFrames."""
        try:
            self.issues_df = pd.read_csv(self.issues_path, encoding='utf-8')
            # Ensure correct data types, handle potential errors during conversion
            self.issues_df['#'] = pd.to_numeric(self.issues_df['#'], errors='coerce').astype('Int64') # Use Int64 for nullable integers
            self.issues_df['予定工数'] = pd.to_numeric(self.issues_df['予定工数'], errors='coerce')
            self.issues_df['残工数'] = pd.to_numeric(self.issues_df['残工数'], errors='coerce')
            self.issues_df['合計予定工数'] = pd.to_numeric(self.issues_df['合計予定工数'], errors='coerce')
            self.issues_df['作業時間'] = pd.to_numeric(self.issues_df['作業時間'], errors='coerce')
            self.issues_df['合計作業時間'] = pd.to_numeric(self.issues_df['合計作業時間'], errors='coerce')
            self.issues_df['進捗率'] = pd.to_numeric(self.issues_df['進捗率'], errors='coerce').astype('Int64')
            self.issues_df['開始日'] = pd.to_datetime(self.issues_df['開始日'], errors='coerce')
            self.issues_df['期日'] = pd.to_datetime(self.issues_df['期日'], errors='coerce')
            self.issues_df['作成日'] = pd.to_datetime(self.issues_df['作成日'], errors='coerce')
            self.issues_df['更新日'] = pd.to_datetime(self.issues_df['更新日'], errors='coerce')
            # Fill NaN in numeric columns that should default to 0
            num_cols_default_zero = ['予定工数', '残工数', '合計予定工数', '作業時間', '合計作業時間', '進捗率']
            for col in num_cols_default_zero:
                 if col in self.issues_df.columns:
                    self.issues_df[col] = self.issues_df[col].fillna(0)

        except FileNotFoundError:
            print(f"Error: Issues file not found at {self.issues_path}")
            # Initialize empty DataFrame if file not found
            self.issues_df = pd.DataFrame(columns=['#', 'プロジェクト', 'トラッカー', '親チケット', '親チケットの題名', 'ステータス', '優先度', '題名', '作成者', '担当者', 'ウォッチャー', '更新日', 'カテゴリ', '対象バージョン', '開始日', '期日', '予定工数', '残工数', '合計予定工数', '作業時間', '合計作業時間', '進捗率', '作成日', '終了日', '最終更新者', '関連するチケット', 'ファイル', 'プライベート'])
        except Exception as e:
            print(f"Error loading issues data: {e}")
            self.issues_df = pd.DataFrame() # Or handle error as appropriate

        try:
            self.timelog_df = pd.read_csv(self.timelog_path, encoding='utf-8')
            # Ensure correct data types
            self.timelog_df['時間'] = pd.to_numeric(self.timelog_df['時間'], errors='coerce')
            self.timelog_df['日付'] = pd.to_datetime(self.timelog_df['日付'], errors='coerce')
            self.timelog_df['作成日'] = pd.to_datetime(self.timelog_df['作成日'], errors='coerce')
            # Fill NaN in numeric columns that should default to 0
            if '時間' in self.timelog_df.columns:
                self.timelog_df['時間'] = self.timelog_df['時間'].fillna(0)

        except FileNotFoundError:
            print(f"Error: Timelog file not found at {self.timelog_path}")
            # Initialize empty DataFrame if file not found
            self.timelog_df = pd.DataFrame(columns=['プロジェクト', '日付', '作成日', '週', '作成者', 'ユーザー', '作業分類', 'チケット', 'トラッカー', '親チケット', 'ステータス', 'カテゴリ', '対象バージョン', 'コメント', '時間'])
        except Exception as e:
            print(f"Error loading timelog data: {e}")
            self.timelog_df = pd.DataFrame() # Or handle error as appropriate

    def save_data(self):
        """Save the current DataFrames back to CSV files."""
        try:
            if self.issues_df is not None:
                # Format dates back to string if needed, matching original format if possible
                issues_to_save = self.issues_df.copy()
                date_cols = ['開始日', '期日', '作成日', '更新日']
                for col in date_cols:
                    if col in issues_to_save.columns:
                         issues_to_save[col] = issues_to_save[col].dt.strftime('%Y/%m/%d').replace('NaT', '') # Handle NaT
                # Convert Int64 back to float/int for saving if necessary, handling NaN
                issues_to_save['#'] = issues_to_save['#'].astype(float).astype(pd.Int64Dtype()) # Keep nullable int
                issues_to_save['進捗率'] = issues_to_save['進捗率'].astype(float).astype(pd.Int64Dtype())

                issues_to_save.to_csv(self.issues_path, index=False, encoding='utf-8')
            if self.timelog_df is not None:
                timelog_to_save = self.timelog_df.copy()
                date_cols_log = ['日付', '作成日']
                for col in date_cols_log:
                    if col in timelog_to_save.columns:
                        timelog_to_save[col] = timelog_to_save[col].dt.strftime('%Y/%m/%d %H:%M').replace('NaT', '') # Match format
                        if col == '日付': # Keep only date part for '日付'
                             timelog_to_save[col] = timelog_to_save[col].str.split(' ').str[0]

                timelog_to_save.to_csv(self.timelog_path, index=False, encoding='utf-8')
        except Exception as e:
            print(f"Error saving data: {e}")

    def get_tasks(self, status=None, priority=None, sort_by=None):
        """Get tasks, optionally filtered by status and priority, and sorted."""
        if self.issues_df is None:
            return pd.DataFrame()
        
        df = self.issues_df.copy()
        if status:
            df = df[df['ステータス'].str.upper() == status.upper()]
        if priority:
            df = df[df['優先度'].str.upper() == priority.upper()]

        if sort_by:
            ascending = True
            if sort_by == '期日':
                df = df.sort_values(by='期日', ascending=True, na_position='last')
            elif sort_by == '優先度':
                # Define custom order for priority
                priority_order = {'高': 0, '中': 1, '低': 2}
                df['priority_sort'] = df['優先度'].map(priority_order)
                df = df.sort_values(by='priority_sort', ascending=True, na_position='last').drop(columns=['priority_sort'])
            # Add more sorting options if needed

        return df

    def get_task_by_id(self, task_id):
        """Get a single task by its ID."""
        if self.issues_df is None:
            return None
        task = self.issues_df[self.issues_df['#'] == task_id]
        if task.empty:
            return None
        return task.iloc[0].to_dict() # Return as dictionary

    def add_log_entry(self, task_id, hours, comment='', user='CLI User'):
        """Add a new entry to the timelog and update the corresponding issue."""
        if self.timelog_df is None or self.issues_df is None:
            print("Error: DataFrames not loaded.")
            return False

        task_info = self.get_task_by_id(task_id)
        if not task_info:
            print(f"Error: Task with ID {task_id} not found.")
            return False

        now = datetime.datetime.now()
        new_log = {
            'プロジェクト': task_info.get('プロジェクト', 'Unknown'),
            '日付': now.strftime('%Y/%m/%d'),
            '作成日': now.strftime('%Y/%m/%d %H:%M'),
            '週': now.isocalendar()[1],
            '作成者': user,
            'ユーザー': user,
            '作業分類': 'タスク', # Assuming default
            'チケット': f"TASK #{task_id}",
            'トラッカー': task_info.get('トラッカー', 'TASK'),
            '親チケット': task_info.get('親チケット', ''),
            'ステータス': task_info.get('ステータス', ''), # Log entry status might differ from issue status
            'カテゴリ': task_info.get('カテゴリ', ''),
            '対象バージョン': task_info.get('対象バージョン', ''),
            'コメント': comment,
            '時間': hours
        }
        
        # Append to DataFrame
        new_log_df = pd.DataFrame([new_log])
        self.timelog_df = pd.concat([self.timelog_df, new_log_df], ignore_index=True)

        # Update issue DataFrame
        task_index = self.issues_df[self.issues_df['#'] == task_id].index
        if not task_index.empty:
            idx = task_index[0]
            # Update '作業時間' and '合計作業時間'
            current_hours = self.issues_df.loc[idx, '作業時間']
            total_hours = self.issues_df.loc[idx, '合計作業時間']
            self.issues_df.loc[idx, '作業時間'] = (current_hours if pd.notna(current_hours) else 0) + hours
            self.issues_df.loc[idx, '合計作業時間'] = (total_hours if pd.notna(total_hours) else 0) + hours
            
            # Update '進捗率'
            total_planned_hours = self.issues_df.loc[idx, '合計予定工数']
            if pd.notna(total_planned_hours) and total_planned_hours > 0:
                new_progress = round(((self.issues_df.loc[idx, '合計作業時間']) / total_planned_hours) * 100)
                self.issues_df.loc[idx, '進捗率'] = min(new_progress, 100) # Cap at 100%
            else:
                 # If no planned hours, maybe set progress based on status or leave as is?
                 # For now, leave as is or set to 0 if status is not '完了'
                 if self.issues_df.loc[idx, 'ステータス'] != '完了': # Assuming '完了' means done
                     self.issues_df.loc[idx, '進捗率'] = self.issues_df.loc[idx, '進捗率'] # Keep existing or 0
                 else:
                     self.issues_df.loc[idx, '進捗率'] = 100

            # Update '更新日'
            self.issues_df.loc[idx, '更新日'] = pd.Timestamp.now()

            # Save changes immediately after logging
            self.save_data()
            return True
        else:
            # This case should not happen due to the check above, but handle defensively
            print(f"Error: Could not find index for Task ID {task_id} after verification.")
            return False

    def update_task_status(self, task_id, new_status):
        """Update the status of a task."""
        if self.issues_df is None:
            print("Error: Issues DataFrame not loaded.")
            return False
        
        task_index = self.issues_df[self.issues_df['#'] == task_id].index
        if not task_index.empty:
            idx = task_index[0]
            self.issues_df.loc[idx, 'ステータス'] = new_status
            self.issues_df.loc[idx, '更新日'] = pd.Timestamp.now()
            # If status is set to '完了', update progress to 100%
            if new_status == '完了': # Assuming '完了' is the completed status
                self.issues_df.loc[idx, '進捗率'] = 100
                # Optionally set end date
                if '終了日' in self.issues_df.columns:
                     self.issues_df.loc[idx, '終了日'] = pd.Timestamp.now().strftime('%Y/%m/%d')
            
            self.save_data()
            return True
        else:
            print(f"Error: Task with ID {task_id} not found.")
            return False

# Example usage (for testing)
if __name__ == '__main__':
    # Assume CSVs are in '/home/ubuntu/upload/'
    data_manager = DataManager(base_dir='/home/ubuntu/upload')
    print("Loaded Issues:")
    print(data_manager.issues_df.head())
    print("\nLoaded Timelog:")
    print(data_manager.timelog_df.head())

    # Test getting tasks
    print("\nTODO Tasks:")
    todo_tasks = data_manager.get_tasks(status='TODO', sort_by='期日')
    print(todo_tasks[['#', '題名', 'ステータス', '期日']].head())

    # Test getting a specific task
    task_165 = data_manager.get_task_by_id(165)
    print("\nTask 165:")
    print(task_165)

    # Test adding a log entry (use a real task ID from your data)
    # print("\nAdding log entry...")
    # success = data_manager.add_log_entry(task_id=165, hours=1.5, comment='Implemented data manager')
    # if success:
    #     print("Log entry added successfully.")
    #     print("Updated Task 165:")
    #     print(data_manager.get_task_by_id(165))
    #     print("Updated Timelog Tail:")
    #     print(data_manager.timelog_df.tail())
    # else:
    #     print("Failed to add log entry.")

    # Test updating status
    # print("\nUpdating task status...")
    # success_status = data_manager.update_task_status(task_id=163, new_status='進行中') # Use a real task ID
    # if success_status:
    #     print("Status updated successfully.")
    #     print(data_manager.get_task_by_id(163))
    # else:
    #     print("Failed to update status.")

