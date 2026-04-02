import { CampfireIcon } from './CampfireIcon'
import { CaveIcon } from './CaveIcon'
import { BlueberryIcon } from './BlueberryIcon'
import { useState, useEffect } from 'react'

interface TabNavProps {
  activeTab: 'cook' | 'shop' | 'tribe' | 'you'
  onTabChange: (tab: 'cook' | 'shop' | 'tribe' | 'you') => void
}

const TAB_COLOURS = {
  you:   '#329783',
  shop:  '#6B93FF',
  tribe: '#FF6A41',
} as const

// Cook! button — exact SVG from user's file, self-contained
function CookButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: 116,
        height: 69,
      }}
      onMouseDown={(e)  => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)' }}
      onMouseUp={(e)    => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
      onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)' }}
      onTouchEnd={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
    >
      <svg
        width="116"
        height="69"
        viewBox="0 0 116 69"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <g filter="url(#cook-filter)">
          <rect x="11.7002" y="7.69922" width="92" height="45" rx="22.5" fill="url(#cook-grad)"/>
          <rect x="12.2002" y="8.19922" width="91" height="44" rx="22" stroke="#737373"/>
          <path d="M41.7962 35.8912C40.6442 35.8912 39.6629 35.6406 38.8522 35.1392C38.0415 34.6379 37.4229 33.9552 36.9962 33.0912C36.5695 32.2166 36.3562 31.2246 36.3562 30.1152C36.3562 29.0059 36.5642 28.0139 36.9802 27.1392C37.3962 26.2646 38.0095 25.5766 38.8202 25.0752C39.6309 24.5632 40.6229 24.3072 41.7962 24.3072C43.1402 24.3072 44.2389 24.6432 45.0922 25.3152C45.9562 25.9766 46.4949 26.9099 46.7082 28.1152H44.4522C44.3135 27.5072 44.0149 27.0326 43.5562 26.6912C43.1082 26.3392 42.5109 26.1632 41.7642 26.1632C41.0815 26.1632 40.4895 26.3232 39.9882 26.6432C39.4975 26.9632 39.1189 27.4166 38.8522 28.0032C38.5855 28.5899 38.4522 29.2939 38.4522 30.1152C38.4522 30.9259 38.5855 31.6299 38.8522 32.2272C39.1189 32.8139 39.4975 33.2672 39.9882 33.5872C40.4895 33.8966 41.0815 34.0512 41.7642 34.0512C42.5109 34.0512 43.1082 33.8912 43.5562 33.5712C44.0149 33.2406 44.3135 32.7872 44.4522 32.2112H46.7082C46.4949 33.3632 45.9562 34.2646 45.0922 34.9152C44.2389 35.5659 43.1402 35.8912 41.7962 35.8912ZM51.9484 35.8912C51.1484 35.8912 50.4338 35.7206 49.8044 35.3792C49.1858 35.0272 48.7004 34.5366 48.3484 33.9072C47.9964 33.2779 47.8204 32.5526 47.8204 31.7312C47.8204 30.8672 48.0071 30.1259 48.3804 29.5072C48.7644 28.8779 49.2711 28.3979 49.9004 28.0672C50.5404 27.7366 51.2444 27.5712 52.0124 27.5712C52.8124 27.5712 53.5271 27.7472 54.1564 28.0992C54.7858 28.4406 55.2818 28.9206 55.6444 29.5392C56.0178 30.1579 56.2044 30.8886 56.2044 31.7312C56.2044 32.5312 56.0231 33.2459 55.6604 33.8752C55.2978 34.5046 54.7964 35.0006 54.1564 35.3632C53.5271 35.7152 52.7911 35.8912 51.9484 35.8912ZM51.9804 34.1152C52.4071 34.1152 52.7751 34.0086 53.0844 33.7952C53.4044 33.5712 53.6551 33.2779 53.8364 32.9152C54.0178 32.5419 54.1084 32.1366 54.1084 31.6992C54.1084 31.1979 54.0071 30.7712 53.8044 30.4192C53.6124 30.0672 53.3564 29.8006 53.0364 29.6192C52.7164 29.4379 52.3644 29.3472 51.9804 29.3472C51.5644 29.3472 51.1964 29.4486 50.8764 29.6512C50.5671 29.8539 50.3218 30.1366 50.1404 30.4992C49.9698 30.8512 49.8844 31.2619 49.8844 31.7312C49.8844 32.2006 49.9751 32.6166 50.1564 32.9792C50.3484 33.3419 50.6044 33.6246 50.9244 33.8272C51.2444 34.0192 51.5964 34.1152 51.9804 34.1152ZM61.2609 35.8912C60.4609 35.8912 59.7463 35.7206 59.1169 35.3792C58.4983 35.0272 58.0129 34.5366 57.6609 33.9072C57.3089 33.2779 57.1329 32.5526 57.1329 31.7312C57.1329 30.8672 57.3196 30.1259 57.6929 29.5072C58.0769 28.8779 58.5836 28.3979 59.2129 28.0672C59.8529 27.7366 60.5569 27.5712 61.3249 27.5712C62.1249 27.5712 62.8396 27.7472 63.4689 28.0992C64.0983 28.4406 64.5943 28.9206 64.9569 29.5392C65.3303 30.1579 65.5169 30.8886 65.5169 31.7312C65.5169 32.5312 65.3356 33.2459 64.9729 33.8752C64.6103 34.5046 64.1089 35.0006 63.4689 35.3632C62.8396 35.7152 62.1036 35.8912 61.2609 35.8912ZM61.2929 34.1152C61.7196 34.1152 62.0876 34.0086 62.3969 33.7952C62.7169 33.5712 62.9676 33.2779 63.1489 32.9152C63.3303 32.5419 63.4209 32.1366 63.4209 31.6992C63.4209 31.1979 63.3196 30.7712 63.1169 30.4192C62.9249 30.0672 62.6689 29.8006 62.3489 29.6192C62.0289 29.4379 61.6769 29.3472 61.2929 29.3472C60.8769 29.3472 60.5089 29.4486 60.1889 29.6512C59.8796 29.8539 59.6343 30.1366 59.4529 30.4992C59.2823 30.8512 59.1969 31.2619 59.1969 31.7312C59.1969 32.2006 59.2876 32.6166 59.4689 32.9792C59.6609 33.3419 59.9169 33.6246 60.2369 33.8272C60.5569 34.0192 60.9089 34.1152 61.2929 34.1152ZM66.7014 35.6992V24.4992H68.7494V31.1232L71.3894 27.7632H74.0294L70.5414 31.7472L74.0774 35.6992H71.4374L68.7494 32.3232V35.6992H66.7014ZM75.7484 32.1632L75.5244 24.4992H77.7164L77.4764 32.1632H75.7484ZM76.6444 35.8912C76.2711 35.8912 75.9564 35.7632 75.7004 35.5072C75.4444 35.2406 75.3164 34.9259 75.3164 34.5632C75.3164 34.1899 75.4444 33.8752 75.7004 33.6192C75.9564 33.3632 76.2711 33.2352 76.6444 33.2352C77.0178 33.2352 77.3324 33.3632 77.5884 33.6192C77.8444 33.8752 77.9724 34.1899 77.9724 34.5632C77.9724 34.9259 77.8444 35.2406 77.5884 35.5072C77.3324 35.7632 77.0178 35.8912 76.6444 35.8912Z" fill="white"/>
        </g>
        <defs>
          <filter id="cook-filter" x="0.000195503" y="-0.000781059" width="115.4" height="68.4" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="5.85"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.646785 0 0 0 0 0.646785 0 0 0 0 0.646785 0 0 0 0.25 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dx="-1" dy="2"/>
            <feGaussianBlur stdDeviation="8.3"/>
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.486685 0 0 0 0 0.486685 0 0 0 0 0.486685 0 0 0 0.25 0"/>
            <feBlend mode="normal" in2="shape" result="effect2_innerShadow"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dx="-2" dy="-1"/>
            <feGaussianBlur stdDeviation="4.6"/>
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"/>
            <feBlend mode="normal" in2="effect2_innerShadow" result="effect3_innerShadow"/>
          </filter>
          <linearGradient id="cook-grad" x1="57.7002" y1="7.69922" x2="57.7002" y2="52.6992" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B3B3B"/>
            <stop offset="1" stopColor="#262626"/>
          </linearGradient>
        </defs>
      </svg>
    </button>
  )
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nav-hover', { detail: { isHovered } }))
  }, [isHovered])

  const mainTabs = [
    { id: 'you'   as const, label: 'Home',   Icon: CaveIcon },
    { id: 'shop'  as const, label: 'Shop',   Icon: BlueberryIcon },
    { id: 'tribe' as const, label: 'Gather', Icon: CampfireIcon },
  ]

  return (
    <>
      {/* ── Full-screen soft overlay: 0% → 60% white, middle → bottom ── */}
      {/* Sits behind the nav (z-49) but in front of page content, pointer-events off */}
      <div
        className="md:hidden fixed inset-0 pointer-events-none"
        style={{
          zIndex: 49,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 75%, rgba(255,255,255,1) 100%)',
        }}
      />

      {/* ── Mobile bottom tab bar ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}
      >
        {/* Simple white gradient background — no blur */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div className="flex items-center" style={{ height: 72, position: 'relative' }}>


          {/* ── Three tabs — evenly distributed ── */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', height: '100%' }}>
            {mainTabs.map((tab) => {
              const isActive = activeTab === tab.id
              const colour   = TAB_COLOURS[tab.id]
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  style={{ flex: 1 }}
                  className="flex flex-col items-center justify-center gap-[3px] transition-all duration-200 active:scale-95"
                >
                  <tab.Icon
                    size={20}
                    className="flex-shrink-0 transition-colors duration-200"
                    style={{ color: isActive ? colour : '#484848' }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: "'Rethink Sans', sans-serif",
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? colour : '#484848',
                      lineHeight: 1,
                      transition: 'color 0.2s',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/*
           * Diagonal separator — placed with more space between it and Cook!
           * margin-right: 20px pushes it away from the button
           */}
          <div
            style={{
              width: 1,
              alignSelf: 'stretch',
              margin: '16px 20px 16px 8px',
              background: 'rgba(0,0,0,0.15)',
              transform: 'skewX(-10deg)',
              flexShrink: 0,
            }}
          />

          {/* ── Cook! button (exact SVG from user) ── */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingRight: 14 }}>
            <CookButton onClick={() => onTabChange('cook')} />
          </div>

        </div>
      </div>

      {/* ── Desktop sidebar ── */}
      <div
        id="desktop-nav"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 hover:w-52 bg-white dark:bg-white border-r border-border z-20 flex-col items-center py-8 px-3 gap-4 transition-all duration-300 overflow-hidden group peer"
      >
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id
          const colour   = TAB_COLOURS[tab.id]
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-3 py-4 px-3 w-14 group-hover:w-full rounded-lg transition-all ${
                isActive ? 'bg-black/5' : 'hover:bg-muted'
              }`}
            >
              <tab.Icon
                size={24}
                style={{ color: isActive ? colour : '#484848' }}
                className="flex-shrink-0 mx-auto group-hover:mx-0"
              />
              <span
                className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden w-0 group-hover:w-auto"
                style={{
                  fontFamily: "'Rethink Sans', sans-serif",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? colour : '#AAAAAA',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
        <button
          onClick={() => onTabChange('cook')}
          className="flex items-center gap-3 py-3 px-3 w-14 group-hover:w-full rounded-full transition-all"
          style={{ background: '#1a1a1a' }}
        >
          <span className="text-white text-sm font-bold whitespace-nowrap mx-auto group-hover:mx-0" style={{ fontFamily: "'Rethink Sans'" }}>🍳</span>
          <span className="text-white text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden w-0 group-hover:w-auto" style={{ fontFamily: "'Rethink Sans'" }}>Cook!</span>
        </button>
      </div>
    </>
  )
}
