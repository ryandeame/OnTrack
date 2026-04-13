import React from 'react';
import { View } from 'react-native';
import { SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk';
import { useFont } from '@shopify/react-native-skia';
import { CartesianChart, Line, Scatter } from 'victory-native';

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
  const font = useFont(SpaceGrotesk_400Regular, 10);

  if (!font) {
    return <View style={{ width: chartWidth, height: 300 }} />;
  }

  return (
    <View style={{ width: chartWidth, height: 300, position: 'relative' }}>
      <CartesianChart
        data={chartData}
        xKey="day"
        yKeys={['value']}
        padding={{ bottom: 20 }}
        domainPadding={{ left: 15, right: 15, top: 5, bottom: 5 }}
        xAxis={{
          tickCount: chartData.length,
          font,
          lineWidth: 0,
          labelRotate: 90,
          labelColor: chartAxisColor,
        }}
        yAxis={[{ yKeys: ['value'], font, axisSide: 'right', labelColor: chartAxisColor }]}>
        {({ points }) => (
          <>
            <Line
              points={points.value}
              color={chartLineColor}
              curveType="linear"
              animate={{ type: 'timing', duration: 250 }}
              connectMissingData
            />
            <Scatter points={points.value} radius={3} color={chartLineColor} />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
