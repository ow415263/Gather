import React from "react"

export function CaveIcon({ size = 24, weight = 'regular', className = '', style }: any) {
  // Using currentColor allows it to inherit active/inactive states from TabNav
  return (
    <svg width={size} height={size} viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path fillRule="evenodd" clipRule="evenodd" d="M85.709 40.4581V85.7241H63.518L58.3578 71.8611L72.0418 63.5056L80.7449 64.2595L71.4637 60.5876L59.7727 67.7399L57.7024 57.8102L47.2964 42.8722L25.2534 64.5402L24.4409 68.9347L17.4526 61.6691L9.8628 64.2316L16.148 64.3449L26.898 74.1535L22.191 85.7195L0 85.7234V67.9304L2.3242 67.0593L5.625 48.6213L13.4492 46.1721L21.5625 52.2932L17.0469 44.4182L22.1914 21.0982L29.8906 17.5435L38.3789 22.7505L32.7773 14.6333L35.7773 4.4453L62.0233 0C60.6561 3.0703 58.2108 8.5938 58.4335 8.5195C58.6405 8.44919 64.8593 2.8593 64.8593 2.8593L73.7773 34.7933L67.9257 40.6644L77.0898 37.6097L85.709 40.4581Z" fill="currentColor"/>
    </svg>
  )
}

