'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { DailyMetric } from '@/types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-3 border text-[12px]" style={{ background: 'var(--bg3)', borderColor: 'var(--border2)' }}>
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: £{p.value.toLocaleString()}</p>)}
    </div>
  )
}

export function SpendRevenueChart({ data }: { data: DailyMetric[] }) {
  const sampled = data.filter((_, i) => i % 2 === 0)
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={sampled} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval={3} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} tickFormatter={v => `£${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text2)' }} iconType="plainline" iconSize={12} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#00d4a0" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#00d4a0' }} />
        <Line type="monotone" dataKey="spend" name="Spend" stroke="#555a6a" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 3, fill: '#555a6a' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
