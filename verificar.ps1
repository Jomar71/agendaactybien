$local = git rev-parse HEAD
git fetch origin | Out-Null
$remote = git rev-parse origin/main

Write-Host ""
Write-Host "=== VERIFICACION DE SUBIDA ===" -ForegroundColor Cyan
Write-Host "Tu commit local : $local"
Write-Host "GitHub (main)  : $remote"
Write-Host ""

if ($local -eq $remote) {
    Write-Host "SE SUBIO CORRECTAMENTE." -ForegroundColor Green
    Write-Host "Tu commit esta IGUAL en tu PC y en GitHub. (visto bueno OK)" -ForegroundColor Green
} else {
    Write-Host "NO COINCIDE. Tu commit local aun NO esta en GitHub." -ForegroundColor Red
    Write-Host "Faltan commits por subir. Ejecuta: git push origin main" -ForegroundColor Yellow
}
Write-Host ""
