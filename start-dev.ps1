$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; uv run uvicorn apps.api.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; uv run python apps/worker/main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; uv run python apps/ingest/main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\web'; npm run dev"
