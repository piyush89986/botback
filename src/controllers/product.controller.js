import { productRepo } from '../repositories/index.js';
import { indexProduct, deleteVector } from '../services/pinecone.service.js';
import { businessRepo } from '../repositories/index.js';

export async function listProducts(req, res, next) {
  try {
    const products = await productRepo.findByBusiness(req.businessId, req.query);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await productRepo.findById(req.params.id, req.businessId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = await productRepo.create({ ...req.body, businessId: req.businessId });
    const business = await businessRepo.findByBusinessId(req.businessId);

    try {
      const pineconeId = await indexProduct(product, business.pineconeNamespace);
      await productRepo.update(product._id, req.businessId, { pineconeId });
    } catch (e) {
      console.warn('Pinecone indexing failed:', e.message);
    }

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await productRepo.update(req.params.id, req.businessId, req.body);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const business = await businessRepo.findByBusinessId(req.businessId);
    try {
      await indexProduct(product, business.pineconeNamespace);
    } catch (e) {
      console.warn('Pinecone re-index failed:', e.message);
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await productRepo.findById(req.params.id, req.businessId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await productRepo.delete(req.params.id, req.businessId);

    const business = await businessRepo.findByBusinessId(req.businessId);
    if (product.pineconeId) {
      try {
        await deleteVector(business.pineconeNamespace, product.pineconeId);
      } catch (e) {
        console.warn('Pinecone delete failed:', e.message);
      }
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

export async function bulkImportProducts(req, res, next) {
  try {
    const items = req.body.products.map((p) => ({ ...p, businessId: req.businessId }));
    const products = await productRepo.bulkCreate(items);

    const business = await businessRepo.findByBusinessId(req.businessId);
    for (const product of products) {
      try {
        await indexProduct(product, business.pineconeNamespace);
      } catch (e) {
        console.warn('Bulk index failed for', product.name);
      }
    }

    res.status(201).json({ success: true, data: { count: products.length, products } });
  } catch (err) {
    next(err);
  }
}
