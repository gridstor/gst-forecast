---
theme: seriph
background: '#FFFFFF'
class: 'text-center'
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
css: unocss
components:
  - ./components/ErrorBoundary.vue
  - ./components/HoustonCalibrationChart.vue
  - ./components/HoustonProbChart.vue
  - ./components/ASChart.vue
  - ./components/ComparisonTable.vue
download: true
---

<div style="text-align: center; padding: 15px 40px;">
<h1 style="font-size: 28px; color: #444444; font-weight: 500; margin-bottom: 15px; line-height: 1.2;">Hidden Lakes 2025 Revenue Forecast Comparison</h1>

<Suspense>
  <ComparisonTable />
  <template #fallback>
    <div class="loading">Loading table...</div>
  </template>
</Suspense>
</div>

---

<div style="text-align: center; padding: 15px 40px;">
<h1 style="font-size: 28px; color: #444444; font-weight: 500; margin-bottom: 15px; line-height: 1.2;">Hidden Lakes 2025 Revenue Components</h1>

<div style="max-width: 1200px; margin: 0 auto; text-align: left; padding: 0 20px;">
<ul style="margin: 0 0 10px 0; padding-left: 25px;">
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">Energy arbitrage revenue with 0.86 cycles averages $5.73/kw-mn.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">AS revenue with 0.14 cycles adds $1.15/kw-mn for a total of $6.88/kw-mn at 1 cycle per day.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">AS revenue with 0.3 cycles adds $2.47/kw-mn for a total of $8.20/kw-mn at 1.2 cycles per day.</li>
</ul>
</div>
<Suspense>
  <ASChart />
  <template #fallback>
    <div class="loading">Loading chart...</div>
  </template>
</Suspense>
</div>

---

<div style="text-align: center; padding: 15px 60px;">
<h1 style="font-size: 24px; color: #444444; font-weight: 500; margin-bottom: 25px; line-height: 1.2;">Hidden Lakes Budget 2025 Forecast Recommendation</h1>

<div style="max-width: 1200px; margin: 0 auto; text-align: center; padding: 0 40px; margin-bottom: 25px;">
<p style="font-size: 14px; color: #555555; line-height: 1.3;"><span style="text-decoration: underline; font-weight: 500; margin-right: 4px;">Recommended forecast:</span> Average monthly revenue for 2025 of $5.73/kw-mn. This is the P50 forecast of a TB2 with 0.86 cycles.</p>
</div>

<div style="max-width: 1200px; margin: 0 auto; text-align: left; padding: 0 80px;">
<ul style="list-style-type: none; margin: 0; padding: 0;">
<ul style="list-style-type: none; margin: 0; padding-left: 25px;">
<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• In TRC terms this is the "lower bound" of trading revenue, that means it is energy arbitrage only, and does not consider any additional revenue from Ancillary Services</li>

<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• The same forecast with energy arbitrage and AS would be $8.20/kw-mn (this is what we have been presenting as the "Target" forecast in TRC terms).</li>

<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• We re-ran 2024 with actual fundamentals as inputs for the current version of our forecast to see how close to 2024 actual prices the forecast would get:</li>

<ul style="list-style-type: none; margin: 0; padding-left: 25px;">
<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• The average actual TB2 was $4.20/kw-mn, the forecast model with actual inputs gave $4.60/kw-mn, about 9.5% above the actual value</li>

<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• The actual 2024 market would have been a P45 value in our forecast</li>

<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• This calibration suggests a moderate upward bias in our forecasts, but we do not recommend making any changes to the budget forecast for 2025 based on this analysis, 9% error and P45 outcome is within expecations. ERCOT has high monthly variability, the fact that there is large forecast errors above and below the P50 suggests more that random events create big monthly swings ERCOT rather than forecast bias.</li>
</ul>
</ul>
</ul>
</div>
</div>

---

<div style="text-align: center; padding: 15px 40px;">
<h1 style="font-size: 28px; color: #444444; font-weight: 500; margin-bottom: 15px; line-height: 1.2;">Hidden Lakes 2025 Budget Forecast</h1>
<div style="max-width: 1200px; margin: 0 auto; text-align: left; padding: 0 20px;">
<ul style="margin: 0 0 10px 0; padding-left: 25px;">
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">2025 P50 forecast averages $5.73/kw-mn, Energy Arbitrage TB2, 0.86 cycles.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">2024 Actuals average $4.20/kw-mn.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">Price ranges: P25-P75 $3.90-$7.50/kw-mn, whiskers P5-P95 $2.80-$9.20/kw-mn</li>
</ul>
</div>
<Suspense>
  <HoustonProbChart />
  <template #fallback>
    <div class="loading">Loading chart...</div>
  </template>
</Suspense>
</div>

---

<div style="text-align: center; padding: 15px 40px;">
<h1 style="font-size: 24px; color: #444444; font-weight: 500; margin-bottom: 15px; line-height: 1.2;">2024 Forecast using actuals as inputs vs. ERCOT prices</h1>
<div style="max-width: 1200px; margin: 0 auto; text-align: left; padding: 0 20px;">
<ul style="margin: 0 0 10px 0; padding-left: 25px;">
<li style="font-size: 12px; color: #555555; margin-bottom: 8px; line-height: 1.3;">We used actual 2024 load, solar, natural gas, etc. and ran our internal model. The actuals averaged $4.20/kw-mn, with significant monthly variation from $1.42 to $12.57/kw-mn.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 8px; line-height: 1.3;">The average P-value of actuals in the forecast range was P45, with monthly values ranging from P32 to P80.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 8px; line-height: 1.3;">7 months were under forecasted, with May showing the largest deviation.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 8px; line-height: 1.3;">Recommendation: No de-biasing of the forecast. The P45 average suggests good calibration, but with high monthly variability, which is expected for ERCOT.</li>
</ul>
</div>
<Suspense>
  <HoustonCalibrationChart />
  <template #fallback>
    <div class="loading">Loading chart...</div>
  </template>
</Suspense>
</div>

<div class="fixed bottom-5 right-5">
  <a href="/presentations/Hidden_Lakes_Budget_Forecast/slidev-exported.pdf" target="_blank" class="download-btn">
    Download PDF
  </a>
</div>

<style>
.loading {
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  color: #666;
  font-size: 16px;
}

.download-btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: #0B2B5B;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.2s;
}

.download-btn:hover {
  background-color: #1a4b8f;
}
</style>

--- 