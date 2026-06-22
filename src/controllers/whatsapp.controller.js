import { whatsappAccountRepo, businessRepo } from '../repositories/index.js';

export async function getWhatsAppSettings(req, res, next) {
  try {
    const account = await whatsappAccountRepo.findByBusinessId(req.businessId);
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
}

export async function saveWhatsAppSettings(req, res, next) {
  try {
    const { phoneNumberId, accessToken, businessAccountId, displayPhoneNumber, webhookVerifyToken } = req.body;

    const account = await whatsappAccountRepo.upsert(req.businessId, {
      phoneNumberId,
      accessToken,
      businessAccountId,
      displayPhoneNumber,
      webhookVerifyToken,
      isVerified: true,
    });

    await businessRepo.update(req.businessId, {
      whatsapp: {
        phoneNumberId,
        accessToken: '***',
        businessAccountId,
        webhookVerifyToken,
        isConnected: true,
      },
    });

    res.json({ success: true, data: { ...account.toObject(), accessToken: undefined } });
  } catch (err) {
    next(err);
  }
}
