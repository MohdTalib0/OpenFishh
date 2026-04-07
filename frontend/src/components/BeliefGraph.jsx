import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const BEAT_COLORS = {
  ai_startups: '#7C3AED', ai_research: '#7C3AED', general_tech: '#3B82F6',
  dev_tools: '#3B82F6', frontier_tech: '#3B82F6', markets: '#0EA5E9',
  vc_funding: '#0891B2', economics: '#0EA5E9', healthcare: '#059669',
  biotech_pharma: '#059669', climate_energy: '#16A34A', crypto_web3: '#F59E0B',
  cybersecurity: '#EF4444', defense_govt: '#EF4444', geopolitics: '#EF4444',
  regulation: '#EF4444', social_trends: '#EC4899', media_entertainment: '#A21CAF',
  supply_chain: '#EA580C', sports: '#C2410C', education: '#0E7490',
  culture_philosophy: '#9333EA', real_estate: '#78716C', food_agriculture: '#4D7C0F',
  global_south: '#0F766E', consumer_retail: '#B45309', science_space: '#2563EB',
  saas_market: '#65A30D', competitive_intel: '#059669',
  india_startups: '#E11D48', india_edtech: '#0D9488',
}

const BEAT_LABELS = {
  ai_startups: 'AI', ai_research: 'AI Research', general_tech: 'Tech',
  dev_tools: 'Dev Tools', frontier_tech: 'Frontier', markets: 'Markets',
  vc_funding: 'VC', economics: 'Economics', healthcare: 'Healthcare',
  biotech_pharma: 'Biotech', climate_energy: 'Climate', crypto_web3: 'Crypto',
  cybersecurity: 'Cyber', defense_govt: 'Defense', geopolitics: 'Geopolitics',
  regulation: 'Regulation', social_trends: 'Social', media_entertainment: 'Media',
  supply_chain: 'Supply Chain',
}

function getEntityBeat(name, beliefs) {
  const c = {}
  beliefs.forEach(b => {
    if (b.subject === name || b.object === name) c[b.beat] = (c[b.beat] || 0) + 1
  })
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]
  return top ? top[0] : 'general_tech'
}

export default function BeliefGraph({ entities, beliefs }) {
  const svgRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || !entities.length) return

    const container = svgRef.current.parentElement
    const W = container.clientWidth
    const H = container.clientHeight || 600

    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H)
    svg.selectAll('*').remove()

    // Drop shadow filter
    const defs = svg.append('defs')
    const shadow = defs.append('filter').attr('id', 'shadow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
    shadow.append('feDropShadow').attr('dx', 0).attr('dy', 1).attr('stdDeviation', 2).attr('flood-color', 'rgba(0,0,0,0.1)')

    const maxMentions = Math.max(...entities.map(e => e.mentions), 1)

    // Nodes -- top 150
    const maxNodes = Math.min(entities.length, 150)
    const topEntities = entities.slice(0, maxNodes)
    const entityNames = new Set(topEntities.map(e => e.name))
    const nameToIdx = new Map(topEntities.map((e, i) => [e.name, i]))

    const nodes = topEntities.map(e => {
      const beat = getEntityBeat(e.name, beliefs)
      return { entity: e, beat, color: BEAT_COLORS[beat] || '#6366F1' }
    })

    // Links
    const linkMap = new Map()
    beliefs.forEach(b => {
      if (!entityNames.has(b.subject) || !entityNames.has(b.object)) return
      if (b.subject === b.object) return
      const key = [b.subject, b.object].sort().join('||')
      if (!linkMap.has(key)) {
        linkMap.set(key, {
          source: nameToIdx.get(b.subject),
          target: nameToIdx.get(b.object),
          predicate: b.predicate,
          confidence: b.confidence,
          weight: b.weight || 1,
        })
      } else {
        linkMap.get(key).weight += (b.weight || 1)
      }
    })
    const links = [...linkMap.values()]

    // Node radius: 5 + (mentions/max) * 16
    function nodeR(d) { return 5 + (d.entity.mentions / maxMentions) * 16 }

    // Beat clustering -- circular layout
    const beatCenters = {}
    const allBeats = [...new Set(nodes.map(n => n.beat))]
    const cx = W / 2, cy = H / 2
    const clusterR = Math.min(W, H) * 0.3
    allBeats.forEach((beat, i) => {
      const angle = (i / allBeats.length) * 2 * Math.PI - Math.PI / 2
      beatCenters[beat] = {
        x: cx + Math.cos(angle) * clusterR,
        y: cy + Math.sin(angle) * clusterR,
      }
    })

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((_, i) => i)
        .distance(d => 40 + 30 / Math.sqrt(d.weight || 1))
        .strength(d => 0.12 * Math.min(1, Math.sqrt(d.weight || 1) / 5))
      )
      .force('charge', d3.forceManyBody().strength(d => -50 - nodeR(d) * 5).distanceMax(250))
      .force('x', d3.forceX(d => beatCenters[d.beat]?.x || cx).strength(0.07))
      .force('y', d3.forceY(d => beatCenters[d.beat]?.y || cy).strength(0.07))
      .force('center', d3.forceCenter(cx, cy).strength(0.03))
      .force('collision', d3.forceCollide().radius(d => nodeR(d) + 4).strength(0.9))
      .alphaDecay(0.012)
      .velocityDecay(0.35)

    const g = svg.append('g')
    const zoom = d3.zoom()
      .scaleExtent([0.2, 5])
      .filter(event => {
        // Allow all touch events + mouse wheel + mouse drag
        if (event.type === 'wheel') return true
        if (event.touches) return true
        return !event.button // left mouse only
      })
      .on('zoom', e => g.attr('transform', e.transform))
    svg.call(zoom)
    // Prevent browser scroll/refresh from stealing touch inside the graph
    svg.style('touch-action', 'none')

    // === EDGES -- light gray, not beat-colored ===
    const linkEls = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', '#E5E5EA')
      .attr('stroke-width', d => 0.5 + d.confidence * 1.5)
      .attr('stroke-opacity', d => 0.12 + d.confidence * 0.25)

    // === EDGE LABELS (hover) ===
    const edgeLabels = g.append('g').selectAll('text').data(links).join('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#6E3AFF')
      .attr('font-size', '8px').attr('font-weight', '500')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('opacity', 0).attr('pointer-events', 'none')
      .text(d => {
        const p = d.predicate || ''
        return p.length > 24 ? p.slice(0, 24) + '...' : p
      })

    // === NODES -- single clean circle, white stroke, drop shadow ===
    const nodeEls = g.append('g').selectAll('circle').data(nodes).join('circle')
      .attr('r', d => nodeR(d))
      .attr('fill', d => d.color)
      .attr('fill-opacity', d => 0.5 + (d.entity.mentions / maxMentions) * 0.4)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#shadow)')
      .style('cursor', 'pointer')

    // === ALWAYS-VISIBLE LABELS -- top 20, Inter 10px, #424245 ===
    const rankMap = new Map(entities.map((e, i) => [e.name, i]))
    const top20 = new Set(entities.slice(0, 20).map(e => e.name))
    const labelNodes = nodes.filter(n => top20.has(n.entity.name))

    const alwaysLabels = g.append('g').selectAll('text')
      .data(labelNodes).join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => -nodeR(d) - 7)
      .attr('fill', '#424245')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('opacity', 0.7)
      .attr('pointer-events', 'none')
      .text(d => d.entity.name.length > 22 ? d.entity.name.slice(0, 22) + '...' : d.entity.name)

    // === HOVER LABELS -- Inter 11px, #1D1D1F ===
    const hoverLabels = g.append('g').selectAll('text').data(nodes).join('text')
      .attr('dx', d => nodeR(d) + 6)
      .attr('dy', 4)
      .attr('fill', '#1D1D1F')
      .attr('font-size', '11px').attr('font-weight', '600')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('opacity', 0).attr('pointer-events', 'none')
      .text(d => d.entity.name.length > 22 ? d.entity.name.slice(0, 22) + '...' : d.entity.name)

    // === INTERACTION ===
    nodeEls
      .on('mouseover', function(event, d) {
        const connected = new Set()
        links.forEach(l => {
          const src = typeof l.source === 'object' ? l.source : nodes[l.source]
          const tgt = typeof l.target === 'object' ? l.target : nodes[l.target]
          if (src === d) connected.add(tgt)
          if (tgt === d) connected.add(src)
        })

        // Dim non-connected
        linkEls.attr('stroke-opacity', 0.04)
        nodeEls.attr('fill-opacity', 0.1)
        alwaysLabels.attr('opacity', 0.1)

        // Highlight connected edges
        linkEls.filter(l => {
          const src = typeof l.source === 'object' ? l.source : nodes[l.source]
          const tgt = typeof l.target === 'object' ? l.target : nodes[l.target]
          return src === d || tgt === d
        })
          .attr('stroke', d.color)
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', 2)

        // Highlight connected + hovered nodes
        nodeEls.filter(n => connected.has(n) || n === d)
          .attr('fill-opacity', 1)
          .attr('stroke-width', n => n === d ? 2.5 : 1.5)

        // Show hover label for hovered node
        hoverLabels.attr('opacity', n => n === d ? 0.85 : 0)

        // Show neighbor labels (for nodes not in always-visible set)
        hoverLabels.filter(n => connected.has(n) && !top20.has(n.entity.name))
          .attr('opacity', 0.85)

        // Edge predicates in purple
        edgeLabels.attr('opacity', l => {
          const src = typeof l.source === 'object' ? l.source : nodes[l.source]
          const tgt = typeof l.target === 'object' ? l.target : nodes[l.target]
          return (src === d || tgt === d) ? 0.85 : 0
        })

        // Keep always-labels for connected nodes
        alwaysLabels.attr('opacity', n => {
          if (n === d) return 1
          return connected.has(n) ? 0.85 : 0.1
        })

        // Tooltip
        if (tooltipRef.current) {
          const connList = []
          links.forEach(l => {
            const src = typeof l.source === 'object' ? l.source : nodes[l.source]
            const tgt = typeof l.target === 'object' ? l.target : nodes[l.target]
            if (src === d) connList.push({ name: tgt.entity.name, pred: l.predicate })
            if (tgt === d) connList.push({ name: src.entity.name, pred: l.predicate })
          })
          const topConns = connList.slice(0, 5)
          const connHtml = topConns.map(c =>
            `<div style="font-size:10px;padding:1px 0;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              <span style="color:#6E3AFF">${c.pred}</span> <span style="color:#1D1D1F;font-weight:500">${c.name}</span>
            </div>`
          ).join('')
          const moreText = connList.length > 5 ? `<div style="color:#aaa;font-size:9px;margin-top:2px">+${connList.length - 5} more</div>` : ''

          tooltipRef.current.innerHTML = `
            <div style="font-weight:700;color:#1D1D1F;margin-bottom:2px;font-size:13px">${d.entity.name}</div>
            <div style="color:#86868B;font-size:10px;margin-bottom:${connHtml ? '6' : '0'}px">${d.entity.mentions} mentions &middot; ${connList.length} connections &middot; <span style="color:${d.color}">${d.beat.replace(/_/g, ' ')}</span></div>
            ${connHtml}${moreText}
          `
          tooltipRef.current.style.opacity = '1'
          tooltipRef.current.style.left = (event.pageX + 16) + 'px'
          tooltipRef.current.style.top = (event.pageY - 10) + 'px'
        }
      })
      .on('mousemove', function(event) {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = (event.pageX + 16) + 'px'
          tooltipRef.current.style.top = (event.pageY - 10) + 'px'
        }
      })
      .on('mouseout', function() {
        linkEls
          .attr('stroke', '#E5E5EA')
          .attr('stroke-opacity', d => 0.12 + d.confidence * 0.25)
          .attr('stroke-width', d => 0.5 + d.confidence * 1.5)
        nodeEls
          .attr('fill-opacity', n => 0.5 + (n.entity.mentions / maxMentions) * 0.4)
          .attr('stroke-width', 1.5)
        alwaysLabels.attr('opacity', 0.7)
        hoverLabels.attr('opacity', 0)
        edgeLabels.attr('opacity', 0)
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0'
      })
      .call(d3.drag()
        .on('start', (e, d) => {
          if (!e.active) simulation.alphaTarget(0.08).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
        .on('end', (e, d) => {
          if (!e.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    // === TICK ===
    simulation.on('tick', () => {
      linkEls
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      edgeLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 4)
      nodeEls.attr('cx', d => d.x).attr('cy', d => d.y)
      alwaysLabels.attr('x', d => d.x).attr('y', d => d.y)
      hoverLabels.attr('x', d => d.x).attr('y', d => d.y)
    })

    // Gentle drift
    const driftInterval = setInterval(() => {
      if (simulation.alpha() < 0.005) {
        for (let i = 0; i < 3; i++) {
          const n = nodes[Math.floor(Math.random() * nodes.length)]
          n.vx += (Math.random() - 0.5) * 1.5
          n.vy += (Math.random() - 0.5) * 1.5
        }
        simulation.alpha(0.008).restart()
      }
    }, 4000)

    return () => {
      clearInterval(driftInterval)
      simulation.stop()
      svg.selectAll('*').remove()
    }
  }, [entities.length, beliefs.length])

  // Legend
  const beatFreq = {}
  beliefs.forEach(b => { beatFreq[b.beat] = (beatFreq[b.beat] || 0) + 1 })
  const topBeats = Object.entries(beatFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Beat legend */}
      <div style={{
        position: 'absolute', bottom: 10, left: 14,
        display: 'flex', flexWrap: 'wrap', gap: '3px 10px', maxWidth: '55%',
      }}>
        {topBeats.map(([beat]) => (
          <div key={beat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: BEAT_COLORS[beat] || '#6366F1',
            }} />
            <span style={{
              fontSize: '9px', color: '#86868B',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              {BEAT_LABELS[beat] || beat.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      <div ref={tooltipRef} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 100,
        background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 10, padding: '10px 14px', opacity: 0,
        transition: 'opacity 0.12s', maxWidth: 280, minWidth: 140,
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }} />
    </div>
  )
}
