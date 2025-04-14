import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
  AreaChart,
  Area,
  Label,
} from "recharts";

// Generic data interface
interface DataPoint {
  [key: string]: any;
}

// Chart configuration interface
interface ChartConfig {
  // Chart type and data
  chartType?: "bar" | "line" | "area";
  data: DataPoint[];
  dataKey: string;
  
  // Axis configuration
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  
  // Tooltip configuration
  tooltipLabelKey?: string;
  tooltipValueLabel?: string;
  
  // Visual customization
  chartColor?: string;
  height?: number;
  desktopMaxLength?: number;
  mobileMaxLength?: number;
  mobileBreakpoint?: number;
  
  // Small screen settings
  smallScreenMinWidth?: number;
  
  // Chart elements
  showLegend?: boolean;
  showGrid?: boolean;
  yAxisTickCount?: number;
  barSize?: number;
  barRadius?: [number, number, number, number];
}

const ReusableChart: React.FC<ChartConfig> = ({
  // Default values for props
  chartType = "bar",
  data,
  dataKey,
  xAxisKey,
  xAxisLabel = "",
  yAxisLabel = "",
  tooltipLabelKey,
  tooltipValueLabel = "Value",
  chartColor = "#020617",
  height = 400,
  desktopMaxLength = 6,
  mobileMaxLength = 4,
  mobileBreakpoint = 768,
  smallScreenMinWidth = 600,
  showLegend = false,
  showGrid = true,
  yAxisTickCount = 6,
  barSize,
  barRadius = [4, 4, 0, 0],
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < mobileBreakpoint);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, [mobileBreakpoint]);

  const truncateLabel = (label: string) => {
    if (!label) return "";
    const maxLength = isSmallScreen ? mobileMaxLength : desktopMaxLength;
    return label.length > maxLength
      ? `${label.substring(0, maxLength)}…`
      : label;
  };

  // Calculate Y-axis max value with some padding
  const maxValue = Math.max(...data.map((item) => Number(item[dataKey]) || 0));
  const yAxisMax = Math.ceil((maxValue * 1.15) / 100) * 100;

  // Custom tooltip for different screen sizes
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const displayLabel = tooltipLabelKey ? payload[0].payload[tooltipLabelKey] : label;
    const value = payload[0].value;

    if (isSmallScreen) {
      // Square tooltip for small screens
      return (
        <div
          style={{
            backgroundColor: "#0f172a",
            border: "none",
            width: "90px",
            height: "90px",
            padding: "0",
            color: "#fff",
            borderRadius: 5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "6px", textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 6px 0",
                fontSize: 10,
                fontWeight: "bold",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                borderRadius: 5,
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
              }}
            >
              {displayLabel}
            </p>
            <p style={{ margin: 0, fontSize: 10 }}>
              {tooltipValueLabel}: {value}
            </p>
          </div>
        </div>
      );
    } else {
      // Desktop tooltip
      return (
        <div
          style={{
            backgroundColor: "#0f172a",
            border: "none",
            padding: "10px",
            color: "#fff",
            fontSize: 13,
            borderRadius: 4,
          }}
        >
          <p style={{ margin: "0 0 5px 0", fontSize: 12 }}>
            {xAxisLabel ? xAxisLabel.split(" ")[0] : "Name"}: {displayLabel}
          </p>
          <p style={{ margin: 0, fontSize: 12 }}>
            {tooltipValueLabel}: {value}
          </p>
        </div>
      );
    }
  };

  const renderChart = () => {
    // Calculate margins to accommodate axis labels
    const margin = {
      top: 20,
      right: 30,
      // Adjust left margin based on y-axis label presence
      left: yAxisLabel ? 60 : 40,
      // Adjust bottom margin based on x-axis label presence
      bottom: xAxisLabel ? 65 : 40,
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart
            data={data}
            margin={margin}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey={xAxisKey}
              interval={0}
              tickFormatter={truncateLabel}
              angle={0}
              tick={{
                fontSize: isSmallScreen ? 10 : 12,
                fill: "#616161",
              }}
            >
              {xAxisLabel && (
                <Label
                  value={xAxisLabel}
                  position="bottom"
                  dy={25}
                  fill="#616161"
                  fontSize={14}
                />
              )}
            </XAxis>
            <YAxis
              domain={[0, yAxisMax]}
              tickCount={yAxisTickCount}
              tick={{ fontSize: 12, fill: "#616161" }}
            >
              {yAxisLabel && (
                <Label
                  value={yAxisLabel}
                  angle={-90}
                  position="left"
                  dx={-35}
                  fill="#616161"
                  fontSize={14}
                  style={{ textAnchor: "middle" }}
                />
              )}
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={chartColor}
              strokeWidth={isSmallScreen ? 1.5 : 2}
              dot={{ fill: chartColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart
            data={data}
            margin={margin}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey={xAxisKey}
              interval={0}
              tickFormatter={truncateLabel}
              angle={0}
              tick={{
                fontSize: isSmallScreen ? 10 : 12,
                fill: "#616161",
              }}
            >
              {xAxisLabel && (
                <Label
                  value={xAxisLabel}
                  position="bottom"
                  dy={25}
                  fill="#616161"
                  fontSize={14}
                />
              )}
            </XAxis>
            <YAxis
              domain={[0, yAxisMax]}
              tickCount={yAxisTickCount}
              tick={{ fontSize: 12, fill: "#616161" }}
            >
              {yAxisLabel && (
                <Label
                  value={yAxisLabel}
                  angle={-90}
                  position="left"
                  dx={-35}
                  fill="#616161"
                  fontSize={14}
                  style={{ textAnchor: "middle" }}
                />
              )}
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={dataKey}
              fill={chartColor}
              stroke={chartColor}
              fillOpacity={0.6}
            />
          </AreaChart>
        );
      case "bar":
      default:
        return (
          <BarChart
            data={data}
            margin={margin}
            barGap={isSmallScreen ? 20 : 5}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey={xAxisKey}
              interval={0}
              tickFormatter={truncateLabel}
              angle={0}
              tick={{
                fontSize: isSmallScreen ? 10 : 12,
                fill: "#616161",
              }}
            >
              {xAxisLabel && (
                <Label
                  value={xAxisLabel}
                  position="bottom"
                  dy={25}
                  fill="#616161"
                  fontSize={14}
                />
              )}
            </XAxis>
            <YAxis
              domain={[0, yAxisMax]}
              tickCount={yAxisTickCount}
              tick={{ fontSize: 12, fill: "#616161" }}
            >
              {yAxisLabel && (
                <Label
                  value={yAxisLabel}
                  angle={-90}
                  position="left"
                  dx={-35}
                  fill="#616161"
                  fontSize={14}
                  style={{ textAnchor: "middle" }}
                />
              )}
            </YAxis>
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            {showLegend && <Legend />}
            <Bar
              dataKey={dataKey}
              fill={chartColor}
              radius={barRadius}
              barSize={isSmallScreen ? 15 : undefined}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: height || 400,
        overflowX: isSmallScreen ? "auto" : "hidden",
      }}
    >
      <div
        style={{
          minWidth: isSmallScreen ? `${smallScreenMinWidth}px` : "100%",
          height: "100%",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReusableChart;