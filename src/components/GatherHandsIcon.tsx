import React from "react"

export function GatherHandsIcon({ size = 24, weight = 'regular', className = '' }: any) {
  const isFill = weight === 'fill'
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" className={className}>
      <rect width="256" height="256" fill="none" />
      
      {/* Two hands cupping upwards */}
      {/* Left Hand */}
      <path d="M128,216 C80,216 32,176 32,136 C32,112 56,104 76,120 L112,144" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Right Hand */}
      <path d="M128,216 C176,216 224,176 224,136 C224,112 200,104 180,120 L144,144" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      
      {/* Gathered Food (Berries/Leaves) */}
      <circle cx="128" cy="96" r="20" fill={isFill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="16"/>
      <circle cx="96" cy="64" r="12" fill={isFill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="16"/>
      <circle cx="160" cy="64" r="12" fill={isFill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="16"/>
      <path d="M128,76 L128,40" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
    </svg>
  )
}
