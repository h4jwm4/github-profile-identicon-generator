# github-profile-identicon-generator

Generate symmetrical pixel avatars for your GitHub profile. Runs entirely in the browser — no server, no tracking, no account required.

**[→ Try it live](https://h4jwm4.github.io/github-profile-identicon-generator)**

![screenshot](./src/assets/hero.png)

---

## Features

- 5×5, 7×7, and 9×9 grid sizes
- Adjustable color saturation
- Light, dark, and deep backgrounds
- Rounded or sharp pixel style
- Export at 1× (480px), 2× (960px), or 4× (1920px)
- Session history — click any previous icon to restore it
- Copy generated hex color to clipboard
- 100% client-side, zero network requests

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- shadcn/ui
- HTML5 Canvas (rendering + export)

## Running locally

```bash
git clone https://github.com/h4jwm4/github-profile-identicon-generator
cd github-profile-identicon-generator
npm install
npm run dev
```

## Deploying to GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to `vite.config.ts`:

```ts
base: '/github-profile-identicon-generator/',
```

Add to `package.json` scripts:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Then:

```bash
npm run deploy
```

Enable Pages in your repo: Settings → Pages → source: `gh-pages` branch.

## How it works

1. Pick a random hue (0–360°) at the chosen saturation level
2. Randomly fill the left half of the grid
3. Mirror it horizontally for bilateral symmetry
4. Render to an HTML5 Canvas and scale on export

## License

MIT