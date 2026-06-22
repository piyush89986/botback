import { businessRepo } from '../repositories/index.js';

export async function getBusiness(req, res, next) {
  try {
    const business = await businessRepo.findByBusinessId(req.businessId);
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    res.json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
}

export async function updateBusiness(req, res, next) {
  try {
    const business = await businessRepo.update(req.businessId, req.body);
    res.json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomization(req, res, next) {
  try {
    const business = await businessRepo.update(req.businessId, {
      customization: req.body,
      theme: req.body.theme,
    });
    res.json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
}
