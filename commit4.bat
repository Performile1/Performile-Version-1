@echo off
git add api/analytics/order-trends.ts api/analytics/claims-trends.ts
git commit -m "Fix analytics APIs: bypass materialized views with RLS issues, query orders table directly"
git push
pause
