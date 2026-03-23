# Analytics Server Persistent Service
# Automatically restarts the server if it crashes.
# Run: powershell -ExecutionPolicy Bypass -File start-service.ps1

$serverPath = Join-Path $PSScriptRoot "server.js"
$logFile = Join-Path $PSScriptRoot "service.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts  $msg" | Tee-Object -FilePath $logFile -Append
}

Write-Log "Analytics service starting..."

while ($true) {
    Write-Log "Launching server..."
    $proc = Start-Process -FilePath "node" -ArgumentList "`"$serverPath`"" -NoNewWindow -PassThru -RedirectStandardError (Join-Path $PSScriptRoot "error.log")
    $proc.WaitForExit()
    $code = $proc.ExitCode
    Write-Log "Server exited with code $code. Restarting in 3 seconds..."
    Start-Sleep -Seconds 3
}
