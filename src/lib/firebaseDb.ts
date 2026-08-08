import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { User, Order, Offer, SupportTicket } from "../types";

// Default Seed Data
export const defaultUsers: User[] = [
  {
    id: "usr-shakib",
    name: "Shakib Raj",
    email: "Khanshakibraj@gmail.com",
    phone: "01635275233",
    profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "Admin" as any,
    walletBalance: 12500,
    pin: "0188",
    password: "Pass 018811",
    status: "Active",
    commissionRate: 2,
    walletLimit: 100000
  },
  {
    id: "usr-ayman",
    name: "Ayman Sadiq",
    email: "aymansadiq@gmail.com",
    phone: "01723456789",
    profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    role: "Retailer" as any,
    walletBalance: 1500,
    pin: "4321",
    password: "password123",
    status: "Active"
  },
  {
    id: "usr-nafis",
    name: "Nafis Fuad",
    email: "nafis@gmail.com",
    phone: "01834567890",
    profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "VIP" as any,
    walletBalance: 5200,
    pin: "5555",
    password: "password123",
    status: "Active"
  },
  {
    id: "usr-rifat",
    name: "Rifat Chowdhury",
    email: "rifat@gmail.com",
    phone: "01945678901",
    profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "Sub-Admin" as any,
    walletBalance: 12000,
    pin: "1111",
    password: "password123",
    status: "Active"
  }
];

export const defaultOffers: Offer[] = [
  {
    id: "gp-1",
    title: "GP Super Internet 25GB",
    operator: "Grameenphone",
    category: "Internet",
    mb: "25 GB",
    min: "0 Min",
    regularPrice: 630,
    resellerPrice: 580,
    validity: "30 Days",
    isEnabled: true,
    description: "Direct Gift Pack, Speed unlimited"
  },
  {
    id: "gp-2",
    title: "GP 25GB + 200 Min Bundle",
    operator: "Grameenphone",
    category: "Bundles",
    mb: "25 GB",
    min: "200 Min",
    regularPrice: 699,
    resellerPrice: 605,
    validity: "30 Days",
    isEnabled: true,
    description: "All BD gift, No division restriction"
  },
  {
    id: "robi-1",
    title: "Robi Dhamaka 40GB",
    operator: "Robi",
    category: "Internet",
    mb: "40 GB",
    min: "0 Min",
    regularPrice: 599,
    resellerPrice: 480,
    validity: "30 Days",
    isEnabled: true,
    description: "Offer only for internet users"
  },
  {
    id: "robi-2",
    title: "Robi 800 Min Call Pack",
    operator: "Robi",
    category: "Minutes",
    mb: "0 GB",
    min: "800 Min",
    regularPrice: 540,
    resellerPrice: 490,
    validity: "30 Days",
    isEnabled: true,
    description: "Any operator calls"
  },
  {
    id: "airtel-1",
    title: "Airtel 1000 Min Bundle",
    operator: "Airtel",
    category: "Minutes",
    mb: "0 GB",
    min: "1000 Min",
    regularPrice: 640,
    resellerPrice: 590,
    validity: "30 Days",
    isEnabled: true,
    description: "Gift pack, instantly active"
  },
  {
    id: "bl-1",
    title: "Banglalink Unlimited 50GB",
    operator: "Banglalink",
    category: "Internet",
    mb: "50 GB",
    min: "0 Min",
    regularPrice: 799,
    resellerPrice: 680,
    validity: "30 Days",
    isEnabled: true,
    description: "Direct gift internet pack"
  },
  {
    id: "bl-2",
    title: "BL Special Call Rate Pack",
    operator: "Banglalink",
    category: "Call Rate",
    mb: "0 GB",
    min: "1 Sec pulse",
    regularPrice: 150,
    resellerPrice: 130,
    validity: "15 Days",
    isEnabled: true,
    description: "Special call rate 0.90tk/min"
  }
];

export const defaultBanners = [
  { id: "b1", title: "জিপি ও রবি ড্রাইভ ধামাকা!", desc: "আজকের স্পেশাল ড্রাইভ প্যাকে পাচ্ছেন সর্বোচ্চ ১৫০ টাকা পর্যন্ত ক্যাশব্যাক!", action: "offers", color: "from-blue-600 to-indigo-700", isActive: true, image: "" },
  { id: "b2", title: "৫ সেকেন্ডে অটো অ্যাড মানি!", desc: "বিকাশ, নগদ বা রকেটে ট্রানজেকশন সাবমিট করলেই ব্যালেন্স সাথে সাথে যোগ হবে।", action: "mfs", color: "from-rose-500 to-orange-600", isActive: true, image: "" },
  { id: "b3", title: "জিরো চার্জে বিদ্যুৎ ও গ্যাস বিল!", desc: "কোন প্রকার অতিরিক্ত চার্জ ছাড়াই ঘরে বসে পরিশোধ করুন যেকোনো ইউটিলিটি বিল।", action: "utility-bills", color: "from-emerald-600 to-teal-700", isActive: true, image: "" }
];

export const defaultNotices = [
  { id: "n1", text: "আসসালামু আলাইকুম! SHAKIB PAY প্ল্যাটফর্মে আপনাকে স্বাগতম। কম রেটে ড্রাইভ প্যাক এবং নির্ভরযোগ্য অ্যাড মানি সুবিধা উপভোগ করুন।", isActive: true, textColor: "#B45309" }
];

export const defaultNotifications = [
  { id: "pop-1", title: "ধামাকা অফার নোটিফিকেশন!", body: "আমাদের সকল রিচার্জে এখন অতিরিক্ত ২% কমিশন চলছে। অফারটি সীমিত সময়ের জন্য!", targetRole: "All", expiryDate: "2026-12-31", isActive: true, imageUrl: "" }
];

export const defaultServices = [
  { id: "s-recharge", name: "Mobile Recharge", slug: "recharge", type: "Recharge", country: "Bangladesh", sortOrder: 1, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
  { id: "s-drive", name: "Drive Pack", slug: "drive", type: "Drive", country: "Bangladesh", sortOrder: 2, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
  { id: "s-bkash", name: "bKash", slug: "bkash", type: "Mobile Bank", country: "Bangladesh", sortOrder: 3, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
  { id: "s-nagad", name: "Nagad", slug: "nagad", type: "Mobile Bank", country: "Bangladesh", sortOrder: 4, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
  { id: "s-rocket", name: "Rocket", slug: "rocket", type: "Mobile Bank", country: "Bangladesh", sortOrder: 5, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
  { id: "s-banking", name: "Bank Transfer", slug: "banking", type: "Bank Transfer", country: "Bangladesh", sortOrder: 6, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
  { id: "s-bill", name: "Pay Bill", slug: "bill", type: "Mobile Bank", country: "Bangladesh", sortOrder: 7, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
];

export const defaultAdminInfo = {
  id: "admin-settings",
  adminNumbers: {
    bkash: { personal: "01700112233", merchant: "01800112233" },
    nagad: { personal: "01900112233", merchant: "01500112233" },
    rocket: { personal: "01300112233", merchant: "01400112233" }
  }
};

export const defaultOrders: Order[] = [
  {
    id: "ORD-9831",
    type: "Add Money",
    userEmail: "Khanshakibraj@gmail.com",
    userPhone: "01712345678",
    serviceName: "bKash",
    paymentMethod: "Personal",
    amount: 1000,
    trxId: "TRX8829103B",
    account: "",
    routingNumber: "",
    accountHolder: "",
    ref: "",
    status: "Success",
    cancellationReason: "",
    date: "2026-07-24T18:30:00.000Z",
    commissionDeducted: 20
  }
];

export const defaultTickets: SupportTicket[] = [
  {
    id: "TCK-881",
    userEmail: "Khanshakibraj@gmail.com",
    userPhone: "01635275233",
    subject: "Add Money Pending too long",
    message: "I sent 500 BDT via bKash Personal but the wallet hasn't updated yet. TrxID is TXN119280.",
    status: "Pending",
    date: "2026-07-25T06:10:00.000Z",
    replies: []
  }
];

// Helper to sanitize object for Firestore (replace undefined values with "")
export function sanitizeForFirestore(data: any): any {
  if (data === undefined) return "";
  if (data === null || typeof data !== 'object') return data;

  // Keep FieldValue (e.g. serverTimestamp()) intact
  if ((data as any)._methodName || (data.constructor && data.constructor.name && data.constructor.name.includes('FieldValue'))) {
    return data;
  }

  if (Array.isArray(data)) return data.map(sanitizeForFirestore);

  const cleanObj: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) {
      cleanObj[key] = "";
    } else if (val && typeof val === 'object' && ((val as any)._methodName || (val.constructor && val.constructor.name && val.constructor.name.includes('FieldValue')))) {
      cleanObj[key] = val;
    } else if (val !== null && typeof val === 'object') {
      cleanObj[key] = sanitizeForFirestore(val);
    } else {
      cleanObj[key] = val;
    }
  }
  return cleanObj;
}

// Seeding / Loading function
export async function getCollection<T extends { id: string }>(
  colName: string,
  defaultData: T[]
): Promise<T[]> {
  try {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    if (snap.empty && defaultData.length > 0) {
      const batch = writeBatch(db);
      for (const item of defaultData) {
        const docRef = doc(db, colName, item.id);
        batch.set(docRef, sanitizeForFirestore(item));
      }
      await batch.commit();
      return defaultData;
    }
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
  } catch (err) {
    console.warn(`Firestore read/seed warning for ${colName}:`, err);
    return defaultData;
  }
}

// Single Doc helpers
export async function getDocById<T>(colName: string, id: string): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, colName, id));
    if (snap.exists()) {
      return { ...snap.data(), id: snap.id } as T;
    }
    return null;
  } catch (err) {
    console.warn(`Firestore getDocById error for ${colName}/${id}:`, err);
    return null;
  }
}

export async function setDocById<T>(colName: string, id: string, data: any): Promise<void> {
  try {
    const cleanData = sanitizeForFirestore({ ...data, id });
    await setDoc(doc(db, colName, id), cleanData);
  } catch (err) {
    console.error(`Firestore setDocById error for ${colName}/${id}:`, err);
    throw err;
  }
}

export async function deleteDocById(colName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, colName, id));
  } catch (err) {
    console.error(`Firestore deleteDocById error for ${colName}/${id}:`, err);
    throw err;
  }
}

// Specific DB Accessors
export async function getUsers(): Promise<User[]> {
  return getCollection<User>("users", defaultUsers);
}

export async function getOrders(): Promise<Order[]> {
  const ords = await getCollection<Order>("orders", defaultOrders);
  ords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return ords;
}

export async function getOffers(): Promise<Offer[]> {
  return getCollection<Offer>("offers", defaultOffers);
}

export async function getCardStocks(): Promise<any[]> {
  return getCollection<any>("calling_card_stock", []);
}

export async function getTickets(): Promise<SupportTicket[]> {
  return getCollection<SupportTicket>("tickets", defaultTickets);
}

export async function getBanners() {
  return getCollection<any>("banners", defaultBanners);
}

export async function getNotices() {
  return getCollection<any>("notices", defaultNotices);
}

export async function getNotifications() {
  return getCollection<any>("notifications", defaultNotifications);
}

export async function getServices() {
  return getCollection<any>("services", defaultServices);
}

export const defaultCallingCardOffers = [
  { id: 'cc-1', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 10, priceBdt: 1120, minutes: '১২০০ মিনিট', rateDescription: '৩০ সেকেন্ড পালস রেট, ক্রিস্টাল ক্লিয়ার অডিও' },
  { id: 'cc-2', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 15, priceBdt: 1680, minutes: '১৮০০ মিনিট', rateDescription: '৩০ সেকেন্ড পালস রেট, ক্রিস্টাল ক্লিয়ার অডিও' },
  { id: 'cc-3', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 25, priceBdt: 2800, minutes: '৩০০০ মিনিট', rateDescription: '৩০ সেকেন্ড পালস রেট, ক্রিস্টাল ক্লিয়ার অডিও' },
  { id: 'cc-4', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'India', value: 10, priceBdt: 1150, minutes: '১৩০০ মিনিট', rateDescription: 'নন-ক্লিপিং প্রিমিয়াম লাইন' },
  { id: 'cc-5', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'India', value: 25, priceBdt: 2850, minutes: '৩২৫০ মিনিট', rateDescription: 'নন-ক্লিপিং প্রিমিয়াম লাইন' },
  { id: 'cc-6', brand: 'Itel Mobile Dialer', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 10, priceBdt: 1090, minutes: '১০০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস স্ট্যান্ডার্ড ভয়েস' },
  { id: 'cc-7', brand: 'Itel Mobile Dialer', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 25, priceBdt: 2700, minutes: '২৫০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস স্ট্যান্ডার্ড ভয়েস' },
  { id: 'cc-8', brand: 'Green Tel Dollar', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 10, priceBdt: 1100, minutes: '১০০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস, ১ নম্বর কোয়ালিটি রাউটিং' },
  { id: 'cc-9', brand: 'Green Tel Dollar', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 15, priceBdt: 1650, minutes: '১৫০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস, ১ নম্বর কোয়ালিটি রাউটিং' },
  { id: 'cc-10', brand: 'Green Tel Dollar', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 25, priceBdt: 2750, minutes: '২৫০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস, ১ নম্বর কোয়ালিটি রাউটিং' },
  { id: 'cc-11', brand: 'Green Tel Dollar', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Saudi Arabia', value: 15, priceBdt: 1700, minutes: '১২০০ মিনিট', rateDescription: 'লো-পিং সৌদি আরব ইন্টারন্যাশনাল রাউট' },
  { id: 'cc-12', brand: 'Green Tel Dollar', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'Pakistan', value: 10, priceBdt: 1140, minutes: '১১০০ মিনিট', rateDescription: 'পাকিস্তান হাই কোয়ালিটি ভয়েস লাইন' },
  { id: 'cc-13', brand: 'Jamalpur Express Dollar', pulseRate: 'ইউএসডি ১/১ মিনিট হবে', country: 'Bangladesh', value: 10, priceBdt: 1140, minutes: '৮০০ মিনিট', rateDescription: '১/১ পালস সুপার স্ট্রং ব্যান্ডউইথ লাইন' },
  { id: 'cc-14', brand: 'Jamalpur Express Dollar', pulseRate: 'ইউএসডি ১/১ মিনিট হবে', country: 'Bangladesh', value: 25, priceBdt: 2820, minutes: '২০০০ মিনিট', rateDescription: '১/১ পালস সুপার স্ট্রং ব্যান্ডউইথ লাইন' },
  { id: 'cc-15', brand: 'Jamalpur Express Dollar', pulseRate: 'ইউএসডি ১/১ মিনিট হবে', country: 'UAE', value: 15, priceBdt: 1750, minutes: '৬০০ মিনিট', rateDescription: 'দুবাই/শারজাহ ডায়ালার ভিআইপি লাইন' },
  { id: 'cc-16', brand: 'Jamalpur Express Dollar', pulseRate: 'ইউএসডি ১/১ মিনিট হবে', country: 'Qatar', value: 25, priceBdt: 2900, minutes: '১১০০ মিনিট', rateDescription: 'কাতার ও দোহা স্পেশাল নেটওয়ার্ক' }
];

export async function getCallingCardOffers() {
  return getCollection<any>("calling_card_offers", defaultCallingCardOffers);
}

export async function getAdminInfo() {
  try {
    const settings = await getDocById<any>("system_settings", "admin-settings");
    if (!settings) {
      await setDocById("system_settings", "admin-settings", defaultAdminInfo);
      return defaultAdminInfo;
    }
    return settings;
  } catch {
    return defaultAdminInfo;
  }
}

export async function updateAdminInfo(info: any) {
  await setDocById("system_settings", "admin-settings", { ...info, id: "admin-settings" });
}

export { serverTimestamp } from "firebase/firestore";
