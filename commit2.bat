@echo off
git add api/analytics/claims-trends.ts
git commit -m "Fix claims-trends API to return empty data instead of 500 error"
git push
pause
