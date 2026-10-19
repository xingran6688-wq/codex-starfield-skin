param([ValidateRange(1024,65535)][int]$Port = 9341)
$ErrorActionPreference = 'Stop'
$package = Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1
if (!$package) { throw 'CODEX_PACKAGE_MISSING: Microsoft Store OpenAI.Codex not found.' }
$expected = [IO.Path]::GetFullPath((Join-Path $package.InstallLocation 'app\ChatGPT.exe'))
if (!(Test-Path -LiteralPath $expected)) { throw 'CODEX_EXECUTABLE_MISSING: registered executable missing.' }
$listeners = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
if (!$listeners.Count) { throw "CDP_NOT_LISTENING: port $Port is closed. Close Codex and use launch-codex.ps1 before retrying." }
if (@($listeners | Where-Object LocalAddress -NotIn @('127.0.0.1','::1')).Count) { throw 'CDP_NOT_LOOPBACK: refusing a network-exposed endpoint.' }
$owners = @($listeners.OwningProcess | Select-Object -Unique)
if ($owners.Count -ne 1) { throw 'CDP_OWNER_AMBIGUOUS: more than one process owns this port.' }
$ownerProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($owners[0])"
if (!$ownerProcess.ExecutablePath -or ![string]::Equals([IO.Path]::GetFullPath($ownerProcess.ExecutablePath), $expected, [StringComparison]::OrdinalIgnoreCase)) { throw 'CDP_WRONG_PROCESS: port owner is not the registered Codex executable.' }
@{ verified = $true; pid = $owners[0]; version = $package.Version.ToString(); port = $Port } | ConvertTo-Json -Compress
