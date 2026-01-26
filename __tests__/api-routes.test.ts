/**
 * Integration tests for API routes
 * Tests authentication flows, rate limiting, and data validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as ocorrenciasPOST } from '@/app/api/ocorrencias/route';
import type { User, Session } from '@/lib/db/file-db';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('@/lib/db/file-db', () => ({
  findUserByEmail: vi.fn(),
  createSession: vi.fn(),
  findValidSession: vi.fn(),
  findUserById: vi.fn(),
  createOcorrencia: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

// Import mocked modules
import { cookies } from 'next/headers';
import { findUserByEmail, createSession, findValidSession, findUserById, createOcorrencia } from '@/lib/db/file-db';
import bcrypt from 'bcryptjs';
import { limiter } from '@/lib/rate-limit';

describe('API Routes - /api/auth/login', () => {
  const mockUser: User = {
    id: 'user-123',
    nome: 'Test User',
    email: 'test@example.com',
    telefone: '11999999999',
    password_hash: '$2a$10$hashedhash',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    limiter.reset();
  });

  it('should reject request with missing email', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test123' }),
    });

    const response = await loginPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('e-mail');
  });

  it('should reject request with missing password', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await loginPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('senha');
  });

  it('should reject login with non-existent email', async () => {
    vi.mocked(findUserByEmail).mockReturnValue(null);

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'notfound@example.com', 
        password: 'test123' 
      }),
    });

    const response = await loginPOST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('incorretos');
  });

  it('should reject login with incorrect password', async () => {
    vi.mocked(findUserByEmail).mockReturnValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'wrongpassword' 
      }),
    });

    const response = await loginPOST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('incorretos');
  });

  it('should login successfully with correct credentials', async () => {
    const mockSession: Session = {
      token: 'session-token-123',
      user_id: mockUser.id,
      created_at: '2024-01-01T00:00:00Z',
      expires_at: '2024-01-02T00:00:00Z',
    };

    vi.mocked(findUserByEmail).mockReturnValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(createSession).mockReturnValue(mockSession);

    const mockCookies = {
      set: vi.fn(),
    };
    vi.mocked(cookies).mockReturnValue(mockCookies as any);

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'test123' 
      }),
    });

    const response = await loginPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.user).toMatchObject({
      id: mockUser.id,
      nome: mockUser.nome,
      email: mockUser.email,
    });
    expect(data.user.password_hash).toBeUndefined(); // Should not leak password
    expect(mockCookies.set).toHaveBeenCalledWith('auth-token', mockSession.token, expect.any(Object));
  });

  it('should enforce rate limiting after 5 failed attempts', async () => {
    vi.mocked(findUserByEmail).mockReturnValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    // Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'wrongpassword' 
        }),
      });
      await loginPOST(request);
    }

    // 6th attempt should be rate limited
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.100',
      },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'wrongpassword' 
      }),
    });

    const response = await loginPOST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Muitas tentativas');
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  it('should normalize email to lowercase', async () => {
    vi.mocked(findUserByEmail).mockReturnValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(createSession).mockReturnValue({
      token: 'token',
      user_id: mockUser.id,
      created_at: '2024-01-01',
      expires_at: '2024-01-02',
    });
    vi.mocked(cookies).mockReturnValue({ set: vi.fn() } as any);

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'TEST@EXAMPLE.COM', 
        password: 'test123' 
      }),
    });

    await loginPOST(request);

    expect(findUserByEmail).toHaveBeenCalledWith('test@example.com');
  });
});

describe('API Routes - /api/ocorrencias', () => {
  const mockUser: User = {
    id: 'user-123',
    nome: 'Test User',
    email: 'test@example.com',
    telefone: '11999999999',
    password_hash: '$2a$10$hashedhash',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockSession: Session = {
    token: 'session-token-123',
    user_id: mockUser.id,
    created_at: '2024-01-01T00:00:00Z',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    limiter.reset();

    // Setup default auth mocks
    const mockCookies = {
      get: vi.fn((name: string) => {
        if (name === 'auth-token') {
          return { value: mockSession.token };
        }
        return undefined;
      }),
    };
    vi.mocked(cookies).mockReturnValue(mockCookies as any);
    vi.mocked(findValidSession).mockReturnValue(mockSession);
    vi.mocked(findUserById).mockReturnValue(mockUser);
  });

  it('should reject unauthenticated requests', async () => {
    // Override auth mock to return no token
    const mockCookies = {
      get: vi.fn(() => undefined),
    };
    vi.mocked(cookies).mockReturnValue(mockCookies as any);

    const request = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tipo: 'Buraco na rua',
        descricao: 'Grande buraco',
      }),
    });

    const response = await ocorrenciasPOST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('autenticado');
  });

  it('should reject request with missing tipo', async () => {
    const request = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        descricao: 'Descrição sem tipo',
      }),
    });

    const response = await ocorrenciasPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('obrigatório');
  });

  it('should create ocorrencia successfully', async () => {
    vi.mocked(createOcorrencia).mockReturnValue(undefined);

    const request = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tipo: 'Buraco na rua',
        descricao: 'Grande buraco na esquina',
        latitude: -22.744832,
        longitude: -48.569672,
      }),
    });

    const response = await ocorrenciasPOST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(createOcorrencia).toHaveBeenCalledWith({
      user_id: mockUser.id,
      tipo: 'Buraco na rua',
      descricao: 'Grande buraco na esquina',
      latitude: -22.744832,
      longitude: -48.569672,
    });
  });

  it('should create ocorrencia without coordinates', async () => {
    vi.mocked(createOcorrencia).mockReturnValue(undefined);

    const request = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tipo: 'Lixo acumulado',
        descricao: 'Muito lixo',
      }),
    });

    const response = await ocorrenciasPOST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(createOcorrencia).toHaveBeenCalledWith({
      user_id: mockUser.id,
      tipo: 'Lixo acumulado',
      descricao: 'Muito lixo',
      latitude: undefined,
      longitude: undefined,
    });
  });

  it('should enforce rate limiting after 10 ocorrencias per hour', async () => {
    vi.mocked(createOcorrencia).mockReturnValue(undefined);

    // Create 10 ocorrencias
    for (let i = 0; i < 10; i++) {
      const request = new Request('http://localhost/api/ocorrencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tipo: 'Tipo ' + i,
          descricao: 'Descrição ' + i,
        }),
      });
      await ocorrenciasPOST(request);
    }

    // 11th attempt should be rate limited
    const request = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tipo: 'Tipo 11',
        descricao: 'Descrição 11',
      }),
    });

    const response = await ocorrenciasPOST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Limite de ocorrências atingido');
    expect(response.headers.get('Retry-After')).toBeTruthy();
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(createOcorrencia).mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const request = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tipo: 'Buraco na rua',
        descricao: 'Teste',
      }),
    });

    const response = await ocorrenciasPOST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Erro ao registrar');
  });

  it('should trim tipo and descricao values', async () => {
    vi.mocked(createOcorrencia).mockReturnValue(undefined);

    const request = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tipo: '  Buraco na rua  ',
        descricao: '  Grande buraco  ',
      }),
    });

    await ocorrenciasPOST(request);

    expect(createOcorrencia).toHaveBeenCalledWith({
      user_id: mockUser.id,
      tipo: 'Buraco na rua',
      descricao: 'Grande buraco',
      latitude: undefined,
      longitude: undefined,
    });
  });
});

describe('API Routes - Integration Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limiter.reset();
  });

  it('should allow login after rate limit window expires', async () => {
    const mockUser: User = {
      id: 'user-123',
      nome: 'Test User',
      email: 'test@example.com',
      telefone: '11999999999',
      password_hash: '$2a$10$hashedhash',
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(findUserByEmail).mockReturnValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.200',
        },
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'wrong' 
        }),
      });
      await loginPOST(request);
    }

    // 6th should be blocked
    const blockedRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.200',
      },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'wrong' 
      }),
    });
    const blockedResponse = await loginPOST(blockedRequest);
    expect(blockedResponse.status).toBe(429);

    // Reset rate limiter (simulating window expiration)
    limiter.reset();

    // Now login should work
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(createSession).mockReturnValue({
      token: 'token',
      user_id: mockUser.id,
      created_at: '2024-01-01',
      expires_at: '2024-01-02',
    });
    vi.mocked(cookies).mockReturnValue({ set: vi.fn() } as any);

    const successRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.200',
      },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'correct' 
      }),
    });

    const successResponse = await loginPOST(successRequest);
    expect(successResponse.status).toBe(200);
  });

  it('should allow different users to have independent rate limits', async () => {
    const user1: User = {
      id: 'user-1',
      nome: 'User 1',
      email: 'user1@example.com',
      telefone: '11111111111',
      password_hash: '$2a$10$hash1',
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
    };

    const user2: User = {
      id: 'user-2',
      nome: 'User 2',
      email: 'user2@example.com',
      telefone: '22222222222',
      password_hash: '$2a$10$hash2',
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
    };

    const session1: Session = {
      token: 'token-1',
      user_id: user1.id,
      created_at: '2024-01-01T00:00:00Z',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const session2: Session = {
      token: 'token-2',
      user_id: user2.id,
      created_at: '2024-01-01T00:00:00Z',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    vi.mocked(createOcorrencia).mockReturnValue(undefined);

    // User 1 creates 10 ocorrencias
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn(() => ({ value: session1.token })),
    } as any);
    vi.mocked(findValidSession).mockReturnValue(session1);
    vi.mocked(findUserById).mockReturnValue(user1);

    for (let i = 0; i < 10; i++) {
      const request = new Request('http://localhost/api/ocorrencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'Tipo ' + i, descricao: 'Desc ' + i }),
      });
      await ocorrenciasPOST(request);
    }

    // User 1's 11th should be blocked
    const user1Blocked = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'Tipo 11', descricao: 'Desc 11' }),
    });
    const user1Response = await ocorrenciasPOST(user1Blocked);
    expect(user1Response.status).toBe(429);

    // User 2 should still be able to create (independent rate limit)
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn(() => ({ value: session2.token })),
    } as any);
    vi.mocked(findValidSession).mockReturnValue(session2);
    vi.mocked(findUserById).mockReturnValue(user2);

    const user2Request = new Request('http://localhost/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'User 2 Tipo', descricao: 'User 2 Desc' }),
    });
    const user2Response = await ocorrenciasPOST(user2Request);
    expect(user2Response.status).toBe(201);
  });
});
