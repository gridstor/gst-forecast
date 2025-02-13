<script setup>
const baseValue = 6.08; // Goleta P50 value
const tableData = [
  { source: 'Goleta P50 (1.0 cycle AS) - Recommended', value: 6.08, diff: 0 },
  { source: 'Goleta Last Year', value: 4.49, diff: -1.59 },
  { source: 'Goleta TB2 (0.86 cycles)', value: 4.10, diff: -1.98 },
  { source: 'Aurora', value: 6.45, diff: 0.37 },
  { source: 'Ascend', value: 10.31, diff: 4.23 },
  { source: 'CQuant', value: 8.05, diff: 1.97 },
  { source: 'Orienna', value: 7.54, diff: 1.46 }
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