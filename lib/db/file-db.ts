import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "db.json");

export type User = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  password_hash: string;
  role: "user" | "admin";
  created_at: string;
};

export type Session = {
  token: string;
  user_id: number;
  created_at: string;
  expires_at: string;
};

export type Ocorrencia = {
  id: number;
  user_id: number;
  tipo: string;
  descricao: string;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
  updated_at?: string;
};

type DbShape = {
  users: User[];
  sessions: Session[];
  ocorrencias: Ocorrencia[];
  counters: {
    user: number;
    ocorrencia: number;
  };
};

function ensureFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    const initial: DbShape = {
      users: [],
      sessions: [],
      ocorrencias: [],
      counters: { user: 0, ocorrencia: 0 },
    };
    fs.writeFileSync(FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

export function readDb(): DbShape {
  ensureFile();
  const raw = fs.readFileSync(FILE_PATH, "utf8");
  return JSON.parse(raw) as DbShape;
}

export function writeDb(db: DbShape): void {
  fs.writeFileSync(FILE_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function createUser(input: {
  nome: string;
  email: string;
  telefone: string | null;
  password_hash: string;
  role?: "user" | "admin";
}): User {
  const db = readDb();
  if (db.users.some((u) => u.email === input.email)) {
    throw Object.assign(new Error("user_exists"), { code: "user_exists" });
  }
  const now = new Date().toISOString();
  const id = ++db.counters.user;
  const user: User = {
    id,
    nome: input.nome,
    email: input.email,
    telefone: input.telefone,
    password_hash: input.password_hash,
    role: input.role || "user",
    created_at: now,
  };
  db.users.push(user);
  writeDb(db);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  const db = readDb();
  return db.users.find((u) => u.email === email);
}

export function findUserById(id: number): User | undefined {
  const db = readDb();
  return db.users.find((u) => u.id === id);
}

export function createSession(userId: number, ttlHours: number): Session {
  const db = readDb();
  const token = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  const session: Session = {
    token,
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
  db.sessions.push(session);
  writeDb(db);
  return session;
}

export function findValidSession(token: string): Session | undefined {
  const db = readDb();
  const nowIso = new Date().toISOString();
  return db.sessions.find(
    (s) => s.token === token && s.expires_at > nowIso
  );
}

export function createOcorrencia(input: {
  user_id: number;
  tipo: string;
  descricao: string;
  foto_url?: string | null;
  latitude: number | null;
  longitude: number | null;
}): Ocorrencia {
  const db = readDb();
  const id = ++db.counters.ocorrencia;
  const now = new Date().toISOString();
  const ocorrencia: Ocorrencia = {
    id,
    user_id: input.user_id,
    tipo: input.tipo,
    descricao: input.descricao,
    foto_url: input.foto_url || null,
    latitude: input.latitude,
    longitude: input.longitude,
    status: "pendente",
    created_at: now,
  };
  db.ocorrencias.push(ocorrencia);
  writeDb(db);
  return ocorrencia;
}

export function listOcorrenciasPendentes(): Array<Ocorrencia & { user: User }> {
  const db = readDb();
  return db.ocorrencias
    .filter((o) => o.status === "pendente")
    .map((ocorrencia) => {
      const user = db.users.find((u) => u.id === ocorrencia.user_id);
      if (!user) {
        throw new Error(`User not found for ocorrencia ${ocorrencia.id}`);
      }
      return { ...ocorrencia, user };
    });
}

export function listAllOcorrencias(): Array<Ocorrencia & { user: User }> {
  const db = readDb();
  return db.ocorrencias
    .map((ocorrencia) => {
      const user = db.users.find((u) => u.id === ocorrencia.user_id);
      if (!user) {
        throw new Error(`User not found for ocorrencia ${ocorrencia.id}`);
      }
      return { ...ocorrencia, user };
    });
}

export function listUserOcorrencias(userId: number): Ocorrencia[] {
  const db = readDb();
  return db.ocorrencias
    .filter((ocorrencia) => ocorrencia.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}


