# start_friend.ps1 - starts bridge/friend/friend.mjs hidden at normal priority via WMI
param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'friend.mjs'
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = Join-Path $env:ProgramFiles 'nodejs\node.exe' }
$match = { $_.CommandLine -match 'friend[\\/]friend\.mjs' }
$running = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object $match)
if ($Stop) {
    if (-not $running) { 'friend: not running' } else {
        foreach ($p in $running) { Stop-Process -Id $p.ProcessId -Force; 'friend: stopped pid {0}' -f $p.ProcessId }
    }
    return
}
if ($running) { 'friend: already running (pid {0})' -f ($running.ProcessId -join ', '); return }
$startup = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ ShowWindow = [uint16]0; PriorityClass = [uint32]32 }
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = '"{0}" "{1}"' -f $node, $script; CurrentDirectory = $PSScriptRoot; ProcessStartupInformation = $startup }
if ($r.ReturnValue -ne 0) { throw "friend did not start (Win32_Process.Create returned $($r.ReturnValue))" }
'friend: started, pid {0} (hidden, normal priority). State: {1}' -f $r.ProcessId, (Join-Path $PSScriptRoot 'friend.json')
