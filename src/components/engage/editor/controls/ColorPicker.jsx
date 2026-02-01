// src/components/engage/editor/controls/ColorPicker.jsx
// Color picker with brand color presets

import { useState, useRef, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Common colors
const COMMON_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617',
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', // reds
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12', // yellows
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', // greens
  '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', // cyans
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', // blues
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', // purples
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', // pinks
]

export default function ColorPicker({ 
  label, 
  value, 
  onChange, 
  brandColors,
  showBrandPresets = true 
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  
  useEffect(() => {
    setInputValue(value)
  }, [value])
  
  const handleInputChange = (e) => {
    let val = e.target.value
    setInputValue(val)
    
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val)
    }
  }
  
  const handleInputBlur = () => {
    // Reset to current value if invalid
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value)
    }
  }
  
  // Brand color presets
  const brandPresets = showBrandPresets && brandColors ? [
    { color: brandColors.primary, label: 'Primary' },
    { color: brandColors.secondary || brandColors.primaryDark, label: 'Secondary' },
  ].filter(p => p.color) : []
  
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-8 h-8 rounded-lg border border-[var(--glass-border)] shadow-sm flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-[var(--brand-primary)]/50 transition-all"
              style={{ backgroundColor: value }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-3" align="start">
            <div className="space-y-3">
              {/* Brand Colors */}
              {brandPresets.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Brand Colors</Label>
                  <div className="flex gap-2">
                    {brandPresets.map((preset, i) => (
                      <button
                        key={i}
                        className={cn(
                          "flex-1 h-8 rounded-md border transition-all",
                          value === preset.color 
                            ? "ring-2 ring-offset-2 ring-[var(--brand-primary)]" 
                            : "hover:ring-2 hover:ring-offset-1 hover:ring-gray-300"
                        )}
                        style={{ backgroundColor: preset.color }}
                        onClick={() => {
                          onChange(preset.color)
                          setInputValue(preset.color)
                        }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Color Grid */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Colors</Label>
                <div className="grid grid-cols-12 gap-1">
                  {COMMON_COLORS.map((color, i) => (
                    <button
                      key={i}
                      className={cn(
                        "w-5 h-5 rounded-sm border border-gray-200 transition-all",
                        value === color 
                          ? "ring-2 ring-offset-1 ring-[var(--brand-primary)]" 
                          : "hover:scale-110"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        onChange(color)
                        setInputValue(color)
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Custom Color Input */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Custom</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => {
                      onChange(e.target.value)
                      setInputValue(e.target.value)
                    }}
                    className="w-10 h-8 p-0 border-0 cursor-pointer rounded"
                  />
                  <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="#000000"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  )
}
