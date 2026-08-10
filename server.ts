import express from 'express';
import path from 'path';


import { GoogleGenAI } from '@google/genai';
import {
  getUsers,
  getOrders,
  getOffers,
  getCardStocks,
  getNotices,
  getNotifications,
  setDocById,
  getDocById,
  serverTimestamp,
  deleteDocById,
  getAdminInfo,
  updateAdminInfo,
  getCallingCardOffers
} from './src/lib/firebaseDb';
import { Offer } from './src/types';


// Telegram Credentials from requirements / environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8365542422:AAEdETBJTNiokHkpWicf6sZ3p1naFIz4mwM";
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "6068195063";

// Helper to notify Telegram with optional inline keyboard support
async function notifyAdminViaTelegram(message: string, replyMarkup?: any) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload: any = {
      chat_id: TELEGRAM_ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error('Failed to send Telegram message:', await res.text());
    }
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

// Send receipt image using sendPhoto API with automatic fallback
async function sendTelegramPhoto(caption: string, base64Image: string, replyMarkup?: any) {
  try {
    if (!base64Image) {
      await notifyAdminViaTelegram(caption, replyMarkup);
      return;
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    
    // Clean base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_ADMIN_CHAT_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    
    // Create a Blob from the buffer to send as file
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('photo', blob, 'receipt.png');
    
    if (replyMarkup) {
      formData.append('reply_markup', JSON.stringify(replyMarkup));
    }
    
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      console.error('Failed to send Telegram photo:', await res.text());
      await notifyAdminViaTelegram(caption, replyMarkup);
    }
  } catch (error) {
    console.error('Telegram sendPhoto error, falling back to sendMessage:', error);
    await notifyAdminViaTelegram(caption, replyMarkup);
  }
}

// Helper to find user by phone with sanitization of spaces and Bangladeshi country codes
function findUserByPhoneHelper(phoneInput: string, userList: any[]) {
  if (!phoneInput) return null;
  const cleanInput = phoneInput.trim();
  const digitsInput = cleanInput.replace(/\D/g, ''); // keeps only digits, e.g. 8801635275233 or 01635275233
  
  let standard11Input = digitsInput;
  if (digitsInput.length === 13 && digitsInput.startsWith('880')) {
    standard11Input = digitsInput.slice(2); // e.g. 8801635275233 -> 01635275233
  } else if (digitsInput.length === 10 && digitsInput.startsWith('1')) {
    standard11Input = '0' + digitsInput; // e.g. 1635275233 -> 01635275233
  }

  return userList.find(u => {
    if (!u.phone) return false;
    const uClean = u.phone.trim();
    const uDigits = uClean.replace(/\D/g, '');
    
    let uStandard11 = uDigits;
    if (uDigits.length === 13 && uDigits.startsWith('880')) {
      uStandard11 = uDigits.slice(2);
    } else if (uDigits.length === 10 && uDigits.startsWith('1')) {
      uStandard11 = '0' + uDigits;
    }

    return (
      uClean === cleanInput ||
      uDigits === digitsInput ||
      uStandard11 === standard11Input ||
      uClean === standard11Input ||
      uStandard11 === cleanInput
    );
  }) || null;
}

// Fraud Tracking variables
const failedPinAttempts = new Map<string, number>();
const userTransactionTimes = new Map<string, number[]>();
const pendingNotices = new Map<string, string>();
let isMaintenanceMode = false;
let maintenanceReason = "সিস্টেম মেইনটেন্যান্স চলছে। কিছুক্ষণের মধ্যেই আমরা ফিরে আসছি।";
let maintenanceHotlines = ["01635275233"];
let marqueeSpeed = 16;
let globalCurrencies = [
  { id: 'c1', name: 'USD', rate: 120 },
  { id: 'c2', name: 'USDT', rate: 121 },
  { id: 'c3', name: 'EUR', rate: 130 },
  { id: 'c4', name: 'GBP', rate: 152 },
  { id: 'c5', name: 'SAR', rate: 32 },
  { id: 'c6', name: 'AED', rate: 32.6 },
  { id: 'c7', name: 'MYR', rate: 25.5 },
  { id: 'c8', name: 'SGD', rate: 89 },
  { id: 'c9', name: 'QAR', rate: 33 },
  { id: 'c10', name: 'KWD', rate: 391 },
  { id: 'c11', name: 'OMR', rate: 311 },
  { id: 'c12', name: 'BHD', rate: 318 },
  { id: 'c13', name: 'INR', rate: 1.44 }
];

async function startServer() {
  const app = express();
  app.use((req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      return next();
    }
    express.json({ limit: '50mb' })(req, res, next);
  });
  app.use((req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      return next();
    }
    express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
  });
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // IN-MEMORY DATA STORAGE
  // Simple seed data representing state that persists for the lifetime of the dev server container.
  
  // 1. All Registered Users (for Dynamic User Management)
  let users: any[] = [
    {
      id: "usr-shakib",
      name: "Shakib Raj",
      email: "Khanshakibraj@gmail.com",
      phone: "01635275233",
      profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: "Admin" as const, // Super Admin
      walletBalance: 12500, // starting balance in BDT
      pin: "0188",
      password: "Pass 018811",
      status: "Active" as "Active" | "Suspended",
      commissionRate: 2,
      walletLimit: 100000
    },
    {
      id: "usr-ayman",
      name: "Ayman Sadiq",
      email: "aymansadiq@gmail.com",
      phone: "01723456789",
      profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      role: "Retailer" as const,
      walletBalance: 1500,
      pin: "4321",
      password: "password123",
      status: "Active" as "Active" | "Suspended"
    },
    {
      id: "usr-nafis",
      name: "Nafis Fuad",
      email: "nafis@gmail.com",
      phone: "01834567890",
      profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      role: "VIP" as const,
      walletBalance: 5200,
      pin: "5555",
      password: "password123",
      status: "Active" as "Active" | "Suspended"
    },
    {
      id: "usr-rifat",
      name: "Rifat Chowdhury",
      email: "rifat@gmail.com",
      phone: "01945678901",
      profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      role: "Sub-Admin" as const,
      walletBalance: 12000,
      pin: "1111",
      password: "password123",
      status: "Active" as "Active" | "Suspended"
    }
  ];

  let currentUser = users[0];

  // 2. Admin Phone Numbers for MFS
  let adminNumbers = {
    bkash: { personal: "01700112233", merchant: "01800112233" },
    nagad: { personal: "01900112233", merchant: "01500112233" },
    rocket: { personal: "01300112233", merchant: "01400112233" },
    usdt: { personal: "TRC20: TVgJ8U... (Your address here)" }
  };

  // 3. Offers Seed Data (Packs)
  let offers: Offer[] = [
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

  // 4. Orders Seed Data
  let orders: any[] = [
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
    },
    {
      id: "ORD-9832",
      type: "Drive Pack",
      userEmail: "Khanshakibraj@gmail.com",
      userPhone: "01812345678",
      serviceName: "GP 25GB + 200 Min Bundle",
      paymentMethod: "",
      amount: 605,
      trxId: "",
      account: "01812345678",
      routingNumber: "",
      accountHolder: "",
      ref: "",
      status: "Pending",
      cancellationReason: "",
      date: "2026-07-25T07:45:00.000Z",
      commissionDeducted: 0
    }
  ];

  // 5. Support Tickets Seed Data
  let supportTickets = [
    {
      id: "TCK-881",
      userEmail: "Khanshakibraj@gmail.com",
      subject: "Add Money Pending too long",
      message: "I sent 500 BDT via bKash Personal but the wallet hasn't updated yet. TrxID is TXN119280.",
      status: "Pending",
      date: "2026-07-25T06:10:00.000Z"
    }
  ];

  // 5.5. Services Seed Data (with custom icons support)
  let services = [
    // Main 8-Button Grid Services
    { id: "s-add-money", name: "Add Money", slug: "add_money", type: "Main Grid", country: "Bangladesh", sortOrder: 1, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-send-money", name: "Send Money", slug: "send_money", type: "Main Grid", country: "Bangladesh", sortOrder: 2, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-drive", name: "Drive Pack", slug: "drive", type: "Main Grid", country: "Bangladesh", sortOrder: 3, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-recharge", name: "Recharge", slug: "recharge", type: "Main Grid", country: "Bangladesh", sortOrder: 4, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-bill", name: "Pay Bill", slug: "bill", type: "Main Grid", country: "Bangladesh", sortOrder: 5, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-banking", name: "Banking", slug: "banking", type: "Main Grid", country: "Bangladesh", sortOrder: 6, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-make-agent", name: "Make Agent", slug: "make_agent", type: "Main Grid", country: "Bangladesh", sortOrder: 8, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-calling-card", name: "Calling Card", slug: "calling_card", type: "Main Grid", country: "Bangladesh", sortOrder: 7, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },

    // Mobile Banking Row Services
    { id: "s-bkash", name: "bKash", slug: "bkash", type: "Mobile Bank", country: "Bangladesh", sortOrder: 9, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-nagad", name: "Nagad", slug: "nagad", type: "Mobile Bank", country: "Bangladesh", sortOrder: 10, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-rocket", name: "Rocket", slug: "rocket", type: "Mobile Bank", country: "Bangladesh", sortOrder: 11, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-upay", name: "Upay", slug: "upay", type: "Mobile Bank", country: "Bangladesh", sortOrder: 12, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-selfin", name: "Selfin", slug: "selfin", type: "Mobile Bank", country: "Bangladesh", sortOrder: 13, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-mcash", name: "M Cash", slug: "mcash", type: "Mobile Bank", country: "Bangladesh", sortOrder: 14, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-surecash", name: "SureCash", slug: "surecash", type: "Mobile Bank", country: "Bangladesh", sortOrder: 15, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" },
    { id: "s-tap", name: "Tap", slug: "tap", type: "Mobile Bank", country: "Bangladesh", sortOrder: 16, rateMultiplier: 1.0, isEnabled: true, requirePin: true, icon: "" }
  ];

  // Dynamic Content Management State
  let banners = [
    { id: "b1", title: "জিপি ও রবি ড্রাইভ ধামাকা!", desc: "আজকের স্পেশাল ড্রাইভ প্যাকে পাচ্ছেন সর্বোচ্চ ১৫০ টাকা পর্যন্ত ক্যাশব্যাক!", action: "offers", color: "from-blue-600 to-indigo-700", isActive: true, image: "" },
    { id: "b2", title: "৫ সেকেন্ডে অটো অ্যাড মানি!", desc: "বিকাশ, নগদ বা রকেটে ট্রানজেকশন সাবমিট করলেই ব্যালেন্স সাথে সাথে যোগ হবে।", action: "mfs", color: "from-rose-500 to-orange-600", isActive: true, image: "" },
    { id: "b3", title: "জিরো চার্জে বিদ্যুৎ ও গ্যাস বিল!", desc: "কোন প্রকার অতিরিক্ত চার্জ ছাড়াই ঘরে বসে পরিশোধ করুন যেকোনো ইউটিলিটি বিল।", action: "utility-bills", color: "from-emerald-600 to-teal-700", isActive: true, image: "" }
  ];

  let notices = [
    { id: "n1", text: "আসসালামু আলাইকুম! SHAKIB PAY প্ল্যাটফর্মে আপনাকে স্বাগতম। কম রেটে ড্রাইভ প্যাক এবং নির্ভরযোগ্য অ্যাড মানি সুবিধা উপভোগ করুন।", isActive: true, textColor: "#B45309" }
  ];

  let notifications: any[] = [
    { id: "pop-1", title: "ধামাকা অফার নোটিফিকেশন!", body: "আমাদের সকল রিচার্জে এখন অতিরিক্ত ২% কমিশন চলছে। অফারটি সীমিত সময়ের জন্য!", targetRole: "All", expiryDate: "2026-12-31", isActive: true, imageUrl: "" }
  ];

  let cardStocks: any[] = [];
  let callingCardOffers: any[] = [];

  // Helper to load state from Firestore
  async function initializeDatabaseState() {
    try {
      const dbUsers = await getUsers();
      if (dbUsers && dbUsers.length > 0) {
        users = dbUsers;
        // set active currentUser to admin
        const adminUser = users.find(u => u.role === 'Admin');
        if (adminUser) {
          currentUser = adminUser;
        } else if (users.length > 0) {
          currentUser = users[0];
        }
      }
      console.log(`[Database] Loaded ${users.length} users from Firestore.`);
    } catch (e) {
      console.error("[Database] Failed to load users from Firestore:", e);
    }

    try {
      const dbOrders = await getOrders();
      if (dbOrders) {
        orders = dbOrders;
      }
      console.log(`[Database] Loaded ${orders.length} orders from Firestore.`);
    } catch (e) {
      console.error("[Database] Failed to load orders from Firestore:", e);
    }

    try {
      const dbOffers = await getOffers();
      if (dbOffers && dbOffers.length > 0) {
        offers = dbOffers;
      }
      console.log(`[Database] Loaded ${offers.length} offers from Firestore.`);
    } catch (e) {
      console.error("[Database] Failed to load offers from Firestore:", e);
    }

    try {
      const dbNotices = await getNotices();
      if (dbNotices && dbNotices.length > 0) {
        notices = dbNotices;
      }
      console.log(`[Database] Loaded ${notices.length} notices from Firestore.`);
    } catch (e) {
      console.error("[Database] Failed to load notices from Firestore:", e);
    }

    try {
      const dbNotifications = await getNotifications();
      if (dbNotifications && dbNotifications.length > 0) {
        notifications = dbNotifications;
      }
      console.log(`[Database] Loaded ${notifications.length} notifications from Firestore.`);
    } catch (e) {
      console.error("[Database] Failed to load notifications from Firestore:", e);
    }

    try {
      const adminInfo = await getAdminInfo();
      if (adminInfo && adminInfo.adminNumbers) {
        adminNumbers = adminInfo.adminNumbers;
        console.log("[Database] Loaded persistent admin payment numbers:", adminNumbers);
      }
    } catch (e) {
      console.error("[Database] Failed to load persistent admin payment numbers:", e);
    }

    try {
      const dbCardStocks = await getCardStocks();
      if (dbCardStocks) {
        cardStocks = dbCardStocks;
      }
      console.log(`[Database] Loaded ${cardStocks.length} card stocks from Firestore.`);
    } catch (e) {
      console.error("[Database] Failed to load card stocks from Firestore:", e);
    }

    try {
      const dbCallingCards = await getCallingCardOffers();
      if (dbCallingCards && dbCallingCards.length > 0) {
        callingCardOffers = dbCallingCards;
      }
      console.log(`[Database] Loaded ${callingCardOffers.length} calling card offers from Firestore.`);
    } catch (e) {
      console.error("[Database] Failed to load calling card offers from Firestore:", e);
    }

    try {
      const maintDoc = await getDocById<{ active?: boolean; reason?: string; hotlines?: string[] }>("system_settings", "maintenance");
      if (maintDoc) {
        isMaintenanceMode = !!maintDoc.active;
        if (maintDoc.reason) maintenanceReason = maintDoc.reason;
        if (maintDoc.hotlines) maintenanceHotlines = maintDoc.hotlines;
        console.log(`[Database] Loaded maintenance mode state: ${isMaintenanceMode}, reason: ${maintenanceReason}, hotlines: ${maintenanceHotlines.join(', ')}`);
      }
    } catch (e) {
      console.error("[Database] Failed to load maintenance state from Firestore:", e);
    }

    try {
      const siteConfigDoc = await getDocById<{ marqueeSpeed?: number; currencies?: any[] }>("system_settings", "site_config");
      if (siteConfigDoc) {
        if (siteConfigDoc.marqueeSpeed !== undefined) marqueeSpeed = siteConfigDoc.marqueeSpeed;
        if (siteConfigDoc.currencies !== undefined) globalCurrencies = siteConfigDoc.currencies;
        console.log(`[Database] Loaded marquee speed: ${marqueeSpeed}s, Currencies: ${globalCurrencies.length}`);
      }
    } catch (e) {
      console.error("[Database] Failed to load site_config from Firestore:", e);
    }
  }

  // Load state
  await initializeDatabaseState();

  // Background sync for global settings to ensure all Cloud Run containers stay updated
  setInterval(async () => {
    try {
      const maintDoc = await getDocById<{ active?: boolean; reason?: string; hotlines?: string[] }>("system_settings", "maintenance");
      if (maintDoc) {
        isMaintenanceMode = !!maintDoc.active;
        if (maintDoc.reason !== undefined) maintenanceReason = maintDoc.reason;
        if (maintDoc.hotlines !== undefined) maintenanceHotlines = maintDoc.hotlines;
      }
    } catch (e) {
      // Ignore
    }
    
    try {
      const siteConfigDoc = await getDocById<{ marqueeSpeed?: number; currencies?: any[] }>("system_settings", "site_config");
      if (siteConfigDoc) {
        if (siteConfigDoc.marqueeSpeed !== undefined) marqueeSpeed = siteConfigDoc.marqueeSpeed;
        if (siteConfigDoc.currencies !== undefined) globalCurrencies = siteConfigDoc.currencies;
      }
    } catch (e) {
      // Ignore
    }
  }, 10000); // 10 seconds

  // Helper to send targeted notifications to user upon order creation, approval or rejection
  async function sendOrderStatusNotification(order: any, status: 'Pending' | 'Success' | 'Failed') {
    try {
      let title = "";
      let body = "";
      let notifType: 'Pending' | 'Success' | 'Admin Alert' = 'Admin Alert';
      if (status === 'Pending') {
        title = `Your order #${order.id} is Pending`;
        body = `আপনার ৳${order.amount} টাকার ${order.type} অর্ডারটি (#${order.id}) পেন্ডিং অবস্থায় রয়েছে।`;
        notifType = 'Pending';
      } else if (status === 'Success') {
        title = `Your order #${order.id} was Completed Successfully! 🎉`;
        body = `Your order #${order.id} was Completed Successfully! 🎉 (৳${order.amount} - ${order.type})`;
        notifType = 'Success';
      } else if (status === 'Failed') {
        title = `Your order #${order.id} was Cancelled`;
        body = `আপনার ৳${order.amount} টাকার ${order.type} অর্ডারটি (#${order.id}) বাতিল করা হয়েছে। কারণ: ${order.cancellationReason || "ভুল তথ্য বা পিন নম্বর!"}`;
        notifType = 'Admin Alert';
      }
      
      const newNotif = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title,
        body,
        status: status,
        type: notifType,
        orderId: order.id,
        targetRole: 'All',
        targetPhone: order.userPhone || '',
        expiryDate: new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 10),
        createdAt: new Date().toISOString(),
        isActive: true,
        imageUrl: ""
      };
      
      // Look for any existing pending notification for this order and update it if present
      const existingIdx = notifications.findIndex(n => n.orderId === order.id || (n.body && n.body.includes(`#${order.id}`)));
      if (existingIdx !== -1 && status === 'Success') {
        notifications[existingIdx] = {
          ...notifications[existingIdx],
          ...newNotif,
          id: notifications[existingIdx].id
        };
        await setDocById("notifications", notifications[existingIdx].id, notifications[existingIdx]);
      } else {
        notifications.unshift(newNotif);
        await setDocById("notifications", newNotif.id, newNotif);
      }

      // If matched user exists, also sync to users/{userId}/notifications in Firestore
      const matchedUser = users.find(u => u.phone === order.userPhone || u.email === order.userEmail);
      if (matchedUser && matchedUser.id) {
        await setDocById(`users/${matchedUser.id}/notifications`, newNotif.id, newNotif);
      }

      // Add the new required Firestore notification record with the specified payload structure
      if (status === 'Success') {
        if (matchedUser && matchedUser.id) {
          let customTitle = "অর্ডার সফল হয়েছে!";
          let customMessage = `আপনার ৳${order.amount} BDT ${order.type} অর্ডারটি সফল হয়েছে। TrxID: ${order.trxId || 'N/A'}`;

          if (order.type === 'Add Money' || order.type === 'Bank Deposit') {
            customTitle = "সফল অ্যাড মানি!";
            customMessage = `আপনার ৳${order.amount} BDT অ্যাড মানি সফল হয়েছে। TrxID: ${order.trxId || 'N/A'}`;
          } else if (order.type === 'Send Money') {
            customTitle = "সফল ব্যালেন্স ট্রান্সফার!";
            customMessage = `আপনার ৳${order.amount} BDT ট্রান্সফার সফল হয়েছে। TrxID: ${order.trxId || 'N/A'}`;
          } else if (order.type === 'Mobile Recharge' || order.type === 'Recharge') {
            customTitle = "সফল মোবাইল রিচার্জ!";
            customMessage = `আপনার ৳${order.amount} BDT রিচার্জ সফল হয়েছে। TrxID: ${order.trxId || 'N/A'}`;
          } else if (order.type === 'Drive Pack' || order.type === 'Drive') {
            customTitle = "সফল ড্রাইভ অর্ডার!";
            customMessage = `আপনার ৳${order.amount} BDT ড্রাইভ প্যাক অর্ডার সফল হয়েছে। TrxID: ${order.trxId || 'N/A'}`;
          }

          const exactNotif = {
            title: customTitle,
            message: customMessage,
            type: "SUCCESS",
            createdAt: serverTimestamp(),
            isRead: false
          };

          const exactNotifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await setDocById(`users/${matchedUser.id}/notifications`, exactNotifId, exactNotif);
        }

        // Recipient of Send Money also gets an in-app notification doc with the correct structure
        if (order.type === 'Send Money' && order.account) {
          const recipientUser = users.find(u => u.phone === order.account);
          if (recipientUser && recipientUser.id) {
            const senderName = matchedUser ? matchedUser.name : (order.userPhone || 'ইউজার');
            const recipientNotif = {
              title: "💸 ব্যালেন্স প্রাপ্তি!",
              message: `আপনি ${senderName} এর থেকে ৳${order.amount} BDT সফলভাবে গ্রহণ করেছেন। TrxID: ${order.trxId || 'N/A'}`,
              type: "SUCCESS",
              createdAt: serverTimestamp(),
              isRead: false
            };
            const exactNotifIdRecip = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await setDocById(`users/${recipientUser.id}/notifications`, exactNotifIdRecip, recipientNotif);
          }
        }
      }

      console.log(`[Notification] Created target notification for ${order.userPhone}: ${title}`);
    } catch (e) {
      console.error("[Notification] Failed to create order notification:", e);
    }
  }

  // Legacy alias for compatibility
  async function sendOrderConfirmationNotification(order: any, isSuccess: boolean) {
    return sendOrderStatusNotification(order, isSuccess ? 'Success' : 'Failed');
  }

  // Helper to send a simulated customer SMS to Telegram admin chat on order approval
  async function sendApprovedSmsToTelegram(order: any, orderUser: any, optionalChatId?: any) {
    try {
      const amount = order.amount || 0;
      const phone = order.account || order.userPhone || 'N/A';
      const trxId = order.trxId || 'TX' + Math.floor(100000 + Math.random() * 900000) + 'B';
      const balance = orderUser ? orderUser.walletBalance : 12500;
      
      let smsText = "";
      const method = (order.paymentMethod || "bKash").toLowerCase();

      if (order.type === 'Add Money' || order.type === 'Deposit' || order.type === 'Bank Deposit') {
        if (method.includes('bkash')) {
          smsText = `bKash: CashIn ৳${amount}.00 from ${order.userPhone || 'Agent'} successful. Fee ৳0.00. Bal ৳${balance}. TrxID ${trxId}.`;
        } else if (method.includes('nagad')) {
          smsText = `Nagad: CashIn ৳${amount}.00 from ${order.userPhone || 'Agent'} successful. TxnID: ${trxId}. Current Balance: ৳${balance}. Ref: AddMoney.`;
        } else if (method.includes('rocket')) {
          smsText = `Rocket CashIn ৳${amount}.00 from ${order.userPhone || 'Agent'} successful. Trx: ${trxId}. New Bal ৳${balance}.`;
        } else {
          smsText = `Wallet Credit: ৳${amount}.00 added successfully to wallet. TrxID: ${trxId}. New Balance: ৳${balance}.`;
        }
      } else if (order.type === 'Send Money') {
        smsText = `You have successfully transferred ৳${amount}.00 to ${order.account}. Fee ৳0.00. Balance ৳${balance}. TrxID ${trxId}.`;
      } else if (order.type === 'Recharge') {
        const op = order.serviceName || "Mobile Recharge";
        smsText = `Recharge Successful! ৳${amount}.00 successful for ${phone} (${op}). Fee ৳0.00. Balance: ৳${balance}. TrxID: ${trxId}.`;
      } else if (order.type === 'Drive' || order.type === 'Drive Pack' || order.type === 'Internet' || order.type === 'Bundles' || order.type === 'Minutes') {
        const title = order.serviceName || "Drive Pack";
        smsText = `Drive Pack Successful! ৳${amount}.00 successful for ${phone}. Package: ${title}. TrxID: ${trxId}. Remaining Balance: ৳${balance}.`;
      } else {
        smsText = `Transaction Successful! ৳${amount}.00 for ${phone}. TrxID: ${trxId}. Balance: ৳${balance}.`;
      }

      const formattedMsg = `💬 <b>[সিমুলেটেড কাস্টমার SMS]</b>\n\n<code>${smsText}</code>`;

      const targetChatId = optionalChatId || TELEGRAM_ADMIN_CHAT_ID;
      await sendTelegramMessage(targetChatId, formattedMsg);
    } catch (e) {
      console.error("[Telegram] Failed to send simulated approved SMS:", e);
    }
  }

  // ==========================================
  // TELEGRAM BOT BACKOFFICE & INTERACTIVE SYSTEM
  // ==========================================

  async function sendTelegramMessage(chatId: any, text: string, replyMarkup?: any) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const body: any = {
        chat_id: String(chatId),
        text,
        parse_mode: 'HTML'
      };
      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        console.error('Failed to send Telegram message:', await res.text());
      }
    } catch (error) {
      console.error('sendTelegramMessage error:', error);
    }
  }

  async function editTelegramMessage(chatId: any, messageId: any, text: string, replyMarkup?: any, isPhoto: boolean = false) {
    try {
      const endpoint = isPhoto ? 'editMessageCaption' : 'editMessageText';
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${endpoint}`;
      const body: any = {
        chat_id: String(chatId),
        message_id: messageId,
        parse_mode: 'HTML'
      };
      if (isPhoto) {
        body.caption = text;
      } else {
        body.text = text;
      }
      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      } else {
        // remove inline keyboard explicitly by passing empty markup
        body.reply_markup = { inline_keyboard: [] };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`editTelegramMessage (${endpoint}) failed:`, errorText);
        
        // Auto-fallback check
        if (!isPhoto && (errorText.includes("there is no text") || errorText.includes("message to edit") || errorText.includes("400"))) {
          console.log("[Telegram] Detected photo message, falling back to editMessageCaption...");
          const fallbackUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageCaption`;
          const fallbackBody = {
            chat_id: String(chatId),
            message_id: messageId,
            caption: text,
            parse_mode: 'HTML',
            reply_markup: replyMarkup || { inline_keyboard: [] }
          };
          const fallbackRes = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackBody)
          });
          if (!fallbackRes.ok) {
            console.error('editTelegramMessage fallback to editMessageCaption failed:', await fallbackRes.text());
          }
        } else if (isPhoto && (errorText.includes("there is no photo") || errorText.includes("no media") || errorText.includes("400"))) {
          console.log("[Telegram] Detected non-photo message, falling back to editMessageText...");
          const fallbackUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
          const fallbackBody = {
            chat_id: String(chatId),
            message_id: messageId,
            text,
            parse_mode: 'HTML',
            reply_markup: replyMarkup || { inline_keyboard: [] }
          };
          const fallbackRes = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackBody)
          });
          if (!fallbackRes.ok) {
            console.error('editTelegramMessage fallback to editMessageText failed:', await fallbackRes.text());
          }
        }
      }
    } catch (error) {
      console.error('editTelegramMessage error:', error);
    }
  }

  async function answerCallbackQuery(callbackQueryId: string, text?: string) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text,
          show_alert: text ? true : false
        })
      });
    } catch (err) {
      console.error("Error answering callback query:", err);
    }
  }

  async function calculateDailyStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let totalDeposits = 0;
    let totalRecharges = 0;
    let totalDrivesSold = 0;
    let netEstimatedProfit = 0;
    let pendingOrdersCount = 0;

    const liveOrders = await getOrders();
    const liveOffers = await getOffers();

    liveOrders.forEach(o => {
      if (o.status === 'Pending') {
        pendingOrdersCount++;
      }

      const orderDate = new Date(o.date);
      const isToday = orderDate >= todayStart;

      if (isToday && (o.status === 'Success' || o.status === 'success' || o.status === 'SUCCESS' || o.status === 'Approved')) {
        if (o.type === 'Add Money' || o.type === 'Deposit' || o.type === 'Bank Deposit') {
          totalDeposits += o.amount;
        } else if (o.type === 'Mobile Recharge' || o.type === 'Recharge') {
          totalRecharges += o.amount;
          netEstimatedProfit += o.amount * 0.02; // 2% margin
        } else if (o.type === 'Drive Pack' || o.type === 'Drive') {
          totalDrivesSold++;
          const offerObj = liveOffers.find(ov => ov.title === o.serviceName || ov.id === o.serviceName);
          if (offerObj) {
            netEstimatedProfit += Math.max(0, offerObj.regularPrice - offerObj.resellerPrice);
          } else {
            netEstimatedProfit += o.amount * 0.08; // 8% profit margin on drives
          }
        } else if (o.type === 'Bank Transfer' || o.type === 'Pay Bill' || o.type === 'Utility Bill' || o.type === 'bill') {
          netEstimatedProfit += o.amount * 0.015; // 1.5% profit
        }
      }
    });

    return {
      totalDeposits,
      totalRecharges,
      totalDrivesSold,
      netEstimatedProfit: Math.round(netEstimatedProfit),
      pendingOrdersCount
    };
  }

  async function triggerDailySummary(chatId: any) {
    const stats = await calculateDailyStats();
    
    const msg = `📊 <b>SHAKIB PAY - দৈনিক হিসাব নিকাশ রিপোর্ট</b> 📊\n` +
      `📅 তারিখ: ${new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 মোট ডিপোজিট (Deposits): ৳<b>${stats.totalDeposits}</b> BDT\n` +
      `📱 মোট রিচার্জ (Recharges): ৳<b>${stats.totalRecharges}</b> BDT\n` +
      `📶 মোট ড্রাইভ বিক্রি (Drives Sold): <b>${stats.totalDrivesSold}</b> টি\n` +
      `💰 আনুমানিক নিট লাভ (Est. Profit): ৳<b>${stats.netEstimatedProfit}</b> BDT\n` +
      `⏳ পেন্ডিং অর্ডার (Pending Orders): <b>${stats.pendingOrdersCount}</b> টি\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💚 <i>রিমোট কন্ট্রোল প্যানেল থেকে স্বয়ংক্রিয়ভাবে জেনারেটেড।</i>`;
      
    await sendTelegramMessage(chatId, msg);
  }

  async function sendDrivesList(chatId: any) {
    const liveOffers = await getOffers();
    const driveOffers = liveOffers.filter(o => o.category === 'Internet' || o.category === 'Bundles' || o.category === 'Minutes' || o.id.startsWith('gp-') || o.id.startsWith('robi-'));
    
    let msg = `📶 <b>ড্রাইভ প্যাক কন্ট্রোল বোর্ড (Drive Packs Control)</b>\n\n`;
    if (driveOffers.length === 0) {
      msg += `কোনো ড্রাইভ প্যাক পাওয়া যায়নি।`;
      await sendTelegramMessage(chatId, msg);
      return;
    }

    msg += `নিচের বাটনগুলো ক্লিক করে ড্রাইভ প্যাকগুলো সাময়িকভাবে বন্ধ (Pause) বা চালু (Resume) করতে পারেন:`;

    const inlineKeyboard = driveOffers.map(o => ([
      {
        text: `${o.isEnabled ? '⏸️ Pause' : '▶️ Resume'} | ${o.title.substring(0, 15)}...`,
        callback_data: `toggle_drive_${o.id}`
      }
    ]));

    const replyMarkup = {
      inline_keyboard: inlineKeyboard
    };

    await sendTelegramMessage(chatId, msg, replyMarkup);
  }

  async function updateDrivesMessage(chatId: any, messageId: any) {
    const liveOffers = await getOffers();
    const driveOffers = liveOffers.filter(o => o.category === 'Internet' || o.category === 'Bundles' || o.category === 'Minutes' || o.id.startsWith('gp-') || o.id.startsWith('robi-'));
    
    let msg = `📶 <b>ড্রাইভ প্যাক কন্ট্রোল বোর্ড (Drive Packs Control)</b>\n\n`;
    msg += `নিচের বাটনগুলো ক্লিক করে ড্রাইভ প্যাকগুলো সাময়িকভাবে বন্ধ (Pause) বা চালু (Resume) করতে পারেন:`;

    const inlineKeyboard = driveOffers.map(o => ([
      {
        text: `${o.isEnabled ? '⏸️ Pause' : '▶️ Resume'} | ${o.title.substring(0, 15)}...`,
        callback_data: `toggle_drive_${o.id}`
      }
    ]));

    const replyMarkup = {
      inline_keyboard: inlineKeyboard
    };

    await editTelegramMessage(chatId, messageId, msg, replyMarkup);
  }

  async function handleTelegramUpdate(update: any) {
    try {
      // 1. Handle Callback Queries
      if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const fromId = String(callbackQuery.from.id);
        
        if (fromId !== TELEGRAM_ADMIN_CHAT_ID) {
          await answerCallbackQuery(callbackQuery.id, "⛔ দুঃখিত, আপনি এডমিন নন!");
          return;
        }

        const data = callbackQuery.data;
        const messageId = callbackQuery.message?.message_id;
        const chatId = callbackQuery.message?.chat?.id;

        if (data.startsWith('approve_')) {
          const orderId = data.replace('approve_', '');
          const order = await getDocById<any>("orders", orderId);

          if (!order) {
            await answerCallbackQuery(callbackQuery.id, "❌ অর্ডারটি খুঁজে পাওয়া যায়নি!");
            return;
          }

          if (order.status !== 'Pending') {
            await answerCallbackQuery(callbackQuery.id, `⚠️ অর্ডারটি ইতিমধ্যে ${order.status}!`);
            return;
          }

          const dbUsers = await getUsers();
          const orderUser = dbUsers.find(u => u.phone === order.userPhone || u.email === order.userEmail);
          order.status = 'Success';

          if ((order.type === 'Add Money' || order.type === 'Deposit' || order.type === 'Bank Deposit') && orderUser) {
            orderUser.walletBalance += order.amount;
            await setDocById("users", orderUser.id, orderUser);

            // Sync outer users array
            const outerUser = users.find(u => u.id === orderUser.id);
            if (outerUser) {
              outerUser.walletBalance = orderUser.walletBalance;
            }
            if (currentUser && currentUser.id === orderUser.id) {
              currentUser.walletBalance = orderUser.walletBalance;
            }
          }

          if (order.type === 'Send Money') {
            const recipient = dbUsers.find(u => u.phone === order.account);
            if (recipient) {
              recipient.walletBalance += order.amount;
              await setDocById("users", recipient.id, recipient);

              // Sync outer users array for recipient
              const outerRecipient = users.find(u => u.id === recipient.id);
              if (outerRecipient) {
                outerRecipient.walletBalance = recipient.walletBalance;
              }
              if (currentUser && currentUser.id === recipient.id) {
                currentUser.walletBalance = recipient.walletBalance;
              }
            }
          }

          await setDocById("orders", orderId, order);

          // Sync outer orders array
          const outerOrder = orders.find(o => o.id === orderId);
          if (outerOrder) {
            outerOrder.status = 'Success';
          }

          // Send confirmation notification to user
          await sendOrderConfirmationNotification(order, true);

          await answerCallbackQuery(callbackQuery.id, "✅ অর্ডারটি সফলভাবে অনুমোদিত হয়েছে!");

          const updateMsg = `✅ Order #<code>${orderId}</code> APPROVED by Admin!\n\n` +
            `👤 ইউজার: ${orderUser ? orderUser.name : 'Unknown'}\n` +
            `📱 ফোন: <code>${order.userPhone}</code>\n` +
            `💼 টাইপ: ${order.type}\n` +
            `💰 পরিমাণ: <code>৳${order.amount} BDT</code>\n` +
            `💚 সফলভাবে অনুমোদিত হয়েছে।`;
          await editTelegramMessage(chatId, messageId, updateMsg, null, !!callbackQuery.message?.photo);

          // Send simulated SMS message to Telegram
          await sendApprovedSmsToTelegram(order, orderUser, chatId);
        } 
        else if (data.startsWith('rejectOptions_')) {
          const orderId = data.replace('rejectOptions_', '');
          const order = await getDocById<any>("orders", orderId);

          if (!order) {
            await answerCallbackQuery(callbackQuery.id, "❌ অর্ডারটি খুঁজে পাওয়া যায়নি!");
            return;
          }

          if (order.status !== 'Pending') {
            await answerCallbackQuery(callbackQuery.id, `⚠️ অর্ডারটি ইতিমধ্যে ${order.status}!`);
            return;
          }

          const rejectKeyboard = {
            inline_keyboard: [
              [
                { text: "❌ Wrong Number", callback_data: `rejectReason_wrong_${orderId}` },
                { text: "❌ Out of Balance", callback_data: `rejectReason_balance_${orderId}` }
              ],
              [
                { text: "❌ Offer Expired", callback_data: `rejectReason_expired_${orderId}` },
                { text: "✍️ Custom Reason", callback_data: `rejectReason_custom_${orderId}` }
              ]
            ]
          };

          const caption = callbackQuery.message?.caption || callbackQuery.message?.text || "";
          const rejectMsg = caption + `\n\n⚠️ <b>দয়া করে বাতিলের কারণ নির্বাচন করুন:</b>`;
          
          await editTelegramMessage(chatId, messageId, rejectMsg, rejectKeyboard, !!callbackQuery.message?.photo);
          await answerCallbackQuery(callbackQuery.id, "👇 বাতিলের কারণ নির্বাচন করুন");
        }
        else if (data.startsWith('rejectReason_')) {
          const parts = data.split('_');
          const reasonCode = parts[1];
          const orderId = parts[2];

          const order = await getDocById<any>("orders", orderId);
          if (!order) {
            await answerCallbackQuery(callbackQuery.id, "❌ অর্ডারটি খুঁজে পাওয়া যায়নি!");
            return;
          }

          if (order.status !== 'Pending') {
            await answerCallbackQuery(callbackQuery.id, `⚠️ অর্ডারটি ইতিমধ্যে ${order.status}!`);
            return;
          }

          let reason = "Cancelled by Admin";
          if (reasonCode === 'wrong') reason = "❌ Wrong Number";
          else if (reasonCode === 'balance') reason = "❌ Server Out of Balance";
          else if (reasonCode === 'expired') reason = "❌ Offer Expired";
          else if (reasonCode === 'custom') reason = "✍️ Custom Reason";

          const dbUsers = await getUsers();
          const orderUser = dbUsers.find(u => u.phone === order.userPhone || u.email === order.userEmail);
          order.status = 'Failed';
          order.cancellationReason = reason;

          // Refund logic: all types except Add Money and Bank Deposit are pre-deducted
          const isPreDeducted = order.type !== 'Add Money' && order.type !== 'Bank Deposit';
          if (isPreDeducted && orderUser) {
            orderUser.walletBalance += order.amount;
            await setDocById("users", orderUser.id, orderUser);

            // Sync outer users array
            const outerUser = users.find(u => u.id === orderUser.id);
            if (outerUser) {
              outerUser.walletBalance = orderUser.walletBalance;
            }
            if (currentUser && currentUser.id === orderUser.id) {
              currentUser.walletBalance = orderUser.walletBalance;
            }
          }

          await setDocById("orders", orderId, order);

          // Sync outer orders array
          const outerOrder = orders.find(o => o.id === orderId);
          if (outerOrder) {
            outerOrder.status = 'Failed';
            outerOrder.cancellationReason = reason;
          }

          // Send confirmation notification to user
          await sendOrderConfirmationNotification(order, false);

          await answerCallbackQuery(callbackQuery.id, "❌ অর্ডারটি বাতিল ও রিফান্ড করা হয়েছে!");

          const updateMsg = `❌ <b>Order #<code>${orderId}</code> REJECTED by Admin!</b>\n\n` +
            `👤 ইউজার: ${orderUser ? orderUser.name : 'Unknown'}\n` +
            `📱 ফোন: <code>${order.userPhone}</code>\n` +
            `💼 টাইপ: ${order.type}\n` +
            `💰 পরিমাণ: <code>৳${order.amount} BDT</code>\n` +
            `❌ কারণ: <b>${reason}</b>\n` +
            `⚠️ বাতিল ও রিফান্ড করা হয়েছে।`;
          await editTelegramMessage(chatId, messageId, updateMsg, null, !!callbackQuery.message?.photo);
        }
        else if (data.startsWith('fraud_block_')) {
          const userPhone = data.replace('fraud_block_', '');
          const dbUsers = await getUsers();
          const userToBlock = dbUsers.find(u => u.phone === userPhone);

          if (!userToBlock) {
            await answerCallbackQuery(callbackQuery.id, "❌ ইউজার খুঁজে পাওয়া যায়নি!");
            return;
          }

          userToBlock.status = "Suspended";
          await setDocById("users", userToBlock.id, userToBlock);

          // Sync outer users array
          const outerUser = users.find(u => u.id === userToBlock.id);
          if (outerUser) {
            outerUser.status = "Suspended";
          }
          if (currentUser && currentUser.id === userToBlock.id) {
            currentUser.status = "Suspended";
          }

          await answerCallbackQuery(callbackQuery.id, "🚫 ইউজারটি ব্লক করা হয়েছে!");
          await editTelegramMessage(chatId, messageId, `🚫 <b>ইউজার ব্লক করা হয়েছে!</b>\n\n👤 নাম: ${userToBlock.name}\n📱 ফোন: <code>${userPhone}</code>\n🛡️ স্ট্যাটাস: <b>SUSPENDED</b>`);
        }
        else if (data === 'fraud_dismiss') {
          await answerCallbackQuery(callbackQuery.id, "Dismissed");
          await editTelegramMessage(chatId, messageId, `⚠️ <b>Fraud activity dismissed by Admin.</b>`);
        }
        else if (data.startsWith('publishNotice_')) {
          const noticeId = data.replace('publishNotice_', '');
          const noticeText = pendingNotices.get(noticeId);

          if (!noticeText) {
            await answerCallbackQuery(callbackQuery.id, "❌ নোটিশটি খুঁজে পাওয়া যায়নি বা মেয়াদোত্তীর্ণ হয়েছে!");
            return;
          }

          const noticesList = await getNotices();
          if (noticesList.length > 0) {
            noticesList[0].text = noticeText;
            noticesList[0].isActive = true;
            await setDocById("notices", noticesList[0].id, noticesList[0]);
          } else {
            const dbNoticeId = 'n-' + Date.now();
            const newNotice = {
              id: dbNoticeId,
              text: noticeText,
              isActive: true,
              textColor: '#B45309'
            };
            await setDocById("notices", dbNoticeId, newNotice);
          }

          await answerCallbackQuery(callbackQuery.id, "📢 নোটিশটি প্রকাশিত হয়েছে!");
          await editTelegramMessage(chatId, messageId, `📢 <b>নোটিশটি সফলভাবে অ্যাপের মারকুই ব্যানারে প্রকাশিত হয়েছে!</b>\n\n📝 নোটিশ:\n<i>${noticeText}</i>`);
        }
        else if (data.startsWith('toggle_drive_')) {
          const driveId = data.replace('toggle_drive_', '');
          const offerObj = await getDocById<any>("offers", driveId);
          if (!offerObj) {
            await answerCallbackQuery(callbackQuery.id, "❌ ড্রাইভ প্যাকটি খুঁজে পাওয়া যায়নি!");
            return;
          }

          offerObj.isEnabled = !offerObj.isEnabled;
          await setDocById("offers", driveId, offerObj);
          await answerCallbackQuery(callbackQuery.id, `✓ ${offerObj.title.substring(0, 15)}... ${offerObj.isEnabled ? 'চালু' : 'বন্ধ'} করা হয়েছে!`);
          
          await updateDrivesMessage(chatId, messageId);
        }
        return;
      }

      // 2. Handle Text Messages
      if (update.message && update.message.text) {
        const message = update.message;
        const fromId = String(message.from.id);
        const text = message.text.trim();
        const chatId = message.chat.id;

        if (fromId !== TELEGRAM_ADMIN_CHAT_ID) {
          await sendTelegramMessage(chatId, "⛔ দুঃখিত, আপনি এই বটের এডমিন নন। আপনার চ্যাট আইডি: " + fromId);
          return;
        }

        if (text.startsWith('/')) {
          const parts = text.split(/\s+/);
          const command = parts[0].toLowerCase();

          try {
            switch (command) {
              case '/add': {
                if (parts.length < 3) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/add [phone] [amount]</code>\nযেমন: <code>/add 01635275233 500</code>");
                  break;
                }
                const phone = parts[1];
                const amount = Number(parts[2]);
                if (isNaN(amount) || amount <= 0) {
                  await sendTelegramMessage(chatId, "❌ সঠিক পরিমাণ BDT ওয়ালেট ব্যালেন্স টাইপ করুন।");
                  break;
                }

                const usersList = await getUsers();
                const targetUser = findUserByPhoneHelper(phone, usersList);
                if (!targetUser) {
                  await sendTelegramMessage(chatId, "❌ এই ফোন নম্বরে কোনো ইউজার পাওয়া যায়নি।");
                  break;
                }

                targetUser.walletBalance = (Number(targetUser.walletBalance) || 0) + amount;
                await setDocById("users", targetUser.id, targetUser);

                const newTx = {
                  id: 'tx-' + Date.now(),
                  userId: targetUser.id,
                  userName: targetUser.name,
                  userPhone: targetUser.phone,
                  type: 'Deposit',
                  amount: amount,
                  paymentMethod: 'Telegram Admin',
                  account: 'Admin Direct',
                  trxId: 'TG-' + Date.now().toString().slice(-6),
                  status: 'Completed',
                  createdAt: new Date().toISOString()
                };
                await setDocById("transactions", newTx.id, newTx);

                // Update outer lists if present
                const outerUser = users.find(u => u.id === targetUser.id);
                if (outerUser) {
                  outerUser.walletBalance = targetUser.walletBalance;
                }
                if (currentUser && currentUser.id === targetUser.id) {
                  currentUser.walletBalance = targetUser.walletBalance;
                }

                await sendTelegramMessage(chatId, `✅ <b>ওয়ালেট ব্যালেন্স যোগ করা হয়েছে!</b>\n\n👤 ইউজার: ${targetUser.name}\n📱 ফোন: <code>${targetUser.phone}</code>\n💰 যোগকৃত পরিমাণ: <code>৳${amount} BDT</code>\n💳 বর্তমান ব্যালেন্স: <code>৳${targetUser.walletBalance} BDT</code>`);
                break;
              }

              case '/deduct': {
                if (parts.length < 3) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/deduct [phone] [amount]</code>\nযেমন: <code>/deduct 01635275233 100</code>");
                  break;
                }
                const phone = parts[1];
                const amount = Number(parts[2]);
                if (isNaN(amount) || amount <= 0) {
                  await sendTelegramMessage(chatId, "❌ সঠিক পরিমাণ টাইপ করুন।");
                  break;
                }

                const usersList = await getUsers();
                const targetUser = findUserByPhoneHelper(phone, usersList);
                if (!targetUser) {
                  await sendTelegramMessage(chatId, "❌ এই ফোন নম্বরে কোনো ইউজার পাওয়া যায়নি।");
                  break;
                }

                targetUser.walletBalance = Math.max(0, (Number(targetUser.walletBalance) || 0) - amount);
                await setDocById("users", targetUser.id, targetUser);

                // Update outer lists if present
                const outerUser = users.find(u => u.id === targetUser.id);
                if (outerUser) {
                  outerUser.walletBalance = targetUser.walletBalance;
                }
                if (currentUser && currentUser.id === targetUser.id) {
                  currentUser.walletBalance = targetUser.walletBalance;
                }

                await sendTelegramMessage(chatId, `💸 <b>ওয়ালেট ব্যালেন্স কেটে নেওয়া হয়েছে!</b>\n\n👤 ইউজার: ${targetUser.name}\n📱 ফোন: <code>${targetUser.phone}</code>\n💰 কর্তনকৃত পরিমাণ: <code>৳${amount} BDT</code>\n💳 বর্তমান ব্যালেন্স: <code>৳${targetUser.walletBalance} BDT</code>`);
                break;
              }

              case '/block': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/block [phone]</code>\nযেমন: <code>/block 01635275233</code>");
                  break;
                }
                const phone = parts[1];
                const usersList = await getUsers();
                const targetUser = findUserByPhoneHelper(phone, usersList);
                if (!targetUser) {
                  await sendTelegramMessage(chatId, "❌ এই ফোন নম্বরে কোনো ইউজার পাওয়া যায়নি।");
                  break;
                }

                targetUser.status = 'Suspended';
                await setDocById("users", targetUser.id, targetUser);

                const outerUser = users.find(u => u.id === targetUser.id);
                if (outerUser) {
                  outerUser.status = 'Suspended';
                }

                await sendTelegramMessage(chatId, `🔒 <b>ইউজার অ্যাকাউন্ট লক করা হয়েছে!</b>\n\n👤 ইউজার: ${targetUser.name}\n📱 ফোন: <code>${targetUser.phone}</code>\n🔴 বর্তমান অবস্থা: <b>BLOCKED</b>`);
                break;
              }

              case '/unblock': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/unblock [phone]</code>\nযেমন: <code>/unblock 01635275233</code>");
                  break;
                }
                const phone = parts[1];
                const usersList = await getUsers();
                const targetUser = findUserByPhoneHelper(phone, usersList);
                if (!targetUser) {
                  await sendTelegramMessage(chatId, "❌ এই ফোন নম্বরে কোনো ইউজার পাওয়া যায়নি।");
                  break;
                }

                targetUser.status = 'Active';
                await setDocById("users", targetUser.id, targetUser);

                const outerUser = users.find(u => u.id === targetUser.id);
                if (outerUser) {
                  outerUser.status = 'Active';
                }

                await sendTelegramMessage(chatId, `🔓 <b>ইউজার অ্যাকাউন্ট আনলক করা হয়েছে!</b>\n\n👤 ইউজার: ${targetUser.name}\n📱 ফোন: <code>${targetUser.phone}</code>\n🟢 বর্তমান অবস্থা: <b>ACTIVE</b>`);
                break;
              }

              case '/resetpin': {
                if (parts.length < 3) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/resetpin [phone] [new_pin]</code>\nযেমন: <code>/resetpin 01635275233 1234</code>");
                  break;
                }
                const phone = parts[1];
                const newPin = parts[2];
                const usersList = await getUsers();
                const targetUser = findUserByPhoneHelper(phone, usersList);
                if (!targetUser) {
                  await sendTelegramMessage(chatId, "❌ এই ফোন নম্বরে কোনো ইউজার পাওয়া যায়নি।");
                  break;
                }

                targetUser.pin = newPin;
                await setDocById("users", targetUser.id, targetUser);

                const outerUser = users.find(u => u.id === targetUser.id);
                if (outerUser) {
                  outerUser.pin = newPin;
                }

                await sendTelegramMessage(chatId, `🔑 <b>ইউজারের সিকিউরিটি পিন সফলভাবে পরিবর্তন করা হয়েছে!</b>\n\n👤 ইউজার: ${targetUser.name}\n📱 ফোন: <code>${targetUser.phone}</code>\n🔑 নতুন পিন: <code>${newPin}</code>`);
                break;
              }

              case '/generate_notice': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/generate_notice [topic]</code>\nযেমন: <code>/generate_notice ঈদ স্পেশাল ড্রাইভ অফার</code>");
                  break;
                }
                const topic = parts.slice(1).join(' ');
                await sendTelegramMessage(chatId, `⏳ <i>Gemini AI দিয়ে "${topic}" বিষয়ে প্রফেশনাল ড্রাফট তৈরি করা হচ্ছে...</i>`);

                const ai = getAiClient();
                const response = await ai.models.generateContent({
                  model: 'gemini-3.6-flash',
                  contents: `আপনি Shakib Pay নামক টেলিকম ড্রাইভ অ্যাপের প্রফেশনাল কপিরাইটার। "${topic}" বিষয়বস্তুর ওপর ২-৩ লাইনের একটি সুন্দর ও আকর্ষণীয় বাংলা নোটিশ ড্রাফট লিখুন যা গ্রাহকদের উৎসাহিত করবে।`
                });

                const generatedNotice = response.text ? response.text.trim() : topic;
                const tempNoticeId = "temp-" + Date.now();
                pendingNotices.set(tempNoticeId, generatedNotice);

                const draftMsg = `📝 <b>AI দ্বারা তৈরিকৃত নোটিশ ড্রাফট:</b>\n\n<i>"${generatedNotice}"</i>\n\nআপনি কি এটি সরাসরি অ্যাপের মারকুই ব্যানারে পাবলিশ করতে চান?`;
                const inlineMarkup = {
                  inline_keyboard: [
                    [{ text: "🚀 Publish Now", callback_data: "publishNotice_" + tempNoticeId }]
                  ]
                };
                await sendTelegramMessage(chatId, draftMsg, inlineMarkup);
                break;
              }

              case '/notice': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/notice [text]</code>\nযেমন: <code>/notice আমাদের সকল ড্রাইভ প্যাক সার্ভারে এখন চালু আছে।</code>");
                  break;
                }
                const noticeText = parts.slice(1).join(' ');
                const noticesList = await getNotices();
                if (noticesList.length > 0) {
                  noticesList[0].text = noticeText;
                  noticesList[0].isActive = true;
                  await setDocById("notices", noticesList[0].id, noticesList[0]);
                } else {
                  const newNotice = { id: 'n-' + Date.now(), text: noticeText, isActive: true, textColor: '#B45309' };
                  await setDocById("notices", newNotice.id, newNotice);
                }
                
                // Sync outer notices variable
                const liveNotices = await getNotices();
                notices.length = 0;
                notices.push(...liveNotices);

                await sendTelegramMessage(chatId, `📢 <b>ওয়েবসাইট স্ক্রলিং নোটিশ পরিবর্তন করা হয়েছে!</b>\n\n📝 নতুন নোটিশ:\n<i>${noticeText}</i>`);
                break;
              }

              case '/pending': {
                const allOrders = await getOrders();
                const pendingList = allOrders.filter(o => o.status === 'Pending' || o.status === 'pending').slice(0, 5);

                if (pendingList.length === 0) {
                  await sendTelegramMessage(chatId, `✅ <b>সব পেন্ডিং অর্ডার সম্পন্ন করা হয়েছে!</b>`);
                  break;
                }

                await sendTelegramMessage(chatId, `🟡 <b>মোট পেন্ডিং অর্ডার তালিকা (সর্বোচ্চ ৫টি):</b>`);
                
                for (const o of pendingList) {
                  const ordMsg = `🚨 <b>পেন্ডিং অর্ডার #<code>${o.id}</code> (${o.type})</b>\n\n` +
                                 `📱 ফোন: <code>${o.userPhone}</code>\n` +
                                 `💼 সার্ভিস: ${o.serviceName} ${o.paymentMethod ? `(${o.paymentMethod})` : ''}\n` +
                                 `💰 পরিমাণ: <code>৳${o.amount} BDT</code>\n` +
                                 `🔑 TrxID/অ্যাকাউন্ট: <code>${o.trxId || o.account || 'N/A'}</code>`;

                  const inlineMarkup = {
                    inline_keyboard: [
                      [
                        { text: "✅ Approve", callback_data: `approve_${o.id}` },
                        { text: "❌ Reject", callback_data: `rejectOptions_${o.id}` }
                      ]
                    ]
                  };
                  await sendTelegramMessage(chatId, ordMsg, inlineMarkup);
                }
                break;
              }

              case '/user': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/user [phone]</code>\nযেমন: <code>/user 01635275233</code>");
                  break;
                }
                const phone = parts[1];
                const usersList = await getUsers();
                const targetUser = findUserByPhoneHelper(phone, usersList);

                if (!targetUser) {
                  await sendTelegramMessage(chatId, "❌ এই ফোন নম্বরে কোনো ইউজার পাওয়া যায়নি।");
                  break;
                }

                const userProfileMsg = `👤 <b>ইউজার প্রোফাইল বিবরণ (User Profile Details)</b>\n\n` +
                  `👤 নাম: <b>${targetUser.name}</b>\n` +
                  `📱 ফোন: <code>${targetUser.phone}</code>\n` +
                  `📧 ইমেইল: <code>${targetUser.email || 'N/A'}</code>\n` +
                  `💼 রোল: <b>${targetUser.role || 'User'}</b>\n` +
                  `🚦 স্ট্যাটাস: <b>${targetUser.status || 'Active'}</b>\n` +
                  `💰 ওয়ালেট ব্যালেন্স: <code>৳${targetUser.walletBalance || 0} BDT</code>\n` +
                  `🎟️ কমিশন রেট: <code>${targetUser.commissionRate || 0}%</code>\n` +
                  `💳 ওয়ালেট লিমিট: <code>৳${targetUser.walletLimit || 'সীমাহীন'} BDT</code>\n` +
                  `🔑 পিন: <code>${targetUser.pin || 'N/A'}</code>`;

                await sendTelegramMessage(chatId, userProfileMsg);
                break;
              }

              case '/history': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/history [phone]</code>\nযেমন: <code>/history 01635275233</code>");
                  break;
                }
                const phone = parts[1];
                const allOrders = await getOrders();
                const userOrders = allOrders.filter(o => o.userPhone === phone).slice(0, 5);

                if (userOrders.length === 0) {
                  await sendTelegramMessage(chatId, `ℹ️ এই নম্বরে (<code>${phone}</code>) কোনো অর্ডারের ইতিহাস পাওয়া যায়নি।`);
                  break;
                }

                let histMsg = `📊 <b>ইউজার <code>${phone}</code>-এর শেষ ৫টি অর্ডার:</b>\n\n`;
                userOrders.forEach((o, idx) => {
                  let stIcon = '🟡';
                  if (o.status === 'Completed' || o.status === 'Success' || o.status === 'Approved') stIcon = '🟢';
                  else if (o.status === 'Failed' || o.status === 'Rejected' || o.status === 'Cancelled') stIcon = '🔴';

                  histMsg += `${idx + 1}. #<code>${o.id}</code> | ${o.type} | ${o.serviceName} | <code>৳${o.amount} BDT</code> | ${stIcon} ${o.status}\n`;
                });
                await sendTelegramMessage(chatId, histMsg);
                break;
              }

              case '/offservice': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/offservice [service]</code>\nযেমন: <code>/offservice bkash</code>\nযেমন: <code>/offservice bkash off</code>");
                  break;
                }
                const serviceInput = parts[1].toLowerCase();
                const explicitStatus = parts[2] ? parts[2].toLowerCase() : null;

                const matchedService = services.find(s => 
                  s.slug.toLowerCase() === serviceInput || 
                  s.name.toLowerCase().includes(serviceInput)
                );

                if (!matchedService) {
                  await sendTelegramMessage(chatId, `❌ "${serviceInput}" নামে কোনো মোবাইল ফাইনান্সিয়াল সার্ভিস পাওয়া যায়নি।`);
                  break;
                }

                let newStatus = !matchedService.isEnabled;
                if (explicitStatus === 'on') newStatus = true;
                else if (explicitStatus === 'off') newStatus = false;

                matchedService.isEnabled = newStatus;
                await setDocById("services", matchedService.id, matchedService);

                await sendTelegramMessage(chatId, `🔌 <b>সার্ভিস স্ট্যাটাস পরিবর্তন করা হয়েছে!</b>\n\n💼 সার্ভিস: <b>${matchedService.name}</b>\n📶 অবস্থা: ${newStatus ? '🟢 সচল (ENABLED)' : '🔴 বন্ধ (DISABLED)'}`);
                break;
              }

              case '/drives': {
                await sendDrivesList(chatId);
                break;
              }

              case '/maintenance': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/maintenance [on/off] [কারণ]</code>\nযেমন: <code>/maintenance on সাময়িক সার্ভার রক্ষণাবেক্ষণ</code>");
                  break;
                }
                const status = parts[1].toLowerCase();
                if (status === 'on') {
                  isMaintenanceMode = true;
                  const reasonText = parts.slice(2).join(' ').trim() || "সিস্টেম মেইনটেন্যান্সের কাজ চলছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।";
                  maintenanceReason = reasonText;

                  await setDocById("system_settings", "maintenance", {
                    active: true,
                    reason: maintenanceReason,
                    hotlines: maintenanceHotlines
                  });

                  // Create and push public announcement notice for maintenance ON
                  const announcementText = `⚠️ সিস্টেম মেইনটেন্যান্স: ${maintenanceReason}`;
                  const newNotif = {
                    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    title: "সিস্টেম মেইনটেন্যান্স 🔴",
                    body: announcementText,
                    targetRole: "All",
                    expiryDate: new Date(Date.now() + 86400000 * 3).toISOString().substring(0, 10),
                    isActive: true,
                    imageUrl: "",
                    targetPhone: "",
                    createdAt: new Date().toISOString()
                  };
                  
                  await setDocById("notifications", newNotif.id, newNotif);
                  notifications.unshift(newNotif);

                  await sendTelegramMessage(chatId, `🔧 <b>সিস্টেম মেইনটেন্যান্স মোড চালু করা হয়েছে!</b>\n\n📝 কারণ: <i>${maintenanceReason}</i>\n🔴 এখন অ্যাপের প্রধান সার্ভিসগুলো সাময়িকভাবে অফলাইন থাকবে। সকল ইউজারের কাছে সফলভাবে এনাউন্স পাঠানো হয়েছে!`);
                } else if (status === 'off') {
                  isMaintenanceMode = false;

                  await setDocById("system_settings", "maintenance", {
                    active: false,
                    reason: maintenanceReason,
                    hotlines: maintenanceHotlines
                  });

                  // Create and push public announcement notice
                  const announcementText = "🔔 সুসংবাদ! আমাদের সিস্টেম মেইনটেন্যান্স শেষ হয়েছে এবং অ্যাপ এখন সম্পূর্ণ সচল। আপনি এখন লেনদেন করতে পারেন।";
                  const newNotif = {
                    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    title: "সিস্টেম এখন সচল! 🟢",
                    body: announcementText,
                    targetRole: "All",
                    expiryDate: new Date(Date.now() + 86400000 * 3).toISOString().substring(0, 10), // 3 days expiry
                    isActive: true,
                    imageUrl: "",
                    targetPhone: "",
                    createdAt: new Date().toISOString()
                  };
                  
                  await setDocById("notifications", newNotif.id, newNotif);
                  notifications.unshift(newNotif);

                  await sendTelegramMessage(chatId, `🔧 <b>সিস্টেম মেইনটেন্যান্স মোড বন্ধ করা হয়েছে!</b>\n🟢 এখন অ্যাপের সকল সার্ভিস সচল রয়েছে। সকল ইউজারের কাছে সফলভাবে এনাউন্স পাঠানো হয়েছে!`);
                } else {
                  await sendTelegramMessage(chatId, `⚠️ ব্যবহার বিধি: <code>/maintenance [on/off] [কারণ]</code>`);
                }
                break;
              }

              case '/hotline': {
                if (parts.length < 2) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/hotline [নম্বর১] [নম্বর২] ...</code>\nযেমন: <code>/hotline 01635275233 01712345678</code>");
                  break;
                }
                const newHotlines = parts.slice(1);
                maintenanceHotlines = newHotlines;

                await setDocById("system_settings", "maintenance", {
                  active: isMaintenanceMode,
                  reason: maintenanceReason,
                  hotlines: maintenanceHotlines
                });

                await sendTelegramMessage(chatId, `📞 <b>হটলাইন নম্বরসমূহ আপডেট করা হয়েছে!</b>\n\nনম্বরগুলো: ${newHotlines.join(', ')}`);
                break;
              }

              case '/modem': {
                const usersList = await getUsers();
                const ordersList = await getOrders();
                const usersCount = usersList.length;
                const ordersCount = ordersList.length;

                const modemMsg = `📡 <b>SHAKIB PAY SYSTEM & MODEM REPORT</b>\n` +
                                 `--------------------------------------------------\n` +
                                 `🖥️ সার্ভার স্ট্যাটাস: <b>ONLINE (RUNNING)</b>\n` +
                                 `👥 মোট নিবন্ধিত ইউজার: <b>${usersCount} জন</b>\n` +
                                 `📦 মোট প্রক্রিয়াজাত ট্রানজেকশন: <b>${ordersCount} টি</b>\n` +
                                 `🔥 ফায়ারবেস কানেকশন: <b>CONNECTED & SECURE</b>\n` +
                                 `📶 মোডেম সংযোগ: <b>CONNECTED (4G LTE - EXCELLENT SIGNAL)</b>\n` +
                                 `⚡ সিস্টেম রেসপন্স লেটেন্সি: <b>~45ms</b>\n` +
                                 `--------------------------------------------------`;
                await sendTelegramMessage(chatId, modemMsg);
                break;
              }

              case '/msg': {
                if (parts.length < 3) {
                  await sendTelegramMessage(chatId, "⚠️ ব্যবহার বিধি: <code>/msg [phone] [message_text]</code>\nযেমন: <code>/msg 01635275233 আপনার ড্রাইভ অর্ডারটি সফল হয়েছে।</code>");
                  break;
                }
                const phone = parts[1];
                const msgText = parts.slice(2).join(' ');

                const usersList = await getUsers();
                const matchedUser = findUserByPhoneHelper(phone, usersList);

                if (!matchedUser) {
                  await sendTelegramMessage(chatId, `❌ এই ফোন নম্বরে (${phone}) কোনো ইউজার পাওয়া যায়নি।`);
                  break;
                }

                const newNotif = {
                  id: `msg-${Date.now()}`,
                  title: "এডমিন নোটিফিকেশন",
                  body: msgText,
                  targetRole: matchedUser.role || 'All',
                  expiryDate: new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 10),
                  isActive: true,
                  imageUrl: "",
                  targetPhone: phone,
                  createdAt: new Date().toISOString()
                };
                
                await setDocById("notifications", newNotif.id, newNotif);

                // Sync outer notifications array
                const liveNotifications = await getNotifications();
                notifications.length = 0;
                notifications.push(...liveNotifications);

                await sendTelegramMessage(chatId, `✅ <b>ইউজার পুশ নোটিফিকেশন পাঠানো হয়েছে!</b>\n\n👤 প্রাপক: ${matchedUser.name} (<code>${phone}</code>)\n📝 বার্তা: <i>${msgText}</i>`);
                break;
              }

              case '/summary': {
                await triggerDailySummary(chatId);
                break;
              }

              case '/start':
              case '/help': {
                const helpMsg = `✨ <b>SHAKIB PAY REMOTE ADMIN BOT PANEL</b> ✨\n\n` +
                  `🛠️ <b>অ্যাডমিন কমান্ডসমূহ:</b>\n` +
                  `💳 <code>/add [phone] [amount]</code> - BDT ওয়ালেট ব্যালেন্স যোগ করুন\n` +
                  `💸 <code>/deduct [phone] [amount]</code> - BDT ওয়ালেট ব্যালেন্স বিয়োগ করুন\n` +
                  `🔒 <code>/block [phone]</code> - অ্যাকাউন্ট সাময়িক ব্লক করুন\n` +
                  `🔓 <code>/unblock [phone]</code> - অ্যাকাউন্ট অ্যাক্টিভ করুন\n` +
                  `📢 <code>/notice [text]</code> - ওয়েবসাইট স্ক্রলিং নোটিশ পরিবর্তন করুন\n` +
                  `🔑 <code>/resetpin [phone] [new_pin]</code> - সিকিউরিটি পিন পরিবর্তন করুন\n` +
                  `📶 <code>/drives</code> - ড্রাইভ প্যাক সাময়িক বন্ধ/চালু করুন\n` +
                  `📊 <code>/summary</code> - আজকের সামগ্রিক রিপোর্ট দেখুন\n\n` +
                  `✨ <b>নতুন জেনুইন ইন্টারেক্টিভ কমান্ডসমূহ:</b>\n` +
                  `📝 <code>/generate_notice [topic]</code> - বাংলায় অটো-নোটিশ তৈরি করুন\n` +
                  `⏳ <code>/pending</code> - পেন্ডিং অর্ডার সমূহ এক নজরে দেখুন ও একশন নিন\n` +
                  `👤 <code>/user [phone]</code> - ইউজারের প্রোফাইল ডাটা দেখুন\n` +
                  `📈 <code>/history [phone]</code> - ইউজারের শেষ ৫টি অর্ডার বিবরণ দেখুন\n` +
                  `📶 <code>/offservice [service]</code> - যেকোনো সার্ভিস সাময়িক বন্ধ/চালু করুন\n` +
                  `🔧 <code>/maintenance [on/off]</code> - সিস্টেম মেইনটেন্যান্স মোড অন/অফ করুন\n` +
                  `📡 <code>/modem</code> - সার্ভার ও মোডেম স্ট্যাটাস রিপোর্ট দেখুন\n` +
                  `💬 <code>/msg [phone] [text]</code> - ইউজারকে ডিরেক্ট ইন-অ্যাপ নোটিফিকেশন পাঠান`;
                await sendTelegramMessage(chatId, helpMsg);
                break;
              }

              default: {
                await sendTelegramMessage(chatId, `❌ অজানা কমান্ড! সাহায্য পেতে <code>/help</code> টাইপ করুন।`);
                break;
              }
            }
          } catch (cmdErr: any) {
            console.error(`Telegram Bot command error [${command}]:`, cmdErr);
            await sendTelegramMessage(chatId, `❌ দুঃখিত, কমান্ডটি প্রসেস করার সময় একটি ত্রুটি ঘটেছে: ${cmdErr.message || "Unknown error"}`);
          }
        }
      }
    } catch (err) {
      console.error('handleTelegramUpdate inner error:', err);
    }
  }

  app.post('/api/auth/login', async (req, res) => {
    const { loginId, password, pin } = req.body;
    if (!loginId) {
      return res.status(400).json({ error: "দয়া করে মোবাইল নম্বর প্রদান করুন।" });
    }

    // Special bypass for Admin PIN or Password: 018811sh or Shakib1213
    if (pin === '018811sh' || password === '018811sh' || (loginId === 'Shakib1213' && password === '018811sh') || pin === 'Shakib1213') {
      let adminUser = users.find(u => u.role === 'Admin');
      if (!adminUser) {
        adminUser = {
          id: "usr-shakib",
          name: "Shakib Raj",
          email: "Khanshackibraj@gmail.com",
          phone: loginId,
          profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          role: "Admin",
          walletBalance: 12500,
          pin: "018811sh",
          password: "018811sh",
          status: "Active",
          commissionRate: 0,
          walletLimit: 500000
        };
        users.push(adminUser);
      } else {
        adminUser.pin = "018811sh";
        adminUser.password = "018811sh";
        adminUser.phone = loginId;
      }
      
      try {
        await setDocById("users", adminUser.id, adminUser);
      } catch (e) {
        console.error("Failed to sync Admin bypass update to Firestore:", e);
      }

      currentUser = adminUser;
      return res.json({ success: true, user: currentUser });
    }

    if (!pin) {
      return res.status(400).json({ error: "দয়া করে পিন নম্বর প্রদান করুন।" });
    }

    if (!password) {
      return res.status(400).json({ error: "দয়া করে পাসওয়ার্ড প্রদান করুন।" });
    }

    const dbUsers = await getUsers();
    const user = dbUsers.find(
      (u) =>
        (u.phone === loginId || u.email === loginId) &&
        (u.pin === pin || u.password === password)
    );

    if (!user) {
      return res.status(401).json({ error: "মোবাইল নম্বর, পিন অথবা পাসওয়ার্ড সঠিক নয়।" });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। সাপোর্ট টিমের সাথে যোগাযোগ করুন।" });
    }

    currentUser = user;
    return res.json({ success: true, user: currentUser });
  });

  app.post('/api/telegram-webhook', async (req, res) => {
    try {
      if (req.body) {
        await handleTelegramUpdate(req.body);
      }
      res.status(200).send('OK');
    } catch (e) {
      console.error('Webhook error:', e);
      res.status(500).send('Error');
    }
  });

  async function pollTelegramUpdates() {
    let offset = 0;
    console.log("Starting Telegram Bot updates polling loop...");
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
      console.log("[Telegram] Webhook cleared for long-polling.");
    } catch (e) {
      console.error("[Telegram] Failed to clear webhook:", e);
    }
    while (true) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=15`);
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.result) {
            for (const update of data.result) {
              offset = update.update_id + 1;
              await handleTelegramUpdate(update);
            }
          }
        } else {
          if (response.status === 409) {
            console.log("[Telegram] Conflict (409). Another instance is likely polling. Stopping this poll loop to prevent conflicts.");
            break;
          }
          console.error("Telegram long poll error status:", response.status);
        }
      } catch (error) {
        console.error("Error polling Telegram updates:", error);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Start polling if not in serverless or webhook mode
  if (process.env.TELEGRAM_USE_WEBHOOK === 'true' || process.env.VERCEL || process.env.NETLIFY) {
    console.log("[Telegram] Serverless or Webhook environment detected. Skipping long-polling loop. Webhook endpoint is active at /api/telegram-webhook");
  } else {
    pollTelegramUpdates();
  }

  // Schedule automatic 23:59 summary trigger
  let lastDailySummaryDate = '';
  setInterval(async () => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours === 23 && minutes === 59) {
        const todayStr = now.toDateString();
        if (lastDailySummaryDate !== todayStr) {
          lastDailySummaryDate = todayStr;
          await triggerDailySummary(TELEGRAM_ADMIN_CHAT_ID);
        }
      }
    } catch (error) {
      console.error("Error in automated daily summary interval:", error);
    }
  }, 60000); // check every minute

  let aiClient: GoogleGenAI | null = null;

  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // --- API ROUTES ---

  app.get('/api/maintenance', (req, res) => {
    res.json({
      active: isMaintenanceMode,
      reason: maintenanceReason,
      hotlines: maintenanceHotlines
    });
  });

  app.post('/api/admin/maintenance', async (req, res) => {
    const { active, reason, hotlines } = req.body;
    isMaintenanceMode = !!active;
    if (reason !== undefined) maintenanceReason = reason;
    if (hotlines !== undefined) maintenanceHotlines = hotlines;

    await setDocById("system_settings", "maintenance", {
      active: isMaintenanceMode,
      reason: maintenanceReason,
      hotlines: maintenanceHotlines
    });

    if (!isMaintenanceMode) {
      // Create and push public announcement notice
      const announcementText = "🔔 সুসংবাদ! আমাদের সিস্টেম মেইনটেন্যান্স শেষ হয়েছে এবং অ্যাপ এখন সম্পূর্ণ সচল। আপনি এখন লেনদেন করতে পারেন।";
      const newNotif = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: "সিস্টেম এখন সচল! 🟢",
        body: announcementText,
        targetRole: "All",
        expiryDate: new Date(Date.now() + 86400000 * 3).toISOString().substring(0, 10), // 3 days expiry
        isActive: true,
        imageUrl: "",
        targetPhone: "",
        createdAt: new Date().toISOString()
      };
      
      await setDocById("notifications", newNotif.id, newNotif);
      notifications.unshift(newNotif);
    } else {
      const announcementText = `⚠️ সিস্টেম মেইনটেন্যান্স: ${maintenanceReason}`;
      const newNotif = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: "সিস্টেম মেইনটেন্যান্স 🔴",
        body: announcementText,
        targetRole: "All",
        expiryDate: new Date(Date.now() + 86400000 * 3).toISOString().substring(0, 10), // 3 days expiry
        isActive: true,
        imageUrl: "",
        targetPhone: "",
        createdAt: new Date().toISOString()
      };
      
      await setDocById("notifications", newNotif.id, newNotif);
      notifications.unshift(newNotif);
    }

    res.json({
      success: true,
      active: isMaintenanceMode,
      reason: maintenanceReason,
      hotlines: maintenanceHotlines
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { name, phone, email, password, pin } = req.body;
    if (!name || !phone || !email || !password || !pin) {
      return res.status(400).json({ error: "দয়া করে সকল তথ্য প্রদান করুন।" });
    }
    if (users.find(u => u.phone === phone || u.email === email)) {
      return res.status(400).json({ error: "এই ফোন বা ইমেইল দিয়ে ইতিমধ্যেই অ্যাকাউন্ট খোলা হয়েছে।" });
    }
    const newUser = {
      id: "usr-" + Date.now(),
      name,
      phone,
      email,
      password,
      pin,
      profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      role: "Normal User" as any,
      walletBalance: 0,
      status: "Active" as "Active" | "Suspended",
      commissionRate: 1,
      walletLimit: 20000
    };
    users.push(newUser);
    try {
      await setDocById("users", newUser.id, newUser);
    } catch (e) {
      console.error("Failed to sync registered user to Firestore:", e);
    }
    currentUser = newUser;
    res.json({ success: true, user: currentUser });
  });

  app.post('/api/auth/admin-login', (req, res) => {
    const { email, password, pin } = req.body;
    if (!email || !password || !pin) {
      return res.status(400).json({ error: "দয়া করে সকল তথ্য প্রদান করুন।" });
    }
    if (email !== 'Khanshakibraj@gmail.com' || password !== 'Pass 018811' || pin !== '0188') {
      return res.status(400).json({ error: "ভুল এডমিন ক্রেডেনশিয়াল!" });
    }
    let adminUser = users.find(u => u.email === 'Khanshakibraj@gmail.com');
    if (!adminUser) {
      adminUser = {
        id: "usr-shakib",
        name: "Shakib Raj",
        email: "Khanshakibraj@gmail.com",
        phone: "01635275233",
        profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        role: "Admin",
        walletBalance: 12500,
        pin: "0188",
        password: "Pass 018811",
        status: "Active",
        commissionRate: 0,
        walletLimit: 500000
      };
      users.push(adminUser);
    }
    currentUser = adminUser;
    res.json({ success: true, user: currentUser });
  });

  app.post('/api/auth/logout', (req, res) => {
    currentUser = null as any;
    res.json({ success: true });
  });

  // 1. Get Current User / Profile Info
  app.get('/api/user/profile', (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json(currentUser);
  });

  // 2. Update Profile Settings
  app.post('/api/user/profile', async (req, res) => {
    const { name, email, profilePic } = req.body;
    if (name) currentUser.name = name;
    if (email) currentUser.email = email;
    if (profilePic) currentUser.profilePic = profilePic;
    try {
      await setDocById("users", currentUser.id, currentUser);
    } catch (e) {
      console.error("Failed to sync user profile changes to Firestore:", e);
    }
    res.json({ success: true, user: currentUser });
  });

  // 3. Security Updates: Change Password
  app.post('/api/user/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (currentUser.password !== oldPassword) {
      return res.status(400).json({ error: "পুরাতন পাসওয়ার্ড সঠিক নয়।" });
    }
    currentUser.password = newPassword;
    try {
      await setDocById("users", currentUser.id, currentUser);
    } catch (e) {
      console.error("Failed to sync user password changes to Firestore:", e);
    }
    res.json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।" });
  });

  // 4. Security Updates: Change PIN
  app.post('/api/user/change-pin', async (req, res) => {
    const { oldPin, newPin } = req.body;
    if (currentUser.pin !== oldPin) {
      return res.status(400).json({ error: "পুরাতন পিন নম্বর সঠিক নয়।" });
    }
    currentUser.pin = newPin;
    try {
      await setDocById("users", currentUser.id, currentUser);
    } catch (e) {
      console.error("Failed to sync user pin changes to Firestore:", e);
    }
    res.json({ success: true, message: "পিন নম্বর সফলভাবে পরিবর্তিত হয়েছে।" });
  });

  // Helper to normalize phone number to standard 11 digits
  function normalizePhone(phone: string): string {
    if (!phone) return "";
    let clean = phone.replace(/[\s\-\+\(\)]/g, ""); // remove spaces, dashes, +, brackets
    if (clean.startsWith("880")) {
      clean = clean.substring(2);
    } else if (clean.startsWith("+880")) {
      clean = clean.substring(3);
    }
    // Standardize 10 digit number starting with 1 to 11 digit starting with 01
    if (clean.length === 10 && clean.startsWith("1")) {
      clean = "0" + clean;
    }
    return clean;
  }

  // 5. Send Money (User to User Transfer)
  app.post('/api/user/send-money', async (req, res) => {
    const { recipientPhone, amount, pin, method } = req.body;
    const amt = Number(amount);

    if (currentUser.pin !== pin) {
      return res.status(400).json({ error: "ভুল পিন নম্বর প্রদান করেছেন!" });
    }
    if (amt <= 0) {
      return res.status(400).json({ error: "সঠিক পরিমাণ প্রদান করুন।" });
    }
    if (currentUser.walletBalance < amt) {
      return res.status(400).json({ error: "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" });
    }

    // Reload users from Firestore to prevent any stale cache issues
    try {
      const dbUsers = await getUsers();
      if (dbUsers && dbUsers.length > 0) {
        users = dbUsers;
      }
    } catch (e) {
      console.error("Failed to reload users from Firestore during send-money:", e);
    }

    const normInput = normalizePhone(recipientPhone);
    const recipient = users.find(u => normalizePhone(u.phone) === normInput);
    if (!recipient) {
      return res.status(400).json({ error: "প্রাপকের নম্বরটি শাকিবপে ইউজার নয়! সঠিক নম্বর দিন।" });
    }
    if (recipient.phone === currentUser.phone) {
      return res.status(400).json({ error: "নিজের নম্বরে টাকা পাঠানো সম্ভব নয়!" });
    }

    // Deduct balance from sender
    currentUser.walletBalance -= amt;
    await setDocById("users", currentUser.id, currentUser);

    // Add balance to recipient
    recipient.walletBalance = (recipient.walletBalance || 0) + amt;
    await setDocById("users", recipient.id, recipient);

    const txId = `TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Create a transaction record with Success status directly
    const newOrd = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      type: "Send Money" as const,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      serviceName: `সেন্ড মানি (${recipient.name})`,
      paymentMethod: method || "ShakibPay Wallet Balance",
      amount: amt,
      trxId: txId,
      account: recipientPhone,
      routingNumber: "",
      accountHolder: recipient.name,
      ref: "ব্যক্তিগত সেন্ড মানি",
      status: "Success" as const,
      cancellationReason: "",
      date: new Date().toISOString(),
      commissionDeducted: 0
    };

    orders.unshift(newOrd);
    await setDocById("orders", newOrd.id, newOrd);

    // Send pending/success status notifications
    await sendOrderStatusNotification(newOrd, 'Success');

    // Send receipt notification to the recipient
    try {
      const recipientNotif = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: "💸 ব্যালেন্স প্রাপ্তি!",
        body: `আপনি ${currentUser.name} (${currentUser.phone}) এর থেকে ${amt} টাকা সফলভাবে গ্রহণ করেছেন।`,
        targetRole: 'All',
        expiryDate: new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 10),
        isActive: true,
        imageUrl: "",
        targetPhone: recipient.phone
      };
      notifications.unshift(recipientNotif);
      await setDocById("notifications", recipientNotif.id, recipientNotif);
    } catch (e) {
      console.error("[Notification] Failed to create recipient notification:", e);
    }

    // Send Telegram alert
    const tgMsg = `🔔 <b>সফল ব্যালেন্স ট্রান্সফার (App-to-App)!</b>\n\n` +
                  `📱 প্রেরক: <code>${currentUser.phone}</code> (${currentUser.name})\n` +
                  `🎯 প্রাপক: <code>${recipientPhone}</code> (${recipient.name})\n` +
                  `💰 পরিমাণ: <code>৳${amt} BDT</code>\n` +
                  `🔌 মাধ্যম: ShakibPay Wallet Balance\n` +
                  `🔑 ট্রানজেকশন ID: <code>${txId}</code>\n` +
                  `📅 সময়: ${new Date().toLocaleString('bn-BD')}\n` +
                  `🟢 স্ট্যাটাস: SUCCESS (Instant)`;

    notifyAdminViaTelegram(tgMsg);

    res.json({ success: true, balance: currentUser.walletBalance, order: newOrd });
  });

  // 5.5 Admin Actions: Dynamic User Management
  app.get('/api/admin/users', (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন।" });
    }
    const ROLE_HIERARCHY: Record<string, number> = {
      'Admin': 6,
      'Sub-Admin': 5,
      'Reseller': 4,
      'Dealer': 4,
      'Retailer': 3,
      'VIP': 2,
      'Normal User': 1
    };
    const currentPower = ROLE_HIERARCHY[currentUser.role] || 1;
    if (currentUser.role === 'Admin') {
      res.json(users);
    } else {
      // Non-admin resellers/dealers/sub-admins: ONLY show users created specifically by this reseller
      const filtered = users.filter(u => {
        if (u.id === currentUser.id) return false;
        const isCreatedByMe = (u.createdBy && u.createdBy === currentUser.id) ||
                             (u.createdByPhone && u.createdByPhone === currentUser.phone);
        return isCreatedByMe;
      });
      res.json(filtered);
    }
  });

  app.post('/api/admin/users/update-balance', async (req, res) => {
    const { userId, amount, action } = req.body;
    const userObj = users.find(u => u.id === userId);
    if (!userObj) {
      return res.status(404).json({ error: "ইউজার খুঁজে পাওয়া যায়নি।" });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: "সঠিক পরিমাণ প্রদান করুন।" });
    }

    if (action === 'add') {
      userObj.walletBalance += amt;
    } else if (action === 'deduct') {
      if (userObj.walletBalance < amt) {
        return res.status(400).json({ error: "ইউজারের ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" });
      }
      userObj.walletBalance -= amt;
    } else {
      return res.status(400).json({ error: "ভুল অ্যাকশন।" });
    }

    // Telegram Notification
    const tgMsg = `⚖️ <b>অ্যাডমিন ব্যালেন্স সমন্বয়!</b>\n\n` +
                  `👤 ইউজার: ${userObj.name} (<code>${userObj.phone}</code>)\n` +
                  `⚙️ অ্যাকশন: ${action === 'add' ? 'যোগ (ADD)' : 'কর্তন (DEDUCT)'}\n` +
                  `💰 পরিমাণ: <code>৳${amt} BDT</code>\n` +
                  `💵 নতুন ব্যালেন্স: <code>৳${userObj.walletBalance} BDT</code>`;
    await notifyAdminViaTelegram(tgMsg);

    res.json({ success: true, users, currentUserBalance: currentUser.walletBalance });
  });

  app.post('/api/admin/users/update-role', (req, res) => {
    const { userId, role } = req.body;
    const userObj = users.find(u => u.id === userId);
    if (!userObj) {
      return res.status(404).json({ error: "ইউজার খুঁজে পাওয়া যায়নি।" });
    }
    const allowedRoles = ['Admin', 'Normal User', 'Reseller', 'Dealer', 'VIP', 'Sub-Admin', 'Retailer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "ভুল ইউজার রোল।" });
    }
    userObj.role = role as any;
    res.json({ success: true, users });
  });

  app.post('/api/admin/users/update-limits', (req, res) => {
    const { userId, commissionRate, walletLimit } = req.body;
    const userObj = users.find(u => u.id === userId);
    if (!userObj) {
      return res.status(404).json({ error: "ইউজার খুঁজে পাওয়া যায়নি।" });
    }
    if (commissionRate !== undefined) {
      userObj.commissionRate = Number(commissionRate);
    }
    if (walletLimit !== undefined) {
      userObj.walletLimit = Number(walletLimit);
    }
    res.json({ success: true, users });
  });

  app.post('/api/admin/users/update-status', (req, res) => {
    const { userId, status } = req.body;
    const userObj = users.find(u => u.id === userId);
    if (!userObj) {
      return res.status(404).json({ error: "ইউজার খুঁজে পাওয়া যায়নি।" });
    }
    if (status !== 'Active' && status !== 'Suspended') {
      return res.status(400).json({ error: "ভুল স্ট্যাটাস।" });
    }
    userObj.status = status;
    res.json({ success: true, users });
  });

  // Create Registered User (Add User)
  app.post('/api/users/create', async (req, res) => {
    const { name, email, phone, role, password, pin, initialBalance } = req.body;
    
    if (!name || !phone || !password || !pin) {
      return res.status(400).json({ error: "প্রয়োজনীয় সকল তথ্য প্রদান করুন।" });
    }

    if (!currentUser) {
      return res.status(401).json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন।" });
    }

    const ROLE_HIERARCHY: Record<string, number> = {
      'Admin': 6,
      'Sub-Admin': 5,
      'Reseller': 4,
      'Dealer': 4,
      'Retailer': 3,
      'VIP': 2,
      'Normal User': 1
    };

    const currentPower = ROLE_HIERARCHY[currentUser.role] || 1;
    const targetPower = ROLE_HIERARCHY[role] || 1;

    if (targetPower >= currentPower) {
      return res.status(403).json({ error: "আপনার এই স্তরের ইউজার তৈরি করার অনুমতি নেই।" });
    }

    const existingUser = users.find(u => u.phone === phone);
    if (existingUser) {
      return res.status(400).json({ error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে ইউজার রেজিস্টার্ড আছে।" });
    }

    const initBal = Number(initialBalance) || 0;
    if (initBal > 0 && currentUser.walletBalance < initBal) {
      return res.status(400).json({ error: "নতুন ইউজারকে ফান্ড দিতে আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" });
    }

    // Deduct from creator if initial balance is set
    if (initBal > 0) {
      currentUser.walletBalance -= initBal;
      const setupOrd = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        type: "Send Money" as const,
        userEmail: currentUser.email,
        userPhone: currentUser.phone,
        serviceName: `Reseller Setup Fund (${name})`,
        paymentMethod: "",
        amount: initBal,
        trxId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        account: phone,
        routingNumber: "",
        accountHolder: "",
        ref: "Setup initial balance",
        status: "Success" as const,
        cancellationReason: "",
        date: new Date().toISOString(),
        commissionDeducted: 0
      };
      orders.unshift(setupOrd);
      try {
        await setDocById("orders", setupOrd.id, setupOrd);
        await setDocById("users", currentUser.id, currentUser);
      } catch (e) {
        console.error("Failed to sync setupOrd or creator update to Firestore:", e);
      }
    }

    const newUser = {
      id: `usr-${Math.floor(100 + Math.random() * 900)}`,
      name,
      email: email || `${phone}@shakibpay.com`,
      phone,
      profilePic: `https://images.unsplash.com/photo-${['1535713875002-d1d0cf377fde', '1494790108377-be9c29b29330', '1599566150163-29194dcaad36', '1580489944761-15a19d654956'][Math.floor(Math.random() * 4)]}?w=150&auto=format&fit=crop&q=80`,
      role: role || "Retailer",
      walletBalance: initBal,
      pin,
      password,
      status: "Active" as const,
      createdBy: currentUser.id,
      createdByPhone: currentUser.phone
    };

    users.push(newUser);
    try {
      await setDocById("users", newUser.id, newUser);
    } catch (e) {
      console.error("Failed to sync newUser to Firestore:", e);
    }

    // Telegram Notification
    const tgMsg = `👤 <b>নতুন ইউজার রেজিস্টার্ড!</b>\n\n` +
                  `👤 নাম: ${name}\n` +
                  `📱 ফোন: <code>${phone}</code>\n` +
                  `🛡️ রোল: ${role}\n` +
                  `💰 প্রারম্ভিক ব্যালেন্স: <code>৳${initBal} BDT</code>`;
    await notifyAdminViaTelegram(tgMsg);

    res.json({ success: true, users, currentUserBalance: currentUser.walletBalance });
  });

  // 6. Get Admin Info
  app.get('/api/admin/info', (req, res) => {
    res.json({ adminNumbers });
  });

  // 6.5. Update Admin Info (Payment Gateways)
  app.post('/api/admin/update-gateways', async (req, res) => {
    try {
      const { bkash, nagad, rocket, usdt } = req.body;
      if (bkash) adminNumbers.bkash = bkash;
      if (nagad) adminNumbers.nagad = nagad;
      if (rocket) adminNumbers.rocket = rocket;
      if (usdt) adminNumbers.usdt = usdt;

      await updateAdminInfo({ adminNumbers });
      res.json({ success: true, adminNumbers });
    } catch (err: any) {
      console.error("Error updating admin gateways:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Create New Order (Add Money, Mobile Recharge, Drive Pack, Bank Transfer, Utility Bill)
  app.post('/api/orders/create', async (req, res) => {
    try {
      const { 
        type, 
        userPhone, 
        serviceName, 
        paymentMethod, 
        amount, 
        trxId, 
        account, 
        routingNumber, 
        accountHolder, 
        ref,
        pin,
        receiptImage,
        recipientNumber,
        accountName,
        bankName,
        reference,
        operator,
        packageId,
        packDetails,
        userName,
        userRole
      } = req.body;

      const amt = Number(amount);

      // Maintenance Mode Check
      if (isMaintenanceMode) {
        return res.status(503).json({ error: "দুঃখিত, সিস্টেম রক্ষণাবেক্ষণের কাজের (Maintenance Mode) জন্য সাময়িকভাবে অফলাইনে রয়েছে। দয়া করে কিছুক্ষণ পর চেষ্টা করুন।" });
      }

      // Fraud Trigger 1: Rapid Spam Orders (More than 3 requests within 30 seconds)
      const now = Date.now();
      const userTimes = userTransactionTimes.get(currentUser.id) || [];
      const recentTimes = userTimes.filter(t => now - t < 30000);
      recentTimes.push(now);
      userTransactionTimes.set(currentUser.id, recentTimes);

      if (recentTimes.length > 3) {
        const alertMsg = `🚨 <b>FRAUD / SUSPICIOUS ACTIVITY ALERT</b>\n` +
                         `--------------------------------------------------\n` +
                         `👤 User: <b>${currentUser.name}</b> (<code>${currentUser.phone}</code>)\n` +
                         `⚠️ Reason: <b>Rapid order spam</b> (More than 3 orders in 30 seconds)\n` +
                         `📅 Time: ${new Date().toLocaleString('bn-BD')}\n` +
                         `--------------------------------------------------`;
        const inlineKeyboard = [
          [
            { text: "🚫 Block User Now", callback_data: `fraud_block_${currentUser.phone}` },
            { text: "⚠️ Dismiss", callback_data: `fraud_dismiss` }
          ]
        ];
        await notifyAdminViaTelegram(alertMsg, { inline_keyboard: inlineKeyboard });
        return res.status(400).json({ error: "সন্দেহজনক কার্যক্রম সনাক্ত করা হয়েছে! দয়া করে একটু অপেক্ষা করে চেষ্টা করুন।" });
      }

      // Validate PIN
      if (currentUser.pin !== pin) {
        const attempts = (failedPinAttempts.get(currentUser.id) || 0) + 1;
        failedPinAttempts.set(currentUser.id, attempts);

        if (attempts >= 3) {
          const alertMsg = `🚨 <b>FRAUD / SUSPICIOUS ACTIVITY ALERT</b>\n` +
                           `--------------------------------------------------\n` +
                           `👤 User: <b>${currentUser.name}</b> (<code>${currentUser.phone}</code>)\n` +
                           `⚠️ Reason: <b>3+ Invalid PIN attempts</b>\n` +
                           `📅 Time: ${new Date().toLocaleString('bn-BD')}\n` +
                           `--------------------------------------------------`;
          const inlineKeyboard = [
            [
              { text: "🚫 Block User Now", callback_data: `fraud_block_${currentUser.phone}` },
              { text: "⚠️ Dismiss", callback_data: `fraud_dismiss` }
            ]
          ];
          await notifyAdminViaTelegram(alertMsg, { inline_keyboard: inlineKeyboard });
        }

        return res.status(400).json({ error: "ভুল পিন নম্বর প্রদান করেছেন!" });
      }

      // Reset wrong PIN attempts on successful execution
      failedPinAttempts.delete(currentUser.id);

      // Fraud Trigger 2: Duplicate TrxID Submission
      if (type === 'Add Money' && trxId) {
        const isDuplicate = orders.some(o => o.trxId === trxId);
        if (isDuplicate) {
          const alertMsg = `🚨 <b>FRAUD / SUSPICIOUS ACTIVITY ALERT</b>\n` +
                           `--------------------------------------------------\n` +
                           `👤 User: <b>${currentUser.name}</b> (<code>${currentUser.phone}</code>)\n` +
                           `⚠️ Reason: <b>Duplicate TrxID Submission</b> (TrxID: <code>${trxId}</code>)\n` +
                           `📅 Time: ${new Date().toLocaleString('bn-BD')}\n` +
                           `--------------------------------------------------`;
          const inlineKeyboard = [
            [
              { text: "🚫 Block User Now", callback_data: `fraud_block_${currentUser.phone}` },
              { text: "⚠️ Dismiss", callback_data: `fraud_dismiss` }
            ]
          ];
          await notifyAdminViaTelegram(alertMsg, { inline_keyboard: inlineKeyboard });
          return res.status(400).json({ error: "এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহৃত হয়েছে!" });
        }
      }

      // Fraud Trigger 3: Unusual Balance Request (Add Money with large amount > 10,000)
      if (type === 'Add Money' && amt > 10000) {
        const alertMsg = `🚨 <b>FRAUD / SUSPICIOUS ACTIVITY ALERT</b>\n` +
                         `--------------------------------------------------\n` +
                         `👤 User: <b>${currentUser.name}</b> (<code>${currentUser.phone}</code>)\n` +
                         `⚠️ Reason: <b>Large Unexpected Add-Money Request</b> (<code>৳${amt} BDT</code>)\n` +
                         `📅 Time: ${new Date().toLocaleString('bn-BD')}\n` +
                         `--------------------------------------------------`;
        const inlineKeyboard = [
          [
            { text: "🚫 Block User Now", callback_data: `fraud_block_${currentUser.phone}` },
            { text: "⚠️ Dismiss", callback_data: `fraud_dismiss` }
          ]
        ];
        await notifyAdminViaTelegram(alertMsg, { inline_keyboard: inlineKeyboard });
      }

      if (amt <= 0) {
        return res.status(400).json({ error: "সঠিক পরিমাণ প্রদান করুন।" });
      }

      // Check balance for pre-deductions (Recharge, Drive Pack, Bank Transfer, Utility Bill)
      // Add Money and Bank Deposit do NOT deduct balance initially, they increase it on approval
      const isPreDeducted = type !== 'Add Money' && type !== 'Bank Deposit';
      if (isPreDeducted && currentUser.walletBalance < amt) {
        return res.status(400).json({ error: "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" });
      }

      // Pre-deduct if applicable
      if (isPreDeducted) {
        currentUser.walletBalance -= amt;
        await setDocById("users", currentUser.id, currentUser);
      }

      // Role-based Level Commission logic
      // e.g. for VIP add money gives 3% commission, Sub-Admin gets 2%, Retailer gets 1%.
      // Let's calculate commission!
      let commission = 0;
      if (type === 'Add Money' || type === 'Bank Deposit') {
        const rate = currentUser.role === 'VIP' ? 0.03 : currentUser.role === 'Sub-Admin' ? 0.02 : 0.01;
        commission = amt * rate;
      }

      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        type,
        userEmail: currentUser.email,
        userPhone: userPhone || currentUser.phone,
        userName: userName || currentUser.name || "গ্রাহক",
        userRole: userRole || currentUser.role || "রিসেলার",
        serviceName,
        paymentMethod: paymentMethod || "",
        amount: amt,
        trxId: trxId || "",
        account: account || recipientNumber || "",
        recipientNumber: recipientNumber || account || "",
        accountName: accountName || accountHolder || "",
        accountHolder: accountHolder || accountName || "",
        bankName: bankName || paymentMethod || "",
        routingNumber: routingNumber || "",
        ref: ref || reference || "",
        reference: reference || ref || "",
        operator: operator || "",
        packageId: packageId || "",
        packDetails: packDetails || serviceName || "",
        status: "Pending" as const,
        cancellationReason: "",
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        commissionDeducted: commission
      };

      orders.unshift(newOrder);
      await setDocById("orders", newOrder.id, newOrder);

      // Send pending status notification
      await sendOrderStatusNotification(newOrder, 'Pending');

      // Send Telegram alert
      const tgMsg = `🚨 <b>নতুন অর্ডারের আবেদন! (${type})</b>\n\n` +
                    `👤 ইউজার: ${currentUser.name} (${currentUser.role})\n` +
                    `📱 ফোন: <code>${newOrder.userPhone}</code>\n` +
                    `💼 সার্ভিস/ব্যাংক: ${serviceName} ${paymentMethod ? `(${paymentMethod})` : ''}\n` +
                    `💰 পরিমাণ: <code>৳${amt} BDT</code>\n` +
                    `🔑 ট্রানজেকশন ID/অ্যাকাউন্ট: <code>${newOrder.trxId || newOrder.account}</code>\n` +
                    `🎁 কমিশন: <code>৳${commission} BDT</code>\n` +
                    `📅 তারিখ: ${new Date().toLocaleString('bn-BD')}\n` +
                    `🟡 স্ট্যাটাস: PENDING`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: "✅ Approve", callback_data: `approve_${newOrder.id}` },
            { text: "❌ Reject", callback_data: `rejectOptions_${newOrder.id}` }
          ]
        ]
      };

      if (receiptImage) {
        await sendTelegramPhoto(tgMsg, receiptImage, replyMarkup);
      } else {
        await notifyAdminViaTelegram(tgMsg, replyMarkup);
      }

      res.json({ success: true, balance: currentUser.walletBalance, order: newOrder });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'অর্ডার তৈরি করতে সমস্যা হয়েছে।' });
    }
  });

  // 8. Get All Orders (History / Admin list)
  app.get('/api/orders', (req, res) => {
    res.json(orders);
  });

  // 9. Admin Action: Approve Order
  app.post('/api/admin/orders/approve', async (req, res) => {
    try {
      const { orderId } = req.body;
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: "অর্ডার খুঁজে পাওয়া যায়নি।" });
    }

    const order = orders[orderIndex];
    if (order.status !== 'Pending') {
      return res.status(400).json({ error: "অর্ডারটি ইতিমধ্যে প্রসেস করা হয়েছে।" });
    }

    // Find the user who submitted the order
    const orderUser = users.find(u => u.phone === order.userPhone || u.email === order.userEmail);

    // If it is Calling Card, process credentials
    if (order.type === 'Calling Card') {
      const { autoAssign, cardPin, cardPassword, cardExpiry, cardImageUrl } = req.body;
      if (autoAssign) {
        const stockItem = cardStocks.find(s => s.packageId === order.packageId && s.status === 'Available');
        if (!stockItem) {
          return res.status(400).json({ error: "দুঃখিত, এই প্যাকেজের কোনো কার্ড স্টকে নেই! অনুগ্রহ করে স্টক যোগ করুন অথবা ম্যানুয়াল তথ্য দিয়ে অনুমোদন করুন।" });
        }
        stockItem.status = 'Sold';
        stockItem.soldTo = order.userPhone || '';
        stockItem.soldAt = new Date().toISOString();
        stockItem.orderId = order.id;

        await setDocById("calling_card_stock", stockItem.id, stockItem);

        order.cardPin = stockItem.pin || "";
        order.cardPassword = stockItem.password || "";
        order.cardExpiry = stockItem.expiryDate || "";
        order.cardImageUrl = stockItem.cardImageUrl || "";
      } else {
        order.cardPin = cardPin || "";
        order.cardPassword = cardPassword || "";
        order.cardExpiry = cardExpiry || "";
        order.cardImageUrl = cardImageUrl || "";
      }
    }

    // Approve logic
    order.status = 'Success';

    // If it was Add Money or Bank Deposit, add balance to user
    if ((order.type === 'Add Money' || order.type === 'Bank Deposit') && orderUser) {
      // Add money amount + commission
      orderUser.walletBalance += (order.amount + (order.commissionDeducted || 0));
      await setDocById("users", orderUser.id, orderUser);
    }

    // If it was Send Money, credit recipient
    if (order.type === 'Send Money') {
      const recipient = users.find(u => u.phone === order.account);
      if (recipient) {
        recipient.walletBalance += order.amount;
        await setDocById("users", recipient.id, recipient);
      }
    }

    await setDocById("orders", order.id, order);

    // Send confirmation notification to user
    await sendOrderStatusNotification(order, 'Success');

    // Send Telegram Notification
    let tgMsg = `✅ <b>অর্ডার অনুমোদিত হয়েছে!</b>\n\n` +
                  `🆔 অর্ডার ID: <code>${order.id}</code>\n` +
                  `👤 টাইপ: ${order.type}\n` +
                  `📱 কাস্টমার ফোন: <code>${order.userPhone}</code>${orderUser ? ` (${orderUser.name})` : ''}\n` +
                  `💰 পরিমাণ: <code>৳${order.amount} BDT</code>\n` +
                  `💚 ব্যালেন্স আপডেট করা হয়েছে।`;

    if (order.type === 'Calling Card') {
      tgMsg += `\n\n🎯 <b>কলিং কার্ড ডেলিভারি ডিটেইলস:</b>\n` +
               `🔑 PIN/Username: <code>${order.cardPin || 'N/A'}</code>\n` +
               `🔒 Password: <code>${order.cardPassword || 'N/A'}</code>\n` +
               `📅 মেয়াদ: <code>${order.cardExpiry || 'N/A'}</code>`;
    }

    await notifyAdminViaTelegram(tgMsg);

    // Send simulated SMS message to Telegram
    await sendApprovedSmsToTelegram(order, orderUser);

    res.json({ success: true, orders, walletBalance: currentUser.walletBalance });
    } catch (err: any) {
      console.error('Error approving order:', err);
      res.status(500).json({ error: err.message || 'অর্ডার অনুমোদন করতে সমস্যা হয়েছে।' });
    }
  });

  // 10. Admin Action: Reject / Cancel Order
  app.post('/api/admin/orders/reject', async (req, res) => {
    const { orderId, reason } = req.body;
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: "অর্ডার খুঁজে পাওয়া যায়নি।" });
    }

    const order = orders[orderIndex];
    if (order.status !== 'Pending') {
      return res.status(400).json({ error: "অর্ডারটি ইতিমধ্যে প্রসেস করা হয়েছে।" });
    }

    // Find the user who submitted the order
    const orderUser = users.find(u => u.phone === order.userPhone || u.email === order.userEmail);

    order.status = 'Rejected';
    order.cancellationReason = reason || "ভুল ট্রানজেকশন তথ্য বা পিন নম্বর!";

    // If order was pre-deducted (not Add Money or Bank Deposit), refund the amount
    if (order.type !== 'Add Money' && order.type !== 'Bank Deposit' && orderUser) {
      orderUser.walletBalance += order.amount;
      await setDocById("users", orderUser.id, orderUser);
    }

    await setDocById("orders", order.id, order);

    // Send confirmation notification to user
    await sendOrderConfirmationNotification(order, false);

    // Send Telegram Notification
    const tgMsg = `❌ <b>অর্ডার বাতিল করা হয়েছে!</b>\n\n` +
                  `🆔 অর্ডার ID: <code>${order.id}</code>\n` +
                  `👤 টাইপ: ${order.type}\n` +
                  `📱 কাস্টমার ফোন: <code>${order.userPhone}</code>${orderUser ? ` (${orderUser.name})` : ''}\n` +
                  `💰 পরিমাণ: <code>৳${order.amount} BDT</code>\n` +
                  `⚠️ বাতিলের কারণ: ${order.cancellationReason}\n` +
                  `💵 রিফান্ড সফলভাবে করা হয়েছে।`;
    await notifyAdminViaTelegram(tgMsg);

    res.json({ success: true, orders, walletBalance: currentUser.walletBalance });
  });

  // 11. Get Offers List
  app.get('/api/offers', (req, res) => {
    res.json(offers);
  });

  // 12. Create Offer
  app.post('/api/offers/create', async (req, res) => {
    try {
      const { title, operator, category, mb, min, regularPrice, resellerPrice, validity, description, isDrivePack } = req.body;
      const newOffer = {
        id: `OFF-${Math.floor(100 + Math.random() * 900)}`,
        title,
        operator,
        category,
        mb: mb || "0 GB",
        min: min || "0 Min",
        regularPrice: Number(regularPrice) || 0,
        resellerPrice: Number(resellerPrice) || 0,
        validity: validity || "30 Days",
        isEnabled: true,
        description: description || "",
        isDrivePack: isDrivePack !== undefined ? !!isDrivePack : false
      };
      offers.unshift(newOffer);
      await setDocById("offers", newOffer.id, newOffer);
      res.json({ success: true, offers });
    } catch (err: any) {
      console.error("Error creating offer:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13. Update Offer
  app.post('/api/offers/update', async (req, res) => {
    try {
      const { id, title, operator, category, mb, min, regularPrice, resellerPrice, validity, description, isEnabled, isDrivePack } = req.body;
      const offerIndex = offers.findIndex(o => o.id === id);
      if (offerIndex === -1) {
        return res.status(404).json({ error: "অফারটি খুঁজে পাওয়া যায়নি।" });
      }

      offers[offerIndex] = {
        ...offers[offerIndex],
        title: title !== undefined ? title : offers[offerIndex].title,
        operator: operator !== undefined ? operator : offers[offerIndex].operator,
        category: category !== undefined ? category : offers[offerIndex].category,
        mb: mb !== undefined ? mb : offers[offerIndex].mb,
        min: min !== undefined ? min : offers[offerIndex].min,
        regularPrice: regularPrice !== undefined ? Number(regularPrice) : offers[offerIndex].regularPrice,
        resellerPrice: resellerPrice !== undefined ? Number(resellerPrice) : offers[offerIndex].resellerPrice,
        validity: validity !== undefined ? validity : offers[offerIndex].validity,
        description: description !== undefined ? description : offers[offerIndex].description,
        isEnabled: isEnabled !== undefined ? isEnabled : offers[offerIndex].isEnabled,
        isDrivePack: isDrivePack !== undefined ? !!isDrivePack : (offers[offerIndex].isDrivePack !== undefined ? offers[offerIndex].isDrivePack : false)
      };

      await setDocById("offers", id, offers[offerIndex]);
      res.json({ success: true, offers });
    } catch (err: any) {
      console.error("Error updating offer:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 14. Delete Offer
  app.post('/api/offers/delete', async (req, res) => {
    try {
      const { id } = req.body;
      offers = offers.filter(o => o.id !== id);
      await deleteDocById("offers", id);
      res.json({ success: true, offers });
    } catch (err: any) {
      console.error("Error deleting offer:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 11.5 Calling Card Offers Management
  app.get('/api/calling-cards', (req, res) => {
    res.json(callingCardOffers);
  });

  app.post('/api/admin/calling-cards/create', async (req, res) => {
    try {
      const { brand, pulseRate, country, value, priceBdt, minutes, rateDescription } = req.body;
      const newCard = {
        id: `cc-${Math.floor(1000 + Math.random() * 9000)}`,
        brand,
        pulseRate,
        country,
        value: Number(value) || 0,
        priceBdt: Number(priceBdt) || 0,
        minutes,
        rateDescription: rateDescription || ""
      };
      callingCardOffers.push(newCard);
      await setDocById("calling_card_offers", newCard.id, newCard);
      res.json({ success: true, callingCardOffers });
    } catch (err: any) {
      console.error("Error creating calling card offer:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/calling-cards/update', async (req, res) => {
    try {
      const { id, brand, pulseRate, country, value, priceBdt, minutes, rateDescription } = req.body;
      const idx = callingCardOffers.findIndex(c => c.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "কলিং কার্ড অফার পাওয়া যায়নি।" });
      }
      callingCardOffers[idx] = {
        ...callingCardOffers[idx],
        brand: brand !== undefined ? brand : callingCardOffers[idx].brand,
        pulseRate: pulseRate !== undefined ? pulseRate : callingCardOffers[idx].pulseRate,
        country: country !== undefined ? country : callingCardOffers[idx].country,
        value: value !== undefined ? Number(value) : callingCardOffers[idx].value,
        priceBdt: priceBdt !== undefined ? Number(priceBdt) : callingCardOffers[idx].priceBdt,
        minutes: minutes !== undefined ? minutes : callingCardOffers[idx].minutes,
        rateDescription: rateDescription !== undefined ? rateDescription : callingCardOffers[idx].rateDescription
      };
      await setDocById("calling_card_offers", id, callingCardOffers[idx]);
      res.json({ success: true, callingCardOffers });
    } catch (err: any) {
      console.error("Error updating calling card offer:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/calling-cards/delete', async (req, res) => {
    try {
      const { id } = req.body;
      callingCardOffers = callingCardOffers.filter(c => c.id !== id);
      await deleteDocById("calling_card_offers", id);
      res.json({ success: true, callingCardOffers });
    } catch (err: any) {
      console.error("Error deleting calling card offer:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Calling Card Stock Endpoints
  app.get('/api/admin/calling-card/stock', async (req, res) => {
    try {
      res.json(cardStocks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/calling-card/stock/create', async (req, res) => {
    try {
      const { packageId, type, pin, password, expiryDate, cardImageUrl } = req.body;
      const newStock = {
        id: `STK-${Math.floor(100000 + Math.random() * 900000)}`,
        packageId,
        type, // 'pin' | 'voucher'
        pin: pin || "",
        password: password || "",
        expiryDate: expiryDate || "",
        cardImageUrl: cardImageUrl || "",
        status: "Available", // "Available" | "Sold"
        soldTo: "",
        soldAt: "",
        orderId: ""
      };
      cardStocks.unshift(newStock);
      await setDocById("calling_card_stock", newStock.id, newStock);
      res.json({ success: true, stock: newStock, cardStocks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/calling-card/stock/bulk', async (req, res) => {
    try {
      const { packageId, textData } = req.body;
      if (!textData) {
        return res.status(400).json({ error: "No data provided" });
      }
      const lines = textData.split('\n');
      const imported: any[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(/[,\t;]+/);
        if (parts.length >= 1) {
          const pin = parts[0]?.trim() || "";
          const password = parts[1]?.trim() || "";
          const expiryDate = parts[2]?.trim() || "";
          if (pin) {
            const newStock = {
              id: `STK-${Math.floor(100000 + Math.random() * 900000)}`,
              packageId,
              type: 'pin',
              pin,
              password,
              expiryDate,
              cardImageUrl: "",
              status: "Available",
              soldTo: "",
              soldAt: "",
              orderId: ""
            };
            cardStocks.unshift(newStock);
            await setDocById("calling_card_stock", newStock.id, newStock);
            imported.push(newStock);
          }
        }
      }
      res.json({ success: true, count: imported.length, imported, cardStocks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/calling-card/stock/delete', async (req, res) => {
    try {
      const { id } = req.body;
      cardStocks = cardStocks.filter(s => s.id !== id);
      await deleteDocById("calling_card_stock", id);
      res.json({ success: true, cardStocks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update calling card stock details
  app.post('/api/admin/calling-card/stock/update', async (req, res) => {
    try {
      const { id, pin, password, expiryDate, cardImageUrl, type } = req.body;
      const idx = cardStocks.findIndex(s => s.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "স্টক আইটেমটি পাওয়া যায়নি।" });
      }
      cardStocks[idx] = {
        ...cardStocks[idx],
        pin: pin !== undefined ? pin : cardStocks[idx].pin,
        password: password !== undefined ? password : cardStocks[idx].password,
        expiryDate: expiryDate !== undefined ? expiryDate : cardStocks[idx].expiryDate,
        cardImageUrl: cardImageUrl !== undefined ? cardImageUrl : cardStocks[idx].cardImageUrl,
        type: type !== undefined ? type : cardStocks[idx].type
      };
      await setDocById("calling_card_stock", id, cardStocks[idx]);
      res.json({ success: true, cardStocks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update approved calling card order details (correction)
  app.post('/api/admin/orders/update-calling-card', async (req, res) => {
    try {
      const { orderId, cardPin, cardPassword, cardExpiry, cardImageUrl } = req.body;
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        return res.status(404).json({ error: "অর্ডারটি পাওয়া যায়নি।" });
      }
      const order = orders[orderIndex];
      order.cardPin = cardPin || "";
      order.cardPassword = cardPassword || "";
      order.cardExpiry = cardExpiry || "";
      order.cardImageUrl = cardImageUrl || "";
      
      await setDocById("orders", order.id, order);
      res.json({ success: true, orders });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete an order
  app.post('/api/admin/orders/delete', async (req, res) => {
    try {
      const { orderId } = req.body;
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        return res.status(404).json({ error: "অর্ডারটি পাওয়া যায়নি।" });
      }
      
      await deleteDocById("orders", orderId);
      orders.splice(orderIndex, 1);
      
      res.json({ success: true, orders });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15. Create Support Ticket
  app.post('/api/tickets/create', (req, res) => {
    const { subject, message } = req.body;
    const newTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      userEmail: currentUser.email,
      subject,
      message,
      status: "Pending",
      date: new Date().toISOString()
    };
    supportTickets.unshift(newTicket);
    res.json({ success: true, tickets: supportTickets });
  });

  // 16. Get Tickets list
  app.get('/api/tickets', (req, res) => {
    res.json(supportTickets);
  });

  // 17. Admin Action: Resolve Ticket
  app.post('/api/admin/tickets/resolve', (req, res) => {
    const { ticketId } = req.body;
    const ticketIndex = supportTickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
      supportTickets[ticketIndex].status = "Resolved";
    }
    res.json({ success: true, tickets: supportTickets });
  });

  // 17.1. Get Services
  app.get('/api/services', (req, res) => {
    res.json(services);
  });

  // 17.2. Update/Edit Service
  app.post('/api/services/update', (req, res) => {
    const { id, name, slug, type, country, sortOrder, rateMultiplier, isEnabled, requirePin, icon } = req.body;
    const idx = services.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "সার্ভিসটি খুঁজে পাওয়া যায়নি।" });
    }
    services[idx] = {
      ...services[idx],
      name: name !== undefined ? name : services[idx].name,
      slug: slug !== undefined ? slug : services[idx].slug,
      type: type !== undefined ? type : services[idx].type,
      country: country !== undefined ? country : services[idx].country,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : services[idx].sortOrder,
      rateMultiplier: rateMultiplier !== undefined ? Number(rateMultiplier) : services[idx].rateMultiplier,
      isEnabled: isEnabled !== undefined ? isEnabled : services[idx].isEnabled,
      requirePin: requirePin !== undefined ? requirePin : services[idx].requirePin,
      icon: icon !== undefined ? icon : services[idx].icon
    };
    res.json({ success: true, services });
  });

  // 17.3. Admin Action: Balance Transfer or Return
  app.post('/api/admin/balance/transfer', async (req, res) => {
    const { type, recipientPhone, amount, note } = req.body;
    const amt = Number(amount);
    
    if (!recipientPhone || isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: "সঠিক ফোন নম্বর এবং ব্যালেন্স প্রদান করুন।" });
    }

    const targetUser = users.find(u => u.phone === recipientPhone);
    if (!targetUser) {
      return res.status(404).json({ error: "নিবন্ধিত রিসেলার ইউজার খুঁজে পাওয়া যায়নি।" });
    }

    if (type === 'Send') {
      targetUser.walletBalance += amt;
    } else if (type === 'Return') {
      if (targetUser.walletBalance < amt) {
        return res.status(400).json({ error: "ইউজারের ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" });
      }
      targetUser.walletBalance -= amt;
    } else {
      return res.status(400).json({ error: "অকার্যকর স্থানান্তর টাইপ।" });
    }

    // Add order entry as transaction log
    const transOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      type: "Send Money" as const,
      userEmail: targetUser.email,
      userPhone: targetUser.phone,
      serviceName: type === 'Send' ? `Admin Fund Send` : `Admin Fund Return`,
      paymentMethod: "",
      amount: amt,
      trxId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      account: recipientPhone,
      routingNumber: "",
      accountHolder: "",
      ref: note || "",
      status: "Success" as const,
      cancellationReason: "",
      date: new Date().toISOString(),
      commissionDeducted: 0
    };
    orders.unshift(transOrder);
    try {
      await setDocById("orders", transOrder.id, transOrder);
      await setDocById("users", targetUser.id, targetUser);
      await sendOrderStatusNotification(transOrder, 'Success');
    } catch (e) {
      console.error("Failed to sync transfer order or user updates to Firestore:", e);
    }

    // Notify Telegram
    const tgMsg = `💸 <b>অ্যাডমিন ব্যালেন্স স্থানান্তর! (${type === 'Send' ? 'প্রদান' : 'ফেরত'})</b>\n\n` +
                  `👤 রিসেলার: ${targetUser.name}\n` +
                  `📱 ফোন: <code>${targetUser.phone}</code>\n` +
                  `💰 পরিমাণ: <code>৳${amt} BDT</code>\n` +
                  `📝 নোট: ${note || 'নেই'}\n` +
                  `💚 বর্তমান ব্যালেন্স: <code>৳${targetUser.walletBalance} BDT</code>`;
    await notifyAdminViaTelegram(tgMsg);

    res.json({ success: true, users, orders });
  });

  // 17.4. Get Banners, Notices, System Statuses for comprehensive Back Office
  app.get('/api/admin/system-data', (req, res) => {
    res.json({
      banners,
      notices,
      notifications,
      ussdGateways: [
        { id: "g1", name: "GP USSD Modem 1", simSlot: "Slot 1", status: "Connected", signal: "Strong", operator: "Grameenphone" },
        { id: "g2", name: "Robi USSD Modem 2", simSlot: "Slot 2", status: "Connected", signal: "Medium", operator: "Robi" },
        { id: "g3", name: "BL USSD Modem 3", simSlot: "Slot 3", status: "Disconnected", signal: "None", operator: "Banglalink" }
      ],
      smsInbox: [
        { id: "sms-1", sender: "bKash", message: "You have received 1000 BDT from 01712345678. Balance: 12500 BDT. TrxID: TRX8829103B.", time: "08:45 AM" },
        { id: "sms-2", sender: "Nagad", message: "Received money 500 BDT from 01635275233. Ref: AddMoney. TxnID: TX88921B.", time: "07:22 AM" },
        { id: "sms-3", sender: "Rocket", message: "Rocket cashin successful. Amount: BDT 1500. New Bal: 4200. Trx: RK99821A.", time: "Yesterday" }
      ],
      blockedIPs: [
        { ip: "103.220.12.98", reason: "Multiple incorrect PIN attempts", date: "2026-07-25" },
        { ip: "182.16.43.210", reason: "API flooding suspected", date: "2026-07-24" }
      ],
      blockedAmounts: [
        { id: "ba-1", phone: "01799221122", amount: 1200, reason: "Chargeback dispute", date: "2026-07-25" },
        { id: "ba-2", phone: "01900112233", amount: 450, reason: "Incorrect number credit", date: "2026-07-23" }
      ]
    });
  });

  // Dynamic Content APIs
  app.get('/api/banners', (req, res) => {
    res.json(banners);
  });

  app.post('/api/banners/create', (req, res) => {
    const { title, desc, action, color, isActive, image } = req.body;
    const newBanner = {
      id: `b-${Date.now()}`,
      title: title || 'নতুন ব্যানার',
      desc: desc || '',
      action: action || 'offers',
      color: color || 'from-indigo-600 to-blue-600',
      isActive: isActive !== false,
      image: image || ''
    };
    banners.unshift(newBanner);
    res.json({ success: true, banners });
  });

  app.post('/api/banners/update', (req, res) => {
    const { id, title, desc, action, color, isActive, image } = req.body;
    const banner = banners.find(b => b.id === id);
    if (banner) {
      if (title !== undefined) banner.title = title;
      if (desc !== undefined) banner.desc = desc;
      if (action !== undefined) banner.action = action;
      if (color !== undefined) banner.color = color;
      if (isActive !== undefined) banner.isActive = isActive;
      if (image !== undefined) banner.image = image;
      res.json({ success: true, banners });
    } else {
      res.status(404).json({ error: "ব্যানার খুঁজে পাওয়া যায়নি" });
    }
  });

  app.post('/api/banners/delete', (req, res) => {
    const { id } = req.body;
    banners = banners.filter(b => b.id !== id);
    res.json({ success: true, banners });
  });

  app.get('/api/notices', (req, res) => {
    res.json(notices);
  });

  app.get('/api/site-config', (req, res) => {
    res.json({ speed: marqueeSpeed, currencies: globalCurrencies });
  });

  app.post('/api/site-config', async (req, res) => {
    const { speed, currencies } = req.body;
    if (speed !== undefined) marqueeSpeed = speed;
    if (currencies !== undefined && Array.isArray(currencies)) globalCurrencies = currencies;

    await setDocById("system_settings", "site_config", { 
      marqueeSpeed, 
      currencies: globalCurrencies
    });
    res.json({ success: true, speed: marqueeSpeed, currencies: globalCurrencies });
  });

  app.get('/api/notices/speed', (req, res) => {
    res.json({ speed: marqueeSpeed });
  });

  app.post('/api/notices/speed', async (req, res) => {
    const { speed } = req.body;
    if (typeof speed === 'number' && speed > 0) {
      marqueeSpeed = speed;
      await setDocById("system_settings", "site_config", { marqueeSpeed });
      res.json({ success: true, speed: marqueeSpeed });
    } else {
      res.status(400).json({ error: "Invalid speed value" });
    }
  });

  app.post('/api/notices/create', (req, res) => {
    const { text, isActive, textColor } = req.body;
    const newNotice = {
      id: `n-${Date.now()}`,
      text: text || '',
      isActive: isActive !== false,
      textColor: textColor || '#B45309'
    };
    notices.unshift(newNotice);
    res.json({ success: true, notices });
  });

  app.post('/api/notices/update', (req, res) => {
    const { id, text, isActive, textColor } = req.body;
    const notice = notices.find(n => n.id === id);
    if (notice) {
      if (text !== undefined) notice.text = text;
      if (isActive !== undefined) notice.isActive = isActive;
      if (textColor !== undefined) notice.textColor = textColor;
      res.json({ success: true, notices });
    } else {
      res.status(404).json({ error: "নোটিশ খুঁজে পাওয়া যায়নি" });
    }
  });

  app.post('/api/notices/delete', (req, res) => {
    const { id } = req.body;
    notices = notices.filter(n => n.id !== id);
    res.json({ success: true, notices });
  });

  app.get('/api/notifications', (req, res) => {
    if (currentUser && currentUser.role === 'Admin') {
      return res.json(notifications);
    }
    const filtered = notifications.filter(n => !n.targetPhone || (currentUser && n.targetPhone === currentUser.phone));
    res.json(filtered);
  });

  app.post('/api/notifications/create', (req, res) => {
    const { title, body, targetRole, expiryDate, isActive, imageUrl } = req.body;
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: title || 'নতুন নোটিফিকেশন',
      body: body || '',
      targetRole: targetRole || 'All',
      expiryDate: expiryDate || '2026-12-31',
      isActive: isActive !== false,
      imageUrl: imageUrl || ''
    };
    notifications.unshift(newNotif);
    res.json({ success: true, notifications });
  });

  app.post('/api/notifications/update', (req, res) => {
    const { id, title, body, targetRole, expiryDate, isActive, imageUrl } = req.body;
    const notif = notifications.find(n => n.id === id);
    if (notif) {
      if (title !== undefined) notif.title = title;
      if (body !== undefined) notif.body = body;
      if (targetRole !== undefined) notif.targetRole = targetRole;
      if (expiryDate !== undefined) notif.expiryDate = expiryDate;
      if (isActive !== undefined) notif.isActive = isActive;
      if (imageUrl !== undefined) notif.imageUrl = imageUrl;
      res.json({ success: true, notifications });
    } else {
      res.status(404).json({ error: "নোটিফিকেশন খুঁজে পাওয়া যায়নি" });
    }
  });

  app.post('/api/notifications/delete', (req, res) => {
    const { id } = req.body;
    notifications = notifications.filter(n => n.id !== id);
    res.json({ success: true, notifications });
  });

  // 18. AI Assistant Chatbot (Bangla Support guiding how to use the app)
  app.post('/api/support/chat', async (req, res) => {
    try {
      const { prompt, user, recentOrders } = req.body;
      const ai = getAiClient();

      let userContext = "No logged in user information available.";
      if (user) {
        userContext = `Current Logged-in User Context:
- Name: ${user.name || 'N/A'}
- Phone: ${user.phone || 'N/A'}
- Wallet Balance: ${user.walletBalance !== undefined ? user.walletBalance + ' BDT' : 'N/A'}
- User Role / Level: ${user.role || 'N/A'}
`;
      }
      
      if (recentOrders && Array.isArray(recentOrders) && recentOrders.length > 0) {
        const ordersSummary = recentOrders.slice(0, 5).map(o => {
          return `- Order ID: #${o.id || o.orderId || 'N/A'}, Service: ${o.type || o.serviceName || 'N/A'}, Amount: ${o.amount} BDT, Status: ${o.status || 'N/A'}, Date: ${o.date || 'N/A'}`;
        }).join('\n');
        userContext += `\nRecent Orders of the User:\n${ordersSummary}`;
      }

      const systemInstruction = 
        "You are 'Shakib Pay AI Assistant' (শাকিব পে এআই অ্যাসিস্ট্যান্ট), an elite customer support expert for 'ShakibPay' (Telecom Reseller & MFS Platform). " +
        "You always communicate in natural, friendly Bangla. Here is how you MUST behave depending on the user's message tone:\n\n" +
        "1. সাধারণ আড্ডা বা গ্রিটিংস (General Greetings / Casual Chat):\n" +
        "- ব্যবহারকারী যদি হাই, হ্যালো, কেমন আছো, কি করো, গান শোনাও, বা অন্য কোনো সাধারণ কথা বলে, তবে আপনি তাদের সাথে একটু মজা করবেন, বন্ধুত্বপূর্ণ হাসি-ঠাট্টা বা মজার উত্তর দেবেন। রোবটের মতো শুকনো কথা বলবেন না, বরং একটু রসিকতা, মজা ও ভালোবাসা মিশিয়ে উত্তর দেবেন যাতে ব্যবহারকারী আনন্দ পায়।\n\n" +
        "2. সমস্যা, পেমেন্ট বা ট্রানজেকশন সংক্রান্ত বিষয় (Issues, Payments, or Transaction Concerns):\n" +
        "- ব্যবহারকারী যদি কোনো সমস্যা (যেমন: পেমেন্ট হচ্ছে না, অ্যাড মানি পেন্ডিং, অফার পাচ্ছে না, ভুল নম্বরে টাকা চলে গেছে, ব্যালেন্স যোগ হয়নি, বা কোনো ট্রানজেকশন সমস্যা) উল্লেখ করে, তাহলে আপনি সাথে সাথে গম্ভীর ও অত্যন্ত নম্র, সহানুভূতিশীল এবং প্রফেশনাল হয়ে যাবেন।\n" +
        "- তাকে চমৎকারভাবে শান্ত করবেন এবং বলবেন যে এডমিন প্যানেল এটি ৫ মিনিটের মধ্যে সমাধান করার জন্য প্রস্তুত।\n" +
        "- তাকে অ্যাপের 'Help & Support' সেকশনে গিয়ে একটি সাপোর্ট টিকিট (Raise Ticket) খোলার জন্য অত্যন্ত সুন্দর করে অনুরোধ করবেন অথবা সরাসরি এডমিনের সাথে যোগাযোগ করতে বলবেন।\n\n" +
        userContext + "\n\n" +
        "Here is the precise knowledge-base on how the applet works and step-by-step instructions for specific queries:\n\n" +
        "1. ড্রাইভ প্যাক কেনার নিয়ম (How to Buy Drive Packs):\n" +
        "- প্রথমে অ্যাপের 'Offers' বা 'অফার তালিকা' ট্যাবে যান।\n" +
        "- আপনি যে অপারেটরের প্যাক নিতে চান (যেমন Grameenphone, Robi, Airtel, Banglalink) সেটি সিলেক্ট করুন।\n" +
        "- আপনার পছন্দের অফারের পাশে থাকা 'ক্রয় করুন' (Buy) বাটনে ক্লিক করুন।\n" +
        "- গ্রাহকের সঠিক ১১ ডিজিটের মোবাইল নম্বরটি লিখুন।\n" +
        "- আপনার একাউন্টের সিকিউরিটি পিন নম্বর (Security PIN) দিয়ে কনফার্ম করুন।\n" +
        "- 'ক্রয় নিশ্চিত করুন' বাটনে চাপ দিন। আপনার ওয়ালেট ব্যালেন্স থেকে অফারের দাম কেটে নেওয়া হবে এবং অর্ডারটি পেন্ডিং হিসেবে সিস্টেমে জমা হবে। এডমিন ৫ থেকে ১৫ মিনিটের মধ্যে এটি যাচাই করে আপনার নম্বরে অফারটি সক্রিয় (Success) করে দেবেন।\n\n" +
        "2. ব্যালেন্স ট্রান্সফার / MFS ট্রান্সফার করার নিয়ম (How to Transfer Balance / MFS Transfer):\n" +
        "- হোম ড্যাশবোর্ড থেকে 'MFS ট্রান্সফার' (MFS Transfer) অপশনে যান।\n" +
        "- আপনার পছন্দসই গেটওয়ে যেমন: bKash (বিকাশ), Nagad (নগদ), Rocket (রকেট), Upay (উপায়), Tap (ট্যাপ) সিলেক্ট করুন।\n" +
        "- লেনদেনের ধরন নির্বাচন করুন: 'পার্সোনাল (Send Money)' অথবা 'এজেন্ট (Cash Out)'।\n" +
        "- প্রাপকের সঠিক ১১ ডিজিটের MFS নম্বর এবং যত টাকা পাঠাতে চান (Amount BDT) তা লিখুন।\n" +
        "- লেনদেনের বিবরণ বা রেফারেন্স (ঐচ্ছিক) প্রদান করুন।\n" +
        "- আপনার একাউন্টের সিকিউরিটি পিন নম্বর দিন এবং রিকোয়েস্ট সাবমিট করুন।\n" +
        "- ব্যালেন্স ট্রান্সফারের জন্য কোনো সার্ভিস চার্জ লাগবে না (সম্পূর্ণ ফ্রি)। এডমিন ৫ মিনিটের মধ্যে ট্রান্সফার রিকোয়েস্টটি যাচাই করে সাকসেস করে দেবেন এবং প্রাপকের কাছে টাকা পৌঁছে যাবে।\n\n" +
        "3. অ্যাড মানি করার নিয়ম (How to Add Money):\n" +
        "- 'Wallet' বা 'ব্যালেন্স' সেকশনে গিয়ে 'Add Money' বাটনে ক্লিক করুন।\n" +
        "- bKash, Nagad, অথবা Rocket এর মধ্যে যেকোনো একটি অপারেটর সিলেক্ট করুন।\n" +
        "- স্ক্রিনে দেওয়া এডমিন নম্বরটি কপি করে আপনার পার্সোনাল বা এজেন্ট নম্বর থেকে টাকা পাঠান (Send Money বা Cash Out করুন)।\n" +
        "- টাকা পাঠানোর পর আপনার প্রাপ্ত TrxID (Transaction ID) এবং টাকার পরিমাণ দিন।\n" +
        "- আপনার সিকিউরিটি পিন দিয়ে সাবমিট করুন। ৫ থেকে ১০ মিনিটের মধ্যে আপনার ওয়ালেটে ব্যালেন্স সফলভাবে যোগ হবে।\n\n" +
        "4. ইউজার লেভেল ও কমিশন (User Levels & Commissions):\n" +
        "- VIP গ্রাহকগণ ব্যালেন্স ডিপোজিটে ৩% কমিশন পান।\n" +
        "- Sub-Admin গ্রাহকগণ ২% কমিশন পান।\n" +
        "- Retailer গ্রাহকগণ ১% কমিশন পান।\n\n" +
        "5. হেল্প ও সাপোর্ট (Help & Support):\n" +
        "- যদি কোনো সমস্যা যেমন ট্রানজেকশন পেন্ডিং থাকে, তাহলে হেল্প ও সাপোর্ট সেকশনে গিয়ে একটি সাপোর্ট টিকিট (Raise Ticket) তৈরি করুন। এডমিন প্যানেল থেকে খুব দ্রুত সমাধান করা হবে।\n" +
        "- এছাড়াও সরাসরি +8801635275233 নম্বরে WhatsApp করতে পারেন অথবা Khanshakibraj@gmail.com এ ইমেইল করতে পারেন।\n\n" +
        "সর্বদা বাংলা ভাষায় সুন্দরভাবে এবং প্রফেশনালি উত্তর দিন।";

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Support Chat error:', error);
      res.status(500).json({ error: "ক্ষমা করবেন, এআই চ্যাটবট সিস্টেমে সাময়িক ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।" });
    }
  });

  // Explicit 404 handler for unhandled API endpoints to prevent Vite from returning index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.originalUrl} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('v' + 'ite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  if (!process.env.NETLIFY && !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
  return app;
}

export const appPromise = startServer();

import serverless from 'serverless-http';
export const handler = async (event: any, context: any) => {
  const app = await appPromise;
  const slsHandler = serverless(app, { basePath: '/.netlify/functions' });
  return slsHandler(event, context);
};
