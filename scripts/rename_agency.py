import os

dir_path = r"C:\Users\Diego Reis\Documents\DEV\ManagerShow"
exclude_dirs = {".venv", "node_modules", ".next", ".git", "__pycache__"}
extensions = {".py", ".tsx", ".ts", ".md"}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return
        
    new_content = content.replace("produtoras", "produtoras")
    new_content = new_content.replace("Produtoras", "Produtoras")
    new_content = new_content.replace("produtora", "produtora")
    new_content = new_content.replace("Produtora", "Produtora")
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

for root, dirs, files in os.walk(dir_path):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if any(file.endswith(ext) for ext in extensions):
            replace_in_file(os.path.join(root, file))
