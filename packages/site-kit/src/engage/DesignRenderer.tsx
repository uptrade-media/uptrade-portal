/**
 * @uptrade/site-kit/engage - Design Renderer
 * 
 * Renders design_json from Engage Studio as React components.
 * This is the runtime renderer that converts the visual builder's
 * JSON structure into actual React elements.
 */

'use client'

import React, { createElement, CSSProperties, MouseEvent, useState } from 'react'

// ============================================
// Types
// ============================================

export interface DesignNode {
  id: string
  type: string
  name: string
  children?: DesignNode[]
  props?: Record<string, any>
  style?: CSSProperties
}

export interface DesignDocument {
  id: string
  type: string
  name: string
  children: DesignNode[]
  style?: CSSProperties
  props?: Record<string, any>
}

export interface DesignRendererProps {
  design: DesignDocument
  onClose?: () => void
  onAction?: (action: ActionConfig, node: DesignNode) => void
  context?: EngageContext
}

export interface ActionConfig {
  action: string
  url?: string
  newTab?: boolean
  target?: string
  text?: string
  productId?: string
  formId?: string
}

export interface EngageContext {
  // Site-Kit context data that can be bound to elements
  user?: {
    name?: string
    email?: string
    isLoggedIn?: boolean
  }
  cart?: {
    itemCount?: number
    total?: number
  }
  page?: {
    url?: string
    title?: string
  }
  // Custom data from the page
  [key: string]: any
}

// ============================================
// Action Handlers
// ============================================

function handleAction(
  action: ActionConfig,
  node: DesignNode,
  onClose?: () => void,
  onAction?: (action: ActionConfig, node: DesignNode) => void,
): void {
  if (!action?.action || action.action === 'none') return

  // Let parent handle custom actions
  if (onAction) {
    onAction(action, node)
  }

  switch (action.action) {
    case 'link':
      if (action.url) {
        if (action.newTab) {
          window.open(action.url, '_blank', 'noopener,noreferrer')
        } else {
          window.location.href = action.url
        }
      }
      break

    case 'scroll':
      if (action.target) {
        const element = document.querySelector(action.target)
        element?.scrollIntoView({ behavior: 'smooth' })
      }
      break

    case 'close':
      onClose?.()
      break

    case 'copy':
      if (action.text) {
        navigator.clipboard.writeText(action.text).catch(console.error)
      }
      break

    case 'share':
      if (navigator.share) {
        navigator.share({
          title: document.title,
          url: window.location.href,
        }).catch(console.error)
      }
      break

    case 'download':
      if (action.url) {
        const a = document.createElement('a')
        a.href = action.url
        a.download = ''
        a.click()
      }
      break

    // Commerce actions - these should be handled by onAction callback
    case 'add_to_cart':
    case 'checkout':
    case 'book':
    case 'submit_form':
    case 'open_form':
      // Handled by parent via onAction
      break
  }
}

// ============================================
// Animation Styles
// ============================================

const animationKeyframes = `
@keyframes engageFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes engageFadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes engageFadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes engageSlideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes engageSlideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes engageSlideInUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
@keyframes engageScaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes engageBounceIn { 0% { opacity: 0; transform: scale(0.3); } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
`

function getAnimationStyle(animation?: string, delay?: number, duration?: number): CSSProperties {
  if (!animation || animation === 'none') return {}
  
  const animationMap: Record<string, string> = {
    fadeIn: 'engageFadeIn',
    fadeInUp: 'engageFadeInUp',
    fadeInDown: 'engageFadeInDown',
    slideInLeft: 'engageSlideInLeft',
    slideInRight: 'engageSlideInRight',
    slideInUp: 'engageSlideInUp',
    scaleIn: 'engageScaleIn',
    bounceIn: 'engageBounceIn',
  }
  
  const animationName = animationMap[animation]
  if (!animationName) return {}
  
  return {
    animation: `${animationName} ${duration || 300}ms ease-out ${delay || 0}ms forwards`,
    opacity: 0, // Start invisible, animation will show it
  }
}

// ============================================
// Node Renderer
// ============================================

interface NodeRendererProps {
  node: DesignNode
  onClose?: () => void
  onAction?: (action: ActionConfig, node: DesignNode) => void
  context?: EngageContext
}

function NodeRenderer({ node, onClose, onAction, context }: NodeRendererProps): React.ReactElement | null {
  const [isHovered, setIsHovered] = useState(false)
  const { type, props = {}, style = {}, children } = node

  // Build styles with hover effects
  const computedStyle: CSSProperties = { ...style }
  
  // Apply animation
  if (props.animation) {
    Object.assign(computedStyle, getAnimationStyle(
      props.animation,
      props.animationDelay,
      props.animationDuration
    ))
  }
  
  // Apply hover effects
  if (isHovered) {
    if (props.hoverScale && props.hoverScale !== 'none') {
      computedStyle.transform = `scale(${props.hoverScale})`
      computedStyle.transition = 'transform 0.2s ease'
    }
    if (props.hoverShadow && props.hoverShadow !== 'none') {
      const shadowMap: Record<string, string> = {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      }
      computedStyle.boxShadow = shadowMap[props.hoverShadow]
    }
  }

  // Event handlers
  const eventHandlers: Record<string, (e: MouseEvent) => void> = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }
  
  // Click handler
  if (props.onClick) {
    eventHandlers.onClick = (e: MouseEvent) => {
      e.preventDefault()
      handleAction(props.onClick, node, onClose, onAction)
    }
    computedStyle.cursor = 'pointer'
  }

  // Render children recursively
  const renderedChildren = children?.map((child) => (
    <NodeRenderer
      key={child.id}
      node={child}
      onClose={onClose}
      onAction={onAction}
      context={context}
    />
  ))

  // Render based on type
  switch (type) {
    case 'Container':
    case 'Box':
    case 'Section':
      return (
        <div style={computedStyle} {...eventHandlers}>
          {renderedChildren}
        </div>
      )

    case 'Text':
      return (
        <p style={computedStyle} {...eventHandlers}>
          {resolveText(props.text, context)}
        </p>
      )

    case 'Heading':
      const HeadingTag = `h${props.level || 2}` as keyof JSX.IntrinsicElements
      return createElement(
        HeadingTag,
        { style: computedStyle, ...eventHandlers },
        resolveText(props.text, context)
      )

    case 'Button':
    case 'BookingButton':
    case 'BuyNow':
    case 'AddToCart':
    case 'EventRSVP':
      return (
        <button
          style={computedStyle}
          {...eventHandlers}
          type="button"
        >
          {resolveText(props.text || props.label, context) || 'Button'}
        </button>
      )

    case 'Image':
      return (
        <img
          src={props.src}
          alt={props.alt || ''}
          style={computedStyle}
          {...eventHandlers}
        />
      )

    case 'Link':
      return (
        <a
          href={props.href || '#'}
          target={props.newTab ? '_blank' : undefined}
          rel={props.newTab ? 'noopener noreferrer' : undefined}
          style={computedStyle}
          {...eventHandlers}
        >
          {resolveText(props.text, context) || renderedChildren}
        </a>
      )

    case 'Input':
      return (
        <input
          type={props.inputType || 'text'}
          placeholder={props.placeholder}
          style={computedStyle}
          {...eventHandlers}
        />
      )

    case 'Divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', ...computedStyle }} />

    case 'Spacer':
      return <div style={{ ...computedStyle, width: props.width, height: props.height }} />

    case 'Icon':
      // Simple emoji/text icon rendering
      return (
        <span style={computedStyle} {...eventHandlers}>
          {props.icon || '★'}
        </span>
      )

    case 'FormEmbed':
      // For form embeds, we need to render the form from Forms module
      // This would integrate with the ManagedForm component
      return (
        <div 
          style={computedStyle} 
          data-engage-form={props.form_id}
          {...eventHandlers}
        >
          {/* ManagedForm would be rendered here by the parent */}
          <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
            Form: {props.form_id || 'Not configured'}
          </div>
        </div>
      )

    case 'ProductCard':
    case 'EventCard':
      // Product/event cards need data binding from Commerce
      return (
        <div 
          style={computedStyle} 
          data-engage-offering={props.offering_id}
          {...eventHandlers}
        >
          {renderedChildren}
        </div>
      )

    default:
      // Unknown type - render as div with children
      console.warn(`[DesignRenderer] Unknown node type: ${type}`)
      return (
        <div style={computedStyle} {...eventHandlers}>
          {renderedChildren}
        </div>
      )
  }
}

// ============================================
// Text Resolution (Data Bindings)
// ============================================

function resolveText(text: string | undefined, context?: EngageContext): string {
  if (!text) return ''
  if (!context) return text
  
  // Replace {{variable}} patterns with context values
  return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path)
    return value !== undefined ? String(value) : match
  })
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

// ============================================
// Main Component
// ============================================

export function DesignRenderer({
  design,
  onClose,
  onAction,
  context,
}: DesignRendererProps): React.ReactElement {
  // Inject animation keyframes
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    
    const styleId = 'engage-design-renderer-animations'
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style')
      styleSheet.id = styleId
      styleSheet.textContent = animationKeyframes
      document.head.appendChild(styleSheet)
    }
  }, [])

  // Render the root container
  const rootStyle: CSSProperties = {
    ...design.style,
  }

  return (
    <div style={rootStyle} data-engage-design={design.id}>
      {design.children?.map((node) => (
        <NodeRenderer
          key={node.id}
          node={node}
          onClose={onClose}
          onAction={onAction}
          context={context}
        />
      ))}
    </div>
  )
}

export default DesignRenderer
