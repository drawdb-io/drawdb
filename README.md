<div align="center">
  <sup>Special thanks to:</sup>
  <br>
  <a href="https://www.warp.dev/drawdb/" target="_blank">
    <img alt="Warp sponsorship" width="280" src="https://github.com/user-attachments/assets/c7f141e7-9751-407d-bb0e-d6f2c487b34f">
    <br>
    <b>Next-gen AI-powered intelligent terminal for all platforms</b>
  </a>
</div>

<br/>
<br/>

<div align="center">
    <img width="64" alt="drawdb logo" src="./src/assets/icon-dark.png">
    <h1>drawDB</h1>
</div>

<h3 align="center">Free, simple, and intuitive database schema editor and SQL generator.</h3>

<div align="center" style="margin-bottom:12px;">
    <a href="https://drawdb.app/" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/Start%20building-grey" alt="drawDB"/>
    </a>
    <a href="https://discord.gg/BrjZgNrmR6" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/discord/1196658537208758412.svg?label=Join%20the%20Discord&logo=discord" alt="Discord"/>
    </a>
    <a href="https://x.com/drawDB_" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/Follow%20us%20on%20X-blue?logo=X" alt="Follow us on X"/>
    </a>
    <a href="https://getmanta.ai/drawdb">
        <img src="https://getmanta.ai/api/badges?text=Manta%20Graph&link=drawdb" alt="DrawDB graph on Manta">
    </a> 
</div>

<h3 align="center"><img width="700" style="border-radius:5px;" alt="demo" src="drawdb.png"></h3>

DrawDB is a robust and user-friendly database entity relationship (DBER) editor right in your browser. Build diagrams with a few clicks, export sql scripts, customize your editor, and more without creating an account. See the full set of features [here](https://drawdb.app/).

## Getting Started

### Local Development

```bash
git clone https://github.com/drawdb-io/drawdb
cd drawdb
npm install
npm run dev
```

### Build

```bash
git clone https://github.com/drawdb-io/drawdb
cd drawdb
npm install
npm run build
```

### Docker Build

```bash
docker build -t drawdb .
docker run -p 3000:80 drawdb
```

If you want to enable sharing, set up the [server](https://github.com/drawdb-io/drawdb-server) and environment variables according to `.env.sample`. This is optional unless you need to share files..

---

## Troubleshooting — PostCSS / lightningcss native binary

If you see errors in the browser or terminal after running `npm run dev` that look like:

```
Failed to load PostCSS config: Loading PostCSS Plugin failed: Cannot find module '../lightningcss.darwin-arm64.node'
```

or repeated Vite errors related to PostCSS / Tailwind, this usually means the native `lightningcss` binary (used by Tailwind v4 / PostCSS) failed to install for your platform. npm may have completed without an obvious error because `lightningcss` is an optional/native dependency.

**Recommended fixes (try in order):**

1) Rebuild the lightningcss binary:

```bash
npm rebuild lightningcss --update-binary
```

2) If that does not help, remove `node_modules` and the lockfile, then reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

3) On macOS Apple Silicon (M1/M2/M3): if the binary still fails to load, try running the terminal under Rosetta (x86) and then re-run the rebuild command above. Alternatively, you can try forcing a build from source (this may require additional toolchain):

```bash
npm install lightningcss --build-from-source
```

Notes:
- Tailwind v4 uses a native binary (`lightningcss`) for performance. 
- When the binary is missing, PostCSS will throw at runtime and Vite will fail to transform CSS.

If none of the above steps help, please open an issue and include: your OS, Node & npm versions, and the full error stack you see in your browser/terminal.

