<script setup>
const baseValue = 6.88; // Hidden Lakes P50 value with 1.0 cycle
const tableData = [
  { source: 'Hidden Lakes P50 (1.0 cycle w/AS) - Recommended', value: 6.88, diff: 0 },
  { source: 'Hidden Lakes P50 (1.2 cycle w/AS)', value: 8.20, diff: 1.32 },
  { source: 'Hidden Lakes TB2 (0.86 cycles)', value: 5.73, diff: -1.15 },
  { source: 'Aurora (1.0 cycle)', value: 11.40, diff: 4.52 }
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