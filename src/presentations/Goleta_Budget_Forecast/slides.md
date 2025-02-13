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
  - ./components/GoletaCalibrationChart.vue
  - ./components/GoletaProbChart.vue
  - ./components/ComparisonTable.vue
---

<div style="text-align: center; padding: 15px 40px;">
<h1 style="font-size: 28px; color: #444444; font-weight: 500; margin-bottom: 15px; line-height: 1.2;">Goleta 2025 Revenue Forecast Comparison</h1>
<Suspense>
  <ComparisonTable />
  <template #fallback>
    <div class="loading">Loading table...</div>
  </template>
</Suspense>
</div>

---

<div style="text-align: center; padding: 15px 60px;">
<h1 style="font-size: 24px; color: #444444; font-weight: 500; margin-bottom: 25px; line-height: 1.2;">Goleta Budget 2025 Forecast Recommendation</h1>

<div style="max-width: 1200px; margin: 0 auto; text-align: center; padding: 0 40px; margin-bottom: 25px;">
<p style="font-size: 14px; color: #555555; line-height: 1.3;"><span style="text-decoration: underline; font-weight: 500; margin-right: 4px;">Recommended forecast:</span> Average monthly revenue for 2025 of $4.92/kw-mn. This is the P50 forecast of a TB2.6 with 86% round trip efficiency.</p>
</div>

<div style="max-width: 1200px; margin: 0 auto; text-align: left; padding: 0 80px;">
<ul style="list-style-type: none; margin: 0; padding: 0;">
<ul style="list-style-type: none; margin: 0; padding-left: 25px;">
<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• In TRC terms this is the "lower bound" of trading revenue, that means it is energy arbitrage only, and does not consider any additional revenue from Ancillary Services</li>

<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• The same forecast with energy arbitrage and AS would be $6.08/kw-mn (this is what we have been presenting until now).</li>

<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• We re-ran 2024 with actual fundamentals as inputs for the current version of our froecast to see how close to 2024 actual prices the forecast would get:</li>

<ul style="list-style-type: none; margin: 0; padding-left: 25px;">
<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• The average actual TB2.6 was $4.10 and the forecast with actual inputs gave $4.53, about 9% above the actual value</li>

<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• The actual 2024 market would have been a P45 value in our forecast</li>

<li style="font-size: 14px; color: #555555; margin-bottom: 12px; line-height: 1.3;">• This calibration is in line with expectations of forecast quality and we do not recommend making any changes to the budget forecast for 2025 based on this analysis</li>
</ul>
</ul>
</ul>
</div>
</div>

---

<div style="text-align: center; padding: 15px 40px;">
<h1 style="font-size: 28px; color: #444444; font-weight: 500; margin-bottom: 15px; line-height: 1.2;">Goleta 2025 Budget Forecast</h1>
<div style="max-width: 1200px; margin: 0 auto; text-align: left; padding: 0 20px;">
<ul style="margin: 0 0 10px 0; padding-left: 25px;">
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">2025 P50 forecast averages $4.92/kw-mn,Energy Arbitrage TB2.6, 86% RTE.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">2024 Actuals average $4.10/kw-mn.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 12px; line-height: 1.4;">Price ranges: P25-P75 $3.50-$6.80/kw-mn, whiskers P5-P95 $2.50-$8.20/kw-mn</li>
</ul>
</div>
<Suspense>
  <GoletaProbChart />
  <template #fallback>
    <div class="loading">Loading chart...</div>
  </template>
</Suspense>
</div>

---

<div style="text-align: center; padding: 15px 40px;">
<h1 style="font-size: 24px; color: #444444; font-weight: 500; margin-bottom: 15px; line-height: 1.2;">2024 Forecast using actuals as inputs vs. Actual CAISO prices</h1>
<div style="max-width: 1200px; margin: 0 auto; text-align: left; padding: 0 20px;">
<ul style="margin: 0 0 10px 0; padding-left: 25px;">
<li style="font-size: 12px; color: #555555; margin-bottom: 8px; line-height: 1.3;">We used actual 2024 load, solar, natural gas, etc. and ran our internal model. The actuals were $4.10/kw-mn, the forecast model with actual inputs gave $4.53/kw-mn, about 9% above the actual value.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 8px; line-height: 1.3;">The P-value of actuals in the forecast range was P45 forecast, with an average error of $0.45/kw-mn.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 8px; line-height: 1.3;">8 months would have been over forecasted, 4 months would have been under forecasted.</li>
<li style="font-size: 12px; color: #555555; margin-bottom: 8px; line-height: 1.3;">Recommendation: No de-biasing of the forecast. Averaging a P45 forecast, is in line with expectations of forecast error, about 9% above actuals.</li>
</ul>
</div>
<Suspense>
  <GoletaCalibrationChart />
  <template #fallback>
    <div class="loading">Loading chart...</div>
  </template>
</Suspense>
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
</style>

---