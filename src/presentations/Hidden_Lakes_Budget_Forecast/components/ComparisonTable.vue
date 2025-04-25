<script setup>
const baseValue = 5.73; // Hidden Lakes TB2 base value
const tableData = [
  { 
    source: 'Hidden Lakes TB2 (0.86 cycles) - Base',
    baseValue: 5.73,
    changePerUnit: 0,
    bridgingCase: 0,
    totalChange: 0,
    finalValue: 5.73
  },
  { 
    source: 'AS Revenue (0.14 cycles)',
    baseValue: 5.73,
    changePerUnit: 8.21,  // AS revenue per cycle
    bridgingCase: 0.14,   // cycles
    totalChange: 1.15,    // 8.21 * 0.14
    finalValue: 6.88      // 5.73 + 1.15
  },
  { 
    source: 'AS Revenue (0.3 cycles)',
    baseValue: 5.73,
    changePerUnit: 8.23,  // AS revenue per cycle
    bridgingCase: 0.3,    // cycles
    totalChange: 2.47,    // 8.23 * 0.3
    finalValue: 8.20      // 5.73 + 2.47
  },
  { 
    source: '2025 - Aurora (1.0 cycle)',
    baseValue: 5.73,
    changePerUnit: 5.67,  // Difference per cycle
    bridgingCase: 1.0,    // cycles
    totalChange: 5.67,    // 5.67 * 1.0
    finalValue: 11.40     // 5.73 + 5.67
  },
  { 
    source: 'Modeling Differences *',
    baseValue: 11.40,
    changePerUnit: 0.31,
    bridgingCase: 1.0,
    totalChange: 0.31,
    finalValue: 11.71
  },
  { 
    source: '2024 Actuals',
    baseValue: 5.73,
    changePerUnit: '-',
    bridgingCase: '-',
    totalChange: '-',
    finalValue: 4.20
  }
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
            <th>Base Value<br/>($/kw-mn)</th>
            <th>Change per Unit<br/>($/kw-mn)</th>
            <th>Bridging Case<br/>(cycles)</th>
            <th>Formula</th>
            <th>Contribution<br/>($/kw-mn)</th>
            <th>Final Value<br/>($/kw-mn)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableData" :key="row.source">
            <td>{{ row.source }}</td>
            <td>${{ typeof row.baseValue === 'number' ? row.baseValue.toFixed(2) : row.baseValue }}</td>
            <td>{{ typeof row.changePerUnit === 'number' ? '$' + row.changePerUnit.toFixed(2) : row.changePerUnit }}</td>
            <td>{{ typeof row.bridgingCase === 'number' ? row.bridgingCase.toFixed(2) : row.bridgingCase }}</td>
            <td class="formula">{{ 
              typeof row.changePerUnit === 'number' && typeof row.bridgingCase === 'number' 
                ? `$${row.changePerUnit.toFixed(2)} × ${row.bridgingCase.toFixed(2)}` 
                : '-' 
            }}</td>
            <td>{{ typeof row.totalChange === 'number' ? '$' + row.totalChange.toFixed(2) : row.totalChange }}</td>
            <td class="final-value">${{ row.finalValue.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="footnote">
        * Modeling differences between Gridstor and Aurora likely account for the remaining variance. Factors such as resource bidding behavior and battery optimization—elements that often vary between modelers—contribute to these discrepancies. Since Aurora is unlikely to disclose the details of these components, a difference in forecast outcomes is expected.
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-wrapper {
  width: 100%;
  max-width: 900px;
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
  margin-bottom: 10px;
}

th, td {
  padding: 6px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  font-size: 12px;
  text-align: center;
  line-height: 1.2;
}

td {
  color: #444;
  text-align: right;
  font-family: monospace;
}

td:first-child {
  text-align: left;
  font-family: inherit;
  white-space: normal;
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

.final-value {
  font-weight: bold;
  color: #0B2B5B;
}

.footnote {
  font-size: 12px;
  color: #666;
  margin-top: 10px;
  padding: 10px;
  border-top: 1px solid #eee;
  line-height: 1.4;
}

.formula {
  font-family: monospace;
  color: #666;
  font-size: 13px;
}
</style> 