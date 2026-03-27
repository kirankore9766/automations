import datetime

class TodoList:
    def __init__(self):
        self.tasks = []
        self.load_tasks() # Load existing tasks on startup

    def add_task(self, task_description, due_date_str=None):
        try:
            due_date = None
            if due_date_str:
                due_date = datetime.datetime.strptime(due_date_str, '%Y-%m-%d').date()
            self.tasks.append({"task": task_description, "due": due_date, "done": False, "added": datetime.date.today()})
            self.save_tasks()
            print(f"Task '{task_description}' added.")
        except ValueError:
            print("Invalid date format. Use YYYY-MM-DD.")

    def complete_task(self, task_index):
        if 0 <= task_index < len(self.tasks):
            self.tasks[task_index]["done"] = True
            self.save_tasks()
            print(f"Task {task_index + 1} marked as done.")
        else:
            print("Invalid task index.")

    def delete_task(self, task_index):
        if 0 <= task_index < len(self.tasks):
            removed_task = self.tasks.pop(task_index)
            self.save_tasks()
            print(f"Task '{removed_task['task']}' deleted.")
        else:
            print("Invalid task index.")

    def view_tasks(self, filter_status=None):
        print("\n--- Your To-Do List ---")
        if not self.tasks:
            print("No tasks yet!")
            return

        for i, task in enumerate(self.tasks):
            status = "✓" if task["done"] else " "
            due_info = f" (Due: {task['due']})" if task['due'] else ""
            if filter_status is None or (filter_status == "done" and task["done"]) or (filter_status == "pending" and not task["done"]):
                print(f"{i + 1}. [{status}] {task['task']}{due_info}")
        print("-----------------------\n")

    def save_tasks(self, filename="todo.txt"):
        with open(filename, 'w') as f:
            for task in self.tasks:
                due_str = task['due'].strftime('%Y-%m-%d') if task['due'] else "None"
                f.write(f"{task['task']}|{due_str}|{task['done']}\n")

    def load_tasks(self, filename="todo.txt"):
        try:
            with open(filename, 'r') as f:
                for line in f:
                    parts = line.strip().split('|')
                    if len(parts) == 3:
                        task_desc = parts[0]
                        due_str = parts[1]
                        done = parts[2] == 'True'
                        due_date = datetime.datetime.strptime(due_str, '%Y-%m-%d').date() if due_str != 'None' else None
                        self.tasks.append({"task": task_desc, "due": due_date, "done": done})
        except FileNotFoundError:
            pass # No file, start with empty list

def main():
    todo_app = TodoList()
    while True:
        print("\nOptions: add, view, done, delete, pending, exit")
        choice = input("Enter your choice: ").strip().lower()

        if choice == 'add':
            task = input("Enter task description: ")
            due = input("Enter due date (YYYY-MM-DD, optional): ")
