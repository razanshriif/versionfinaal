# update-ip.ps1
# This script detects the current IP address and updates environment files automatically.

function Get-CurrentIP {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169' }).IPAddress
    if ($ip -is [array]) { $ip = $ip[0] }
    return $ip
}

$newIp = Get-CurrentIP
Write-Host "Detected IP: $newIp" -ForegroundColor Cyan

$filesToUpdate = @(
    "src/environments/environment.ts",
    "src/environments/environment.prod.ts",
    "capacitor.config.ts"
)

foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        $content = Get-Content $file
        $updatedContent = $content -replace 'http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:8090', "http://$($newIp):8090"
        $updatedContent = $updatedContent -replace "'http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'", "'http://$($newIp)'"
        $updatedContent | Set-Content $file
        Write-Host "Updated $file" -ForegroundColor Green
    }
}

Write-Host "Done! Please restart your Angular/Ionic server." -ForegroundColor Yellow
