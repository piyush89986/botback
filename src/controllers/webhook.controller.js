import { config } from '../config/index.js';
import {
  businessRepo,
  whatsappAccountRepo,
  customerRepo,
  conversationRepo,
  productRepo,
} from '../repositories/index.js';
import { processMessage } from '../services/chatbot.service.js';
import { renderAndSend } from '../services/templateEngine.service.js';
import { markAsRead, sendListMessage } from '../services/whatsapp.service.js';

export function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('✅ Webhook verified by Meta');
    return res.status(200).send(challenge);
  }

  return res.status(403).send('Verification failed');
}

export async function handleWebhook(req, res) {
  // Respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  try {
    // Body comes as Buffer due to express.raw() — parse it
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : 
                 Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    if (!change?.messages?.length) return;

    const message = change.messages[0];
    const phoneNumberId = change.metadata?.phone_number_id;

    const account = await whatsappAccountRepo.findByPhoneNumberId(phoneNumberId);
    if (!account) {
      console.warn('No WhatsApp account found for phoneNumberId:', phoneNumberId);
      return;
    }

    const business = await businessRepo.findByBusinessId(account.businessId);
    if (!business?.isActive) return;

    const senderPhone = message.from;
    const messageId = message.id;

    // Mark as read (non-blocking)
    markAsRead(phoneNumberId, account.accessToken, messageId).catch(() => {});

    const customer = await customerRepo.upsert(business.businessId, senderPhone);
    const conversation = await conversationRepo.findOrCreate(
      business.businessId,
      senderPhone,
      customer._id,
    );

    // Extract text from message
    let userText = '';
    if (message.type === 'text') {
      userText = message.text.body;
    } else if (message.type === 'interactive') {
      const interactive = message.interactive;
      if (interactive.type === 'button_reply') {
        userText = interactive.button_reply.id;
      } else if (interactive.type === 'list_reply') {
        userText = interactive.list_reply.id;
      }
    } else {
      // Unsupported message type — silently ignore
      return;
    }

    // Handle product detail button clicks
    if (userText.startsWith('product_') || userText.startsWith('details_')) {
      const productId = userText.replace(/^(product_|details_)/, '');
      const product = await productRepo.findById(productId, business.businessId);
      if (product) {
        await renderAndSend({
          phoneNumberId,
          accessToken: account.accessToken,
          to: senderPhone,
          businessId: business.businessId,
          templateType: 'product_details',
          products: [product],
        });
        return;
      }
    }

    // Handle buy button clicks
    if (userText.startsWith('buy_')) {
      const productId = userText.replace('buy_', '');
      const product = await productRepo.findById(productId, business.businessId);
      if (product) {
        await renderAndSend({
          phoneNumberId,
          accessToken: account.accessToken,
          to: senderPhone,
          businessId: business.businessId,
          templateType: 'text',
          variables: {
            message: `Great choice! 🛒\n\n*${product.name}* - ₹${product.price?.toLocaleString('en-IN')}\n\nOur team will contact you shortly to complete your order. You can also call us at ${business.phone || 'our store'}.`,
          },
        });
        return;
      }
    }

    // Handle "more products" button
    if (userText === 'more_products') {
      userText = 'Show me your products';
    }

    // Save user message to conversation
    await conversationRepo.addMessage(conversation._id, {
      role: 'user',
      content: userText,
    });

    // Get recent history for context
    const history = conversationRepo.getRecentMessages(conversation);

    // Process with AI
    const result = await processMessage(business, userText, history);

    // Send response
    if (result.templateType === 'list_message' && result.listSections) {
      await sendListMessage(
        phoneNumberId,
        account.accessToken,
        senderPhone,
        result.variables.message,
        'View Products',
        result.listSections,
      );
    } else {
      await renderAndSend({
        phoneNumberId,
        accessToken: account.accessToken,
        to: senderPhone,
        businessId: business.businessId,
        templateType: result.templateType,
        variables: result.variables,
        products: result.products || [],
        replyToId: messageId,
      });
    }

    // Save assistant response to conversation
    const responseText =
      result.variables?.message ||
      (result.products?.length ? `Found ${result.products.length} product(s)` : 'Response sent');

    await conversationRepo.addMessage(conversation._id, {
      role: 'assistant',
      content: responseText,
      intent: result.intent,
    });

  } catch (err) {
    console.error('Webhook processing error:', err.message, err.stack);
  }
}
