Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host 'Starting Farm To Home AI assistant backend on http://127.0.0.1:8000'
Write-Host 'Make sure the Python dependencies from requirements.txt are installed.'

python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
