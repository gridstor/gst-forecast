import React, { useState } from 'react';
import * as d3 from 'd3';

function CurveGraph({ curves }) {
  const [hoverDate, setHoverDate] = useState(null);
  
  // Common x-axis scale for all curves
  const xScale = d3.scaleTime()
    .domain([/* your min date */, /* your max date */])
    .range([0, width]);

  // Handle mouse move for all curves
  const handleMouseMove = (event) => {
    const [xCoord] = d3.pointer(event);
    const date = xScale.invert(xCoord);
    setHoverDate(date);
  };

  // Find closest point for each curve using common hover date
  const getClosestPoints = (curveData) => {
    if (!hoverDate) return null;
    
    return curveData.data.reduce((closest, point) => {
      const currentDistance = Math.abs(point.date - hoverDate);
      return currentDistance < closest.distance 
        ? { point, distance: currentDistance } 
        : closest;
    }, { distance: Infinity }).point;
  };

  return (
    <svg onMouseMove={handleMouseMove} onMouseLeave={() => setHoverDate(null)}>
      {/* X-axis using common scale */}
      <g transform={`translate(0,${height})`}>
        <AxisBottom scale={xScale} />
      </g>

      {curves.map(curve => {
        const closestPoint = getClosestPoints(curve);
        
        return (
          <g key={curve.id}>
            {/* Existing curve path */}
            <path d={curve.path} stroke={curve.color} />
            
            {closestPoint && (
              <g transform={`translate(${xScale(closestPoint.date)},${yScale(closestPoint.value)})`}>
                <circle r="5" fill={curve.color} />
                <text x="8" y="5" fill={curve.color}>
                  {closestPoint.value.toFixed(2)}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Vertical reference line */}
      {hoverDate && (
        <line
          x1={xScale(hoverDate)}
          x2={xScale(hoverDate)}
          y1={0}
          y2={height}
          stroke="#666"
          strokeDasharray="4 2"
        />
      )}
    </svg>
  );
}

export default CurveGraph; 