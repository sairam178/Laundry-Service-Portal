// Run with: npm run seed
// Populates the Service collection with starter laundry services.
require('dotenv').config();
const connectDB = require('../config/db');
const Service = require('../models/Service');

const services = [
  { name: 'Everyday Wash & Fold', category: 'Wash & Fold', unit: 'per kg', price: 60, description: 'Regular clothes washed, dried and neatly folded.', estimatedTurnaroundHours: 24 },
  { name: 'Premium Dry Cleaning', category: 'Dry Cleaning', unit: 'per item', price: 150, description: 'Gentle dry cleaning for suits, blazers and delicate fabrics.', estimatedTurnaroundHours: 48 },
  { name: 'Steam Ironing', category: 'Ironing', unit: 'per item', price: 20, description: 'Crisp, wrinkle-free steam ironing.', estimatedTurnaroundHours: 12 },
  { name: 'Sneaker & Shoe Cleaning', category: 'Shoe Cleaning', unit: 'per item', price: 120, description: 'Deep clean and deodorize shoes and sneakers.', estimatedTurnaroundHours: 48 },
  { name: 'Bedsheet & Linen Wash', category: 'Bedding & Linen', unit: 'per kg', price: 70, description: 'Heavy-duty wash for bedsheets, blankets and curtains.', estimatedTurnaroundHours: 36 },
];

(async () => {
  await connectDB();
  await Service.deleteMany({});
  await Service.insertMany(services);
  console.log('Services seeded successfully');
  process.exit();
})();
