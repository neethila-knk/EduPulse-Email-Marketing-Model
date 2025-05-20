import { Strategy as LocalStrategy } from 'passport-local';
const mockingoose = require('mockingoose');

import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';

// Helper to wrap LocalStrategy authenticate for testing
const runLocalStrategy = (
  strategy: LocalStrategy,
  email: string,
  password: string
): Promise<any> => {
  return new Promise((resolve) => {
    // @ts-ignore: internal test structure, not an actual HTTP request
    strategy.success = (user: any) => resolve({ user });
    // @ts-ignore
    strategy.fail = (_info: any) => resolve({ user: null, info: _info });
    // @ts-ignore
    strategy.error = (err: any) => resolve({ error: err });

    strategy.authenticate({ body: { email, password } } as any);
  });
};

describe('Passport Local Strategy - Admin', () => {
  const mockPassword = 'test123';
  let mockHashedPassword: string;

  beforeAll(async () => {
    mockHashedPassword = await bcrypt.hash(mockPassword, 10);
  });

  it('authenticates a valid admin', async () => {
    mockingoose(Admin).toReturn(
      {
        _id: '661d2154f7269a6caa1a7f01',
        email: 'admin@example.com',
        password: mockHashedPassword,
        isActive: true,
      },
      'findOne'
    );

    const strategy = new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const admin = await Admin.findOne({ email });
          if (!admin) return done(null, false, { message: 'Invalid email' });

          if (!admin.isActive) {
            return done(null, false, {
              message: 'Your admin account has been deactivated.',
            });
          }

          const isMatch = await bcrypt.compare(password, admin.password);
          if (!isMatch)
            return done(null, false, { message: 'Incorrect password' });

          return done(null, {
            ...admin.toObject(),
            _id: admin._id.toString(),
          });
          
        } catch (error) {
          return done(error);
        }
      }
    );

    const { user, info, error } = await runLocalStrategy(
      strategy,
      'admin@example.com',
      mockPassword
    );

    expect(error).toBeUndefined();
    expect(user).toBeTruthy();
    expect(user.email).toBe('admin@example.com');
    expect(info).toBeUndefined();
  });

  it('fails on wrong password', async () => {
    mockingoose(Admin).toReturn(
      {
        _id: '661d2154f7269a6caa1a7f01',
        email: 'admin@example.com',
        password: mockHashedPassword,
        isActive: true,
      },
      'findOne'
    );

    const strategy = new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const admin = await Admin.findOne({ email });
          if (!admin) return done(null, false, { message: 'Invalid email' });

          const isMatch = await bcrypt.compare(password, admin.password);
          if (!isMatch)
            return done(null, false, { message: 'Incorrect password' });

          return done(null, {
            ...admin.toObject(),
            _id: admin._id.toString(),
          });
        } catch (error) {
          return done(error);
        }
      }
    );

    const { user, info } = await runLocalStrategy(
      strategy,
      'admin@example.com',
      'wrongpass'
    );

    expect(user).toBeNull();
    expect(info?.message).toBe('Incorrect password');
  });

  it('fails if admin is inactive', async () => {
    mockingoose(Admin).toReturn(
      {
        _id: '661d2154f7269a6caa1a7f01',
        email: 'admin@example.com',
        password: mockHashedPassword,
        isActive: false,
      },
      'findOne'
    );

    const strategy = new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const admin = await Admin.findOne({ email });
          if (!admin) return done(null, false, { message: 'Invalid email' });

          if (!admin.isActive) {
            return done(null, false, {
              message: 'Your admin account has been deactivated.',
            });
          }

          const isMatch = await bcrypt.compare(password, admin.password);
          if (!isMatch)
            return done(null, false, { message: 'Incorrect password' });

          return done(null, {
            ...admin.toObject(),
            _id: admin._id.toString(),
          });
        } catch (error) {
          return done(error);
        }
      }
    );

    const { user, info } = await runLocalStrategy(
      strategy,
      'admin@example.com',
      mockPassword
    );

    expect(user).toBeNull();
    expect(info?.message).toMatch(/deactivated/i);
  });
});
