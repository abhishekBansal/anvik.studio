/* anvik.studio — progressive enhancements. The page is complete without this
 * file; every function below only adds motion or polish, and each one checks
 * for the elements it needs so a missing section never breaks the rest. */
(() => {
  'use strict'

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const $ = (selector, root = document) => root.querySelector(selector)
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

  /** Adds a frosted background to the sticky header once the page scrolls. */
  function initHeader() {
    const header = $('[data-header]')
    if (!header) return
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 12)
    update()
    window.addEventListener('scroll', update, { passive: true })
  }

  /** Fades sections in as they enter the viewport, then stops observing them. */
  function initReveal() {
    const items = $$('[data-reveal]')
    if (!('IntersectionObserver' in window) || reducedMotion) {
      items.forEach((item) => item.classList.add('is-in'))
      return
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-in')
      observer.unobserve(entry.target)
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    items.forEach((item) => observer.observe(item))
  }

  /** Cycles the hero's last word with a blur-out / blur-in swap. */
  function initRotator() {
    const rotator = $('[data-rotator]')
    if (!rotator || reducedMotion) return
    const words = ['care.', 'craft.', 'focus.', 'no ads.', 'privacy.']
    const word = $('em', rotator)
    let index = 0
    setInterval(() => {
      rotator.classList.add('is-out')
      setTimeout(() => {
        index = (index + 1) % words.length
        word.textContent = words[index]
        rotator.classList.remove('is-out')
      }, 350)
    }, 2600)
  }

  /** Counts each stat up from zero the first time the stats row is seen. */
  function initCounters() {
    const counters = $$('[data-count]')
    if (!counters.length || reducedMotion || !('IntersectionObserver' in window)) return
    const run = (el) => {
      const target = Number(el.dataset.count)
      const start = performance.now()
      const duration = 1200
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration)
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      run(entry.target)
      observer.unobserve(entry.target)
    }), { threshold: 0.6 })
    counters.forEach((el) => observer.observe(el))
  }

  /** Feeds the pointer position to CSS so cards glow where the cursor is. */
  function initSpotlight() {
    $$('[data-spotlight]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
        card.style.setProperty('--my', `${event.clientY - rect.top}px`)
      })
    })
  }

  /** Nudges the email link toward the cursor while it hovers nearby. */
  function initMagnetic() {
    if (reducedMotion) return
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect()
        const dx = (event.clientX - rect.left - rect.width / 2) * 0.08
        const dy = (event.clientY - rect.top - rect.height / 2) * 0.2
        el.style.transform = `translate(${dx}px, ${dy}px)`
      })
      el.addEventListener('pointerleave', () => { el.style.transform = '' })
    })
  }

  /**
   * Fills each FluxWall column with its thumbnails twice. The column scrolls
   * by exactly -50% (see the wall-up / wall-down keyframes), so the duplicate
   * lands where the original started and the loop has no visible seam.
   */
  function initWallpaperWall() {
    $$('[data-wall]').forEach((column) => {
      const ids = column.dataset.wall.split(' ')
      const images = [...ids, ...ids].map((id) => {
        const img = document.createElement('img')
        img.src = `assets/images/fluxwall/${id}.webp`
        img.alt = ''
        img.loading = 'lazy'
        img.width = 362
        img.height = 788
        return img
      })
      column.replaceChildren(...images)
    })
  }

  /**
   * Types a short DevTools CLI session into the terminal, line by line, then
   * clears and starts over. Lines are pre-highlighted HTML; typing reveals one
   * visible character at a time by walking the text nodes, so markup tags are
   * never split mid-way.
   */
  function initTerminal() {
    const body = $('[data-terminal]')
    if (!body) return
    const session = [
      { html: '<span class="p">$</span> devtools json format response.json', typed: true },
      { html: '{' },
      { html: '  <span class="k">"app"</span>: <span class="s">"devtools"</span>,' },
      { html: '  <span class="k">"local"</span>: <span class="n">true</span>,' },
      { html: '  <span class="k">"telemetry"</span>: <span class="n">null</span>,' },
      { html: '  <span class="k">"took_ms"</span>: <span class="n">3</span>' },
      { html: '}' },
      { html: '<span class="ok">✓ valid JSON · 6 lines</span>' },
      { html: '' },
      { html: '<span class="p">$</span> devtools base64 decode aGVsbG8gYW52aWs=', typed: true },
      { html: '<span class="s">hello anvik</span>' }
    ]
    const cursor = '<span class="cursor"></span>'

    if (reducedMotion) {
      body.innerHTML = session.map((line) => line.html).join('\n')
      return
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    /** Returns `html` cut after `count` visible characters, tags intact. */
    const visiblePrefix = (html, count) => {
      const holder = document.createElement('div')
      holder.innerHTML = html
      let remaining = count
      const walk = (node) => {
        for (const child of [...node.childNodes]) {
          if (child.nodeType === Node.TEXT_NODE) {
            if (remaining <= 0) child.remove()
            else if (child.textContent.length > remaining) { child.textContent = child.textContent.slice(0, remaining); remaining = 0 }
            else remaining -= child.textContent.length
          } else walk(child)
        }
      }
      walk(holder)
      return holder.innerHTML
    }

    const play = async () => {
      for (;;) {
        const done = []
        for (const line of session) {
          if (line.typed) {
            const length = line.html.replace(/<[^>]+>/g, '').length
            for (let i = 0; i <= length; i++) {
              body.innerHTML = [...done, visiblePrefix(line.html, i) + cursor].join('\n')
              await sleep(i < 2 ? 0 : 28 + Math.random() * 40)
            }
            await sleep(380)
          } else {
            await sleep(70)
          }
          done.push(line.html)
          body.innerHTML = [...done, cursor].join('\n')
        }
        await sleep(3800)
      }
    }

    // Start only once the terminal is on screen, so the loop isn't half over
    // by the time a visitor scrolls to it.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      play()
    }, { threshold: 0.3 })
    observer.observe(body)
  }

  /**
   * Draws a slow constellation of drifting points behind the page. Nearby
   * points are joined by faint lines, and points lean gently toward the
   * pointer. Point count scales with screen area and the device pixel ratio
   * is capped at 2, so it stays cheap on phones. The loop pauses while the
   * tab is hidden.
   */
  function initField() {
    const canvas = $('[data-field]')
    if (!canvas || reducedMotion) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pointer = { x: -9999, y: -9999 }
    const linkDistance = 130
    let points = []
    let width = 0
    let height = 0
    let frame = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(110, Math.round((width * height) / 16000))
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.4
      }))
    }

    const step = () => {
      ctx.clearRect(0, 0, width, height)
      for (const p of points) {
        // Gentle pull toward the pointer, strongest when close.
        const dx = pointer.x - p.x
        const dy = pointer.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < 220) { p.vx += (dx / dist) * 0.006; p.vy += (dy / dist) * 0.006 }
        p.vx *= 0.995
        p.vy *= 0.995
        p.x += p.vx
        p.y += p.vy
        // Wrap around the edges so the field never empties out.
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = height + 10
        if (p.y > height + 10) p.y = -10
      }
      for (let i = 0; i < points.length; i++) {
        const a = points[i]
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < linkDistance) {
            ctx.strokeStyle = `rgba(148, 163, 184, ${0.14 * (1 - d / linkDistance)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        ctx.fillStyle = 'rgba(199, 210, 254, 0.55)'
        ctx.beginPath()
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2)
        ctx.fill()
      }
      frame = requestAnimationFrame(step)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', (event) => { pointer.x = event.clientX; pointer.y = event.clientY }, { passive: true })
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(frame)
      if (!document.hidden) frame = requestAnimationFrame(step)
    })
    frame = requestAnimationFrame(step)
  }

  function initYear() {
    const year = $('[data-year]')
    if (year) year.textContent = String(new Date().getFullYear())
  }

  initHeader()
  initReveal()
  initRotator()
  initCounters()
  initSpotlight()
  initMagnetic()
  initWallpaperWall()
  initTerminal()
  initField()
  initYear()
})()
