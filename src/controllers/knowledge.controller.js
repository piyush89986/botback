import { knowledgeRepo, businessRepo } from '../repositories/index.js';
import { indexKnowledge, deleteVector } from '../services/pinecone.service.js';

export async function listKnowledge(req, res, next) {
  try {
    const items = await knowledgeRepo.findByBusiness(req.businessId, req.query);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function createKnowledge(req, res, next) {
  try {
    const item = await knowledgeRepo.create({ ...req.body, businessId: req.businessId });
    const business = await businessRepo.findByBusinessId(req.businessId);

    try {
      const pineconeId = await indexKnowledge(item, business.pineconeNamespace);
      await knowledgeRepo.update(item._id, req.businessId, { pineconeId });
    } catch (e) {
      console.warn('Knowledge indexing failed:', e.message);
    }

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function updateKnowledge(req, res, next) {
  try {
    const item = await knowledgeRepo.update(req.params.id, req.businessId, req.body);
    const business = await businessRepo.findByBusinessId(req.businessId);

    try {
      await indexKnowledge(item, business.pineconeNamespace);
    } catch (e) {
      console.warn('Knowledge re-index failed:', e.message);
    }

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteKnowledge(req, res, next) {
  try {
    const item = await knowledgeRepo.findById(req.params.id, req.businessId);
    await knowledgeRepo.delete(req.params.id, req.businessId);

    if (item?.pineconeId) {
      const business = await businessRepo.findByBusinessId(req.businessId);
      try {
        await deleteVector(business.pineconeNamespace, item.pineconeId);
      } catch (e) {
        console.warn('Pinecone delete failed:', e.message);
      }
    }

    res.json({ success: true, message: 'Knowledge item deleted' });
  } catch (err) {
    next(err);
  }
}
