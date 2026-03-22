'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DATA = [
  { name: 'Meta', value: 46, color: '#1877f2' },
  { name: 'Google', value: 32, color: '#ea4335' },
  { name: 'TikTok', value: 22, color: '#00d4a0' },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-2.5 border text-[12px]" style={{ background: 'var(--bg3)', borderColor: 'var(--border2)' }}>
      <p style={{ color: payload[0].payload.color }}>{payload[0].name}: {payload[0].value}%</p>
    </div>
  )
}

export function PlatformDonut() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={2} dataKey="value">
          {DATA.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--text2)' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
