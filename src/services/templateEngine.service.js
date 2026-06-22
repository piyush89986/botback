import { templateRepo } from '../repositories/index.js';
import {
  sendTextMessage,
  sendInteractiveButtons,
  sendListMessage,
  sendImageMessage,
  sendCtaUrl,
  sendProductCarousel,
  formatProductCardBody,
} from './whatsapp.service.js';

function interpolate(template, variables = {}) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');
}

export async function renderAndSend({
  phoneNumberId,
  accessToken,
  to,
  businessId,
  templateType,
  variables = {},
  products = [],
  replyToId = null,
}) {
  // Gracefully handle missing template — fall back to defaults
  let template = null;
  try {
    template = await templateRepo.findByType(businessId, templateType);
  } catch (e) {
    console.warn('Template fetch failed, using defaults:', e.message);
  }

  switch (templateType) {
    case 'product_card': {
      const product = products[0];
      if (!product) {
        return sendTextMessage(phoneNumberId, accessToken, to, 'Product not found.', replyToId);
      }

      const body = template
        ? interpolate(template.body, { ...variables, ...flattenProduct(product) })
        : formatProductCardBody(product);

      const buttons = template?.buttons?.length
        ? template.buttons
        : [
            { id: `details_${product._id}`, title: 'View Details' },
            { id: `buy_${product._id}`, title: 'Buy Now' },
          ];

      const header = product.images?.[0]
        ? { type: 'image', image: { link: product.images[0] } }
        : template?.header?.content
          ? { type: 'text', text: interpolate(template.header.content, variables) }
          : null;

      return sendInteractiveButtons(
        phoneNumberId,
        accessToken,
        to,
        body,
        buttons,
        header,
        template?.footer ? interpolate(template.footer, variables) : (product.brand || ''),
      );
    }

    case 'product_carousel':
      return sendProductCarousel(
        phoneNumberId,
        accessToken,
        to,
        products,
        template ? interpolate(template.body, variables) : `Found ${products.length} products for you:`,
      );

    case 'product_details': {
      const product = products[0];
      if (!product) {
        return sendTextMessage(phoneNumberId, accessToken, to, 'Product not found.', replyToId);
      }

      const details = [
        `*${product.name}*`,
        product.description || '',
        `\nPrice: ₹${product.price?.toLocaleString('en-IN')}`,
        `Stock: ${product.stock ? 'In Stock ✅' : 'Out of Stock ❌'}`,
        product.features?.length ? `\nFeatures:\n${product.features.map((f) => `• ${f}`).join('\n')}` : '',
        product.warranty ? `\nWarranty: ${product.warranty}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const body = template ? interpolate(template.body, { ...variables, details }) : details;

      if (product.images?.[0]) {
        await sendImageMessage(phoneNumberId, accessToken, to, product.images[0], product.name);
      }

      return sendInteractiveButtons(phoneNumberId, accessToken, to, body, [
        { id: `buy_${product._id}`, title: 'Buy Now' },
        { id: 'more_products', title: 'More Products' },
      ]);
    }

    case 'interactive_buttons':
      if (!template) {
        return sendTextMessage(phoneNumberId, accessToken, to, variables.message || '', replyToId);
      }
      return sendInteractiveButtons(
        phoneNumberId,
        accessToken,
        to,
        interpolate(template.body, variables),
        template.buttons || [],
        template.header?.content ? { type: 'text', text: interpolate(template.header.content, variables) } : null,
        template.footer ? interpolate(template.footer, variables) : null,
      );

    case 'list_message':
      if (!template) {
        return sendTextMessage(phoneNumberId, accessToken, to, variables.message || '', replyToId);
      }
      return sendListMessage(
        phoneNumberId,
        accessToken,
        to,
        interpolate(template.body, variables),
        'View Options',
        template.listSections || [],
        template.header?.content ? { type: 'text', text: interpolate(template.header.content, variables) } : null,
        template.footer ? interpolate(template.footer, variables) : null,
      );

    case 'call_to_action':
      if (!template) {
        return sendTextMessage(phoneNumberId, accessToken, to, variables.message || '', replyToId);
      }
      return sendCtaUrl(
        phoneNumberId,
        accessToken,
        to,
        interpolate(template.body, variables),
        template.buttons?.[0]?.title || 'Visit',
        template.buttons?.[0]?.url || variables.url,
        template.header?.content ? { type: 'text', text: interpolate(template.header.content, variables) } : null,
      );

    case 'text':
    default: {
      const msg = template?.body
        ? interpolate(template.body, variables)
        : (variables.message || '');
      return sendTextMessage(phoneNumberId, accessToken, to, msg, replyToId);
    }
  }
}

function flattenProduct(product) {
  return {
    name: product.name || '',
    model: product.model || '',
    brand: product.brand || '',
    price: `₹${product.price?.toLocaleString('en-IN') || '0'}`,
    stock: product.stock ? 'Available ✅' : 'Out of Stock ❌',
    features: (product.features || []).map((f) => `• ${f}`).join('\n'),
    warranty: product.warranty || '',
    description: product.description || '',
  };
}
