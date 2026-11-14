# Abstract Wallpaper

Generative, endless abstract landscapes rendered in real time with a WebGL2 ray marcher. Every frame is computed on the GPU, so there are no video or image assets and the picture stays sharp at any resolution.

## Getting started

```bash
pnpm install
pnpm dev      # development server with hot reload
pnpm build    # type-check and bundle into a single self-contained dist/index.html
pnpm preview  # serve the production build
```

The production build is one HTML file, so it can be opened directly in a browser or loaded by a live-wallpaper host that accepts a local web page.

## Controls

| Input          | Action                         |
| -------------- | ------------------------------ |
| `H` / dblclick | Toggle the control panel       |
| `N`            | Jump to a random scene         |
| `←` `→`        | Previous / next preset         |

A scene is the combination of a world (overall shape), a terrain (surface relief), a style (shading), a palette, a screen symmetry and a camera. Presets store that combination; custom presets are kept in the browser's local storage.

## How it renders

Each frame runs three passes:

1. **Prepass** – a coarse cone march at 1/8 resolution that records how far every tile can advance through empty space.
2. **Scene** – the full ray march and shading, rendered at a fraction of the output resolution chosen by the quality level. Only the region that the active symmetry actually repeats is rendered.
3. **Composite** – at full resolution: symmetry folding, lightning, rain, contrast, grain and palette.

The quality level sets the internal resolution and the frame-rate cap. Rendering is paced to an even divisor of the display refresh rate, and the resolution drops automatically if frames start arriving late.

## Project layout

```
src/
  config/   worlds, terrains, palettes, parameters, presets, UI labels
  state/    persisted settings and preset library
  scene/    camera rigs, motion, storm, scene director
  render/   WebGL helpers, renderer, pacing, shader sources
  ui/       control panel, hint, keyboard
  dev/      URL flags for still capture and benchmarking
```

Shaders live in `src/render/shaders`. A scene program is assembled from a terrain chunk, a world chunk and the shared marcher, so adding a world or a terrain means adding one `.glsl` file and registering it in `shaders/index.ts` and `config/catalog.ts`.

## Development flags

Append these to the page URL:

| Flag            | Effect                                                        |
| --------------- | ------------------------------------------------------------- |
| `fresh=1`       | Ignore and do not write saved settings                        |
| `ui=0`          | Hide the on-screen hint                                       |
| `preset=<n>`    | Start from the n-th built-in preset                           |
| `<param>=<n>`   | Override any parameter, e.g. `world=5&terrain=1&quality=3`    |
| `t=<seconds>`   | Start the animation at a given time                           |
| `still=1`       | Render a single frame and stop                                |
| `bench=1`       | Measure milliseconds per frame at 1920×1080 into the tab title |
| `prepass=0`     | Disable the prepass                                           |
