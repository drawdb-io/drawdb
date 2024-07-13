<h3 align="center">
    <img width="80" alt="drawdb logo" src="./src/assets/icon-dark.png">
</h3>

<h3 align="center">Free, simple, and intuitive database design tool and SQL generator.</h3>

<p align="center">
    <a href="https://drawdb.app/">drawDB</a>
    ·  
    <a href="https://discord.gg/BrjZgNrmR6">Discord</a>
    ·  
    <a href="https://x.com/drawDB_">X</a>
</p>

<h3 align="center"><img width="700" style="border-radius:5px;" alt="demo" src="drawdb.gif"></h3>

## drawDB

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

Set up the [server](https://github.com/drawdb-io/drawdb-server) and environment variables according to `.env.sample` for the survey and bug report forms.
