# BetterBahn – PWA Branch

BetterBahn is an open-source web app that helps you find comfortable and affordable train connections in Germany – featuring split-ticketing and a modern PWA interface.

With the new approach, we focus on a simple, low-maintenance, and fully client-side solution that works across all devices – without the need for a custom backend or server infrastructure.

---

## New Approach

Instead of fetching data via the `db-vendo-client`, we now use the public [transport.rest API (v6)](https://v6.db.transport.rest/).

This change brings several benefits:

- No dedicated server or proxy required
- Static, client-side architecture (Next.js + Static Export)
- Works as a Progressive Web App (PWA) on both desktop and mobile
- Easy deployment on GitHub Pages, Vercel, or any standard web host

---

## Current Focus

### Connection Search

- Optimize search logic and performance
- Store recurring traveler data (e.g., name, BahnCard) using cookies
- Add advanced options like arrival time, time window, or transport type filters
- Improve station search by caching results to reduce unnecessary API calls

### Split Ticketing

- Rebuild and improve the split-ticketing feature
- Compare different algorithms for better price optimization
- Optional “risk assessment” modes:
  - Only consider splits without transfers
  - Or include splits with transfers (for experienced travelers)

### Additional Features

- Implement an overbooking feature to simulate sold-out connections
- Integrate more transport providers through [transport.rest](https://transport.rest/)
- Allow community-created adapters for regional transport associations

### UI / UX and PWA

- Full PWA functionality (offline support, installable as app)
- Modern, responsive interface
- Light and dark mode
- Smooth animations and user-centered design

---

## Technology

- Next.js with static export (`next export`)
- [transport.rest API (v6)](https://v6.db.transport.rest/) as the main data source
- TypeScript, React Hooks, TailwindCSS
- npm as the package manager

---

## Getting Started

```bash
# Clone the repository
git clone [https://github.com/l2xu/betterbahn.git](https://github.com/l2xu/betterbahn.git)
cd betterbahn

# Install dependencies
npm install

# Start the development server
npm run dev
```

The project will be available at http://localhost:3000.

To generate a static export:

```bash
npm run build
npm run export
```

The output will be located in the /out directory and can be deployed to any web server or CDN.

## License

This project is licensed under the AGPL-3.0-only. See the [LICENSE](https://github.com/BetterBahn/betterbahn/blob/main/LICENSE) file for details.

## Community and Contribution

Join the [Discord community](https://discord.gg/9pFXzs6XRK) to ask questions, share feedback, and connect with other users and contributors.

Want to contribute? Please read the [Code of Conduct](/https://github.com/BetterBahn/betterbahn/blob/main/CODE_OF_CONDUCT.md) and see the [Contributing Guide](/https://github.com/BetterBahn/betterbahn/blob/main/CONTRIBUTE.md) for details on how to get started.

---

Made with ❤️ for train travelers in Germany.
