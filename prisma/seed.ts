import { CustomizationType, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create categories
  const categories = [
    {
      name: 'T-Shirts',
      slug: 't-shirts',
      description: 'Customizable t-shirts for all occasions',
      imageUrl: '/images/categories/t-shirts.jpg',
    },
    {
      name: 'Mugs',
      slug: 'mugs',
      description: 'Personalized mugs for your morning coffee',
      imageUrl: '/images/categories/mugs.jpg',
    },
    {
      name: 'Posters',
      slug: 'posters',
      description: 'Custom posters to decorate your space',
      imageUrl: '/images/categories/posters.jpg',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  // Get created categories
  const tShirtCategory = await prisma.category.findUnique({
    where: { slug: 't-shirts' },
  });
  
  const mugCategory = await prisma.category.findUnique({
    where: { slug: 'mugs' },
  });
  
  const posterCategory = await prisma.category.findUnique({
    where: { slug: 'posters' },
  });

  if (!tShirtCategory || !mugCategory || !posterCategory) {
    throw new Error('Failed to create categories');
  }

  // Create products
  const products = [
    {
      name: 'Padalustro T-Shirt',
      slug: 'padalustro-t-shirt',
      description: 'A comfortable Padalustro t-shirt that you can customize with your own designs',
      basePrice: 19.99,
      images: ['/images/products/Padalustro-t-shirt-1.jpg', '/images/products/Padalustro-t-shirt-2.jpg'],
      categoryId: tShirtCategory.id,
      customizableAreas: [
        { name: 'Text', type: CustomizationType.TEXT, extraCharge: 2.50 }
      ],
    },
    {
      name: 'Classic T-Shirt',
      slug: 'padalustro-t-shirt',
      description: 'A comfortable Padalustro t-shirt that you can customize with your own designs',
      basePrice: 19.99,
      images: ['/images/products/Padalustro-t-shirt-1.png', '/images/products/Padalustro-t-shirt-2.png'],
      categoryId: tShirtCategory.id,
      customizableAreas: [
        { name: 'Text', type: CustomizationType.TEXT, extraCharge: 2.50 },
        { name: 'Shirt Color', type: CustomizationType.COLOR, extraCharge: 0.00 },
      ],
    },
    {
      name: 'Premium Mug',
      slug: 'premium-mug',
      description: 'High-quality ceramic mug perfect for personalization',
      basePrice: 14.99,
      images: ['/images/products/premium-mug-1.png', '/images/products/premium-mug-2.png'],
      categoryId: mugCategory.id,
      customizableAreas: [
        { name: 'Front Image', type: CustomizationType.IMAGE, extraCharge: 3.00 },
        { name: 'Custom Text', type: CustomizationType.TEXT, extraCharge: 1.50 },
        { name: 'Mug Color', type: CustomizationType.COLOR, extraCharge: 0.00 },
      ],
    },
    {
      name: 'Art Poster',
      slug: 'art-poster',
      description: 'Premium quality poster paper for your custom designs',
      basePrice: 24.99,
      images: ['/images/products/art-poster.jpg'],
      categoryId: posterCategory.id,
      customizableAreas: [
        { name: 'Main Image', type: CustomizationType.IMAGE, extraCharge: 7.50 },
        { name: 'Caption', type: CustomizationType.TEXT, extraCharge: 2.00 },
      ],
    },
  ];

  for (const product of products) {
    const { customizableAreas, ...productData } = product;
    
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...productData,
        customizableAreas: {
          create: customizableAreas,
        },
      },
    });
  }

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });