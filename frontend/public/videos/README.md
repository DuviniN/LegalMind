# Hero background video

`hero-background.mp4` and `hero-poster.jpg` are used as the full-screen hero
background on the landing page (`src/pages/Landing.jsx`).

- `hero-background.mp4` — "A Lawyer Signing a Document", sourced from
  [Pexels](https://www.pexels.com/video/a-lawyer-signing-a-document-7841652/)
  (Pexels License — free for commercial use, no attribution required), ~5MB,
  1920x1080 30fps.
- `hero-poster.jpg` — poster frame from the same Pexels clip, shown while the
  video loads and as a fallback on slow connections.

If these files are removed, the hero still renders correctly using the dark
gradient background — the page will not break.

To swap in a different clip, replace both files (keep the same names) or
update the `<source>`/`poster` paths in `src/pages/Landing.jsx`. Keep the
video short (~10-20s), muted, and under ~5-8MB for fast loads.
