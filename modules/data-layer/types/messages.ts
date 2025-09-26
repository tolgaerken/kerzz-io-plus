// Messaging Module Types

export type MessageType = 'private' | 'department' | 'broadcast';
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageImportance = 'normal' | 'important' | 'critical';

// Mention interfaces
export interface UserMention {
  id: string;
  name: string;
  email: string;
}

export interface DepartmentMention {
  code: string;
  name: string;
}

export interface CustomerMention {
  id: string;
  name: string;
  code?: string;
}

export interface LicenseMention {
  id: string;
  name: string;
  licenseId: string;
}

export interface MessageMentions {
  users: UserMention[];
  departments: DepartmentMention[];
  customers: CustomerMention[];
  licenses: LicenseMention[];
}

// Reference interfaces
export interface MessageReference {
  route?: string; // Sayfa yönlendirmesi (/sales/123)
  collection?: string; // MongoDB koleksiyonu (sales, customers)
  recordId?: string; // Kayıt ID'si
  displayText?: string; // Gösterilecek metin
  type: 'route' | 'record' | 'customer' | 'license';
}

// Ana mesaj interface'i
export interface Message {
  id: string;
  content: string;
  
  // Gönderen bilgileri
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderImage?: string;
  
  // Mesaj türü ve hedef
  type: MessageType;
  targetUsers?: string[]; // Özel mesaj için kullanıcı ID'leri
  targetDepartments?: string[]; // Departman kodları
  
  // Özellikler
  priority: MessagePriority;
  importance: MessageImportance;
  hasSound: boolean;
  
  // Mention ve referanslar
  mentions: MessageMentions;
  references?: MessageReference[];
  
  // Durum bilgileri
  isRead: { [userId: string]: boolean };
  readAt: { [userId: string]: Date };
  createdAt: Date;
  updatedAt: Date;
  
  // Lisans bilgisi
  licenseId: string;
  
  // Thread bilgisi (gelecekte kullanım için)
  threadId?: string;
  replyToId?: string;
}

// Mesaj oluşturma için input interface'i
export interface CreateMessageInput {
  content: string;
  type: MessageType;
  targetUsers?: string[];
  targetDepartments?: string[];
  priority?: MessagePriority;
  importance?: MessageImportance;
  hasSound?: boolean;
  mentions?: Partial<MessageMentions>;
  references?: MessageReference[];
}

// Mesaj güncelleme için input interface'i
export interface UpdateMessageInput {
  content?: string;
  priority?: MessagePriority;
  importance?: MessageImportance;
  hasSound?: boolean;
}

// Mesaj filtreleme için interface
export interface MessageFilters {
  type?: MessageType;
  priority?: MessagePriority;
  importance?: MessageImportance;
  senderId?: string;
  unreadOnly?: boolean;
  mentionsMe?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
}

// Mesaj istatistikleri
export interface MessageStats {
  total: number;
  unread: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  byImportance: {
    critical: number;
    important: number;
    normal: number;
  };
}

// Bildirim ayarları
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  priorityFilter: MessagePriority[]; // Hangi öncelik seviyelerinde bildirim alınacak
  importanceFilter: MessageImportance[]; // Hangi önem seviyelerinde bildirim alınacak
  mutedUsers: string[]; // Sessize alınan kullanıcılar
  mutedDepartments: string[]; // Sessize alınan departmanlar
}

// Departman bilgileri (mention için)
export interface Department {
  code: string;
  name: string;
  description?: string;
  members?: string[]; // Kullanıcı ID'leri
}

// Mesaj paneli durumu
export interface MessagePanelState {
  isOpen: boolean;
  activeTab: 'compose' | 'inbox' | 'sent' | 'settings';
  selectedMessage?: Message;
  replyingTo?: Message;
}

// Mention parser sonucu
export interface ParsedContent {
  text: string;
  mentions: MessageMentions;
  references: MessageReference[];
}

// Ses dosyaları enum'u
export const SoundType = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  URGENT: 'urgent',
  MENTION: 'mention',
  NEW_MESSAGE: 'new_message'
} as const;


// Component props interfaces
export interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onMarkAsRead?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  compact?: boolean;
}

export interface MessageFormProps {
  onSend: (message: CreateMessageInput) => Promise<void>;
  replyingTo?: Message;
  onCancel?: () => void;
  defaultType?: MessageType;
  defaultTargets?: {
    users?: string[];
    departments?: string[];
  };
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  filters?: MessageFilters;
  onMessageClick?: (message: Message) => void;
}
