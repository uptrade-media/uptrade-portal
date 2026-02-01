// src/components/engage/editor/controls/GradientPicker.jsx
// Gradient picker with type, angle, and color stops

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import ColorPicker from './ColorPicker'

// Gradient types
const GRADIENT_TYPES = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
]

// Angle presets
const ANGLE_PRESETS = [
  { value: 0, label: '→' },
  { value: 45, label: '↗' },
  { value: 90, label: '↑' },
  { value: 135, label: '↖' },
  { value: 180, label: '←' },
  { value: 225, label: '↙' },
  { value: 270, label: '↓' },
  { value: 315, label: '↘' },
]

// Gradient presets
const GRADIENT_PRESETS = [
  { colors: ['#667eea', '#764ba2'], name: 'Purple Haze' },
  { colors: ['#f093fb', '#f5576c'], name: 'Pink Glow' },
  { colors: ['#4facfe', '#00f2fe'], name: 'Ocean Blue' },
  { colors: ['#43e97b', '#38f9d7'], name: 'Fresh Mint' },
  { colors: ['#fa709a', '#fee140'], name: 'Sunset' },
  { colors: ['#a8edea', '#fed6e3'], name: 'Soft Pink' },
  { colors: ['#ff9a9e', '#fecfef'], name: 'Peach' },
  { colors: ['#667eea', '#764ba2', '#f093fb'], name: 'Multi' },
]

export default function GradientPicker({ value, onChange, brandColors }) {
  // value = { type: 'linear', angle: 135, colors: ['#hex1', '#hex2'] }
  
  const getGradientCSS = (grad) => {
    if (!grad || !grad.colors?.length) return '#f0f0f0'
    
    if (grad.type === 'radial') {
      return `radial-gradient(circle, ${grad.colors.join(', ')})`
    }
    return `linear-gradient(${grad.angle || 135}deg, ${grad.colors.join(', ')})`
  }
  
  const updateColor = (index, color) => {
    const newColors = [...value.colors]
    newColors[index] = color
    onChange({ ...value, colors: newColors })
  }
  
  const addColor = () => {
    onChange({ ...value, colors: [...value.colors, '#ffffff'] })
  }
  
  const removeColor = (index) => {
    if (value.colors.length <= 2) return
    const newColors = value.colors.filter((_, i) => i !== index)
    onChange({ ...value, colors: newColors })
  }
  
  const applyPreset = (preset) => {
    onChange({ ...value, colors: preset.colors })
  }
  
  const applyBrandGradient = () => {
    onChange({
      ...value,
      colors: [brandColors.primary, brandColors.secondary || brandColors.primaryDark]
    })
  }
  
  return (
    <div className="space-y-3">
      {/* Preview */}
      <div
        className="h-12 rounded-lg border border-[var(--glass-border)]"
        style={{ background: getGradientCSS(value) }}
      />
      
      {/* Presets */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Presets</Label>
        <div className="flex flex-wrap gap-2">
          {/* Brand gradient */}
          <button
            onClick={applyBrandGradient}
            className="w-8 h-8 rounded-md border border-[var(--glass-border)] hover:ring-2 hover:ring-offset-1 hover:ring-[var(--brand-primary)]/50 transition-all"
            style={{
              background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary || brandColors.primaryDark})`
            }}
            title="Brand Gradient"
          />
          
          {GRADIENT_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => applyPreset(preset)}
              className="w-8 h-8 rounded-md border border-[var(--glass-border)] hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-all"
              style={{
                background: `linear-gradient(135deg, ${preset.colors.join(', ')})`
              }}
              title={preset.name}
            />
          ))}
        </div>
      </div>
      
      {/* Type and Angle */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={value.type}
            onValueChange={(v) => onChange({ ...value, type: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADIENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {value.type === 'linear' && (
          <div>
            <Label className="text-xs text-muted-foreground">Angle</Label>
            <div className="flex items-center gap-1 mt-1">
              {ANGLE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => onChange({ ...value, angle: preset.value })}
                  className={cn(
                    "w-6 h-6 rounded text-xs flex items-center justify-center transition-colors",
                    value.angle === preset.value
                      ? "bg-[var(--brand-primary)] text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  )}
                  title={`${preset.value}°`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Angle Slider */}
      {value.type === 'linear' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Custom Angle</Label>
            <span className="text-xs text-muted-foreground">{value.angle}°</span>
          </div>
          <Slider
            value={[value.angle || 135]}
            onValueChange={([v]) => onChange({ ...value, angle: v })}
            min={0}
            max={360}
            step={1}
          />
        </div>
      )}
      
      {/* Color Stops */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Colors</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={addColor}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        
        <div className="space-y-2">
          {value.colors.map((color, index) => (
            <div key={index} className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="w-8 h-8 rounded-md border border-[var(--glass-border)] cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-[var(--brand-primary)]/50 transition-all"
                    style={{ backgroundColor: color }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-3" align="start">
                  <ColorPicker
                    label={`Color ${index + 1}`}
                    value={color}
                    onChange={(c) => updateColor(index, c)}
                    brandColors={brandColors}
                  />
                </PopoverContent>
              </Popover>
              
              <span className="flex-1 font-mono text-xs text-muted-foreground">
                {color}
              </span>
              
              {value.colors.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeColor(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
