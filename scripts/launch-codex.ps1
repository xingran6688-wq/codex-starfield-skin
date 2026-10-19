param([ValidateRange(1024,65535)][int]$Port = 9341)
$ErrorActionPreference = 'Stop'
$package = Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1
if (!$package) { throw 'Microsoft Store OpenAI.Codex package not found.' }
$executable = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
if (!(Test-Path -LiteralPath $executable)) { throw 'Registered Codex executable missing.' }
$running = @(Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" | Where-Object { $_.ExecutablePath -eq $executable })
if ($running.Count) { throw 'CODEX_ALREADY_RUNNING: Close Codex yourself after saving work, then run this launcher. No processes were stopped.' }
if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { throw 'PORT_IN_USE: choose another port with -Port.' }
Start-Process -FilePath $executable -ArgumentList @('--remote-debugging-address=127.0.0.1', "--remote-debugging-port=$Port") -WindowStyle Hidden
Write-Output "Codex launched with loopback CDP on port $Port. Run doctor before apply."
