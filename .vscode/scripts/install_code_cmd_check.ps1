# Check for existing `code` command
$c = Get-Command code -ErrorAction SilentlyContinue
if ($c) {
    Write-Output "FOUND:$($c.Path)"
    exit 0
}

# Common install locations
$c1 = Join-Path $env:LocalAppData 'Programs\Microsoft VS Code\bin\code.cmd'
$c2 = 'C:\Program Files\Microsoft VS Code\bin\code.cmd'

if (Test-Path $c1) { $folder = Split-Path $c1 -Parent }
elseif (Test-Path $c2) { $folder = Split-Path $c2 -Parent }
else { Write-Output "NOT_FOUND_POSSIBLE_PATHS"; exit 2 }

# Append to user PATH if missing
$current = [Environment]::GetEnvironmentVariable('PATH','User')
if ($current -notlike "*$folder*") {
    if ($current) { $new = $current + ';' + $folder } else { $new = $folder }
    [Environment]::SetEnvironmentVariable('PATH',$new,'User')
    Write-Output "ADDED:$folder"
} else {
    Write-Output "ALREADY_IN_PATH:$folder"
}

exit 0
