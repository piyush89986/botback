import { connectDatabase } from '../config/database.js';
import { businessRepo, userRepo, productRepo, knowledgeRepo, templateRepo, whatsappAccountRepo } from '../repositories/index.js';
import { registerBusiness } from '../services/auth.service.js';
import { indexProduct, indexKnowledge } from '../services/pinecone.service.js';

async function seed() {
  await connectDatabase();
  console.log('Seeding demo data...');

  const existing = await userRepo.findByEmail('demo@abc-electronics.com');
  if (existing) {
    console.log('Demo data already exists. Skipping.');
    process.exit(0);
  }

  const { business } = await registerBusiness({
    businessName: 'ABC Electronics',
    email: 'demo@abc-electronics.com',
    password: 'Demo@12345',
    name: 'Demo Owner',
    phone: '+919876543210',
    industry: 'Electronics',
    address: '123 Main Street, Mumbai',
  });

  await whatsappAccountRepo.upsert(business.businessId, {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'YOUR_PHONE_NUMBER_ID',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
    displayPhoneNumber: '+919876543210',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'verify_token',
    isVerified: false,
  });

  const products = [
    {
      businessId: business.businessId,
      name: 'Voltas AC',
      model: '2022',
      category: 'Air Conditioner',
      brand: 'Voltas',
      price: 10000,
      stock: true,
      stockQuantity: 5,
      description: 'Energy efficient split AC with turbo cooling',
      features: ['Turbo Cooling', '5 Star Rating', 'Low Power Consumption'],
      warranty: '1 Year',
    },
    {
      businessId: business.businessId,
      name: 'Voltas AC',
      model: '2023',
      category: 'Air Conditioner',
      brand: 'Voltas',
      price: 12000,
      stock: true,
      stockQuantity: 3,
      description: 'Latest model with inverter technology',
      features: ['Inverter Technology', '5 Star Rating', 'WiFi Control'],
      warranty: '2 Years',
    },
    {
      businessId: business.businessId,
      name: 'Samsung Galaxy S24',
      model: '256GB',
      category: 'Mobile',
      brand: 'Samsung',
      price: 79999,
      stock: true,
      stockQuantity: 10,
      features: ['AMOLED Display', '50MP Camera', '5G'],
      warranty: '1 Year',
    },
  ];

  const createdProducts = await productRepo.bulkCreate(products);
  for (const p of createdProducts) {
    try {
      await indexProduct(p, business.pineconeNamespace);
    } catch (e) {
      console.warn('Index failed:', p.name);
    }
  }

  const kbItems = [
    {
      businessId: business.businessId,
      title: 'Warranty Policy',
      content:
        'All products come with manufacturer warranty. AC units have 1-2 years warranty. Mobile phones have 1 year warranty. Extended warranty available on request.',
      type: 'warranty_policy',
    },
    {
      businessId: business.businessId,
      title: 'Return Policy',
      content:
        'Returns accepted within 7 days of purchase with original packaging. Defective products can be exchanged within 15 days.',
      type: 'return_policy',
    },
    {
      businessId: business.businessId,
      title: 'Store Information',
      content:
        'ABC Electronics - Your trusted electronics partner since 2010. Open Mon-Sat 10AM-8PM. Free installation for AC purchases above ₹15,000.',
      type: 'business_info',
    },
  ];

  for (const kb of kbItems) {
    const item = await knowledgeRepo.create(kb);
    try {
      await indexKnowledge(item, business.pineconeNamespace);
    } catch (e) {
      console.warn('KB index failed:', kb.title);
    }
  }

  await templateRepo.create({
    businessId: business.businessId,
    name: 'Default Product Card',
    type: 'product_card',
    body: '*{{name}} {{model}}*\n\n{{price}}\n\n{{stock}}\n\nFeatures:\n{{features}}\n\nWarranty:\n{{warranty}}',
    buttons: [
      { id: 'view_details', title: 'View Details' },
      { id: 'buy_now', title: 'Buy Now' },
    ],
    isDefault: true,
  });

  console.log('Seed complete!');
  console.log('Login: demo@abc-electronics.com / Demo@12345');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
