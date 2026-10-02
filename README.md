# ONE PIECE | Luffy

A cinematic, scroll-driven fan tribute to Monkey D. Luffy. One long page in white, black and crimson that plays like a film as you scroll: slow-motion footage, arch-window reveals, a 3D picture voyage and a Gear 5 awakening you scrub through frame by frame.

**Live site:** https://gireeshkumarreddy.github.io/one-piece-/

## Run it locally

The clips need a server that answers range requests, so open the site through the included one rather than straight from the folder:

```bash
node serve.js
```

Then open http://localhost:5173. On Windows you can double-click `Open website.cmd` instead.

## What's inside

| Path | What it is |
| --- | --- |
| `index.html` | Every section of the page, in scroll order |
| `css/style.css` | Colours, fonts, layout and the film effects |
| `js/main.js` | Every animation and scroll scene (GSAP, ScrollTrigger, SplitText, Lenis) |
| `assets/img/` | 19 pictures |
| `assets/video/` | 23 slow-motion clips and their posters |
| `assets/seq/awaken/` | 97 frames for the Gear 5 scroll sequence |
| `serve.js` | A tiny local server with range support |
| `guide/ONE-PIECE-Luffy-Guide.pdf` | A step-by-step guide to recreating the site |

## Credits

An unofficial fan project, made for fun and never sold. ONE PIECE is © Eiichiro Oda / Shueisha and Toei Animation; the artwork and footage belong to their creators. Built with GSAP, Lenis and Google Fonts.
