import { templateRepo } from '../repositories/index.js';

export async function listTemplates(req, res, next) {
  try {
    const templates = await templateRepo.findByBusiness(req.businessId);
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req, res, next) {
  try {
    const template = await templateRepo.create({ ...req.body, businessId: req.businessId });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplate(req, res, next) {
  try {
    const template = await templateRepo.update(req.params.id, req.businessId, req.body);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    await templateRepo.delete(req.params.id, req.businessId);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
}
