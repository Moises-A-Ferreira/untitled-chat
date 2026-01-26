import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAuth, ensureUserAccess } from '../lib/auth';
import type { User, Session } from '../lib/db/file-db';
import { cookies } from 'next/headers';

// Mocks
vi.mock('next/headers');
vi.mock('../lib/db/file-db', () => ({
  findValidSession: vi.fn(),
  findUserById: vi.fn(),
}));

const { findValidSession, findUserById } = await import('../lib/db/file-db');

describe('Auth Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('deve retornar 401 quando não há cookie', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const result = await requireAuth();

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(401);
    });

    it('deve retornar 401 quando sessão é inválida', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'invalid-token' }),
      } as any);

      vi.mocked(findValidSession).mockReturnValue(undefined);

      const result = await requireAuth();

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(401);
    });

    it('deve retornar 401 quando usuário não existe', async () => {
      const mockSession: Session = {
        token: 'valid-token',
        user_id: 999,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      } as any);

      vi.mocked(findValidSession).mockReturnValue(mockSession);
      vi.mocked(findUserById).mockReturnValue(undefined);

      const result = await requireAuth();

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
      expect(result.response?.status).toBe(401);
    });

    it('deve retornar sessão e usuário quando válidos', async () => {
      const mockSession: Session = {
        token: 'valid-token',
        user_id: 1,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUser: User = {
        id: 1,
        nome: 'Test User',
        email: 'test@example.com',
        telefone: '(14) 99999-9999',
        password_hash: 'hashed',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      } as any);

      vi.mocked(findValidSession).mockReturnValue(mockSession);
      vi.mocked(findUserById).mockReturnValue(mockUser);

      const result = await requireAuth();

      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockUser);
      expect(result.response).toBeUndefined();
    });

    it('deve permitir não autenticado quando allowUnauthenticated=true', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const result = await requireAuth({ allowUnauthenticated: true });

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
      expect(result.response).toBeUndefined();
    });

    it('deve validar admin quando requireAdmin=true', async () => {
      const mockSession: Session = {
        token: 'valid-token',
        user_id: 1,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUser: User = {
        id: 1,
        nome: 'Regular User',
        email: 'user@example.com',
        telefone: null,
        password_hash: 'hashed',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      } as any);

      vi.mocked(findValidSession).mockReturnValue(mockSession);
      vi.mocked(findUserById).mockReturnValue(mockUser);

      const result = await requireAuth({ requireAdmin: true });

      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockUser);
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(403);
    });

    it('deve permitir admin quando requireAdmin=true', async () => {
      const mockSession: Session = {
        token: 'admin-token',
        user_id: 2,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockAdmin: User = {
        id: 2,
        nome: 'Admin User',
        email: 'admin@example.com',
        telefone: null,
        password_hash: 'hashed',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'admin-token' }),
      } as any);

      vi.mocked(findValidSession).mockReturnValue(mockSession);
      vi.mocked(findUserById).mockReturnValue(mockAdmin);

      const result = await requireAuth({ requireAdmin: true });

      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockAdmin);
      expect(result.response).toBeUndefined();
    });
  });

  describe('ensureUserAccess', () => {
    it('deve permitir admin acessar qualquer recurso', () => {
      const admin: User = {
        id: 1,
        nome: 'Admin',
        email: 'admin@example.com',
        telefone: null,
        password_hash: 'hashed',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      const result = ensureUserAccess(999, admin);
      expect(result).toBeNull();
    });

    it('deve permitir usuário acessar próprio recurso', () => {
      const user: User = {
        id: 5,
        nome: 'User',
        email: 'user@example.com',
        telefone: null,
        password_hash: 'hashed',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      const result = ensureUserAccess(5, user);
      expect(result).toBeNull();
    });

    it('deve bloquear usuário acessando recurso de outro', () => {
      const user: User = {
        id: 5,
        nome: 'User',
        email: 'user@example.com',
        telefone: null,
        password_hash: 'hashed',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      const result = ensureUserAccess(10, user);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });
  });

  describe('Cenários de integração', () => {
    it('cenário: endpoint protegido com usuário válido', async () => {
      const mockSession: Session = {
        token: 'user-token',
        user_id: 3,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUser: User = {
        id: 3,
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '(14) 98765-4321',
        password_hash: '$2a$10$abcdef',
        role: 'user',
        created_at: '2025-01-01T00:00:00.000Z',
      };

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'user-token' }),
      } as any);

      vi.mocked(findValidSession).mockReturnValue(mockSession);
      vi.mocked(findUserById).mockReturnValue(mockUser);

      const { user, response } = await requireAuth();

      expect(response).toBeUndefined();
      expect(user?.nome).toBe('João Silva');
    });

    it('cenário: /api/auth/me com allowUnauthenticated', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const { user, response } = await requireAuth({ allowUnauthenticated: true });

      expect(response).toBeUndefined();
      expect(user).toBeNull();
    });

    it('cenário: admin acessando /api/admin/ocorrencias', async () => {
      const mockSession: Session = {
        token: 'admin-token',
        user_id: 1,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockAdmin: User = {
        id: 1,
        nome: 'Admin',
        email: 'admin@saomanuel.sp.gov.br',
        telefone: null,
        password_hash: '$2a$10$admin',
        role: 'admin',
        created_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'admin-token' }),
      } as any);

      vi.mocked(findValidSession).mockReturnValue(mockSession);
      vi.mocked(findUserById).mockReturnValue(mockAdmin);

      const { user, response } = await requireAuth({ requireAdmin: true });

      expect(response).toBeUndefined();
      expect(user?.role).toBe('admin');
    });
  });
});
