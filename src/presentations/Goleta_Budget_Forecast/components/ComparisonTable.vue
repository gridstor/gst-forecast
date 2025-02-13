<script setup>
const baseValue = 6.08; // Goleta P50 value
const tableData = [
  { source: '2025 - Forecast Goleta P50 (TB2 0.86 cycles + 10% for AS)', value: 5.41, diff: 0 },
  { source: '2025 - Forecast Goleta TB2 (TB2, 0.86 cycles)', value: 4.92, diff: -0.49 },
  { source: '2024 - Actual Site Revenue', value: 4.49, diff: -0.92 },
  { source: '2024 - Goleta TB2 (TB2)', value: 4.10, diff: -1.31 },
  { source: 'Aurora', value: 6.45, diff: 0.94 },
  { source: 'Ascend', value: 10.31, diff: 4.90 },
  { source: 'CQuant', value: 7.05, diff: 1.64 },
  { source: 'Orienna', value: 7.54, diff: 2.13 }
];
</script>

<template>
  <div class="table-wrapper">
    <h2 class="title">2025 Revenue Forecast Comparison</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>$/kw-mn</th>
            <th>vs. Recommended</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableData" :key="row.source">
            <td>{{ row.source }}</td>
            <td>${{ row.value.toFixed(2) }}</td>
            <td :class="{ 'positive': row.diff > 0, 'negative': row.diff < 0 }">
              {{ row.diff > 0 ? '+' : ''}}${{ row.diff.toFixed(2) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-wrapper {
  width: 100%;
  max-width: 600px;
  margin: 10px auto;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 18px;
  color: #444444;
  font-weight: 500;
  margin-bottom: 10px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 6px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  font-size: 13px;
}

td {
  color: #444;
}

tr:first-child td {
  font-weight: 600;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f5f5f5;
}

td:nth-child(2), td:nth-child(3) {
  text-align: right;
  font-family: monospace;
}

.positive {
  color: #2e7d32;
}

.negative {
  color: #c62828;
}
</style> 