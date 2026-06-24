import prisma from './prisma';
import crypto from 'crypto';

// Hash password using SHA-256
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Verify password
export function verifyPassword(password, hashedPassword) {
  const hash = hashPassword(password);
  return hash === hashedPassword;
}

// Create admin user if not exists
export async function ensureAdminUser() {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@printables.com' }
    });
    
    if (!adminExists) {
      await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@printables.com',
          password: hashPassword('admin123'),
          role: 'ADMIN',
          emailVerified: true
        }
      });
      console.log('Admin user created: admin@printables.com / admin123');
    }
  } catch (error) {
    console.error('Error ensuring admin user:', error);
  }
}

// Verify auth token (simple implementation)
export async function verifyAuth(token) {
  if (!token) return null;
  
  try {
    // Simple base64 decode (in production, use JWT)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user && verifyPassword(password, user.password)) {
      return { email: user.email, role: user.role };
    }
  } catch (error) {
    console.error('Auth verification error:', error);
  }
  
  return null;
}

// Create auth token
export function createAuthToken(email, password) {
  return Buffer.from(`${email}:${password}`).toString('base64');
}
