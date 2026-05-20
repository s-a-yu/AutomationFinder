export async function exportResultsToPdf({ scoredResults, summary, orgContext }) {
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PW = 210, PH = 297
  const ML = 18, MR = 18, MT = 20, MB = 20
  const CW = PW - ML - MR   // 174 mm

  const C = {
    sage:    [ 56,  73,  89],   // #384959
    sageD:   [ 40,  53,  64],   // #283540 (700)
    sageBg:  [236, 240, 243],   // #ecf0f3 (50)
    sageBd:  [186, 201, 214],   // #bac9d6 (200)
    dark:    [ 31,  41,  55],
    body:    [ 75,  85, 100],
    muted:   [156, 163, 175],
    light:   [243, 244, 246],
    border:  [229, 231, 235],
    white:   [255, 255, 255],
    green:   [ 21, 128,  61],
    blue:    [ 29,  78, 216],
  }

  const sc = (c) => pdf.setTextColor(...c)
  const sf = (c) => pdf.setFillColor(...c)
  const sd = (c) => pdf.setDrawColor(...c)

  let y = MT
  let page = 1

  function footer() {
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    sc(C.muted)
    pdf.text('AI Automation Discovery  ·  Confidential', ML, PH - 10)
    pdf.text(`Page ${page}`, PW - MR, PH - 10, { align: 'right' })
  }

  function newPage() {
    pdf.addPage()
    page++
    y = MT
    footer()
  }

  function guard(needed) {
    if (y + needed > PH - MB) newPage()
  }

  function hline(color = C.border, lw = 0.25) {
    sd(color); pdf.setLineWidth(lw)
    pdf.line(ML, y, PW - MR, y)
  }

  function sectionLabel(text) {
    pdf.setFontSize(6.5)
    pdf.setFont('helvetica', 'bold')
    sc(C.muted)
    pdf.text(text, ML, y)
    y += 5
  }

  // ── Page 1 header ────────────────────────────────────────────────────────────
  footer()

  pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); sc(C.muted)
  pdf.text('AI Automation Discovery  ·  FinOps Assessment', ML, y + 2)
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  pdf.text(dateStr, PW - MR, y + 2, { align: 'right' })
  y += 9

  hline(); y += 7

  pdf.setFontSize(20); pdf.setFont('helvetica', 'bold'); sc(C.dark)
  pdf.text('Your Automation Roadmap', ML, y)
  y += 7

  const ctx = [orgContext.cloud?.toUpperCase(), orgContext.industry, orgContext.domain].filter(Boolean)
  if (ctx.length) {
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); sc(C.muted)
    pdf.text(ctx.join('  ·  '), ML, y)
    y += 10
  } else {
    y += 4
  }

  // ── Stats ────────────────────────────────────────────────────────────────────
  const quickWins = scoredResults.filter((r) => r.tier === 'quick_win')
  const planNow   = scoredResults.filter((r) => r.tier === 'plan_now')
  const backlog   = scoredResults.filter((r) => r.tier === 'backlog')
  const bw = (CW - 8) / 3

  ;[
    { label: 'Quick Wins', value: quickWins.length, color: C.green },
    { label: 'Plan Now',   value: planNow.length,   color: C.blue  },
    { label: 'Backlog',    value: backlog.length,    color: C.muted },
  ].forEach(({ label: lbl, value: val, color }, i) => {
    const bx = ML + i * (bw + 4)
    sd(C.border); pdf.setLineWidth(0.25)
    pdf.roundedRect(bx, y, bw, 18, 2, 2, 'S')
    pdf.setFontSize(17); pdf.setFont('helvetica', 'bold'); sc(color)
    pdf.text(String(val), bx + bw / 2, y + 11, { align: 'center' })
    pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); sc(C.muted)
    pdf.text(lbl, bx + bw / 2, y + 16.5, { align: 'center' })
  })
  y += 24

  // ── Executive Summary ────────────────────────────────────────────────────────
  if (summary?.executive_summary) {
    const pad = 4
    pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal')
    const esLines = pdf.splitTextToSize(summary.executive_summary, CW - pad * 2)
    const esH = 7 + esLines.length * 4.8 + pad + 2
    guard(esH + 4)
    sf(C.sageBg); sd(C.sageBd); pdf.setLineWidth(0.25)
    pdf.roundedRect(ML, y, CW, esH, 2, 2, 'FD')
    y += pad + 2
    pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); sc(C.sageD)
    pdf.text('EXECUTIVE SUMMARY', ML + pad, y)
    y += 5
    pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); sc(C.dark)
    esLines.forEach((l) => { pdf.text(l, ML + pad, y); y += 4.8 })
    y += pad + 2
  }

  if (summary?.readiness_recommendations?.length) {
    guard(14); y += 2
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); sc(C.dark)
    pdf.text('Readiness Recommendations', ML, y)
    y += 5.5
    pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); sc(C.body)
    summary.readiness_recommendations.forEach((rec) => {
      const lines = pdf.splitTextToSize(`-  ${rec}`, CW - 4)
      guard(lines.length * 4.5 + 2)
      lines.forEach((l) => { pdf.text(l, ML + 2, y); y += 4.5 })
    })
    y += 4
  }

  // ── Prioritized Roadmap ──────────────────────────────────────────────────────
  guard(32)
  hline(); y += 7

  pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); sc(C.dark)
  pdf.text('Prioritized Roadmap', ML, y)
  y += 8

  const COL = {
    num:  { x: ML,       w: 7  },
    name: { x: ML + 7,   w: 70 },
    tier: { x: ML + 77,  w: 28 },
    eff:  { x: ML + 105, w: 22 },
    pri:  { x: ML + 127, w: 47 },
  }

  sf([248, 250, 252]); pdf.rect(ML, y - 4.5, CW, 8, 'F')
  pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); sc(C.muted)
  pdf.text('#',        COL.num.x,  y)
  pdf.text('PROCESS',  COL.name.x, y)
  pdf.text('TIER',     COL.tier.x, y)
  pdf.text('EFFORT',   COL.eff.x,  y)
  pdf.text('PRIORITY', COL.pri.x,  y)
  y += 4.5; hline(); y += 3

  const TIER_L = { quick_win: 'Quick Win', plan_now: 'Plan Now', backlog: 'Backlog' }
  const TIER_C = { quick_win: C.green, plan_now: C.blue, backlog: C.muted }
  const EFF_L  = { S: 'Low', M: 'Medium', L: 'High' }

  scoredResults.forEach((r, i) => {
    const nameLines = pdf.splitTextToSize(r.label, COL.name.w - 2)
    const rowH = Math.max(nameLines.length * 4.2, 4) + 4
    guard(rowH)

    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'normal'); sc(C.muted)
    pdf.text(String(i + 1), COL.num.x, y)

    pdf.setFont('helvetica', 'bold'); sc(C.dark)
    nameLines.forEach((l, li) => pdf.text(l, COL.name.x, y + li * 4.2))

    pdf.setFont('helvetica', 'normal'); sc(TIER_C[r.tier] ?? C.muted)
    pdf.text(TIER_L[r.tier] ?? '', COL.tier.x, y)

    sc(C.body)
    pdf.text(EFF_L[r.effort] ?? '', COL.eff.x, y)

    const barW = 28, barH = 2.5, barY = y - 2.2
    sf(C.border); pdf.rect(COL.pri.x, barY, barW, barH, 'F')
    sf(C.sage);   pdf.rect(COL.pri.x, barY, barW * r.priorityScore, barH, 'F')
    pdf.setFontSize(7.5); sc(C.muted)
    pdf.text(`${(r.priorityScore * 100).toFixed(0)}`, COL.pri.x + barW + 2, y)

    y += rowH
    hline([241, 243, 245]); y += 2
  })

  // ── Action Plan ───────────────────────────────────────────────────────────────
  const planItems = [
    ...(summary?.quick_wins ?? []).map((item) => ({ item, tier: 'quick_win' })),
    ...(summary?.plan_now   ?? []).map((item) => ({ item, tier: 'plan_now'  })),
  ]

  if (!planItems.length) {
    pdf.save(`finops-automation-roadmap-${new Date().toISOString().slice(0, 10)}.pdf`)
    return
  }

  guard(20); y += 4; hline(); y += 7
  pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); sc(C.dark)
  pdf.text('Suggested Plan of Action', ML, y)
  y += 5
  pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); sc(C.muted)
  pdf.text('Phase-by-phase implementation guide for each identified opportunity.', ML, y)
  y += 9

  planItems.forEach(({ item, tier }, idx) => {
    guard(30)

    const tierLabel  = tier === 'quick_win' ? 'Quick Win' : 'Plan Now'
    const tierColor  = tier === 'quick_win' ? C.green : C.blue
    const effortLabel = { S: 'Low effort', M: 'Medium effort', L: 'High effort' }[item.effort] ?? ''

    // Process name
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); sc(C.dark)
    const titleLines = pdf.splitTextToSize(`${idx + 1}.  ${item.process}`, CW - 48)
    titleLines.forEach((l, li) => pdf.text(l, ML, y + li * 5.5))
    // Tier + effort right-aligned
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); sc(tierColor)
    pdf.text(tierLabel, PW - MR, y, { align: 'right' })
    pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); sc(C.muted)
    pdf.text(effortLabel, PW - MR, y + 5, { align: 'right' })
    y += titleLines.length * 5.5 + 3

    // Rationale
    if (item.rationale) {
      pdf.setFontSize(8); pdf.setFont('helvetica', 'italic'); sc(C.muted)
      const rLines = pdf.splitTextToSize(item.rationale, CW)
      guard(rLines.length * 4.5 + 3)
      rLines.forEach((l) => { pdf.text(l, ML, y); y += 4.5 })
      y += 3
    }

    // Value & Business Case
    const val = item.value_proposition
    if (val?.headline) {
      const bens = val.benefits ?? []
      // Measure at actual render font sizes before computing box height
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold')
      const hLines = pdf.splitTextToSize(val.headline, CW - 10)
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal')
      const benLines = bens.map((b) => pdf.splitTextToSize(`-  ${b}`, CW - 10))
      const benH = benLines.reduce((acc, bl) => acc + bl.length * 4.2, 0)
      const boxH = 8 + hLines.length * 4.5 + benH + 5
      guard(boxH + 2)
      sf(C.sageBg); sd(C.sageBd); pdf.setLineWidth(0.25)
      pdf.roundedRect(ML, y, CW, boxH, 1.5, 1.5, 'FD')
      y += 4
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); sc(C.sageD)
      pdf.text('VALUE & BUSINESS CASE', ML + 4, y)
      y += 4.5
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); sc([31, 41, 55])
      hLines.forEach((l) => { pdf.text(l, ML + 4, y); y += 4.5 })
      if (benLines.length) {
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); sc([56, 73, 89])
        benLines.forEach((bl) => {
          bl.forEach((l) => { pdf.text(l, ML + 4, y); y += 4.2 })
        })
      }
      y += 5
    }

    // Industry Standards
    const standards = item.industry_standards ?? []
    if (standards.length) {
      guard(10 + standards.length * 5)
      sectionLabel('INDUSTRY STANDARDS & BEST PRACTICES')
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); sc(C.body)
      standards.forEach((s) => {
        const sl = pdf.splitTextToSize(`-  ${s}`, CW - 4)
        guard(sl.length * 4.5)
        sl.forEach((l) => { pdf.text(l, ML + 2, y); y += 4.5 })
      })
      y += 3
    }

    // Recommended Tools
    const tools = item.recommended_tools ?? []
    if (tools.length) {
      guard(10 + tools.length * 10)
      sectionLabel('RECOMMENDED TOOLS')
      const LC = {
        'Open Source': { text: [6, 95, 70],   bg: [209, 250, 229] },
        'Commercial':  { text: [154, 52, 18],  bg: [255, 237, 213] },
        'Freemium':    { text: [7,  89, 133],  bg: [224, 242, 254] },
      }
      tools.forEach((t) => {
        guard(10)
        const lc = LC[t.license] ?? { text: [100, 100, 100], bg: [243, 244, 246] }
        pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); sc(lc.text)
        const lbW = pdf.getTextWidth(t.license) + 6
        sf(lc.bg); pdf.roundedRect(ML, y - 3.5, lbW, 5.5, 1, 1, 'F')
        pdf.text(t.license, ML + 3, y)
        pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); sc(C.dark)
        pdf.text(t.name, ML + lbW + 3, y)
        y += 5
        if (t.notes) {
          pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); sc(C.muted)
          const nl = pdf.splitTextToSize(t.notes, CW - lbW - 3)
          nl.forEach((l) => { pdf.text(l, ML + lbW + 3, y); y += 4 })
        }
        y += 1.5
      })
      y += 2
    }

    // Cost Estimate
    const cost = item.cost_estimate
    if (cost) {
      const hw = (CW - 4) / 2
      // Measure content at render font size before computing box height
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold')
      const implLines = pdf.splitTextToSize(cost.implementation ?? '', hw - 6)
      const licLines  = pdf.splitTextToSize(cost.licensing ?? '', hw - 6)
      const maxLines  = Math.max(implLines.length, licLines.length)
      const boxH = 6 + maxLines * 4 + 4
      guard(boxH + 8)
      sectionLabel('COST ESTIMATE')
      ;[
        { title: 'Implementation',    lines: implLines, x: ML },
        { title: 'Ongoing Licensing', lines: licLines,  x: ML + hw + 4 },
      ].forEach(({ title, lines, x }) => {
        sf([249, 250, 251]); sd(C.border); pdf.setLineWidth(0.25)
        pdf.roundedRect(x, y, hw, boxH, 1.5, 1.5, 'FD')
        pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); sc(C.muted)
        pdf.text(title, x + 3, y + 4)
        pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); sc(C.dark)
        lines.forEach((l, li) => pdf.text(l, x + 3, y + 8.5 + li * 4))
      })
      y += boxH + 3
      if (cost.notes) {
        pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic'); sc(C.muted)
        pdf.splitTextToSize(cost.notes, CW).forEach((l) => { pdf.text(l, ML, y); y += 3.8 })
      }
      y += 4
    }

    // Implementation Plan
    const steps = item.action_steps ?? []
    if (steps.length) {
      guard(16)
      sectionLabel('IMPLEMENTATION PLAN')
      steps.forEach((step, si) => {
        const tasks = step.tasks ?? []
        guard(7 + tasks.length * 4.2)
        sf(C.sage); pdf.circle(ML + 3, y - 1.5, 3, 'F')
        pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); sc(C.white)
        pdf.text(String(si + 1), ML + 3, y + 0.5, { align: 'center' })
        pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); sc(C.dark)
        pdf.text(step.phase ?? '', ML + 9, y)
        const phaseW = pdf.getTextWidth(step.phase ?? '')
        if (step.duration) {
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); sc(C.sage)
          pdf.text(step.duration, ML + 9 + phaseW + 3, y)
        }
        y += 5.5
        pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); sc(C.body)
        tasks.forEach((task) => {
          const tl = pdf.splitTextToSize(`-  ${task}`, CW - 12)
          guard(tl.length * 4.2)
          tl.forEach((l) => { pdf.text(l, ML + 9, y); y += 4.2 })
        })
        y += 3
      })
      y += 2
    }

    // Success Metrics
    const metrics = item.success_metrics ?? []
    if (metrics.length) {
      guard(14)
      sectionLabel('SUCCESS METRICS')
      let mx = ML
      metrics.forEach((m) => {
        pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal')
        const mw = pdf.getTextWidth(m) + 8
        if (mx + mw > PW - MR + 2) { mx = ML; y += 6 }
        sf(C.light); pdf.roundedRect(mx, y - 3.5, mw, 5.5, 2, 2, 'F')
        sc(C.body); pdf.text(m, mx + 4, y)
        mx += mw + 3
      })
      y += 7
    }

    y += 4
    if (idx < planItems.length - 1) {
      guard(8); hline([240, 242, 244]); y += 7
    }
  })

  pdf.save(`finops-automation-roadmap-${new Date().toISOString().slice(0, 10)}.pdf`)
}
