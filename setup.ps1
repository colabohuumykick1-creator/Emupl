$ErrorActionPreference = "Stop"

$project = "C:\Users\bagieta\Desktop\pubg-mobile-pl-bot"

Set-Location $project

Write-Host ""
Write-Host "Instaluję zależności..." -ForegroundColor Cyan
npm install

if (-not (Test-Path ".\.env")) {
    Copy-Item ".\.env.example" ".\.env"

    Write-Host ""
    Write-Host "Utworzono plik .env" -ForegroundColor Green
    Write-Host "Uzupełnij DISCORD_TOKEN, CLIENT_ID, GUILD_ID i WELCOME_CHANNEL_ID." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Projekt gotowy." -ForegroundColor Green
Write-Host ""
Write-Host "Uruchomienie:"
Write-Host "npm start"
