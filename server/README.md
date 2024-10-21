# DrawDB Node.js Wrapper

This is a Node.js application that serves static files for the DrawDB frontend and provides an API to handle file operations for `.ddb` files.

## Environment variables:
- `DRAWDB_FILE_DIR`: Directory where `.ddb` files will be stored (default: `/usercode`).
- `DRAWDB_HOME`: Path to the DrawDB frontend static files (default: `../dist`).
- `DRAWDB_PORT`: Port number for the app (default: `8080`).

## Run dev
```bash
export DRAWDB_FILE_DIR=/some-dir-to-write-ddb-files
cd server
npm run start
```

The server will be running at `http://localhost:8080` (or the port specified by `DRAWDB_PORT`).
