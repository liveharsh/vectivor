@echo off
title Vectivor - Quantitative Market Terminal
cd /d "D:\StockMarketPredictor"
echo ========================================================
echo   Starting Vectivor - Quantitative Market Terminal
echo ========================================================
echo Opening browser at http://localhost:3000 ...
timeout /t 2 /nobreak >nul
start http://localhost:3000
node server.js
pause
