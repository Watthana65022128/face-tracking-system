'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts'

interface BehaviorData {
  behavior: string
  count: number
  totalTime: number
  color: string
  lightColor: string
}

interface BehaviorChartProps {
  data: BehaviorData[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    color: string
    dataKey: string
  }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const countData = payload.find(p => p.dataKey === 'count')
    const timeData = payload.find(p => p.dataKey === 'totalTime')
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {countData && (
          <p className="text-sm" style={{ color: countData.color }}>
            จำนวนครั้ง: <span className="font-semibold">{countData.value}</span>
          </p>
        )}
        {timeData && (
          <p className="text-sm" style={{ color: timeData.color }}>
            เวลารวม: <span className="font-semibold">{timeData.value.toFixed(1)} วินาที</span>
          </p>
        )}
      </div>
    )
  }
  return null
}

export function BehaviorChart({ data }: BehaviorChartProps) {
  // เตรียมข้อมูลสำหรับกราฟ
  const chartData = data.map(item => ({
    name: item.behavior,
    count: item.count,
    totalTime: item.totalTime,
    color: item.color,
    lightColor: item.lightColor
  }))

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#ddd' }}
          />
          <YAxis 
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#ddd' }}
            label={{ 
              value: 'จำนวนครั้ง', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
            }}
            domain={[0, 100]}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#ddd' }}
            label={{ 
              value: 'เวลา (วินาที)', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
            }}
            domain={[0, 500]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar 
            yAxisId="left"
            dataKey="count" 
            name="จำนวนครั้ง"
            radius={[2, 2, 0, 0]}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => {
              const item = data.find(d => d.behavior === entry.name)
              return (
                <Cell key={`count-${index}`} fill={item ? item.color : '#3b82f6'} />
              )
            })}
          </Bar>
          <Bar 
            yAxisId="right"
            dataKey="totalTime" 
            name="เวลารวม (วินาที)"
            radius={[2, 2, 0, 0]}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => {
              const item = data.find(d => d.behavior === entry.name)
              return (
                <Cell key={`time-${index}`} fill={item ? item.lightColor : '#93c5fd'} />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}