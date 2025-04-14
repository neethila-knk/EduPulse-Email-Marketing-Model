import React, { useState, useEffect, useRef } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

// Define the shape of your pie chart data
export interface PieChartData {
  name: string;
  value: number;
}

interface ReusablePieChartProps {
  data: PieChartData[];
  colors?: string[];
  tooltipFormatter?: (value: number, name: string) => React.ReactNode;
  labelFormatter?: (entry: { name: string; percent: number }) => string;
  showLegend?: boolean;
  /**
   * The height of the chart container (in pixels). If not provided,
   * the component will default to a responsive height based on width.
   */
  height?: number;
  /**
   * The percentage of available space the pie chart should use.
   * Value between 0-1, default is 0.8 (80% of the smallest dimension).
   */
  sizeRatio?: number;
}

// Export colors and utils for use in detached legend
export const defaultColors = [
  "#232c33", // Dark
  "#f9a620", // Yellow
  "#cc2936", // Red
  "#157f1f", // Green 
  "#f2f4f3", // Light (can be used sparingly or for contrast)
  "#a1c181", // Muted green complement (optional addition)
  "#ffe066", // Lighter yellow for variation
];

export const PieChartLegend: React.FC<{
  data: PieChartData[];
  colors?: string[];
  layout?: "horizontal" | "vertical";
  className?: string;
}> = ({ data, colors = defaultColors, layout = "vertical", className = "" }) => {
  const renderLegendItem = (entry: PieChartData, index: number) => {
    const color = colors[index % colors.length];
    return (
      <div key={`legend-item-${index}`} className="flex items-center mb-2">
        <div
          className="w-3 h-3 mr-2 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm">{entry.name}</span>
        <span className="text-sm text-gray-500 ml-2">
          ({entry.value.toLocaleString()})
        </span>
      </div>
    );
  };

  return (
    <div className={`${className} ${layout === "horizontal" ? "flex flex-wrap gap-4" : ""}`}>
      {data.map((entry, index) => renderLegendItem(entry, index))}
    </div>
  );
};

const ReusablePieChart: React.FC<ReusablePieChartProps> = ({
  data,
  colors = defaultColors,
  tooltipFormatter,
  labelFormatter,
  showLegend = true,
  height,
  sizeRatio = 0.8,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
    outerRadius: 0,
  });

  // Calculate responsive dimensions whenever container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Use provided height or make height responsive based on container width
        const containerHeight = height || Math.max(250, Math.min(containerWidth * 0.75, 400));
        const smallestDimension = Math.min(containerWidth, containerHeight);
        const legendSpace = showLegend ? smallestDimension * 0.2 : 0;
        const outerRadius = ((smallestDimension - legendSpace) * sizeRatio) / 2;
        setChartDimensions({
          width: containerWidth,
          height: containerHeight,
          outerRadius,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [height, sizeRatio, showLegend]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: chartDimensions.height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: showLegend ? 30 : 10 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={chartDimensions.outerRadius}
            label={labelFormatter}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
  formatter={tooltipFormatter}
  contentStyle={{
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
  }}
  labelStyle={{ color: "#fff" }}    // changes the label text color
  itemStyle={{ color: "#fff" }}     // changes the tooltip item text color
/>

          {showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: "10px",
                fontSize: chartDimensions.width < 500 ? "12px" : "14px",
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReusablePieChart;
