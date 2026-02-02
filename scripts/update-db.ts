import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');
const db = new Database(DB_PATH);

// Criar tabela de feedbacks se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ocorrencia_id INTEGER NOT NULL,
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
`);

console.log('Tabela de feedbacks criada/atualizada com sucesso!');