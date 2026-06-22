import OpenAI from 'openai';
import { config } from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const INTENTS = [
  'PRODUCT_SEARCH',
  'PRODUCT_DETAILS',
  'PRICE_QUERY',
  'STOCK_QUERY',
  'BUSINESS_INFO',
  'FAQ_QUERY',
  'ORDER_QUERY',
  'SUPPORT_QUERY',
  'GENERAL_BUSINESS_QUERY',
  'UNKNOWN',
];

export async function classifyIntent(userMessage, conversationHistory = []) {
  const systemPrompt = `You are an intent classifier for a multi-tenant WhatsApp business chatbot.
Classify the user message into ONE of these intents: ${INTENTS.join(', ')}.

Also extract relevant entities when present:
- product (product name)
- model
- brand
- category
- orderNumber

Respond ONLY with valid JSON:
{
  "intent": "INTENT_NAME",
  "product": "extracted product or null",
  "model": "extracted model or null",
  "brand": "extracted brand or null",
  "category": "extracted category or null",
  "orderNumber": "extracted order number or null",
  "isBusinessRelated": true/false,
  "confidence": 0.0-1.0
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return { intent: 'UNKNOWN', isBusinessRelated: true, confidence: 0.5 };
  }
}

export async function generateNaturalResponse(systemPrompt, userMessage, context = {}) {
  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context: ${JSON.stringify(context)}\n\nUser: ${userMessage}` },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

export async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: config.openai.embeddingModel,
    input: text,
  });
  return response.data[0].embedding;
}

export { openai, INTENTS };
