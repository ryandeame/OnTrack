import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryLabel, VictoryLine, VictoryScatter, VictoryTheme } from 'victory';

type ChartPoint = { day: string; value: number };

type DashboardHistoryChartProps = {
  chartData: ChartPoint[];
  chartWidth: number;
  chartAxisColor: string;
  chartLineColor: string;
};

export default function DashboardHistoryChart({
  chartData,
  chartWidth,
  chartAxisColor,
  chartLineColor,
}: DashboardHistoryChartProps) {
  const isMobileWidth = chartWidth < 420;
  const plotData = chartData.map((d) => ({ x: d.day, y: d.value }));
  const yValues = plotData.map((d) => d.y);
  const minY = yValues.length ? Math.min(...yValues) : 0;
  const maxY = yValues.length ? Math.max(...yValues) : 1;

  const buildYTicks = () => {
    const safeMin = Number.isFinite(minY) ? minY : 0;
    const safeMax = Number.isFinite(maxY) ? maxY : 1;
    const low = Math.min(safeMin, safeMax);
    const high = Math.max(safeMin, safeMax);
    const range = Math.max(1, high - low);
    const roughStep = range / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const multiples = [1, 2, 5, 10];
    const step = multiples.find((m) => m * magnitude >= roughStep)! * magnitude;
    const start = Math.max(0, Math.floor(low / step) * step);
    const end = Math.ceil(high / step) * step;
    const ticks: number[] = [];

    for (let value = start; value <= end + step / 100; value += step) {
      ticks.push(Number(value.toFixed(6)));
    }

    return ticks.length ? ticks : [0, 1];
  };

  const yTickValues = buildYTicks();
  const xTickValues = plotData.map((point) => point.x);
  const chartHeight = isMobileWidth ? 320 : 260;

  const formatYTick = (value: number) => {
    if (Math.abs(value) >= 100) {
      return Math.round(value).toString();
    }

    return Number(value.toFixed(1)).toString();
  };

  return (
    <View style={{ width: chartWidth }}>
      <View style={[styles.chartArea, { minHeight: chartHeight }]}>
        <VictoryChart
          width={chartWidth}
          height={chartHeight}
          theme={VictoryTheme.clean}
          domainPadding={{ x: isMobileWidth ? 12 : 18, y: 10 }}
          padding={{
            top: 20,
            bottom: isMobileWidth ? 72 : 64,
            left: isMobileWidth ? 16 : 24,
            right: isMobileWidth ? 62 : 56,
          }}>
          <VictoryAxis
            tickValues={xTickValues}
            fixLabelOverlap={false}
            tickLabelComponent={
              <VictoryLabel
                angle={90}
                textAnchor="middle"
                verticalAnchor="middle"
                dx={0}
                dy={0}
              />
            }
            style={{
              axis: { stroke: chartAxisColor, strokeWidth: 1 },
              tickLabels: {
                fill: chartAxisColor,
                fontSize: isMobileWidth ? 9 : 10,
                padding: isMobileWidth ? 12 : 14,
              },
              ticks: { stroke: chartAxisColor, size: 4 },
              grid: { stroke: 'transparent' },
            }}
          />
          <VictoryAxis
            dependentAxis
            orientation="right"
            tickValues={yTickValues}
            fixLabelOverlap={false}
            tickFormat={formatYTick}
            style={{
              axis: { stroke: chartAxisColor, strokeWidth: 1 },
              tickLabels: {
                fill: chartAxisColor,
                fontSize: isMobileWidth ? 8 : 9,
                padding: 4,
              },
              ticks: { stroke: chartAxisColor, size: 4 },
              grid: { stroke: 'rgba(148, 163, 184, 0.2)' },
            }}
          />
          <VictoryLine
            data={plotData}
            interpolation="linear"
            style={{
              data: { stroke: chartLineColor, strokeWidth: 2.5 },
            }}
          />
          <VictoryScatter
            data={plotData}
            size={3}
            style={{
              data: { fill: chartLineColor },
            }}
          />
        </VictoryChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartArea: {
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
