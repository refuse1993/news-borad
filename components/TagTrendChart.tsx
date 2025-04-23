// components/TagTrendChart.tsx
'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Text } from 'recharts';

interface TagTrend {
  date: string;
  tag: string;
  count: number;
}

interface TagTrendChartProps {
  trends: TagTrend[];
  tagName: string;
}

// 날짜 형식 변환 (YYYY-WXX 형식에서 더 읽기 쉬운 형식으로)
const formatDate = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('-W')) return dateStr;
  
  try {
    const [year, week] = dateStr.split('-W');
    return `${year}년 ${week}주`;
  } catch (e) {
    return dateStr;
  }
};

export default function TagTrendChart({ trends, tagName }: TagTrendChartProps) {
  // 차트 데이터 준비
  const chartData = useMemo(() => {
    // 날짜순으로 정렬
    return [...trends].sort((a, b) => a.date.localeCompare(b.date));
  }, [trends]);

  // 데이터가 없는 경우
  if (trends.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 text-sm">
          {tagName} 태그의 트렌드 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis 
            allowDecimals={false}
            tick={{ fontSize: 10 }}
            label={
              <Text
                x={0}
                y={0}
                dx={-30}
                dy={40}
                offset={0}
                angle={-90}
                fontSize={10}
              >
                언급 횟수
              </Text>
            }
          />
          <Tooltip 
            formatter={(value) => [`${value}회`, '언급 수']}
            labelFormatter={formatDate}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#4f46e5" 
            strokeWidth={2}
            activeDot={{ r: 6 }} 
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}