import axios from 'axios';
import { config } from '../config/index.js';

function getApiUrl(phoneNumberId) {
  return `https://graph.facebook.com/${config.whatsapp.apiVersion}/${phoneNumberId}/messages`;
}

function getHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function markAsRead(phoneNumberId, accessToken, messageId) {
  const payload = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
    typing_indicator: { type: 'text' },
  };

  await axios.post(getApiUrl(phoneNumberId), payload, { headers: getHeaders(accessToken) });
}

export async function sendTextMessage(phoneNumberId, accessToken, to, text, replyToId = null) {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  };

  if (replyToId) {
    payload.context = { message_id: replyToId };
  }

  const { data } = await axios.post(getApiUrl(phoneNumberId), payload, {
    headers: getHeaders(accessToken),
  });
  return data;
}

export async function sendInteractiveButtons(phoneNumberId, accessToken, to, body, buttons, header = null, footer = null) {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body.slice(0, 1024) },
      action: {
        buttons: buttons.slice(0, 3).map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title.slice(0, 20) },
        })),
      },
    },
  };

  if (header) payload.interactive.header = header;
  if (footer) payload.interactive.footer = { text: footer.slice(0, 60) };

  const { data } = await axios.post(getApiUrl(phoneNumberId), payload, {
    headers: getHeaders(accessToken),
  });
  return data;
}

export async function sendListMessage(phoneNumberId, accessToken, to, body, buttonText, sections, header = null, footer = null) {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body.slice(0, 1024) },
      action: { button: buttonText.slice(0, 20), sections },
    },
  };

  if (header) payload.interactive.header = header;
  if (footer) payload.interactive.footer = { text: footer.slice(0, 60) };

  const { data } = await axios.post(getApiUrl(phoneNumberId), payload, {
    headers: getHeaders(accessToken),
  });
  return data;
}

export async function sendImageMessage(phoneNumberId, accessToken, to, imageUrl, caption = '') {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: { link: imageUrl, caption: caption.slice(0, 1024) },
  };

  const { data } = await axios.post(getApiUrl(phoneNumberId), payload, {
    headers: getHeaders(accessToken),
  });
  return data;
}

export async function sendCtaUrl(phoneNumberId, accessToken, to, body, buttonText, url, header = null) {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: { text: body.slice(0, 1024) },
      action: {
        name: 'cta_url',
        parameters: { display_text: buttonText.slice(0, 20), url },
      },
    },
  };

  if (header) payload.interactive.header = header;

  const { data } = await axios.post(getApiUrl(phoneNumberId), payload, {
    headers: getHeaders(accessToken),
  });
  return data;
}

export async function sendProductCarousel(phoneNumberId, accessToken, to, products, introText) {
  const results = [];

  if (introText) {
    await sendTextMessage(phoneNumberId, accessToken, to, introText);
  }

  for (const product of products.slice(0, 10)) {
    const body = formatProductCardBody(product);
    const buttons = [
      { id: `details_${product._id}`, title: 'View Details' },
      { id: `buy_${product._id}`, title: 'Buy Now' },
    ];

    const header = product.images?.[0]
      ? { type: 'image', image: { link: product.images[0] } }
      : { type: 'text', text: product.name.slice(0, 60) };

    const result = await sendInteractiveButtons(
      phoneNumberId,
      accessToken,
      to,
      body,
      buttons,
      header,
      product.brand || '',
    );
    results.push(result);
  }

  return results;
}

function formatProductCardBody(product) {
  const price = `₹${product.price?.toLocaleString('en-IN')}`;
  const availability = product.stock ? 'Available ✅' : 'Out of Stock ❌';
  const features = (product.features || [])
    .slice(0, 3)
    .map((f) => `• ${f}`)
    .join('\n');

  return [
    `*${product.name}*${product.model ? ` ${product.model}` : ''}`,
    '',
    price,
    availability,
    features ? `\nFeatures:\n${features}` : '',
    product.warranty ? `\nWarranty: ${product.warranty}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export { formatProductCardBody };
