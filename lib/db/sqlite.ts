import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Basic schema for local auth + ocorrências
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ocorrencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT,
    latitude REAL,
    longitude REAL,
    foto_url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
<<<<<<< HEAD

  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ocorrencia_id INTEGER,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating IN (1, 2, 3, 4, 5)), -- 1=sad (red), 3=neutral (yellow), 5=happy (green)
    comentario TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_feedbacks_ocorrencia ON feedbacks(ocorrencia_id);
  CREATE INDEX IF NOT EXISTS idx_feedbacks_rating ON feedbacks(rating);
  CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);
=======
>>>>>>> fa95f88f0a2e4a3f92d155e004edb13f769df551
`);

export { db };


