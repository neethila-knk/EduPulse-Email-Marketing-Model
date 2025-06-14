import { Strategy as LocalStrategy } from 'passport-local';
const mockingoose = require('mockingoose');
import Admin from '../models/Admin';


jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockImplementation((plainText, _hashed) => {
 
    return Promise.resolve(plainText === 'test123');
  })
}));


const runLocalStrategy = (
  strategy: LocalStrategy,
  email: string,
  password: string
): Promise<any> => {
  return new Promise((resolve) => {
 
    strategy.success = (user: any) => resolve({ user });
    
    strategy.fail = (_info: any) => resolve({ user: null, info: _info });
 
    strategy.error = (err: any) => resolve({ error: err });

    strategy.authenticate({ body: { email, password } } as any);
  });
};

describe('Passport Local Strategy - Admin', () => {
  const mockAdmin = {
    _id: '661d2154f7269a6caa1a7f01',
    email: 'admin@example.com',
    password: 'hashedpassword', 
    isActive: true,
  };

  beforeEach(() => {
   
    jest.clearAllMocks();
  });

  it('authenticates a valid admin', async () => {
    mockingoose(Admin).toReturn(mockAdmin, 'findOne');

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

          const isMatch = await require('bcryptjs').compare(password, admin.password);
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
      'test123' 
    );

    expect(error).toBeUndefined();
    expect(user).toBeTruthy();
    expect(user.email).toBe('admin@example.com');
    expect(info).toBeUndefined();
    expect(require('bcryptjs').compare).toHaveBeenCalledWith('test123', 'hashedpassword');
  });

  it('fails on wrong password', async () => {
    mockingoose(Admin).toReturn(mockAdmin, 'findOne');

    const strategy = new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const admin = await Admin.findOne({ email });
          if (!admin) return done(null, false, { message: 'Invalid email' });

          const isMatch = await require('bcryptjs').compare(password, admin.password);
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
    expect(require('bcryptjs').compare).toHaveBeenCalledWith('wrongpass', 'hashedpassword');
  });

  it('fails if admin is inactive', async () => {
    mockingoose(Admin).toReturn(
      { ...mockAdmin, isActive: false },
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

          const isMatch = await require('bcryptjs').compare(password, admin.password);
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
      'test123'
    );

    expect(user).toBeNull();
    expect(info?.message).toMatch(/deactivated/i);
    // Verify compare wasn't called since we failed on isActive first
    expect(require('bcryptjs').compare).not.toHaveBeenCalled();
  });
});