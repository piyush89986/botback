import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config/index.js';
import { createEmbedding } from './ai.service.js';

let pineconeClient = null;
let pineconeIndex = null;

async function getIndex() {
  if (!config.pinecone.apiKey) {
    console.warn('Pinecone API key not configured');
    return null;
  }

  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: config.pinecone.apiKey });
    pineconeIndex = pineconeClient.index(config.pinecone.indexName);
  }

  return pineconeIndex;
}

export async function upsertVector(namespace, id, text, metadata = {}) {
  const index = await getIndex();
  if (!index) return null;

  const embedding = await createEmbedding(text);
  await index.namespace(namespace).upsert([
    {
      id,
      values: embedding,
      metadata: { ...metadata, text: text.slice(0, 1000) },
    },
  ]);

  return id;
}

export async function deleteVector(namespace, id) {
  const index = await getIndex();
  if (!index) return;
  await index.namespace(namespace).deleteOne(id);
}

export async function semanticSearch(namespace, query, topK = 5, filter = {}) {
  const index = await getIndex();
  if (!index) return [];

  const embedding = await createEmbedding(query);
  const results = await index.namespace(namespace).query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: Object.keys(filter).length ? filter : undefined,
  });

  return results.matches || [];
}

export async function indexProduct(product, namespace) {
  const text = [
    product.name,
    product.brand,
    product.model,
    product.category,
    product.description,
    ...(product.features || []),
  ]
    .filter(Boolean)
    .join(' ');

  const id = `product_${product._id}`;
  await upsertVector(namespace, id, text, {
    type: 'product',
    productId: product._id.toString(),
    name: product.name,
    price: product.price,
    stock: product.stock,
  });

  return id;
}

export async function indexKnowledge(kb, namespace) {
  const text = `${kb.title}\n${kb.content}`;
  const id = `kb_${kb._id}`;
  await upsertVector(namespace, id, text, {
    type: 'knowledge',
    kbId: kb._id.toString(),
    kbType: kb.type,
    title: kb.title,
  });

  return id;
}
