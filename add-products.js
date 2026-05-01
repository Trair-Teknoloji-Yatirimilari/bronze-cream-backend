const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

async function addProducts() {
  const products = [
    {
      name: 'Hafif Bronz',
      description: 'Doğal ve hafif bronzlaşma efekti',
      price: 950,
      imageUrl: '/uploads/placeholder-light.jpg',
      link: 'https://www.edataspinar.com',
      isActive: true,
      isTrending: false,
      isSoldOut: false,
      isPopular: false,
      hasFilterEvent: true,
      filterColor: '#D2A679', // Açık bronz
      intensity: 1,
      filterType: 'Color'
    },
    {
      name: 'Orta Bronz',
      description: 'Dengeli ve doğal bronzlaşma',
      price: 1050,
      imageUrl: '/uploads/placeholder-medium.jpg',
      link: 'https://www.edataspinar.com',
      isActive: true,
      isTrending: true,
      isSoldOut: false,
      isPopular: true,
      hasFilterEvent: true,
      filterColor: '#A67C52', // Orta bronz
      intensity: 2,
      filterType: 'Color'
    },
    {
      name: 'Koyu Bronz',
      description: 'Yoğun ve çarpıcı bronzlaşma',
      price: 1150,
      imageUrl: '/uploads/placeholder-dark.jpg',
      link: 'https://www.edataspinar.com',
      isActive: true,
      isTrending: false,
      isSoldOut: false,
      isPopular: true,
      hasFilterEvent: true,
      filterColor: '#8B5A3C', // Koyu bronz
      intensity: 3,
      filterType: 'Color'
    },
    {
      name: 'Ultra Koyu',
      description: 'Maksimum bronzlaşma efekti',
      price: 1250,
      imageUrl: '/uploads/placeholder-ultra.jpg',
      link: 'https://www.edataspinar.com',
      isActive: true,
      isTrending: false,
      isSoldOut: false,
      isPopular: false,
      hasFilterEvent: true,
      filterColor: '#5C3A21', // Çok koyu bronz
      intensity: 4,
      filterType: 'Color'
    }
  ];

  for (const product of products) {
    const created = await prisma.products.create({ data: product });
    console.log('✅ Ürün eklendi:', created.name, '- Renk:', created.filterColor);
  }
  
  console.log('🎉 Tüm ürünler eklendi!');
}

addProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
