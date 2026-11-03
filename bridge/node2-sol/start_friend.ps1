# start_friend.ps1 - starts bridge/friend/friend.mjs hidden at normal priority via WMI
# "Already running" is decided in this order (ticket T2):
#   1. friend.pid, written here after Win32_Process.Create: running when that pid is a node.exe
#      that started before the file was written (a reused pid is not ours) and, where its command
#      line is visible, is friend.mjs. A pid file that fails this is stale and is removed.
#   2. the node.exe command-line match. An unelevated query sees the hidden daemon's command line
#      as null, which is why 1 exists.
#   3. friend.log written under 2 minutes ago: running, pid unknown. Start refuses and -Stop
#      cannot stop it; use an elevated prompt, where 2 works.
param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'friend.mjs'
$pidFile = Join-Path $PSScriptRoot 'friend.pid'
$logFile = Join-Path $PSScriptRoot 'friend.log'
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = Join-Path $env:ProgramFiles 'nodejs\node.exe' }
$match = { $_.CommandLine -match 'friend[\\/]friend\.mjs' }

function Get-PidFileProcess {
    # The node.exe named by friend.pid, or $null when the file is missing or stale.
    if (-not (Test-Path -LiteralPath $pidFile)) { return $null }
    $id = (Get-Content -LiteralPath $pidFile -TotalCount 1) -as [int]
    if (-not $id) { return $null }
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$id"
    if (-not $p -or $p.Name -ne 'node.exe') { return $null }
    $written = (Get-Item -LiteralPath $pidFile).LastWriteTime
    if ($p.CreationDate -and $p.CreationDate -gt $written.AddSeconds(5)) { return $null }
    if ($p.CommandLine -and -not ($p.CommandLine -match 'friend[\\/]friend\.mjs')) { return $null }
    return $p
}

$running = @()
$fromPid = Get-PidFileProcess
if ($fromPid) { $running += $fromPid }
elseif (Test-Path -LiteralPath $pidFile) { Write-Warning 'friend: friend.pid is stale, removing it'; Remove-Item -LiteralPath $pidFile -Force }
foreach ($p in @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object $match)) {
    if ($running.ProcessId -notcontains $p.ProcessId) { $running += $p }
}
$logAge = $null
if (Test-Path -LiteralPath $logFile) { $logAge = [math]::Max(0, ((Get-Date) - (Get-Item -LiteralPath $logFile).LastWriteTime).TotalSeconds) }
$logFresh = ($null -ne $logAge) -and ($logAge -lt 120)

if ($Stop) {
    if ($running) {
        foreach ($p in $running) { Stop-Process -Id $p.ProcessId -Force; 'friend: stopped pid {0}' -f $p.ProcessId }
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    } elseif ($logFresh) {
        throw ('friend: friend.log was written {0:N0} s ago, so friend.mjs is probably running, but its pid is unknown (no friend.pid, and this prompt cannot see its command line). Stop it from an elevated prompt.' -f $logAge)
    } else { 'friend: not running' }
    return
}
if ($running) { 'friend: already running (pid {0})' -f ($running.ProcessId -join ', '); return }
if ($logFresh) {
    throw ('friend: not started: friend.log was written {0:N0} s ago, so friend.mjs is probably already running (no friend.pid, and this prompt cannot see its command line). Check from an elevated prompt before starting another.' -f $logAge)
}
$startup = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ ShowWindow = [uint16]0; PriorityClass = [uint32]32 }
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = '"{0}" "{1}"' -f $node, $script; CurrentDirectory = $PSScriptRoot; ProcessStartupInformation = $startup }
if ($r.ReturnValue -ne 0) { throw "friend did not start (Win32_Process.Create returned $($r.ReturnValue))" }
Set-Content -LiteralPath $pidFile -Value $r.ProcessId
'friend: started, pid {0} (hidden, normal priority). Pid file: {1}. State: {2}' -f $r.ProcessId, $pidFile, (Join-Path $PSScriptRoot 'friend.json')
