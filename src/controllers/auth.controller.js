import { registerBusiness, login } from '../services/auth.service.js';

export async function signup(req, res, next) {
  try {
    const result = await registerBusiness(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const { businessRepo, userRepo } = await import('../repositories/index.js');
    const user = await userRepo.findById(req.user.userId);
    const business = await businessRepo.findByBusinessId(req.user.businessId);
    res.json({ success: true, data: { user, business } });
  } catch (err) {
    next(err);
  }
}
