import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { businessRepo, userRepo } from '../repositories/index.js';

export async function registerBusiness({ businessName, email, password, name, phone, industry, address }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const businessId = uuidv4().replace(/-/g, '').slice(0, 12);
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const business = await businessRepo.create({
    businessId,
    businessName,
    slug: `${slug}-${businessId.slice(0, 4)}`,
    email,
    phone,
    address,
    industry,
    pineconeNamespace: `biz_${businessId}`,
  });

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await userRepo.create({
    businessId,
    name,
    email,
    password: hashedPassword,
    role: 'owner',
  });

  const token = generateToken(user, business);

  return { token, user: sanitizeUser(user), business };
}

export async function login(email, password) {
  const user = await userRepo.findByEmail(email);
  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const business = await businessRepo.findByBusinessId(user.businessId);
  const token = generateToken(user, business);

  return { token, user: sanitizeUser(user), business };
}

function generateToken(user, business) {
  return jwt.sign(
    {
      userId: user._id,
      businessId: user.businessId,
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
  };
}

export { sanitizeUser };
