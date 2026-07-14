// Database Connection — sql.js (pure JS SQLite, no native deps)
import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CREATE_TABLES_SQL } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'flowsupport.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = null;

// Wrapper to provide a better-sqlite3-like synchronous API over sql.js
class Database {
  constructor(sqlJsDb) {
    this._db = sqlJsDb;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        const lastId = self._db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] || 0;
        const changes = self._db.getRowsModified();
        self._save();
        return { lastInsertRowid: lastId, changes };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          results.push(row);
        }
        stmt.free();
        return results;
      },
    };
  }

  exec(sql) {
    this._db.exec(sql);
    this._save();
  }

  pragma(pragma) {
    try { this._db.exec(`PRAGMA ${pragma}`); } catch {}
  }

  _save() {
    try {
      const data = this._db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch {}
  }
}

async function initDB() {
  if (db) return db;

  const SQL = await initSqlJs();

  let sqlJsDb;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlJsDb = new SQL.Database(fileBuffer);
    console.log(`[DB] Loaded existing database from ${DB_PATH}`);
  } else {
    sqlJsDb = new SQL.Database();
    console.log(`[DB] Created new database at ${DB_PATH}`);
  }

  db = new Database(sqlJsDb);
  db.pragma('foreign_keys = ON');
  db.exec(CREATE_TABLES_SQL);

  return db;
}

// Initialize immediately
const dbPromise = initDB();

// Export a proxy that waits for init then delegates
const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch') return undefined; // Not a thenable
    if (prop === '_ready') return dbPromise;
    if (!db) {
      // During startup, methods might be called before init completes
      // Return a function that waits
      if (prop === 'prepare') {
        return (sql) => ({
          run: (...p) => { throw new Error('DB not ready. Await db._ready first.'); },
          get: (...p) => { throw new Error('DB not ready'); },
          all: (...p) => { throw new Error('DB not ready'); },
        });
      }
      return () => {};
    }
    return db[prop]?.bind ? db[prop].bind(db) : db[prop];
  }
});

export default dbProxy;
export { initDB, dbPromise };
