param([string]$OutputName = 'codex-starfield-skin-0.1.0.zip')
$ErrorActionPreference = 'Stop'
if ([IO.Path]::GetFileName($OutputName) -ne $OutputName -or !$OutputName.EndsWith('.zip')) { throw 'OutputName must be a ZIP filename without directories.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$archivePath = Join-Path $outputDir $OutputName
if (Test-Path -LiteralPath $archivePath) { throw 'Release ZIP already exists; choose a new version rather than overwrite it.' }
$items = @('SKILL.md','README.md','LICENSE','ASSETS-LICENSE.md','package.json','Apply.cmd','Restore.cmd','Preview.cmd','agents','assets','scripts','tests') | ForEach-Object { Join-Path $projectRoot $_ }
Compress-Archive -LiteralPath $items -DestinationPath $archivePath
$hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText((Join-Path $outputDir 'SHA256SUMS.txt'), "$hash  $OutputName`n", [Text.UTF8Encoding]::new($false))
Write-Output $archivePath
