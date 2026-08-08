export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string;
  role: 'Admin' | 'Normal User' | 'User' | 'Reseller' | 'Dealer' | 'VIP' | 'Sub-Admin' | 'Retailer';
  walletBalance: number;
  pin: string;
  status?: 'Active' | 'Suspended';
  commissionRate?: number;
  walletLimit?: number;
  password?: string;
  createdBy?: string;
  createdByPhone?: string;
}

export interface Offer {
  id: string;
  title: string;
  operator: 'Grameenphone' | 'Robi' | 'Airtel' | 'Teletalk' | 'Banglalink' | string;
  category: 'Minutes' | 'Internet' | 'Bundles' | 'Call Rate' | 'Calling Card';
  mb: string;
  min: string;
  regularPrice: number;
  resellerPrice: number;
  validity: string;
  isEnabled: boolean;
  description: string;
  isDrivePack?: boolean;
}

export interface Order {
  id: string;
  type: 'Add Money' | 'Recharge' | 'Drive Pack' | 'Bank Transfer' | 'Send Money' | 'Utility Bill' | 'Deposit' | 'Bank Deposit' | 'Drive' | 'Mobile Recharge' | 'Pay Bill' | string;
  userEmail: string;
  userPhone: string;
  serviceName: string;
  paymentMethod: string;
  amount: number;
  trxId: string;
  account: string;
  routingNumber?: string;
  accountHolder?: string;
  ref?: string;
  status: 'Pending' | 'Success' | 'Rejected' | 'Cancelled' | string;
  cancellationReason: string;
  date: string;
  commissionDeducted: number;
  operator?: string;
  packDetails?: string;
  packageId?: string;
  cardPin?: string;
  cardPassword?: string;
  cardExpiry?: string;
  cardImageUrl?: string;
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  message: string;
  status: 'Pending' | 'Resolved';
  date: string;
  replies?: Array<{
    sender: string;
    message: string;
    date: string;
  }>;
}

export interface Bank {
  id: string;
  name: string;
  logoColor: string;
  bgColor: string;
  accentColor: string;
}
