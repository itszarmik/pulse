'use client'
import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, RotateCcw, Zap } from 'lucide-react'

type Campaign = {
  id: string; name: string; platform: string
  spend: number; revenue: number; roas: number; status: string
}

const PLATFORM_COLORS: Record<string,string> = { Meta:'#1877f2', Google:'#ea4335', TikTok:'#00d4a0' }

export function BudgetSimulator({ campaigns }: { campaigns: Campaign[] }) {
  const totalBudget = useMemo(() => campaigns.reduce((s,c) => s + c.spend, 0), [campaigns])
  const [allocations, setAllocations] = useState<Record<string,number>>({})
  const [dragging, setDragging] = useState<string|null>(null)

  // Sync allocations when campaigns load/change
  useEffect(() => {
    if (campaigns.length === 0) return
    const init: Record<string,number> = {}
    campaigns.forEach(c => { init[c.id] = c.spend })
    setAllocations(init)
  }, [campaigns])

  // Reset to original
  const reset = () => {
    const init: Record<string,number> = {}
    campaigns.forEach(c => { init[c.id] = c.spend })
    setAllocations(init)
  }

  // When user moves a slider, keep total budget constant by redistributing remainder proportionally
  const handleSlider = (id: string, newVal: number) => {
    const clamped = Math.max(0, Math.min(newVal, totalBudget))
    const others = campaigns.filter(c => c.id !== id)
    const currentOthersTotal = others.reduce((s,c) => s + (allocations[c.id] || 0), 0)
    const remaining = totalBudget - clamped

    setAllocations(prev => {
      const next = { ...prev, [id]: clamped }
      if (currentOthersTotal === 0) {
        // distribute evenly
        const each = remaining / others.length
        others.forEach(c => { next[c.id] = Math.max(0, each) })
      } else {
        // proportional distribution
        others.forEach(c => {
          const share = (prev[c.id] || 0) / currentOthersTotal
          next[c.id] = Math.max(0, remaining * share)
        })
      }
      return next
    })
  }

  // Calculate projected metrics
  const projected = useMemo(() => {
    let revenue = 0
    campaigns.forEach(c => {
      const spend = allocations[c.id] || 0
      revenue += spend * c.roas
    })
    const roas = totalBudget > 0 ? revenue / totalBudget : 0
    return { revenue, roas }
  }, [allocations, campaigns, totalBudget])

  const originalRevenue = useMemo(() =>
    campaigns.reduce((s,c) => s + c.revenue, 0), [campaigns])
  const originalROAS = totalBudget > 0 ? originalRevenue / totalBudget : 0

  const revLift = projected.revenue - originalRevenue
  const roasLift = projected.roas - originalROAS

  // Sorted by ROAS descending for better UX
  const sorted = useMemo(() =>
    [...campaigns].sort((a,b) => b.roas - a.roas), [campaigns])

  return (
    <div className="rounded-xl border p-6" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[14px] font-bold flex items-center gap-2">
            <Zap size={15} style={{ color:'var(--teal)' }}/>
            Real-time budget simulator
          </div>
          <p className="text-[11px] mt-0.5" style={{ color:'var(--text3)' }}>
            Drag the sliders to reallocate budget â projected revenue updates instantly. Total budget stays fixed at £{totalBudget.toLocaleString()}.
          </p>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all hover:bg-[var(--bg3)]"
          style={{ borderColor:'var(--border2)', color:'var(--text2)' }}>
          <RotateCcw size={11}/> Reset
        </button>
      </div>

      {/* Live outcome bar */}
      <div className="grid grid-cols-3 gap-3 mb-6 mt-4">
        <div className="rounded-lg p-3 border" style={{ background:'var(--bg3)', borderColor:'var(--border)' }}>
          <div className="text-[10px] uppercase font-semibold mb-1" style={{ color:'var(--text3)' }}>Total budget</div>
          <div className="text-[20px] font-bold font-mono" style={{ color:'var(--text)' }}>£{totalBudget.toLocaleString()}</div>
          <div className="text-[10px] mt-0.5" style={{ color:'var(--text3)' }}>Fixed</div>
        </div>
        <div className="rounded-lg p-3 border transition-all" style={{
          background: revLift > 0 ? 'rgba(0,212,160,0.08)' : revLift < 0 ? 'rgba(255,92,92,0.08)' : 'var(--bg3)',
          borderColor: revLift > 0 ? 'rgba(0,212,160,0.3)' : revLift < 0 ? 'rgba(255,92,92,0.3)' : 'var(--border)'
        }}>
          <div className="text-[10px] uppercase font-semibold mb-1" style={{ color:'var(--text3)' }}>Projected revenue</div>
          <div className="text-[20px] font-bold font-mono" style={{ color: revLift > 0 ? 'var(--teal)' : revLift < 0 ? 'var(--danger)' : 'var(--text)' }}>
            £{Math.round(projected.revenue).toLocaleString()}
          </div>
          <div className="text-[10px] mt-0.5 font-semibold" style={{ color: revLift > 0 ? 'var(--teal)' : revLift < 0 ? 'var(--danger)' : 'var(--text3)' }}>
            {revLift === 0 ? 'No change' : `${revLift > 0 ? '+' : ''}£${Math.round(revLift).toLocaleString()}/mo vs current`}
          </div>
        </div>
        <div className="rounded-lg p-3 border transition-all" style={{
          background: roasLift > 0 ? 'rgba(0,212,160,0.08)' : roasLift < 0 ? 'rgba(255,92,92,0.08)' : 'var(--bg3)',
          borderColor: roasLift > 0 ? 'rgba(0,212,160,0.3)' : roasLift < 0 ? 'rgba(255,92,92,0.3)' : 'var(--border)'
        }}>
          <div className="text-[10px] uppercase font-semibold mb-1" style={{ color:'var(--text3)' }}>Projected ROAS</div>
          <div className="text-[20px] font-bold font-mono" style={{ color: roasLift > 0 ? 'var(--teal)' : roasLift < 0 ? 'var(--danger)' : 'var(--text)' }}>
            {projected.roas.toFixed(2)}x
          </div>
          <div className="text-[10px] mt-0.5 font-semibold" style={{ color: roasLift > 0 ? 'var(--teal)' : roasLift < 0 ? 'var(--danger)' : 'var(--text3)' }}>
            {roasLift === 0 ? `Was ${originalROAS.toFixed(2)}x` : `${roasLift > 0 ? '+' : ''}${roasLift.toFixed(2)}x vs ${originalROAS.toFixed(2)}x`}
          </div>
        </div>
      </div>

      {/* Campaign sliders */}
      <div className="flex flex-col gap-4">
        {sorted.map(c => {
          const alloc = allocations[c.id] || 0
          const pct = totalBudget > 0 ? (alloc / totalBudget) * 100 : 0
          const origPct = totalBudget > 0 ? (c.spend / totalBudget) * 100 : 0
          const projRev = alloc * c.roas
          const origRev = c.spend * c.roas
          const lift = projRev - origRev
          const roasColor = c.roas >= 4 ? 'var(--teal)' : c.roas >= 2.5 ? '#4ade80' : c.roas >= 1.5 ? 'var(--warn)' : 'var(--danger)'

          return (
            <div key={c.id} className="rounded-lg border p-4" style={{ background:'var(--bg3)', borderColor: dragging === c.id ? 'rgba(0,212,160,0.4)' : 'var(--border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: PLATFORM_COLORS[c.platform] || '#888' }}/>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold truncate">{c.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color:'var(--text3)' }}>{c.platform}</span>
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ background: roasColor + '18', color: roasColor }}>{c.roas.toFixed(1)}x ROAS</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-[14px] font-bold font-mono">£{Math.round(alloc).toLocaleString()}</div>
                  {alloc !== c.spend && (
                    <div className="text-[10px] font-mono" style={{ color: alloc > c.spend ? 'var(--teal)' : 'var(--danger)' }}>
                      {alloc > c.spend ? '+' : ''}£{Math.round(alloc - c.spend).toLocaleString()} vs original
                    </div>
                  )}
                </div>
              </div>

              {/* Slider */}
              <div className="relative mb-2">
                {/* Original position marker */}
                <div className="absolute top-0 w-0.5 h-4 rounded-full z-10"
                  style={{ left: `${origPct}%`, background: 'rgba(255,255,255,0.2)', transform: 'translateX(-50%)' }}/>
                <input
                  type="range" min={0} max={totalBudget} step={50}
                  value={Math.round(alloc)}
                  onMouseDown={() => setDragging(c.id)}
                  onMouseUp={() => setDragging(null)}
                  onTouchStart={() => setDragging(c.id)}
                  onTouchEnd={() => setDragging(null)}
                  onChange={e => handleSlider(c.id, parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${roasColor} ${pct}%, var(--bg4) ${pct}%)`,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Budget distribution bar */}
              <div className="flex items-center justify-between text-[10px]" style={{ color:'var(--text3)' }}>
                <span>£0</span>
                <span className="font-semibold" style={{ color: lift !== 0 ? (lift > 0 ? 'var(--teal)' : 'var(--danger)') : 'var(--text3)' }}>
                  {lift === 0 ? `Rev: £${Math.round(projRev).toLocaleString()}` : `Rev: £${Math.round(projRev).toLocaleString()} (${lift > 0 ? '+' : ''}£${Math.round(lift).toLocaleString()})`}
                </span>
                <span>£{totalBudget.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Budget distribution visualiser */}
      <div className="mt-5 pt-4 border-t" style={{ borderColor:'var(--border)' }}>
        <div className="text-[11px] font-semibold mb-2" style={{ color:'var(--text2)' }}>Budget distribution</div>
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {sorted.map(c => {
            const pct = totalBudget > 0 ? (allocations[c.id] || 0) / totalBudget * 100 : 0
            return (
              <div key={c.id} className="h-full transition-all duration-150 relative group"
                style={{ width: `${pct}%`, background: PLATFORM_COLORS[c.platform] || '#888', opacity: 0.8 }}
                title={`${c.name}: £${Math.round(allocations[c.id]||0).toLocaleString()}`}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {sorted.map(c => (
            <div key={c.id} className="flex items-center gap-1.5 text-[10px]" style={{ color:'var(--text2)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[c.platform] || '#888' }}/>
              <span className="truncate max-w-[140px]">{c.name}</span>
              <span className="font-mono font-semibold">£{Math.round(allocations[c.id]||0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
