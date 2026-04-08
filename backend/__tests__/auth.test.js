/**
 * Auth Routes Integration Tests
 * Run: npm test
 * Uses supertest to hit real Express routes with an in-memory MongoDB
 */

const request = require('supertest');

// We mock mongoose so tests don't need a real DB
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
    connection: { close: jest.fn() },
  };
});

// Mock the User model
jest.mock('../models/User', () => {
  const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$12$hashed',
    role: 'user',
    createdAt: new Date(),
    comparePassword: jest.fn(),
    toJSON: jest.fn(() => ({ _id: 'user123', name: 'Test User', email: 'test@example.com' })),
  };

  const MockUser = jest.fn(() => mockUser);
  MockUser.findOne = jest.fn();
  MockUser.create = jest.fn();
  MockUser.findById = jest.fn();
  return MockUser;
});

const express = require('express');
const app = express();
app.use(express.json());

const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

const User = require('../models/User');

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('returns 409 when user already exists', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing', email: 'alice@test.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 201 and token on success', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'newuser123',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'user',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('alice@test.com');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when user does not exist', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('returns 401 when password is wrong', async () => {
    const fakeUser = {
      _id: 'user123',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'user',
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns 200 and token on valid credentials', async () => {
    const fakeUser = {
      _id: 'user123',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'user',
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.name).toBe('Alice');
  });
});
