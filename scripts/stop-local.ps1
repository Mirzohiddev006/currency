$ErrorActionPreference = 'SilentlyContinue'

$root = 'C:\Users\Mirzohid\Downloads\currency-tracker'
$pgCtl = 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe'
$cluster = Join-Path $root '.postgres-dev-utf8'

function Stop-PortProcess($Port) {
  $line = netstat -ano | Select-String ":$Port\s+"
  if (-not $line) {
    return
  }

  $pids = @()
  foreach ($entry in $line) {
    $parts = ($entry.ToString() -split '\s+') | Where-Object { $_ }
    if ($parts.Count -gt 4) {
      $pid = $parts[-1]
      if ($pid -match '^\d+$') {
        $pids += [int]$pid
      }
    }
  }

  $pids | Sort-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force }
}

Stop-PortProcess 3000
Stop-PortProcess 5000

if (Test-Path $cluster) {
  & $pgCtl -D $cluster stop | Out-Null
}

Write-Output 'Local services stopped.'
