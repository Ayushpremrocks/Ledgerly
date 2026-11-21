# Ledgerly frontend

React 19 + Vite 7 + Tailwind CSS 4. See the [main README](../README.md) for how to run the whole app.

```bash
npm install
npm run dev     # http://localhost:3000, talks to http://localhost:8080/api
npm run build   # production build in dist/
npm run lint
```

Set `VITE_API_URL` to point at a different backend (see `.env.production`).

## Where things are

| Path | What it holds |
|---|---|
| `src/index.css` | Design tokens (colors for light and dark mode). Change the look here. |
| `src/components/ui.jsx` | Buttons, inputs, cards, modals, badges: the building blocks of every page |
| `src/components/AppLayout.jsx` | Sidebar, top bar, mobile menu |
| `src/components/charts/` | The in/out bar chart and ranked bar lists |
| `src/pages/` | One file per screen |
| `src/lib/api.js` | Every backend call |
| `src/lib/format.js` | Rupee, date and account-number formatting |
| `src/context/` | Signed-in user, theme, toast messages |
