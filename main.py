# -*- coding: utf-8 -*-
import typer
from rich.console import Console

from data_manager import DataManager
from commands import list_cmd, log_cmd, report_cmd, plan_cmd # Assuming commands are structured as suggested

app = typer.Typer()
console = Console()
data_manager = DataManager(base_dir="/home/ubuntu/personal_ai_cli/") # Use the project directory for CSVs

# Register command modules
app.add_typer(list_cmd.app, name="list", help="タスクを一覧表示します")
app.add_typer(log_cmd.app, name="log", help="作業時間を記録します")
app.add_typer(report_cmd.app, name="report", help="進捗レポートを表示します")
app.add_typer(plan_cmd.app, name="plan", help="計画を提案します")

# Add a command to update status directly in main for now, or create status_cmd.py later
@app.command(name="status", help="タスクのステータスを更新します")
def update_status(
    task_id: int = typer.Argument(..., help="ステータスを更新するタスクのID"),
    new_status: str = typer.Argument(..., help="新しいステータス (例: 進行中, 完了)")
):
    """指定されたタスクIDのステータスを更新します。"""
    success = data_manager.update_task_status(task_id, new_status)
    if success:
        console.print(f"[bold green]タスク {task_id} のステータスを「{new_status}」に更新しました。[/bold green]")
        # Optionally show the updated task details
        updated_task = data_manager.get_task_by_id(task_id)
        if updated_task:
             # Use rich table or simple print for confirmation
             # Corrected f-strings below
             console.print(f"  題名: {updated_task.get('題名', 'N/A')}")
             console.print(f"  新ステータス: {updated_task.get('ステータス', 'N/A')}")
             # Format datetime object if it exists
             updated_at = updated_task.get('更新日')
             updated_at_str = updated_at.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(updated_at) else 'N/A'
             console.print(f"  更新日: {updated_at_str}")
             if new_status == '完了' and '終了日' in updated_task:
                 end_date = updated_task.get('終了日')
                 end_date_str = end_date if isinstance(end_date, str) else (end_date.strftime('%Y-%m-%d') if pd.notna(end_date) else 'N/A')
                 console.print(f"  終了日: {end_date_str}")
    else:
        console.print(f"[bold red]エラー: タスク {task_id} のステータス更新に失敗しました。IDを確認してください。[/bold red]")

if __name__ == "__main__":
    app()

