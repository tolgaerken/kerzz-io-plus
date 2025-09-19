// Mock data for sellers - will be replaced with API integration later

export interface TSeller {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  isActive: boolean;
  avatar?: string;
}

export const mockSellers: TSeller[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@kerzz.com',
    phone: '+90 532 123 45 67',
    department: 'Satış',
    isActive: true,
    avatar: '👨‍💼'
  },
  {
    id: '2',
    name: 'Ayşe Demir',
    email: 'ayse.demir@kerzz.com',
    phone: '+90 533 234 56 78',
    department: 'Satış',
    isActive: true,
    avatar: '👩‍💼'
  },
  {
    id: '3',
    name: 'Mehmet Kaya',
    email: 'mehmet.kaya@kerzz.com',
    phone: '+90 534 345 67 89',
    department: 'Satış',
    isActive: true,
    avatar: '👨‍💻'
  },
  {
    id: '4',
    name: 'Fatma Özkan',
    email: 'fatma.ozkan@kerzz.com',
    phone: '+90 535 456 78 90',
    department: 'Satış',
    isActive: true,
    avatar: '👩‍💻'
  },
  {
    id: '5',
    name: 'Ali Çelik',
    email: 'ali.celik@kerzz.com',
    phone: '+90 536 567 89 01',
    department: 'Satış',
    isActive: true,
    avatar: '👨‍🔧'
  },
  {
    id: '6',
    name: 'Zeynep Arslan',
    email: 'zeynep.arslan@kerzz.com',
    phone: '+90 537 678 90 12',
    department: 'Satış',
    isActive: false,
    avatar: '👩‍🎓'
  },
  {
    id: '7',
    name: 'Mustafa Güler',
    email: 'mustafa.guler@kerzz.com',
    phone: '+90 538 789 01 23',
    department: 'Satış',
    isActive: true,
    avatar: '👨‍🎯'
  },
  {
    id: '8',
    name: 'Elif Şahin',
    email: 'elif.sahin@kerzz.com',
    phone: '+90 539 890 12 34',
    department: 'Satış',
    isActive: true,
    avatar: '👩‍🚀'
  }
];

// Helper functions for sellers
export const getActiveSellers = (): TSeller[] => {
  return mockSellers.filter(seller => seller.isActive);
};

export const getSellerById = (id: string | number): TSeller | undefined => {
  if (!id) return undefined;
  const searchId = String(id); // ID'yi string'e çevir
  return mockSellers.find(seller => seller.id === searchId);
};

export const getSellerByName = (name: string): TSeller | undefined => {
  return mockSellers.find(seller => seller.name.toLowerCase().includes(name.toLowerCase()));
};
