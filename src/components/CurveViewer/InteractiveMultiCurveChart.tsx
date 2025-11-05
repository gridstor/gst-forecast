import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface DataPoint {
  timestamp: string;
  value: number;
  curveType: string;
  commodity: string;
  scenario: string;
  instanceId: number;
  curveName: string;
  units: string;
}

interface SelectedCurve {
  instanceId: number;
  curveName: string;
  instanceVersion: string;
  color: string;
  isPrimary: boolean;
}

interface InteractiveMultiCurveChartProps {
  data: DataPoint[];
  selectedCurves: SelectedCurve[];
  startDate?: string | null;
  endDate?: string | null;
  commodity?: string;
  height?: number;
  viewMode?: 'monthly' | 'annual';
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

const InteractiveMultiCurveChart: React.FC<InteractiveMultiCurveChartProps> = ({ 
  data, 
  selectedCurves,
  startDate = null, 
  endDate = null,
  commodity = 'Total Revenue',
  height = 400,
  viewMode = 'annual',
  onDateRangeChange
}) => {
  const chartOption = useMemo(() => {
    if (data.length === 0) return {};

    // Filter by commodity and date range
    let filteredData = data.filter(point => point.commodity === commodity);
    
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      filteredData = filteredData.filter(point => {
        const pointDate = new Date(point.timestamp).getTime();
        return pointDate >= start && pointDate <= end;
      });
    }

    if (filteredData.length === 0) return {};

    // Group by timestamp and instance
    const timestampGroups: { [key: string]: { [key: string]: number } } = {};
    
    filteredData.forEach(point => {
      const ts = point.timestamp;
      if (!timestampGroups[ts]) timestampGroups[ts] = {};
      
      const curveInfo = selectedCurves.find(c => c.instanceId === point.instanceId);
      if (!curveInfo) return;
      
      if (curveInfo.isPrimary) {
        // Primary curve: Store P-values
        if (point.scenario === 'P5' || point.scenario === 'P05') timestampGroups[ts]['primaryP5'] = point.value;
        if (point.scenario === 'P25') timestampGroups[ts]['primaryP25'] = point.value;
        if (point.scenario === 'P50') timestampGroups[ts]['primaryP50'] = point.value;
        if (point.scenario === 'P75') timestampGroups[ts]['primaryP75'] = point.value;
        if (point.scenario === 'P95') timestampGroups[ts]['primaryP95'] = point.value;
      } else {
        // Overlay curves: Just store P50 or Base value
        const overlayKey = `overlay_${point.instanceId}`;
        if (point.scenario === 'P50') {
          timestampGroups[ts][overlayKey] = point.value;
        } else if (point.scenario === 'Base' || point.scenario === 'BASE') {
          timestampGroups[ts][overlayKey] = point.value;
        }
      }
    });

    // Convert to array
    let allData = Object.entries(timestampGroups).map(([timestamp, values]) => {
      const date = new Date(timestamp);
      return {
        date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        dateObj: date,
        year: date.getFullYear(),
        timestamp: date.getTime(),
        ...values
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    // Annual aggregation if needed
    if (viewMode === 'annual') {
      const yearGroups: { [key: number]: typeof allData } = {};
      allData.forEach(point => {
        if (!yearGroups[point.year]) yearGroups[point.year] = [];
        yearGroups[point.year].push(point);
      });

      allData = Object.entries(yearGroups).map(([year, points]) => {
        const calcAvg = (key: string) => {
          const vals = points.map(p => p[key]).filter(v => typeof v === 'number') as number[];
          return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        };

        const result: any = {
          date: year,
          year: parseInt(year),
          timestamp: new Date(parseInt(year), 0, 1).getTime(),
          primaryP5: calcAvg('primaryP5'),
          primaryP25: calcAvg('primaryP25'),
          primaryP50: calcAvg('primaryP50'),
          primaryP75: calcAvg('primaryP75'),
          primaryP95: calcAvg('primaryP95')
        };

        selectedCurves.forEach(curve => {
          if (!curve.isPrimary) {
            result[`overlay_${curve.instanceId}`] = calcAvg(`overlay_${curve.instanceId}`);
          }
        });

        return result;
      }).sort((a, b) => a.year - b.year);
    }

    const primaryCurve = selectedCurves.find(c => c.isPrimary);
    const overlayCurves = selectedCurves.filter(c => !c.isPrimary);

    // Build ECharts series
    const series: any[] = [];
    const xAxisData = allData.map(d => viewMode === 'annual' ? d.year.toString() : d.date);

    // Primary curve confidence bands (P5-P95)
    if (primaryCurve) {
      // P5-P95 Band (Cyan)
      series.push({
        name: `${primaryCurve.instanceVersion} P5-P95`,
        type: 'line',
        data: allData.map(d => [d.date, d.primaryP5 ?? null]),
        lineStyle: { color: '#34D5ED', width: 1, opacity: 0.5 },
        itemStyle: { color: '#34D5ED' },
        areaStyle: { color: '#34D5ED', opacity: 0.15 },
        smooth: false,
        step: 'end',
        symbol: 'none',
        z: 1
      });

      series.push({
        name: `${primaryCurve.instanceVersion} P95`,
        type: 'line',
        data: allData.map(d => [d.date, d.primaryP95 ?? null]),
        lineStyle: { color: '#34D5ED', width: 1, opacity: 0.5 },
        itemStyle: { color: '#34D5ED' },
        areaStyle: { color: '#34D5ED', opacity: 0.15 },
        smooth: false,
        step: 'end',
        symbol: 'none',
        z: 1
      });

      // P25-P75 Band (Gray)
      series.push({
        name: 'P25-P75',
        type: 'line',
        data: allData.map(d => [d.date, d.primaryP25 ?? null]),
        lineStyle: { color: '#9CA3AF', width: 1, opacity: 0.5 },
        itemStyle: { color: '#9CA3AF' },
        areaStyle: { color: '#9CA3AF', opacity: 0.2 },
        smooth: false,
        step: 'end',
        symbol: 'none',
        z: 2
      });

      series.push({
        name: 'P75',
        type: 'line',
        data: allData.map(d => [d.date, d.primaryP75 ?? null]),
        lineStyle: { color: '#9CA3AF', width: 1, opacity: 0.5 },
        itemStyle: { color: '#9CA3AF' },
        areaStyle: { color: '#9CA3AF', opacity: 0.2 },
        smooth: false,
        step: 'end',
        symbol: 'none',
        z: 2
      });

      // P50 Median Line (Blue)
      series.push({
        name: `${primaryCurve.instanceVersion} P50`,
        type: 'line',
        data: allData.map(d => [d.date, d.primaryP50 ?? null]),
        lineStyle: { color: '#3B82F6', width: 3 },
        itemStyle: { color: '#3B82F6' },
        smooth: false,
        step: 'end',
        symbol: 'circle',
        symbolSize: 6,
        z: 3
      });
    }

    // Overlay curves
    overlayCurves.forEach(curve => {
      series.push({
        name: curve.instanceVersion,
        type: 'line',
        data: allData.map(d => [d.date, d[`overlay_${curve.instanceId}`] ?? null]),
        lineStyle: { color: curve.color, width: 2 },
        itemStyle: { color: curve.color },
        smooth: false,
        step: 'end',
        symbol: 'circle',
        symbolSize: 4,
        z: 3
      });
    });

    return {
      title: {
        show: false
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        textStyle: {
          color: '#1F2937',
          fontFamily: 'Inter, sans-serif'
        },
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: '#9CA3AF',
            type: 'dashed'
          }
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
          params.forEach((item: any) => {
            if (item.value && item.value[1] != null) {
              result += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color};"></span>
                <span style="font-size: 11px; text-transform: uppercase; color: #6B7280;">${item.seriesName}:</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${item.color};">$${item.value[1].toFixed(2)}</span>
              </div>`;
            }
          });
          return result;
        }
      },
      legend: {
        show: true,
        bottom: 0,
        textStyle: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: '#6B7280'
        },
        icon: 'roundRect'
      },
      grid: {
        left: '80px',
        right: '40px',
        top: '40px',
        bottom: '60px',
        containLabel: false
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          zoomOnMouseWheel: 'ctrl', // Ctrl+scroll to zoom
          moveOnMouseWheel: true, // Regular scroll to pan
          moveOnMouseMove: true // Drag to pan
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 30,
          bottom: 25,
          borderColor: '#E5E7EB',
          fillerColor: 'rgba(59, 130, 246, 0.15)',
          handleStyle: {
            color: '#3B82F6'
          },
          dataBackground: {
            lineStyle: {
              color: '#9CA3AF'
            },
            areaStyle: {
              color: '#E5E7EB'
            }
          },
          textStyle: {
            color: '#6B7280',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11
          }
        }
      ],
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
            title: {
              zoom: 'Zoom',
              back: 'Reset Zoom'
            }
          },
          restore: {
            title: 'Reset'
          },
          saveAsImage: {
            title: 'Save as Image',
            pixelRatio: 2
          }
        },
        iconStyle: {
          borderColor: '#6B7280'
        },
        emphasis: {
          iconStyle: {
            borderColor: '#3B82F6'
          }
        },
        right: 20,
        top: 10
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: '#E5E7EB'
          }
        },
        axisLabel: {
          color: '#6B7280',
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          rotate: viewMode === 'monthly' ? 45 : 0
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisLabel: {
          color: '#6B7280',
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          fontSize: 12,
          formatter: (value: number) => `$${value.toFixed(0)}`
        },
        splitLine: {
          lineStyle: {
            color: '#E5E7EB',
            type: 'dashed'
          }
        }
      },
      series
    };
  }, [data, selectedCurves, startDate, endDate, commodity, viewMode]);

  if (Object.keys(chartOption).length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data available for {commodity}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ReactECharts 
        option={chartOption}
        style={{ height: `${height}px`, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
      
      <div className="text-[10px] text-gray-600 text-center bg-blue-50 rounded px-3 py-2">
        <strong className="text-blue-700">💡 Interactive Controls:</strong> 
        <span className="ml-2">Scroll to pan • Ctrl+Scroll to zoom • Drag slider below chart • Use toolbar (top-right) for zoom box</span>
      </div>
    </div>
  );
};

export default InteractiveMultiCurveChart;

