import { User, Order, Offer, SupportTicket } from '../types';
import {
  getUsers,
  getOrders,
  getOffers,
  getCardStocks,
  getCallingCardOffers,
  getTickets,
  getBanners,
  getNotices,
  getNotifications,
  getServices,
  getAdminInfo,
  updateAdminInfo,
  setDocById,
  deleteDocById,
  getDocById,
  defaultUsers,
  defaultOffers,
  defaultBanners,
  defaultNotices,
  defaultNotifications,
  defaultServices,
  defaultOrders,
  defaultTickets
} from '../lib/firebaseDb';

// LocalStorage session helper for tracking the browser's logged-in state
const TELEGRAM_BOT_TOKEN = "8365542422:AAEdETBJTNiokHkpWicf6sZ3p1naFIz4mwM";
const TELEGRAM_ADMIN_CHAT_ID = "6068195063";

async function notifyAdminViaTelegram(message: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    };
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Telegram notification error from client:', error);
  }
}

async function sendTelegramPhoto(caption: string, base64Image: string) {
  try {
    if (!base64Image) {
      await notifyAdminViaTelegram(caption);
      return;
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_ADMIN_CHAT_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    formData.append('photo', blob, 'receipt.png');
    
    await fetch(url, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.error('Telegram sendPhoto error from client:', error);
    await notifyAdminViaTelegram(caption);
  }
}

function getStored<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function handleMockApi(url: string, init?: RequestInit): Promise<Response> {
  const method = init?.method?.toUpperCase() || 'GET';
  const body = init?.body ? JSON.parse(init.body as string) : null;

  const responseJson = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const cachedSession = getStored<User | null>('sp_mock_session_user', null);

  // 1. Auth endpoints
  if (url === '/api/auth/login') {
    const { loginId, password, pin } = body;
    const users = await getUsers();

    // Special bypass for Admin PIN: 018811sh
    if (pin === '018811sh') {
      let found = users.find(u => u.role === 'Admin');
      if (!found) {
        found = {
          id: "usr-shakib",
          name: "Shakib Raj",
          email: "Khanshakibraj@gmail.com",
          phone: loginId || "01635275233",
          profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          role: "Admin" as any,
          walletBalance: 12500,
          pin: "018811sh",
          password: "Pass 018811",
          status: "Active",
          commissionRate: 0,
          walletLimit: 500000
        };
        try {
          await setDocById("users", found.id, found);
        } catch (e) {
          console.warn("Firestore write for admin seed failed, continuing in-memory:", e);
        }
      } else {
        found.pin = "018811sh";
        try {
          await setDocById("users", found.id, found);
        } catch (e) {
          console.warn("Firestore write for admin update failed, continuing in-memory:", e);
        }
      }
      setStored('sp_mock_session_user', found);
      return responseJson({ success: true, user: found });
    }

    const found = users.find(u => u.phone === loginId || u.email === loginId);
    if (!found) return responseJson({ error: "ইউজার খুঁজে পাওয়া যায়নি।" }, 400);
    if (found.password !== password) return responseJson({ error: "ভুল পাসওয়ার্ড।" }, 400);
    if (found.pin !== pin) return responseJson({ error: "ভুল পিন নম্বর।" }, 400);
    if (found.status === 'Suspended') return responseJson({ error: "আপনার অ্যাকাউন্ট সাময়িকভাবে বন্ধ করা হয়েছে।" }, 400);
    setStored('sp_mock_session_user', found);
    return responseJson({ success: true, user: found });
  }

  if (url === '/api/auth/admin-login') {
    const { email, password, pin } = body;
    if (email !== 'Khanshakibraj@gmail.com' || password !== 'Pass 018811' || pin !== '0188') {
      return responseJson({ error: "ভুল এডমিন ক্রেডেনশিয়াল!" }, 400);
    }
    const users = await getUsers();
    let found = users.find(u => u.email === 'Khanshakibraj@gmail.com');
    if (!found) {
      found = {
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
        commissionRate: 0,
        walletLimit: 500000
      };
      await setDocById("users", found.id, found);
    }
    setStored('sp_mock_session_user', found);
    return responseJson({ success: true, user: found });
  }

  if (url === '/api/auth/register') {
    const { name, phone, email, password, pin } = body;
    const users = await getUsers();
    if (users.find(u => u.phone === phone || u.email === email)) {
      return responseJson({ error: "এই ফোন বা ইমেইল দিয়ে ইতিমধ্যেই অ্যাকাউন্ট খোলা হয়েছে।" }, 400);
    }
    const newUser: User = {
      id: "usr-" + Date.now(),
      name,
      phone,
      email,
      password,
      pin,
      profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      role: "Normal User" as any,
      walletBalance: 0,
      status: "Active",
      commissionRate: 1,
      walletLimit: 20000
    };
    await setDocById("users", newUser.id, newUser);
    setStored('sp_mock_session_user', newUser);
    return responseJson({ success: true, user: newUser });
  }

  if (url === '/api/auth/logout') {
    setStored('sp_mock_session_user', null);
    return responseJson({ success: true });
  }

  // 2. User Profile Endpoints
  if (url === '/api/user/profile') {
    if (!cachedSession) return responseJson({ error: "Unauthorized" }, 401);
    const user = await getDocById<User>("users", cachedSession.id);
    if (!user) return responseJson({ error: "User not found" }, 401);

    if (method === 'POST') {
      const { name, email, profilePic } = body;
      const updated = { ...user };
      if (name) updated.name = name;
      if (email) updated.email = email;
      if (profilePic) updated.profilePic = profilePic;
      
      await setDocById("users", updated.id, updated);
      setStored('sp_mock_session_user', updated);
      return responseJson({ success: true, user: updated });
    }
    return responseJson(user);
  }

  if (url === '/api/user/change-password' && method === 'POST') {
    if (!cachedSession) return responseJson({ error: "Unauthorized" }, 401);
    const user = await getDocById<User>("users", cachedSession.id);
    if (!user) return responseJson({ error: "User not found" }, 401);

    if (user.password !== body.oldPassword) {
      return responseJson({ error: "পুরাতন পাসওয়ার্ড সঠিক নয়।" }, 400);
    }
    user.password = body.newPassword;
    await setDocById("users", user.id, user);
    return responseJson({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।" });
  }

  if (url === '/api/user/change-pin' && method === 'POST') {
    if (!cachedSession) return responseJson({ error: "Unauthorized" }, 401);
    const user = await getDocById<User>("users", cachedSession.id);
    if (!user) return responseJson({ error: "User not found" }, 401);

    if (user.pin !== body.oldPin) {
      return responseJson({ error: "পুরাতন পিন নম্বর সঠিক নয়।" }, 400);
    }
    user.pin = body.newPin;
    await setDocById("users", user.id, user);
    return responseJson({ success: true, message: "পিন নম্বর সফলভাবে পরিবর্তিত হয়েছে।" });
  }

  // 3. User Creation (Resellers)
  if (url === '/api/users/create') {
    const { name, email, phone, role, password, pin, initialBalance } = body;
    if (!cachedSession) return responseJson({ error: "Unauthorized" }, 401);
    const sessionUser = await getDocById<User>("users", cachedSession.id);
    if (!sessionUser) return responseJson({ error: "Unauthorized" }, 401);
    
    const ROLE_HIERARCHY: Record<string, number> = {
      'Admin': 6,
      'Sub-Admin': 5,
      'Reseller': 4,
      'Dealer': 4,
      'Retailer': 3,
      'VIP': 2,
      'Normal User': 1
    };

    const currentPower = ROLE_HIERARCHY[sessionUser.role] || 1;
    const targetPower = ROLE_HIERARCHY[role] || 1;

    if (targetPower >= currentPower) {
      return responseJson({ error: "আপনার এই স্তরের ইউজার তৈরি করার অনুমতি নেই।" }, 403);
    }

    const users = await getUsers();
    if (users.find(u => u.phone === phone)) {
      return responseJson({ error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে ইউজার রেজিস্টার্ড আছে।" }, 400);
    }

    const initBal = Number(initialBalance) || 0;
    if (initBal > 0 && sessionUser.walletBalance < initBal) {
      return responseJson({ error: "নতুন ইউজারকে ফান্ড দিতে আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" }, 400);
    }

    if (initBal > 0) {
      const updatedSession = { ...sessionUser };
      updatedSession.walletBalance -= initBal;
      const setupOrd: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        type: "Send Money",
        userEmail: updatedSession.email,
        userPhone: updatedSession.phone,
        serviceName: `Reseller Setup Fund (${name})`,
        paymentMethod: "",
        amount: initBal,
        trxId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        account: phone,
        routingNumber: "",
        accountHolder: "",
        ref: "Setup initial balance",
        status: "Success",
        cancellationReason: "",
        date: new Date().toISOString(),
        commissionDeducted: 0
      };
      await setDocById("orders", setupOrd.id, setupOrd);
      await setDocById("users", updatedSession.id, updatedSession);
      setStored('sp_mock_session_user', updatedSession);
    }

    const newUser: User = {
      id: `usr-${Math.floor(100 + Math.random() * 900)}`,
      name,
      email: email || `${phone}@shakibpay.com`,
      phone,
      profilePic: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      role: role || "Retailer",
      walletBalance: initBal,
      pin,
      password,
      status: "Active",
      commissionRate: 1,
      walletLimit: 20000,
      createdBy: sessionUser.id,
      createdByPhone: sessionUser.phone
    };

    await setDocById("users", newUser.id, newUser);
    const updatedUsers = await getUsers();
    return responseJson({ success: true, users: updatedUsers, currentUserBalance: sessionUser.walletBalance - initBal });
  }

  // 4. Send Money
  if (url === '/api/user/send-money') {
    const { amount, targetPhone, pin } = body;
    if (!cachedSession) return responseJson({ error: "Unauthorized" }, 401);
    const sessionUser = await getDocById<User>("users", cachedSession.id);
    if (!sessionUser) return responseJson({ error: "Unauthorized" }, 401);

    if (sessionUser.pin !== pin) {
      return responseJson({ error: "ভুল সিকিউরিটি পিন নম্বর।" }, 400);
    }

    const amt = Number(amount);
    if (sessionUser.walletBalance < amt) {
      return responseJson({ error: "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" }, 400);
    }

    const users = await getUsers();
    const recipient = users.find(u => u.phone === targetPhone);
    if (!recipient) return responseJson({ error: "প্রাপক ইউজার খুঁজে পাওয়া যায়নি।" }, 400);

    const updatedSender = { ...sessionUser };
    updatedSender.walletBalance -= amt;

    const updatedRecipient = { ...recipient };
    updatedRecipient.walletBalance += amt;

    const txId = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const ord: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      type: "Send Money",
      userEmail: updatedSender.email,
      userPhone: updatedSender.phone,
      serviceName: `সেন্ড মানি (${recipient.name})`,
      paymentMethod: "Wallet Transfer",
      amount: amt,
      trxId: txId,
      account: targetPhone,
      routingNumber: "",
      accountHolder: recipient.name,
      ref: "ব্যক্তিগত সেন্ড মানি",
      status: "Success",
      cancellationReason: "",
      date: new Date().toISOString(),
      commissionDeducted: 0
    };

    await setDocById("orders", ord.id, ord);
    await setDocById("users", updatedSender.id, updatedSender);
    await setDocById("users", updatedRecipient.id, updatedRecipient);

    setStored('sp_mock_session_user', updatedSender);
    return responseJson({ success: true, trxId: txId, newBalance: updatedSender.walletBalance });
  }

  // 5. Orders create
  if (url === '/api/orders/create') {
    const { type, amount, paymentMethod, trxId, account, routingNumber, accountHolder, ref, serviceName } = body;
    if (!cachedSession) return responseJson({ error: "Unauthorized" }, 401);
    const sessionUser = await getDocById<User>("users", cachedSession.id);
    if (!sessionUser) return responseJson({ error: "Unauthorized" }, 401);
    
    const isPaymentAndWallet = type !== 'Deposit' && type !== 'Bank Deposit' && paymentMethod === 'My Wallet Balance';
    if (isPaymentAndWallet && sessionUser.walletBalance < Number(amount)) {
      return responseJson({ error: "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" }, 400);
    }

    const updatedUser = { ...sessionUser };
    if (isPaymentAndWallet) {
      updatedUser.walletBalance -= Number(amount);
    }

    const newOrd: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      userEmail: updatedUser.email,
      userPhone: updatedUser.phone,
      serviceName: serviceName || "সার্ভিস পেমেন্ট",
      paymentMethod: paymentMethod || "",
      amount: Number(amount),
      trxId: trxId || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      account: account || "",
      routingNumber: routingNumber || "",
      accountHolder: accountHolder || "",
      ref: ref || "",
      status: "Pending",
      cancellationReason: "",
      date: new Date().toISOString(),
      commissionDeducted: type === 'Deposit' ? Number(amount) * 0.02 : 0 // 2% commission
    };

    await setDocById("orders", newOrd.id, newOrd);
    if (isPaymentAndWallet) {
      await setDocById("users", updatedUser.id, updatedUser);
      setStored('sp_mock_session_user', updatedUser);
    }

    // Send Telegram Notification in the background (client-side)
    const tgMsg = `🚨 <b>নতুন অর্ডারের আবেদন! (Vercel App)</b>\n\n` +
                  `👤 ইউজার: ${updatedUser.name} (${updatedUser.role})\n` +
                  `📱 ফোন: <code>${newOrd.userPhone}</code>\n` +
                  `💼 সার্ভিস/ব্যাংক: ${newOrd.serviceName} ${newOrd.paymentMethod ? `(${newOrd.paymentMethod})` : ''}\n` +
                  `💰 পরিমাণ: <code>৳${newOrd.amount} BDT</code>\n` +
                  `🔑 ট্রানজেকশন ID/অ্যাকাউন্ট: <code>${newOrd.trxId || newOrd.account}</code>\n` +
                  `📅 তারিখ: ${new Date().toLocaleString('bn-BD')}\n` +
                  `🟡 স্ট্যাটাস: ${newOrd.status.toUpperCase()}`;

    const receiptImage = body?.receiptImage || '';
    if (receiptImage) {
      sendTelegramPhoto(tgMsg, receiptImage).catch(err => console.error("Client Telegram sending failed:", err));
    } else {
      notifyAdminViaTelegram(tgMsg).catch(err => console.error("Client Telegram sending failed:", err));
    }

    return responseJson({ success: true, order: newOrd, newBalance: updatedUser.walletBalance });
  }

  // 6. Admin sub-resellers list
  if (url === '/api/admin/users') {
    if (!cachedSession) return responseJson({ error: "Unauthorized" }, 401);
    const sessionUser = await getDocById<User>("users", cachedSession.id);
    if (!sessionUser) return responseJson({ error: "Unauthorized" }, 401);

    const ROLE_HIERARCHY: Record<string, number> = {
      'Admin': 6,
      'Sub-Admin': 5,
      'Reseller': 4,
      'Dealer': 4,
      'Retailer': 3,
      'VIP': 2,
      'Normal User': 1
    };
    const currentPower = ROLE_HIERARCHY[sessionUser.role] || 1;
    const allUsers = await getUsers();

    if (sessionUser.role === 'Admin') {
      return responseJson(allUsers);
    } else {
      const filtered = allUsers.filter(u => {
        if (u.id === sessionUser.id) return false;
        const isCreatedByMe = (u.createdBy && u.createdBy === sessionUser.id) ||
                             (u.createdByPhone && u.createdByPhone === sessionUser.phone);
        return isCreatedByMe;
      });
      return responseJson(filtered);
    }
  }

  // Admin user status, limits, and roles updates
  if (url === '/api/admin/users/update-balance' && method === 'POST') {
    const { userId, amount, action } = body;
    const userObj = await getDocById<User>("users", userId);
    if (!userObj) return responseJson({ error: "ইউজার খুঁজে পাওয়া যায়নি।" }, 404);

    const amt = Number(amount);
    if (action === 'add') {
      userObj.walletBalance += amt;
    } else {
      if (userObj.walletBalance < amt) return responseJson({ error: "পর্যাপ্ত ব্যালেন্স নেই।" }, 400);
      userObj.walletBalance -= amt;
    }
    await setDocById("users", userObj.id, userObj);
    const allUsers = await getUsers();
    return responseJson({ success: true, users: allUsers });
  }

  if (url === '/api/admin/users/update-role' && method === 'POST') {
    const { userId, role } = body;
    const userObj = await getDocById<User>("users", userId);
    if (!userObj) return responseJson({ error: "ইউজার খুঁজে পাওয়া যায়নি।" }, 404);
    userObj.role = role;
    await setDocById("users", userObj.id, userObj);
    const allUsers = await getUsers();
    return responseJson({ success: true, users: allUsers });
  }

  if (url === '/api/admin/users/update-limits' && method === 'POST') {
    const { userId, walletLimit, commissionRate } = body;
    const userObj = await getDocById<User>("users", userId);
    if (!userObj) return responseJson({ error: "ইউজার খুঁজে পাওয়া যায়নি।" }, 404);
    if (walletLimit !== undefined) userObj.walletLimit = Number(walletLimit);
    if (commissionRate !== undefined) userObj.commissionRate = Number(commissionRate);
    await setDocById("users", userObj.id, userObj);
    const allUsers = await getUsers();
    return responseJson({ success: true, users: allUsers });
  }

  if (url === '/api/admin/users/update-status' && method === 'POST') {
    const { userId, status } = body;
    const userObj = await getDocById<User>("users", userId);
    if (!userObj) return responseJson({ error: "ইউজার খুঁজে পাওয়া যায়নি।" }, 404);
    userObj.status = status;
    await setDocById("users", userObj.id, userObj);
    const allUsers = await getUsers();
    return responseJson({ success: true, users: allUsers });
  }

  // 7. General GET lists
  if (url === '/api/orders') {
    if (!cachedSession) return responseJson([]);
    const allOrders = await getOrders();
    const sessionUser = await getDocById<User>("users", cachedSession.id);
    if (!sessionUser) return responseJson([]);

    const filtered = sessionUser.role === 'Admin' 
      ? allOrders 
      : allOrders.filter(o => o.userPhone === sessionUser.phone || o.userEmail === sessionUser.email);
    return responseJson(filtered);
  }

  if (url === '/api/offers') {
    const offers = await getOffers();
    return responseJson(offers);
  }

  // Offers creation/update/deletion
  if (url === '/api/offers/create' && method === 'POST') {
    const newOffer: Offer = {
      ...body,
      id: body.id || `off-${Date.now()}`
    };
    await setDocById("offers", newOffer.id, newOffer);
    const offers = await getOffers();
    return responseJson({ success: true, offers });
  }

  if (url === '/api/offers/update' && method === 'POST') {
    await setDocById("offers", body.id, body);
    const offers = await getOffers();
    return responseJson({ success: true, offers });
  }

  if (url === '/api/offers/delete' && method === 'POST') {
    await deleteDocById("offers", body.id);
    const offers = await getOffers();
    return responseJson({ success: true, offers });
  }

  if (url === '/api/tickets') {
    if (!cachedSession) return responseJson([]);
    const sessionUser = await getDocById<User>("users", cachedSession.id);
    if (!sessionUser) return responseJson([]);

    const tickets = await getTickets();
    const filtered = sessionUser.role === 'Admin'
      ? tickets
      : tickets.filter(t => t.userPhone === sessionUser.phone || t.userEmail === sessionUser.email);
    return responseJson(filtered);
  }

  if (url === '/api/tickets/create' && method === 'POST') {
    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      userEmail: body.userEmail,
      userPhone: body.userPhone || "",
      subject: body.subject,
      message: body.message,
      status: "Pending",
      date: new Date().toISOString(),
      replies: []
    };
    await setDocById("tickets", newTicket.id, newTicket);
    const tickets = await getTickets();
    return responseJson({ success: true, ticket: newTicket, tickets });
  }

  if (url === '/api/admin/tickets/resolve' && method === 'POST') {
    const { ticketId } = body;
    const ticket = await getDocById<SupportTicket>("tickets", ticketId);
    if (ticket) {
      ticket.status = "Resolved";
      await setDocById("tickets", ticketId, ticket);
    }
    const tickets = await getTickets();
    return responseJson({ success: true, tickets });
  }

  if (url === '/api/support/chat' && method === 'POST') {
    const { ticketId, sender, message } = body;
    const ticket = await getDocById<SupportTicket>("tickets", ticketId);
    if (ticket) {
      if (!ticket.replies) ticket.replies = [];
      ticket.replies.push({
        sender,
        message,
        date: new Date().toISOString()
      });
      await setDocById("tickets", ticketId, ticket);
    }
    return responseJson({ success: true, ticket });
  }

  if (url === '/api/banners') {
    const banners = await getBanners();
    return responseJson(banners);
  }

  if (url === '/api/banners/create' && method === 'POST') {
    const newB = { ...body, id: `b-${Date.now()}` };
    await setDocById("banners", newB.id, newB);
    const banners = await getBanners();
    return responseJson({ success: true, banners });
  }

  if (url === '/api/banners/update' && method === 'POST') {
    await setDocById("banners", body.id, body);
    const banners = await getBanners();
    return responseJson({ success: true, banners });
  }

  if (url === '/api/banners/delete' && method === 'POST') {
    await deleteDocById("banners", body.id);
    const banners = await getBanners();
    return responseJson({ success: true, banners });
  }

  if (url === '/api/notices') {
    const notices = await getNotices();
    return responseJson(notices);
  }

  if (url === '/api/notices/create' && method === 'POST') {
    const newN = { ...body, id: `n-${Date.now()}` };
    await setDocById("notices", newN.id, newN);
    const notices = await getNotices();
    return responseJson({ success: true, notices });
  }

  if (url === '/api/notices/update' && method === 'POST') {
    await setDocById("notices", body.id, body);
    const notices = await getNotices();
    return responseJson({ success: true, notices });
  }

  if (url === '/api/notices/delete' && method === 'POST') {
    await deleteDocById("notices", body.id);
    const notices = await getNotices();
    return responseJson({ success: true, notices });
  }

  if (url === '/api/notifications') {
    const notifications = await getNotifications();
    const sessionUser = cachedSession ? await getDocById<User>("users", cachedSession.id) : null;
    if (sessionUser && sessionUser.role === 'Admin') {
      return responseJson(notifications);
    }
    const filtered = notifications.filter(n => !n.targetPhone || (sessionUser && n.targetPhone === sessionUser.phone));
    return responseJson(filtered);
  }

  if (url === '/api/notifications/create' && method === 'POST') {
    const newNf = { ...body, id: `nf-${Date.now()}` };
    await setDocById("notifications", newNf.id, newNf);
    const notifications = await getNotifications();
    return responseJson({ success: true, notifications });
  }

  if (url === '/api/notifications/update' && method === 'POST') {
    await setDocById("notifications", body.id, body);
    const notifications = await getNotifications();
    return responseJson({ success: true, notifications });
  }

  if (url === '/api/notifications/delete' && method === 'POST') {
    await deleteDocById("notifications", body.id);
    const notifications = await getNotifications();
    return responseJson({ success: true, notifications });
  }

  if (url === '/api/services') {
    const services = await getServices();
    return responseJson(services);
  }

  if (url === '/api/services/update' && method === 'POST') {
    await setDocById("services", body.id, body);
    const services = await getServices();
    return responseJson({ success: true, services });
  }

  if (url === '/api/admin/info') {
    const adminSettings = await getAdminInfo();
    return responseJson(adminSettings);
  }

  // Admin order approvals & rejections
  if (url === '/api/admin/orders/approve' && method === 'POST') {
    const { orderId } = body;
    const order = await getDocById<Order>("orders", orderId);
    if (!order) return responseJson({ error: "অর্ডার খুঁজে পাওয়া যায়নি।" }, 404);
    if (order.status !== 'Pending') return responseJson({ error: "অর্ডারটি ইতিমধ্যে সম্পন্ন বা বাতিল হয়েছে।" }, 400);

    order.status = 'Success';
    await setDocById("orders", orderId, order);

    // If "Add Money" / "Deposit" or "Bank Deposit", update user wallet balance
    let userName = "ইউজার";
    if (order.type === 'Deposit' || order.type === 'Bank Deposit' || order.type === 'Add Money') {
      const users = await getUsers();
      const orderUser = users.find(u => u.phone === order.userPhone || u.email === order.userEmail);
      if (orderUser) {
        orderUser.walletBalance += order.amount;
        userName = orderUser.name;
        await setDocById("users", orderUser.id, orderUser);
      }
    }

    // Send Telegram Notification
    const approveMsg = `✅ <b>অর্ডার সম্পন্ন করা হয়েছে! (Vercel App)</b>\n\n` +
                       `🆔 অর্ডার ID: <code>${order.id}</code>\n` +
                       `👤 ইউজার: ${userName}\n` +
                       `📱 ফোন: <code>${order.userPhone}</code>\n` +
                       `💼 সার্ভিস/ব্যাংক: ${order.serviceName}\n` +
                       `💰 পরিমাণ: <code>৳${order.amount} BDT</code>\n` +
                       `🟢 স্ট্যাটাস: SUCCESSFUL`;
    notifyAdminViaTelegram(approveMsg).catch(err => console.error("Client approve Telegram notify failed:", err));

    const orders = await getOrders();
    return responseJson({ success: true, orders });
  }

  if (url === '/api/admin/orders/reject' && method === 'POST') {
    const { orderId, reason } = body;
    const order = await getDocById<Order>("orders", orderId);
    if (!order) return responseJson({ error: "অর্ডার খুঁজে পাওয়া যায়নি।" }, 404);
    if (order.status !== 'Pending') return responseJson({ error: "অর্ডারটি ইতিমধ্যে সম্পন্ন বা বাতিল হয়েছে।" }, 400);

    order.status = 'Cancelled';
    order.cancellationReason = reason || "অ্যাডমিন দ্বারা বাতিল";
    await setDocById("orders", orderId, order);

    let userName = "ইউজার";
    // If payment was made using wallet, refund user wallet balance
    if (order.paymentMethod === 'My Wallet Balance') {
      const users = await getUsers();
      const orderUser = users.find(u => u.phone === order.userPhone || u.email === order.userEmail);
      if (orderUser) {
        orderUser.walletBalance += order.amount;
        userName = orderUser.name;
        await setDocById("users", orderUser.id, orderUser);
      }
    }

    // Send Telegram Notification
    const rejectMsg = `❌ <b>অর্ডার বাতিল করা হয়েছে! (Vercel App)</b>\n\n` +
                     `🆔 অর্ডার ID: <code>${order.id}</code>\n` +
                     `👤 ইউজার: ${userName}\n` +
                     `📱 ফোন: <code>${order.userPhone}</code>\n` +
                     `💼 সার্ভিস/ব্যাংক: ${order.serviceName}\n` +
                     `💰 পরিমাণ: <code>৳${order.amount} BDT</code>\n` +
                     `⚠️ কারণ: ${order.cancellationReason}\n` +
                     `🔴 স্ট্যাটাস: REJECTED`;
    notifyAdminViaTelegram(rejectMsg).catch(err => console.error("Client reject Telegram notify failed:", err));

    const orders = await getOrders();
    return responseJson({ success: true, orders });
  }

  if (url === '/api/admin/balance/transfer' && method === 'POST') {
    const { fromPhone, toPhone, amount } = body;
    const users = await getUsers();
    const sender = users.find(u => u.phone === fromPhone);
    const recipient = users.find(u => u.phone === toPhone);

    if (!sender || !recipient) return responseJson({ error: "প্রেরক বা প্রাপক খুঁজে পাওয়া যায়নি।" }, 404);
    const amt = Number(amount);
    if (sender.walletBalance < amt) return responseJson({ error: "প্রেরকের পর্যাপ্ত ব্যালেন্স নেই।" }, 400);

    sender.walletBalance -= amt;
    recipient.walletBalance += amt;

    await setDocById("users", sender.id, sender);
    await setDocById("users", recipient.id, recipient);

    const ord: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      type: "Send Money",
      userEmail: sender.email,
      userPhone: sender.phone,
      serviceName: `অ্যাডমিন ব্যালেন্স ট্রান্সফার (${recipient.name})`,
      paymentMethod: "Wallet Transfer",
      amount: amt,
      trxId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      account: toPhone,
      routingNumber: "",
      accountHolder: recipient.name,
      ref: "অ্যাডমিন প্যানেল ট্রান্সফার",
      status: "Success",
      cancellationReason: "",
      date: new Date().toISOString(),
      commissionDeducted: 0
    };

    await setDocById("orders", ord.id, ord);
    const updatedUsers = await getUsers();
    return responseJson({ success: true, users: updatedUsers });
  }

  if (url === '/api/admin/system-data') {
    const users = await getUsers();
    const orders = await getOrders();
    const offers = await getOffers();

    let totalDeposits = 0;
    let totalRecharges = 0;
    let totalDrivesSold = 0;
    let totalProfits = 0;

    orders.forEach(o => {
      if (o.status === 'Success') {
        if (o.type === 'Deposit' || o.type === 'Bank Deposit') {
          totalDeposits += o.amount;
        } else if (o.type === 'Recharge') {
          totalRecharges += o.amount;
          totalProfits += o.amount * 0.02;
        } else if (o.type === 'Drive') {
          totalDrivesSold++;
          totalProfits += o.amount * 0.08;
        }
      }
    });

    return responseJson({
      stats: {
        totalDeposits,
        totalRecharges,
        totalDrivesSold,
        netEstimatedProfit: Math.round(totalProfits),
        pendingOrdersCount: orders.filter(o => o.status === 'Pending').length
      }
    });
  }

  if (url === "/api/calling-cards") {
    return responseJson(await getCallingCardOffers());
  }

  if (url === "/api/admin/calling-cards/create" && method === "POST") {
    const data = body;
    const newOffer = { ...data, id: "cc-off-" + Date.now() };
    await setDocById("calling_card_offers", newOffer.id, newOffer);
    return responseJson({ success: true, offer: newOffer });
  }

  if (url === "/api/admin/calling-cards/update" && method === "POST") {
    const data = body;
    await setDocById("calling_card_offers", data.id, data);
    return responseJson({ success: true });
  }

  if (url === "/api/admin/calling-cards/delete" && method === "POST") {
    const { id } = body;
    await deleteDocById("calling_card_offers", id);
    return responseJson({ success: true });
  }

  if (url === "/api/admin/calling-card/stock") {
    return responseJson(await getCardStocks());
  }

  if (url === "/api/admin/calling-card/stock/create" && method === "POST") {
    const data = body;
    const newStock = { ...data, id: "cc-stk-" + Date.now() };
    await setDocById("calling_card_stock", newStock.id, newStock);
    return responseJson({ success: true, stock: newStock });
  }

  if (url === "/api/admin/calling-card/stock/bulk" && method === "POST") {
    const { pins } = body;
    for (const pin of pins) {
      await setDocById("calling_card_stock", pin.id, pin);
    }
    return responseJson({ success: true });
  }

  if (url === "/api/admin/calling-card/stock/update" && method === "POST") {
    const data = body;
    await setDocById("calling_card_stock", data.id, data);
    return responseJson({ success: true });
  }

  if (url === "/api/admin/calling-card/stock/delete" && method === "POST") {
    const { id } = body;
    await deleteDocById("calling_card_stock", id);
    return responseJson({ success: true });
  }

  if (url === "/api/admin/orders/update-calling-card" && method === "POST") {
    const { orderId, cardPin, cardPassword, cardExpiry, cardImageUrl } = body;
    const orders = await getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return responseJson({ error: "অর্ডার খুঁজে পাওয়া যায়নি।" }, 404);
    order.cardPin = cardPin;
    order.cardPassword = cardPassword;
    order.cardExpiry = cardExpiry;
    order.cardImageUrl = cardImageUrl;
    await setDocById("orders", orderId, order);
    return responseJson({ success: true });
  }

  // Fallback default
  return responseJson({ success: true });
}
