/* ONE PIECE | Luffy — scroll choreography
   Every scene is scrubbed by scroll, so the visitor sets the speed of the slow motion. */
(() => {
  'use strict';

  const { gsap, ScrollTrigger, SplitText } = window;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const vw = () => window.innerWidth;
  const vh = () => window.innerHeight;
  const fmt = n => Math.round(n).toLocaleString('en-US');

  /* ---------- Film grain texture, generated once ---------- */
  {
    const size = 160;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    root.style.setProperty('--noise', `url(${c.toDataURL('image/png')})`);
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  // window.__capture is set only by the frame-by-frame recorder, which drives scrolling itself
  if (!reduceMotion && window.Lenis && !window.__capture) {
    lenis = new window.Lenis({ lerp: 0.075, wheelMultiplier: 0.85, touchMultiplier: 1.4 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 2.6 });
    else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  $('.foot__again').addEventListener('click', scrollToTop);
  $('.hud__mark').addEventListener('click', e => { e.preventDefault(); scrollToTop(); });

  /* ---------- Header: chapter names and light/dark ink ---------- */
  const hud = $('.hud');
  const hudText = {
    label: $('[data-hud="label"]'),
    jp: $('[data-hud="jp"]'),
    pill: $('[data-hud="pill"]'),
  };
  let activeScene = null;
  let activeTheme = hud.dataset.theme;

  function roll(el, text) {
    if (el.dataset.text === text) return;
    el.dataset.text = text;
    gsap.killTweensOf(el);
    gsap.timeline()
      .to(el, { yPercent: -115, duration: 0.3, ease: 'power2.in' })
      .add(() => { el.textContent = text; })
      .fromTo(el, { yPercent: 115 }, { yPercent: 0, duration: 0.55, ease: 'power3.out' });
  }
  function setScene(scene) {
    if (scene === activeScene) return;
    activeScene = scene;
    roll(hudText.label, scene.dataset.label);
    roll(hudText.jp, scene.dataset.jp);
    roll(hudText.pill, scene.dataset.pill);
    if (scene._ink) setTheme(scene._ink());
  }
  // a scene says how the header should be inked over it; checked on every update and on arrival
  function inkFor(scene, ink) {
    scene._ink = ink;
    return () => { if (activeScene === scene) setTheme(ink()); };
  }
  function setTheme(theme) {
    if (theme === activeTheme) return;
    activeTheme = theme;
    hud.dataset.theme = theme;
  }
  Object.values(hudText).forEach(el => { el.dataset.text = el.textContent; });

  /* ---------- Video: load when close, play only while on screen ---------- */
  const videos = $$('video[data-src]');
  const loadVideo = v => {
    if (v.getAttribute('src')) return;
    v.preload = 'auto';
    // some loops read best from their middle; start them on the same frame as their poster
    if (v.dataset.t) v.addEventListener('loadedmetadata', () => { v.currentTime = Number(v.dataset.t); }, { once: true });
    v.src = v.dataset.src;
    v.load();
  };
  const playWatch = new IntersectionObserver(entries => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting && !reduceMotion) {
        loadVideo(v);
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.01 });
  videos.forEach(v => playWatch.observe(v));

  /* ---------- Loader ---------- */
  const hero = $('.prologue .film__video');

  function preload() {
    loadVideo(hero);
    const waitFor = (el, ev) => new Promise(res => {
      el.addEventListener(ev, res, { once: true });
      el.addEventListener('error', res, { once: true });
    });
    // only what the first screens need; everything further down streams in as it approaches
    const tasks = [
      document.fonts.ready,
      hero.readyState >= 3 ? Promise.resolve() : waitFor(hero, 'canplay'),
      ...$$('.wanted img, #dream .arch img').map(img => (img.complete ? Promise.resolve() : waitFor(img, 'load'))),
    ];
    const sun = $('.loader__sun');
    const count = $('.loader__count');
    const shown = { p: 0 };
    let done = 0;
    let target = 0;

    const tick = () => {
      gsap.to(shown, {
        p: target,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          count.textContent = Math.round(shown.p);
          gsap.set(sun, { scale: 0.02 + 0.98 * (shown.p / 100) });
        },
      });
    };
    tasks.forEach(t => t.then(() => { done += 1; target = (done / tasks.length) * 100; tick(); }));

    const minimum = new Promise(res => setTimeout(res, 1800));
    const timeout = new Promise(res => setTimeout(res, 9000));
    return Promise.race([Promise.all([Promise.all(tasks), minimum]), timeout]).then(() => {
      target = 100;
      tick();
      return new Promise(res => setTimeout(res, 650));
    });
  }

  function intro() {
    const sun = $('.loader__sun');
    const film = $('.prologue__film');
    const r = sun.getBoundingClientRect().width / 2;
    const copy = $('.prologue__intro');

    gsap.set(film, { clipPath: `circle(${r}px at 50% 50%)` });
    const lines = SplitText.create(copy, { type: 'lines', mask: 'lines' }).lines;
    gsap.set(lines, { yPercent: 110 });
    hero.play().catch(() => {});

    const tl = gsap.timeline({
      onComplete() {
        gsap.set(film, { clipPath: 'inset(0% 0% 0% 0% round 0px)' });
        $('.loader').remove();
        body.classList.remove('is-loading');
        if (lenis) lenis.start();
        buildScroll();
      },
    });
    tl.to('.loader__count, .loader__mark', { opacity: 0, duration: 0.4, ease: 'power1.out' })
      .set('.loader', { backgroundColor: 'transparent' })
      // the red sun dissolves into the first shot, then opens to fill the screen
      .to(sun, { opacity: 0, duration: 0.8, ease: 'power1.inOut' })
      .fromTo(film, { clipPath: `circle(${r}px at 50% 50%)` }, { clipPath: `circle(${Math.hypot(vw(), vh()) / 2 + 4}px at 50% 50%)`, duration: 2, ease: 'expo.inOut' }, '+=0.1')
      .fromTo(hero, { scale: 1.4 }, { scale: 1.06, duration: 2.6, ease: 'expo.out' }, '<')
      .fromTo('.prologue .burn', { opacity: 0, xPercent: -14 }, { opacity: 0.9, xPercent: 0, duration: 0.7, ease: 'power2.out' }, '<+0.55')
      .to('.prologue .burn', { opacity: 0, xPercent: 12, duration: 1.2, ease: 'power2.inOut' })
      .fromTo('.prologue .letterbox i', { scaleY: 0 }, { scaleY: 1, duration: 1.1, ease: 'power3.out' }, '<-0.5')
      .fromTo(hud, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '<')
      // the copy (and the shadow pool behind it) only appears once the film has opened
      .fromTo(copy, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: 'power1.out' }, '<+0.15')
      .to(lines, { yPercent: 0, duration: 1.3, stagger: 0.1, ease: 'power4.out' }, '<')
      .to('.scroll-cue', { opacity: 1, duration: 0.8 }, '<+0.7');
  }

  /* ---------- Scroll scenes ---------- */
  let mm = null;

  function buildScroll() {
    mm = gsap.matchMedia();
    mm.add({
      desktop: '(min-width: 821px) and (prefers-reduced-motion: no-preference)',
      mobile: '(max-width: 820px) and (prefers-reduced-motion: no-preference)',
      still: '(prefers-reduced-motion: reduce)',
    }, ctx => {
      const { desktop, still } = ctx.conditions;
      if (still) { staticPage(); return; }
      const cleanups = [];
      // build top to bottom, so every pin knows the space taken by the pins above it
      $$('main > section').forEach(sec => {
        const is = name => sec.classList.contains(name);
        if (is('prologue')) prologueScene();
        else if (is('marquee')) cleanups.push(marqueeScene());
        else if (is('wanted')) cleanups.push(bountyScene(desktop));
        else if (is('chapter')) chapterScene(sec, desktop);
        else if (is('voyage')) voyageScene(desktop);
        else if (is('awaken')) cleanups.push(awakenScene(false));
        else if (is('epilogue')) epilogueScene();
      });
      watchScenes();
      ScrollTrigger.refresh();   // re-measure once everything exists, so each pin uses its final length
      return () => cleanups.forEach(fn => fn && fn());
    });
  }

  function prologueScene() {
    const sec = $('.prologue');
    const film = $('.prologue__film');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: '+=240%', pin: true, scrub: 0.8,
        onUpdate: inkFor(sec, () => (tl.scrollTrigger && tl.scrollTrigger.progress < 0.42 ? 'dark' : 'light')),
      },
    });
    tl.to('.scroll-cue', { opacity: 0, duration: 0.05 }, 0)
      .to('.prologue__intro', { opacity: 0, y: -40, filter: 'blur(8px)', duration: 0.18, ease: 'power1.in' }, 0.04)
      .to('.prologue .letterbox i', { scaleY: 0, duration: 0.2, ease: 'power2.inOut' }, 0.2)
      .fromTo(film, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(18% 27% 38% 27% round 6px)', duration: 0.4, ease: 'power3.inOut' }, 0.24)
      .to(hero, { scale: 1, duration: 0.4, ease: 'power3.inOut' }, 0.24)
      .fromTo('.band', { yPercent: 101, autoAlpha: 1 }, { yPercent: 0, duration: 0.32, ease: 'power3.out' }, 0.52)
      .from('.band__title span', { yPercent: 120, opacity: 0, stagger: 0.07, duration: 0.26, ease: 'power3.out' }, 0.6)
      .from('.band .seal', { scale: 0.6, opacity: 0, rotation: -8, stagger: 0.05, duration: 0.2, ease: 'back.out(2)' }, 0.66)
      .to({}, { duration: 0.12 });
  }

  function bountyScene(desktop) {
    const sec = $('.wanted');
    const first = $('.poster--first .poster__amount');
    const live = $('.poster--now .poster__amount');
    const nodes = $$('.bounty-line li');
    const values = nodes.map(n => Number(n.dataset.v));
    const last = values.length - 1;
    const state = { first: 0, step: 0 };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: '+=220%', pin: true, scrub: 0.8,
        onUpdate: inkFor(sec, () => 'light'),
      },
    });
    tl.from('.wanted__title', { yPercent: 40, opacity: 0, duration: 0.16, ease: 'power2.out' }, 0)
      .from('.poster', { y: () => vh() * 0.55, rotation: i => (i ? 7 : -7), opacity: 0, duration: 0.28, stagger: 0.06, ease: 'power3.out' }, 0.04)
      .to(state, {
        first: values[0], duration: 0.2, ease: 'power2.out',
        onUpdate: () => { first.textContent = fmt(state.first); nodes[0].classList.toggle('is-on', state.first >= values[0] - 1); },
      }, 0.16)
      .to(state, {
        step: last, duration: 0.52,
        onUpdate: () => {
          const i = Math.min(Math.floor(state.step), last);
          const f = state.step - i;
          const a = values[i];
          const b = values[Math.min(i + 1, last)];
          live.textContent = fmt(a + (b - a) * f);
          nodes.forEach((n, k) => n.classList.toggle('is-on', state.step >= k - 0.001 && state.first >= values[0]));
        },
      }, 0.36)
      .fromTo('.bounty-line__fill', { scaleX: 0 }, { scaleX: 1, duration: 0.52 }, 0.36)
      .to({}, { duration: 0.12 });

    // posters breathe, and lean toward the pointer
    const bodies = $$('.poster__body');
    const float = gsap.to(bodies, { y: -10, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.8 });
    if (!desktop) return () => float.kill();
    const rx = bodies.map(b => gsap.quickTo(b, 'rotationX', { duration: 0.9, ease: 'power3.out' }));
    const ry = bodies.map(b => gsap.quickTo(b, 'rotationY', { duration: 0.9, ease: 'power3.out' }));
    const onMove = e => {
      const x = e.clientX / vw() - 0.5;
      const y = e.clientY / vh() - 0.5;
      bodies.forEach((_, i) => { ry[i](x * 16); rx[i](-y * 10); });
    };
    sec.addEventListener('pointermove', onMove);
    return () => { sec.removeEventListener('pointermove', onMove); float.kill(); };
  }

  function chapterScene(ch, desktop) {
    const track = $('.chapter__track', ch);
    const opener = $('.panel--opener', ch);
    const film = $('.opener__film', ch);
    const media = $('.film__video', film);
    const arches = $$('.arch', ch);
    const kanji = $('.opener__kanji', ch);
    const en = $('.opener__en', ch);
    const burn = $('.burn', ch);
    const bars = $$('.letterbox i', ch);
    const panels = $$('.panel:not(.panel--opener)', ch);
    const isSun = ch.classList.contains('chapter--sun');

    const W = vw();
    const H = vh();
    const archW = W * (desktop ? 0.32 : 0.74);
    const top = H * (desktop ? 0.24 : 0.22);
    const bottom = H * (desktop ? 0.12 : 0.14);
    const side = (W - archW) / 2;
    const r = archW / 2;
    const archClip = `inset(${top}px ${side}px ${bottom}px ${side}px round ${r}px ${r}px 0px 0px)`;
    const fullClip = 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)';
    gsap.set(film, { clipPath: archClip });

    // buffer this chapter's footage a screen before it arrives
    ScrollTrigger.create({ trigger: ch, start: () => `top bottom+=${vh()}`, once: true, onEnter: () => $$('video', ch).forEach(loadVideo) });

    // the arches rise into place as the chapter scrolls up
    gsap.fromTo([...arches, film], { y: H * 0.18 }, {
      y: 0, ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top bottom', end: 'top top', scrub: 0.8 },
    });

    const OPEN = H * 1.7;                                   // scroll spent opening the arch
    const SLIDE = desktop ? Math.max(0, track.scrollWidth - W) : 0;
    let total = OPEN + SLIDE;                               // grows to the timeline's length once it's built

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: desktop ? ch : opener,
        start: 'top top',
        // one pixel of scroll moves the strip one pixel; the last picture's drift adds a short hold
        end: () => `+=${total}`,
        pin: true,
        scrub: 0.8,
        // dark ink while the film fills the screen, paper ink once the pages take over
        onUpdate: inkFor(ch, () => {
          const t = tl.time();
          if (!desktop) return t > OPEN * 0.36 && tl.scrollTrigger && tl.scrollTrigger.progress < 0.999 ? 'dark' : 'light';
          return t > OPEN * 0.36 && t < OPEN + W * 0.5 ? 'dark' : 'light';
        }),
      },
    });

    // 1. the centre arch opens into the full frame
    tl.fromTo(film, { clipPath: archClip }, { clipPath: fullClip, duration: OPEN * 0.55, ease: 'power2.inOut' }, 0)
      .fromTo(media, { scale: 1.28 }, { scale: 1.02, duration: OPEN * 0.8, ease: 'power2.out' }, 0);
    arches.forEach((a, i) => {
      tl.to(a, { xPercent: i ? 45 : -45, scale: 0.9, opacity: 0, duration: OPEN * 0.42, ease: 'power2.in' }, OPEN * 0.04);
    });
    tl.fromTo(burn, { opacity: 0, xPercent: -14 }, { opacity: isSun ? 1 : 0.85, xPercent: 0, duration: OPEN * 0.14, ease: 'power2.out' }, OPEN * 0.3)
      .to(burn, { opacity: 0, xPercent: 14, duration: OPEN * 0.26, ease: 'power2.inOut' }, OPEN * 0.44)
      .fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: OPEN * 0.2, ease: 'power3.out' }, OPEN * 0.46)
      .fromTo(kanji, { x: W * 0.32, opacity: 0 }, { x: 0, opacity: 1, duration: OPEN * 0.36, ease: 'power3.out' }, OPEN * 0.5)
      .fromTo(en, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: OPEN * 0.2, ease: 'power2.out' }, OPEN * 0.66);

    if (!desktop) {
      tl.to({}, { duration: OPEN * 0.1 });
      total = tl.duration();
      panels.forEach(p => revealOnEnter(p));
      return;
    }

    // 2. the strip slides sideways: the film leaves left, the pages arrive from the right
    tl.to(track, { x: -SLIDE, duration: SLIDE }, OPEN)
      .to(media, { xPercent: 14, duration: W, ease: 'none' }, OPEN)
      .to(kanji, { x: -W * 0.28, duration: W, ease: 'none' }, OPEN)
      .to(bars, { scaleY: 0, duration: W * 0.5, ease: 'power1.in' }, OPEN + W * 0.2);

    panels.forEach(p => {
      const enter = OPEN + p.offsetLeft - W;                // when the panel's left edge reaches the right edge
      const cross = W + p.offsetWidth;
      $$('.frame', p).forEach(frame => {
        const inner = frame.querySelector('img, video');
        tl.fromTo(frame, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: W * 0.32, ease: 'power3.out' }, enter + W * 0.12);
        if (inner) tl.fromTo(inner, { xPercent: -7, scale: 1.18 }, { xPercent: 7, scale: 1.08, duration: cross }, enter);
      });
      revealTextInTimeline(tl, p, enter + W * 0.2, W);
    });
    total = Math.max(total, tl.duration());
  }

  // masked line reveals for copy inside the sideways strip
  function revealTextInTimeline(tl, panel, at, W) {
    const blocks = $$('.panel__h, .panel__p, .quote, .roster__note', panel);
    blocks.forEach((el, i) => {
      const lines = SplitText.create(el, { type: 'lines', mask: 'lines' }).lines;
      tl.from(lines, { yPercent: 110, duration: W * 0.3, stagger: W * 0.025, ease: 'power3.out' }, at + i * W * 0.06);
    });
    const marks = $$('.vjp, figcaption, .roster li', panel);
    if (marks.length) tl.from(marks, { opacity: 0, y: 16, duration: W * 0.25, stagger: W * 0.02, ease: 'power2.out' }, at + W * 0.05);
  }

  // phones: panels reveal as they scroll up
  function revealOnEnter(panel) {
    const blocks = $$('.panel__h, .panel__p, .quote', panel);
    const lines = blocks.flatMap(el => SplitText.create(el, { type: 'lines', mask: 'lines' }).lines);
    const tl = gsap.timeline({ scrollTrigger: { trigger: panel, start: 'top 82%', toggleActions: 'play none none reverse' } });
    if (lines.length) tl.from(lines, { yPercent: 110, duration: 1, stagger: 0.06, ease: 'power3.out' });
    $$('.frame', panel).forEach(f => tl.fromTo(f, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.out' }, 0));
  }

  // two rows of names that drift on their own and surge with the scroll
  function marqueeScene() {
    const sec = $('.marquee');
    const rows = $$('.marquee__track', sec).map((track, i) => {
      track.dataset.unit = track.dataset.unit || track.innerHTML;
      track.innerHTML = track.dataset.unit;
      while (track.scrollWidth < vw() * 1.5) track.insertAdjacentHTML('beforeend', track.dataset.unit);
      track.insertAdjacentHTML('beforeend', track.innerHTML);   // two identical halves wrap seamlessly
      const half = track.scrollWidth / 2;
      return { half, x: i ? -half / 2 : 0, sign: i ? 1 : -1, set: gsap.quickSetter(track, 'x', 'px') };
    });
    let extra = 0;
    let dir = 1;
    const tick = (time, dt) => {
      extra *= Math.pow(0.9, dt / 16.7);
      const step = (60 + extra) * (dt / 1000) * dir;
      rows.forEach(r => { r.x = gsap.utils.wrap(-r.half, 0, r.x + step * r.sign); r.set(r.x); });
    };
    let running = false;
    const run = on => {
      if (on === running) return;
      running = on;
      if (on) gsap.ticker.add(tick); else gsap.ticker.remove(tick);
    };
    rows.forEach(r => r.set(r.x));
    ScrollTrigger.create({
      trigger: sec, start: 'top bottom', end: 'bottom top',
      onToggle: self => run(self.isActive),
      onUpdate: self => { dir = self.direction; extra = Math.min(1400, Math.abs(self.getVelocity()) * 0.5); },
    });
    return () => run(false);
  }

  // the voyage: every picture flies past the camera as you scroll
  function voyageScene(desktop) {
    const sec = $('.voyage');
    const cards = $$('.card', sec);
    const GAP = 480;
    const START = -900;
    const TRAVEL = cards.length * GAP + 1800;
    const W = vw();
    const H = vh();
    const items = cards.map(card => {
      const x = Number(card.dataset.x) * (desktop ? 1 : 0.62);
      const y = Number(card.dataset.y) * (desktop ? 1 : 0.9);
      const w = Number(card.dataset.w) * (desktop ? 1 : 1.9);
      gsap.set(card, { width: (w * W) / 100, xPercent: -50, yPercent: -50, x: (x * W) / 100, y: (y * H) / 100, z: START, opacity: 0 });
      return { card, z: gsap.quickSetter(card, 'z', 'px'), o: gsap.quickSetter(card, 'opacity'), shown: false };
    });
    const render = p => {
      items.forEach((it, i) => {
        const z = START - i * GAP + p * TRAVEL;
        // fade in out of the white distance, fade out just before reaching the lens
        const o = gsap.utils.clamp(0, 1, (z + 4600) / 3000) * gsap.utils.clamp(0, 1, (720 - z) / 520);
        const show = o > 0.004;
        if (show !== it.shown) { it.shown = show; it.card.style.visibility = show ? 'visible' : 'hidden'; }
        if (show) { it.z(Math.min(z, 880)); it.o(o); }
      });
    };
    const state = { p: 0 };
    render(0);
    // decode every picture before the flight starts, so none of them pops in mid-air
    ScrollTrigger.create({
      trigger: sec, start: () => `top bottom+=${vh() * 2}`, once: true,
      onEnter: () => cards.forEach(c => { const img = c.querySelector('img'); img.loading = 'eager'; img.decode().catch(() => {}); }),
    });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: '+=520%', pin: true, scrub: 1,
        onUpdate: inkFor(sec, () => 'light'),
      },
    });
    tl.to(state, { p: 1, duration: 1, onUpdate: () => render(state.p) }, 0)
      .to('.voyage__intro', { opacity: 0, scale: 0.94, duration: 0.07 }, 0.91);

    const lines = SplitText.create('.voyage__title', { type: 'lines', mask: 'lines' }).lines;
    gsap.from(lines, {
      yPercent: 110, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: sec, start: 'top 75%', end: 'top 10%', scrub: 0.8 },
    });
    gsap.from('.voyage__kicker, .voyage__sub', {
      opacity: 0, y: 18, stagger: 0.12, ease: 'power2.out',
      scrollTrigger: { trigger: sec, start: 'top 70%', end: 'top 15%', scrub: 0.8 },
    });
  }

  /* ---------- The awakening: footage scrubbed frame by frame on a canvas ---------- */
  const SEQ = { count: 97, src: i => `assets/seq/awaken/${String(i + 1).padStart(3, '0')}.webp` };
  const seqFrames = new Array(SEQ.count);
  let seqLoading = false;
  let seqRedraw = null;   // set by the scene, so frames that arrive late can repaint

  function loadSequence() {
    if (seqLoading) return;
    seqLoading = true;
    let next = 0;
    const pump = () => {
      if (next >= SEQ.count) return;
      const i = next++;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { seqFrames[i] = img; if (seqRedraw) seqRedraw(i); pump(); };
      img.onerror = pump;
      img.src = SEQ.src(i);
    };
    for (let k = 0; k < 6; k++) pump();
  }

  function awakenScene(still) {
    const sec = $('.awaken');
    const canvas = $('.awaken__canvas', sec);
    const ctx = canvas.getContext('2d');
    const state = { pos: still ? 0.74 : 0 };
    let rect = [0, 0, 0, 0];

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const s = Math.max(canvas.width / 1280, canvas.height / 720);
      rect = [(canvas.width - 1280 * s) / 2, (canvas.height - 720 * s) / 2, 1280 * s, 720 * s];
    };
    const nearest = i => {
      for (let d = 1; d < SEQ.count; d++) {
        if (seqFrames[i - d]) return seqFrames[i - d];
        if (seqFrames[i + d]) return seqFrames[i + d];
      }
      return null;
    };
    // cross-dissolve neighbouring frames, so a slow scroll glides instead of stepping
    const draw = () => {
      const f = state.pos * (SEQ.count - 1);
      const i = Math.floor(f);
      const a = seqFrames[i] || nearest(i);
      if (!a) return;
      ctx.globalAlpha = 1;
      ctx.drawImage(a, ...rect);
      const b = seqFrames[i + 1];
      const t = f - i;
      if (b && t > 0.02) {
        ctx.globalAlpha = t;
        ctx.drawImage(b, ...rect);
        ctx.globalAlpha = 1;
      }
    };
    fit();
    seqRedraw = i => {
      const f = state.pos * (SEQ.count - 1);
      if (Math.abs(i - f) < 2 || !seqFrames[Math.floor(f)]) draw();
    };
    draw();

    if (still) {
      loadSequence();
      return () => { seqRedraw = null; };
    }
    // fetch the frames a few screens early, or after the page settles, whichever comes first
    ScrollTrigger.create({ trigger: sec, start: () => `top bottom+=${vh() * 3}`, once: true, onEnter: loadSequence });
    const idle = setTimeout(loadSequence, 6000);

    const subs = $$('.sub', sec);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: '+=460%', pin: true, scrub: 0.6,
        onUpdate: inkFor(sec, () => 'dark'),
      },
    });
    tl.to(state, { pos: 1, duration: 1, onUpdate: draw }, 0)
      .fromTo('.awaken__meter i', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .fromTo('.awaken .letterbox i', { scaleY: 0 }, { scaleY: 1, duration: 0.05, ease: 'power2.out' }, 0);
    // subtitles, timed to the cuts in the footage: lying still, rising, the grin
    [[0.02, 0.21], [0.27, 0.45], [0.66, 0.83]].forEach(([from, to], k) => {
      tl.fromTo(subs[k], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.03 }, from)
        .to(subs[k], { opacity: 0, y: -8, duration: 0.03 }, to);
    });
    // the eruption flashes white, then the name of the form lands
    tl.fromTo('.awaken .burn', { opacity: 0 }, { opacity: 0.9, duration: 0.04, ease: 'power2.out' }, 0.47)
      .to('.awaken .burn', { opacity: 0, duration: 0.08 }, 0.52)
      .fromTo('.awaken__gear', { opacity: 0, scale: 1.25, letterSpacing: '0.2em' }, { opacity: 1, scale: 1, letterSpacing: '0.01em', duration: 0.08, ease: 'power3.out' }, 0.86)
      .fromTo('.awaken__jp', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.88);

    return () => { clearTimeout(idle); seqRedraw = null; };
  }

  function epilogueScene() {
    const sec = $('.epilogue');
    const stage = $('.epilogue__stage', sec);
    const film = $('.epilogue__film', sec);
    const video = $('.film__video', film);
    const mark = $('.epilogue__mark', sec);
    const tbc = $('.epilogue__tbc', sec);

    const lines = SplitText.create('.epilogue__line', { type: 'lines', mask: 'lines' }).lines;
    gsap.from(lines, {
      yPercent: 110, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: sec, start: 'top 80%', end: 'top 15%', scrub: 0.8 },
    });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: '+=280%', pin: true, scrub: 0.8,
        onUpdate: inkFor(sec, () => (tl.scrollTrigger && tl.scrollTrigger.progress > 0.2 ? 'dark' : 'light')),
      },
    });
    tl.to({}, { duration: 0.1 })
      .fromTo(film, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.3, ease: 'power3.inOut' })
      .fromTo(video, { scale: 1.3 }, { scale: 1.02, duration: 0.5, ease: 'power2.out' }, '<')
      .fromTo('.epilogue .letterbox i', { scaleY: 0 }, { scaleY: 1, duration: 0.14, ease: 'power2.out' }, '-=0.08')
      .fromTo(mark, { opacity: 0, letterSpacing: '0.62em' }, { opacity: 1, letterSpacing: '0.3em', duration: 0.2, ease: 'power2.out' }, '<')
      .to(mark, { opacity: 0, duration: 0.08 }, '+=0.1')
      // the end card slams in like the last frame of an episode
      .to(video, { filter: 'brightness(0.38) saturate(0.7)', duration: 0.1 }, '<')
      .fromTo(tbc, { opacity: 0, scale: 1.8, rotation: -7 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.1, ease: 'back.out(2.4)' }, '<+0.03')
      .to(stage, { keyframes: { x: [0, -16, 12, -8, 5, 0], y: [0, 6, -5, 3, -1, 0] }, duration: 0.07 }, '>-0.015')
      .to({}, { duration: 0.14 });
  }

  // header follows whichever scene holds the middle of the screen
  function watchScenes() {
    $$('.scene').forEach(scene => {
      const box = scene.parentElement.classList.contains('pin-spacer') ? scene.parentElement : scene;
      ScrollTrigger.create({
        trigger: box, start: 'top 50%', end: 'bottom 50%',
        onToggle: self => { if (self.isActive) setScene(scene); },
      });
    });
    // chapter openers pin only their first panel on phones, so watch the chapter itself there
    setScene($('.prologue'));
  }

  function staticPage() {
    root.classList.add('is-static');
    gsap.set(hud, { opacity: 1 });
    setTheme('light');
    awakenScene(true);
    $$('.scene').forEach(scene => {
      ScrollTrigger.create({
        trigger: scene, start: 'top 50%', end: 'bottom 50%',
        onToggle: self => { if (self.isActive) setScene(scene); },
      });
    });
  }

  /* ---------- Rebuild on resize so every distance is measured fresh ---------- */
  let lastW = vw();
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!mm || Math.abs(vw() - lastW) < 40) return;
      lastW = vw();
      mm.revert();
      buildScroll();
      ScrollTrigger.refresh();
    }, 250);
  });

  /* ---------- Start ---------- */
  if (reduceMotion) {
    $('.loader').remove();
    body.classList.remove('is-loading');
    gsap.set('.prologue__film', { clipPath: 'none' });
    buildScroll();
  } else {
    window.scrollTo(0, 0);
    preload().then(intro);
  }
})();
