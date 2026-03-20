import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

interface ChartConfig {
  type: 'bar' | 'line' | 'pie'
  labelColumn: string
  valueColumns: string[]
}

interface ResultsChartProps {
  config: ChartConfig
  rows: Record<string, unknown>[]
}

const COLORS = ['#89b4fa', '#a6e3a1', '#fab387', '#f38ba8', '#cba6f7']

const tooltipStyle = {
  contentStyle: { background: '#1e1e2e', border: '1px solid #313244', color: '#cdd6f4', fontSize: 12 },
  itemStyle: { color: '#cdd6f4' }
}

const axisProps = { tick: { fill: '#a6adc8', fontSize: 11 } }

export const ResultsChart: React.FC<ResultsChartProps> = ({ config, rows }) => {
  const { type, labelColumn, valueColumns } = config

  const data = rows.map((row) => {
    const item: Record<string, unknown> = { name: String(row[labelColumn] ?? '') }
    for (const col of valueColumns) {
      item[col] = Number(row[col]) || 0
    }
    return item
  })

  if (type === 'pie') {
    const valueCol = valueColumns[0]
    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey={valueCol} nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'line') {
    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipStyle} />
            {valueColumns.map((col, i) => (
              <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Default: bar
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip {...tooltipStyle} />
          {valueColumns.map((col, i) => (
            <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
