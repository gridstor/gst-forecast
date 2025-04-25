import React, { useState, useRef } from 'react';

function CurveGraph({ curves, width = 800, height = 400 }) {
  const [hoverDate, setHoverDate] = useState(null);
  const svgRef = useRef(null);
  
  // Time scale conversion functions
  const getTimeScale = (minDate, maxDate, width) => {
    const timeRange = maxDate - minDate;
    return (date) => {
      return ((date - minDate) / timeRange) * width;
    };
  };

  const getInverseTimeScale = (minDate, maxDate, width) => {
    const timeRange = maxDate - minDate;
    return (xCoord) => {
      return new Date(minDate.getTime() + (xCoord / width) * timeRange);
    };
  };

  // Calculate min and max dates from all curves
  const minDate = new Date(Math.min(...curves.flatMap(curve => 
    curve.data.map(point => new Date(point.date).getTime())
  )));
  const maxDate = new Date(Math.max(...curves.flatMap(curve => 
    curve.data.map(point => new Date(point.date).getTime())
  )));

  // Calculate min and max values for y-scale
  const minValue = Math.min(...curves.flatMap(curve => 
    curve.data.map(point => point.value)
  ));
  const maxValue = Math.max(...curves.flatMap(curve => 
    curve.data.map(point => point.value)
  ));

  // Y scale conversion function
  const yScale = (value) => {
    return height - ((value - minValue) / (maxValue - minValue)) * height;
  };

  // Handle mouse move for all curves
  const handleMouseMove = (event) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const xCoord = event.clientX - rect.left;
    const date = getInverseTimeScale(minDate, maxDate, width)(xCoord);
    setHoverDate(date);
  };

  // Find closest point for each curve using common hover date
  const getClosestPoints = (curveData) => {
    if (!hoverDate) return null;
    
    return curveData.data.reduce((closest, point) => {
      const currentDistance = Math.abs(new Date(point.date) - hoverDate);
      return currentDistance < closest.distance 
        ? { point, distance: currentDistance } 
        : closest;
    }, { distance: Infinity }).point;
  };

  // Create path for each curve
  const createPath = (curveData) => {
    return curveData.data.map((point, i) => {
      const x = getTimeScale(minDate, maxDate, width)(new Date(point.date));
      const y = yScale(point.value);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <svg 
      ref={svgRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove} 
      onMouseLeave={() => setHoverDate(null)}
      className="bg-white"
    >
      {/* X-axis */}
      <g transform={`translate(0,${height})`}>
        <line x1="0" y1="0" x2={width} y2="0" stroke="#666" />
      </g>

      {/* Y-axis */}
      <line x1="0" y1="0" x2="0" y2={height} stroke="#666" />

      {curves.map(curve => {
        const closestPoint = getClosestPoints(curve);
        const path = createPath(curve);
        
        return (
          <g key={curve.id}>
            <path d={path} stroke={curve.color} fill="none" strokeWidth="2" />
            
            {closestPoint && (
              <g transform={`translate(${getTimeScale(minDate, maxDate, width)(new Date(closestPoint.date))},${yScale(closestPoint.value)})`}>
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
          x1={getTimeScale(minDate, maxDate, width)(hoverDate)}
          x2={getTimeScale(minDate, maxDate, width)(hoverDate)}
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