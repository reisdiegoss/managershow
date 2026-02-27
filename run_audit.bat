@echo off
set PYTHONIOENCODING=utf-8
call .venv\Scripts\activate
python .agent\scripts\checklist.py . > checklist_audit.txt 2>&1
python .agent\skills\lint-and-validate\scripts\lint_runner.py . > lint_output.txt 2>&1
echo DONE
