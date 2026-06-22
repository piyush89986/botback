import { categoryRepo } from '../repositories/index.js';

export async function listCategories(req, res, next) {
  try {
    const categories = await categoryRepo.findByBusiness(req.businessId);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await categoryRepo.create({ ...req.body, businessId: req.businessId });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await categoryRepo.update(req.params.id, req.businessId, req.body);
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    await categoryRepo.delete(req.params.id, req.businessId);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}
