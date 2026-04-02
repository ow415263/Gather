import { useEffect, useRef, useState, useMemo } from 'react'
// @ts-ignore
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d'
import { CookProfile } from '@/pages/TribePage'
import { ArrowsOutSimple } from '@phosphor-icons/react'

export interface GraphNode {
    id: string
    name: string
    group: number
    val: number
    x?: number
    y?: number
}

export interface GraphLink {
    source: string
    target: string
}

interface ConnectionsGraphProps {
    connections: CookProfile[]
    currentUserPhoto?: string
    currentUserName: string
    onNodeClick?: (nodeId: string) => void
    maximized?: boolean
    onToggleMaximize?: () => void
}

export function ConnectionsGraph({
    connections,
    currentUserName,
    onNodeClick,
    maximized = false,
    onToggleMaximize
}: ConnectionsGraphProps) {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    const graphData = useMemo(() => {
        const links: GraphLink[] = connections.map(c => ({
            source: 'me',
            target: c.id
        }))
        
        // Add spiderweb random connections so they link to each other too
        connections.forEach((c, i) => {
            if (i > 0) {
                links.push({ source: c.id, target: connections[i - 1].id })
            }
            if (i % 2 === 0 && connections[i + 2]) {
                links.push({ source: c.id, target: connections[i + 2].id })
            }
        })

        return {
            nodes: [
                { id: 'me', name: currentUserName, group: 1, val: 8 },
                ...connections.map(c => ({
                    id: c.id,
                    name: c.name,
                    group: 2,
                    val: 4
                }))
            ],
            links
        }
    }, [connections, currentUserName])

    useEffect(() => {
        if (maximized) {
            setDimensions({ width: window.innerWidth, height: window.innerHeight })
            const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        } else {
            if (!containerRef.current) return
            const resizeObserver = new ResizeObserver(entries => {
                if (entries[0]) {
                    const { width, height } = entries[0].contentRect
                    if (width > 0 && height > 0) {
                        setDimensions({ width, height })
                    }
                }
            })
            resizeObserver.observe(containerRef.current)
            return () => resizeObserver.disconnect()
        }
    }, [maximized])

    useEffect(() => {
        if (fgRef.current && dimensions.width > 0 && dimensions.height > 0) {
            // Apply custom D3 forces for a tighter, cleaner graph
            const chargeForce = fgRef.current.d3Force('charge')
            if (chargeForce) (chargeForce as any).strength(-200) // Moderate repulsion
            
            const linkForce = fgRef.current.d3Force('link')
            if (linkForce) (linkForce as any).distance(60)     // Keep links relatively short
            
            setTimeout(() => {
                 fgRef.current?.zoomToFit(400, maximized ? 60 : 40)
            }, 300)
        }
    }, [maximized, connections.length, dimensions.width, dimensions.height])

    return (
        <div 
            ref={containerRef} 
            className={`bg-background overflow-hidden \${maximized ? 'absolute inset-0 rounded-none' : 'relative w-full rounded-2xl shadow-sm border border-border/40 cursor-pointer'}`}
            style={maximized ? {} : { height: '240px', transform: 'translateZ(0)' }}
        >
            {/* Header info / Actions */}
            {!maximized && (
                <div 
                    onClick={onToggleMaximize}
                    className="absolute inset-x-0 top-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-auto"
                >
                    <span className="text-foreground font-bold text-sm tracking-wide drop-shadow-sm">Your Network</span>
                    <button className="w-8 h-8 rounded-full bg-black/5 backdrop-blur-md flex items-center justify-center text-foreground border border-border/40">
                        <ArrowsOutSimple size={14} weight="bold" />
                    </button>
                </div>
            )}

            {dimensions.width > 0 && dimensions.height > 0 && (
                <div className="absolute inset-0 z-0">
                    <ForceGraph2D
                        ref={fgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}
                        nodeRelSize={1}
                        // Interactions
                        enableZoomInteraction={maximized}
                        enablePanInteraction={maximized}
                        enableNodeDrag={true} // Allow dragging always for fun
                        onNodeClick={(node) => {
                            if (node.id !== 'me') {
                                if (onNodeClick) onNodeClick(node.id as string)
                            } else if (!maximized && onToggleMaximize) {
                                onToggleMaximize()
                            }
                        }}
                        onBackgroundClick={() => {
                            if (!maximized && onToggleMaximize) {
                                onToggleMaximize()
                            }
                        }}
                        nodeCanvasObject={(node, ctx, globalScale) => {
                            const size = node.val!
                            const isMe = node.id === 'me'
                            const isDark = document.documentElement.className.includes('dark')
                            
                            // 1. Draw solid node circle (like Obsidian)
                            ctx.beginPath()
                            ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI, false)
                            ctx.fillStyle = isMe ? '#8a2be2' : (isDark ? '#e5e7eb' : '#4b5563') 
                            ctx.fill()
                            
                            // 2. Draw Label below node
                            const label = node.name as string
                            const safeScale = globalScale || 1
                            let baseSize = maximized ? (14 / safeScale) : (10 / safeScale)
                            // clamp the font size so it never crashes the canvas or blows up
                            if (baseSize < 6) baseSize = 6
                            if (baseSize > 24) baseSize = 24
                            
                            ctx.font = `500 \${baseSize}px Inter, sans-serif`
                            ctx.textAlign = 'center'
                            ctx.textBaseline = 'top'
                            
                            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0,0,0,0.8)'
                            
                            // Optional: outline to make text readable over lines
                            ctx.shadowColor = isDark ? '#000' : '#FFF'
                            ctx.shadowBlur = maximized ? 4 : 2
                            ctx.fillText(label, node.x!, node.y! + size + 4)
                            ctx.shadowBlur = 0 // reset shadow for next draws
                        }}
                        linkColor={() => document.documentElement.className.includes('dark') ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
                        linkWidth={maximized ? 1 : 0.5}
                        cooldownTicks={100}
                    />
                </div>
            )}
        </div>
    )
}
