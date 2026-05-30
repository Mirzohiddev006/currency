$ErrorActionPreference = 'Stop'

$root = 'C:\Users\Mirzohid\Downloads\currency-tracker'
$pgCtl = 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe'
$createdb = 'C:\Program Files\PostgreSQL\17\bin\createdb.exe'
$cluster = Join-Path $root '.postgres-dev-utf8'
$pgLog = Join-Path $cluster 'postgres.log'
$serverOut = Join-Path $root 'server-runtime.out'
$serverErr = Join-Path $root 'server-runtime.err'
$clientOut = Join-Path $root 'client-runtime.out'
$clientErr = Join-Path $root 'client-runtime.err'

function Test-Port($Port) {
  $result = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
  return [bool]$result.TcpTestSucceeded
}

if (-not (Test-Path $cluster)) {
  throw "Cluster not found: $cluster"
}

if (-not (Test-Port 5433)) {
  & $pgCtl -D $cluster -l $pgLog -o '"-p 5433"' start | Out-Null
  Start-Sleep -Seconds 3
}

try {
  & $createdb -U postgres -h localhost -p 5433 currency_tracker 2>$null
} catch {
}

if (-not (Test-Port 5000)) {
  if (Test-Path $serverOut) { Remove-Item $serverOut -Force }
  if (Test-Path $serverErr) { Remove-Item $serverErr -Force }
  Start-Process -FilePath node -ArgumentList 'dist/index.js' -WorkingDirectory (Join-Path $root 'server') -WindowStyle Hidden -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr | Out-Null
  Start-Sleep -Seconds 5
}

if (-not (Test-Port 3000)) {
  if (Test-Path $clientOut) { Remove-Item $clientOut -Force }
  if (Test-Path $clientErr) { Remove-Item $clientErr -Force }
  Start-Process -FilePath cmd.exe -ArgumentList '/c','npm run preview -- --host 0.0.0.0 --port 3000' -WorkingDirectory (Join-Path $root 'client') -WindowStyle Hidden -RedirectStandardOutput $clientOut -RedirectStandardError $clientErr | Out-Null
  Start-Sleep -Seconds 5
}

Write-Output 'Local services status:'
Write-Output "Postgres 5433: $(Test-Port 5433)"
Write-Output "API 5000: $(Test-Port 5000)"
Write-Output "Client 3000: $(Test-Port 3000)"
