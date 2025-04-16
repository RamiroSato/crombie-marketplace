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
      imageUrl: 'https://storage.googleapis.com/crombie-marketplace-bucket/categories/t-shirts.jpg',
    },
    {
      name: 'Mugs',
      slug: 'mugs',
      description: 'Personalized mugs for your morning coffee',
      imageUrl: 'https://storage.googleapis.com/crombie-marketplace-bucket/categories/mugs.jpg',
    },
    {
      name: 'Posters',
      slug: 'posters',
      description: 'Custom posters to decorate your space',
      imageUrl: 'https://storage.googleapis.com/crombie-marketplace-bucket/categories/posters.jpg',
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
      name: 'Classic T-Shirt',
      slug: 'classic-t-shirt',
      description: 'A comfortable Padalustro t-shirt that you can customize with your own designs',
      basePrice: 19.99,
      images: ['https://storage.googleapis.com/crombie-marketplace-bucket/categories/t-shirts.jpg'],
      categoryId: tShirtCategory.id,
      customizableAreas: [
        { name: 'Front Print', type: CustomizationType.IMAGE, extraCharge: 5.00 },
        { name: 'Back Print', type: CustomizationType.IMAGE, extraCharge: 5.00 },
        { name: 'Text', type: CustomizationType.TEXT, extraCharge: 2.50 },
        { name: 'Shirt Color', type: CustomizationType.COLOR, extraCharge: 0.00 },
      ],
    },
    {
      name: 'Classic Mug',
      slug: 'classic-mug',
      description: 'Yes! Game Over, you just lost the game! Troll your friends or co-worker with this exclusive mug',
      basePrice: 14.99,
      images: ['https://storage.googleapis.com/crombie-marketplace-bucket/categories/mugs.jpg'],
      categoryId: mugCategory.id,
      customizableAreas: [
        { name: 'Front Image', type: CustomizationType.IMAGE, extraCharge: 3.00 },
        { name: 'Custom Text', type: CustomizationType.TEXT, extraCharge: 1.50 },
        { name: 'Mug Color', type: CustomizationType.COLOR, extraCharge: 0.00 },
      ],
    },
    {
      name: 'Classic Poster',
      slug: 'Classic-poster',
      description: 'Premium quality small poster paper for your custom designs',
      basePrice: 4.99,
      images: ['https://storage.googleapis.com/crombie-marketplace-bucket/categories/posters.jpg'],
      categoryId: posterCategory.id,
      customizableAreas: [],
    },
    {
      name: 'Premium Mug',
      slug: 'premium-mug',
      description: 'High-quality premium ceramic mug perfect',
      basePrice: 9.99,
      images: ['https://storage.googleapis.com/crombie-marketplace-bucket/products/premium-mug-1.png', 'https://storage.googleapis.com/crombie-marketplace-bucket/products/premium-mug-2.png'],
      categoryId: mugCategory.id,
      customizableAreas: [],
    },
    {
      name: 'The Game Mug',
      slug: 'the-game-mug',
      description: 'Yes! Game Over, you just lost the game! Troll your friends or co-worker with this exclusive mug',
      basePrice: 14.99,
      images: ['https://storage.googleapis.com/crombie-marketplace-bucket/products/the-game-mug-1.png'],
      categoryId: mugCategory.id,
      customizableAreas: [],
    },
    
    {
      name: 'Art Poster',
      slug: 'art-poster',
      description: 'Premium quality Art poster paper',
      basePrice: 9.99,
      images: ['https://storage.googleapis.com/crombie-marketplace-bucket/products/art-poster-1.jpg', 'https://storage.googleapis.com/crombie-marketplace-bucket/products/art-poster-2.jpg'],
      categoryId: posterCategory.id,
      customizableAreas: [],
    },
    {
      name: 'Padalustro T-Shirt',
      slug: 'padalustro-t-shirt',
      description: 'An Exclusive Padalustro t-shirt that you can customize with your own designs',
      basePrice: 29.99,
      images: ['https://storage.googleapis.com/crombie-marketplace-bucket/products/padalustro-t-shirt-1.jpg', 'https://storage.googleapis.com/crombie-marketplace-bucket/products/padalustro-t-shirt-2.jpg'],
      categoryId: tShirtCategory.id,
      customizableAreas: [],
    },
    {
      name: 'Tralalero Trala T-Shirt',
      slug: 'tralalero-t-shirt',
      description: 'Trallallero Trallalla, porco dio e porco Allah. Ero con il mio fottuto figlio merdardo a giocare a Fortnite, quando a un punto arriva mia nonna, Ornella Leccacappella, a avvisarci che quello stronzo di Burger ci aveva invitato a cena per mangiare un purè di cazzi.',
      basePrice: 69.99,
      images: ['https://storage.googleapis.com/crombie-marketplace-bucket/products/tralalero-t-shirt.jpg', 'https://storage.googleapis.com/crombie-marketplace-bucket/products/tralalero-model-t-shirt.jpg' , 'https://storage.googleapis.com/crombie-marketplace-bucket/products/tralalero-female-model-t-shirt.jpg'],
      categoryId: tShirtCategory.id,
      customizableAreas: [],
    }
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