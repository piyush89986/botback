import { productRepo } from '../repositories/index.js';
import { semanticSearch } from './pinecone.service.js';
import { classifyIntent, generateNaturalResponse } from './ai.service.js';

async function mergeProducts(mongoResults, pineconeMatches, businessId) {
  const seen = new Set(mongoResults.map((p) => p._id.toString()));
  const merged = [...mongoResults];

  for (const match of pineconeMatches) {
    if (match.metadata?.type === 'product' && match.metadata?.productId) {
      const productId = match.metadata.productId;
      if (!seen.has(productId)) {
        const product = await productRepo.findById(productId, businessId);
        if (product) {
          seen.add(productId);
          merged.push(product);
        }
      }
    }
  }

  return merged;
}

export async function searchProducts(businessId, namespace, query, entities = {}) {
  const searchTerms = [entities.product, entities.brand, entities.model, entities.category, query]
    .filter(Boolean)
    .join(' ');

  const mongoResults = await productRepo.searchText(businessId, searchTerms || query);

  let pineconeMatches = [];
  try {
    pineconeMatches = await semanticSearch(namespace, searchTerms || query, 5, { type: { $eq: 'product' } });
  } catch (e) {
    console.warn('Pinecone search failed:', e.message);
  }

  const merged = await mergeProducts(mongoResults, pineconeMatches, businessId);

  if (entities.brand) {
    merged.sort((a, b) => {
      const aMatch = a.brand?.toLowerCase().includes(entities.brand.toLowerCase()) ? 1 : 0;
      const bMatch = b.brand?.toLowerCase().includes(entities.brand.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  if (entities.model) {
    merged.sort((a, b) => {
      const aMatch = a.model?.toLowerCase().includes(entities.model.toLowerCase()) ? 1 : 0;
      const bMatch = b.model?.toLowerCase().includes(entities.model.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  return merged;
}

export async function handleProductIntent(business, intentData, userMessage) {
  const products = await searchProducts(
    business.businessId,
    business.pineconeNamespace,
    userMessage,
    intentData,
  );

  if (!products.length) {
    return {
      templateType: 'text',
      intent: intentData.intent,
      variables: {
        message: `Sorry, we couldn't find any products matching your query. Please try different keywords or contact us for assistance.`,
      },
      products: [],
    };
  }

  if (products.length === 1 || intentData.intent === 'PRODUCT_DETAILS') {
    return { templateType: 'product_card', intent: intentData.intent, products: [products[0]], variables: {} };
  }

  if (products.length <= 3) {
    return {
      templateType: 'product_carousel',
      intent: intentData.intent,
      products,
      variables: { count: products.length },
    };
  }

  return {
    templateType: 'list_message',
    intent: intentData.intent,
    products: products.slice(0, 10),
    variables: {
      message: `Found ${products.length} products. Select one to view details:`,
    },
    listSections: [
      {
        title: 'Products',
        rows: products.slice(0, 10).map((p) => ({
          id: `product_${p._id}`,
          title: p.name.slice(0, 24),
          description: `₹${p.price?.toLocaleString('en-IN')} | ${p.stock ? 'In Stock' : 'Out of Stock'}`,
        })),
      },
    ],
  };
}

export async function handleKnowledgeQuery(business, userMessage) {
  let context = '';
  try {
    const matches = await semanticSearch(business.pineconeNamespace, userMessage, 3);
    context = matches
      .map((m) => m.metadata?.text || m.metadata?.title)
      .filter(Boolean)
      .join('\n\n');
  } catch (e) {
    console.warn('Knowledge search failed:', e.message);
  }

  const systemPrompt = `You are a helpful assistant for ${business.businessName}.
${context ? 'Answer based ONLY on the provided knowledge base context.\nIf the answer is not in the context, say you don\'t have that information and suggest contacting the business.' : 'Answer helpfully based on general knowledge about this type of business.'}
Keep responses concise and WhatsApp-friendly. Use bullet points when helpful.`;

  let answer;
  try {
    answer = await generateNaturalResponse(systemPrompt, userMessage, { knowledge: context });
  } catch (e) {
    console.error('AI response generation failed:', e.message);
    answer = `I'm having trouble processing your request right now. Please contact us directly at ${business.phone || business.email || 'our support line'}.`;
  }

  return { templateType: 'text', intent: 'FAQ_QUERY', variables: { message: answer }, products: [] };
}

export async function handleGeneralQuery(business, userMessage, intentData) {
  if (!intentData.isBusinessRelated) {
    return {
      templateType: 'text',
      intent: intentData.intent,
      variables: {
        message: business.customization?.outOfScopeMessage ||
          'I can assist only with business products, services, support and related information.',
      },
      products: [],
    };
  }

  const systemPrompt = `You are a helpful assistant for ${business.businessName} (${business.industry || 'retail business'}).
Answer business-related educational questions helpfully.
Keep responses concise for WhatsApp.`;

  let answer;
  try {
    answer = await generateNaturalResponse(systemPrompt, userMessage, {});
  } catch (e) {
    console.error('AI response failed:', e.message);
    answer = `Please contact us for more information.`;
  }

  return {
    templateType: 'text',
    intent: intentData.intent,
    variables: { message: answer },
    products: [],
  };
}

export async function processMessage(business, userMessage, conversationHistory = []) {
  let intentData;
  try {
    intentData = await classifyIntent(userMessage, conversationHistory);
  } catch (e) {
    console.error('Intent classification failed:', e.message);
    intentData = { intent: 'UNKNOWN', isBusinessRelated: true, confidence: 0.5 };
  }

  switch (intentData.intent) {
    case 'PRODUCT_SEARCH':
    case 'PRODUCT_DETAILS':
    case 'PRICE_QUERY':
    case 'STOCK_QUERY':
      return handleProductIntent(business, intentData, userMessage);

    case 'BUSINESS_INFO':
    case 'FAQ_QUERY':
    case 'SUPPORT_QUERY':
      return handleKnowledgeQuery(business, userMessage);

    case 'ORDER_QUERY':
      return {
        templateType: 'text',
        intent: intentData.intent,
        variables: {
          message: intentData.orderNumber
            ? `Please hold on while we check order ${intentData.orderNumber}. Our team will assist you shortly.`
            : 'Please share your order number so we can help you track your order.',
        },
        products: [],
      };

    case 'GENERAL_BUSINESS_QUERY':
      return handleGeneralQuery(business, userMessage, intentData);

    default:
      if (!intentData.isBusinessRelated) {
        return {
          templateType: 'text',
          intent: intentData.intent,
          variables: {
            message: business.customization?.outOfScopeMessage ||
              'I can assist only with business products, services, support and related information.',
          },
          products: [],
        };
      }
      return handleKnowledgeQuery(business, userMessage);
  }
}

export { classifyIntent };
