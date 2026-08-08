#!/bin/bash
# Insert imports
sed -i 's/getOffers,/getOffers,\n  getCardStocks,\n  getCallingCardOffers,/' src/utils/mockDb.ts

# Insert endpoints
sed -i '/\/\/ Fallback default/i \
  if (url === "/api/calling-cards") {\
    return responseJson(await getCallingCardOffers());\
  }\
\
  if (url === "/api/admin/calling-cards/create" && method === "POST") {\
    const data = body;\
    const newOffer = { ...data, id: "cc-off-" + Date.now() };\
    await setDocById("calling_card_offers", newOffer.id, newOffer);\
    return responseJson({ success: true, offer: newOffer });\
  }\
\
  if (url === "/api/admin/calling-cards/update" && method === "POST") {\
    const data = body;\
    await setDocById("calling_card_offers", data.id, data);\
    return responseJson({ success: true });\
  }\
\
  if (url === "/api/admin/calling-cards/delete" && method === "POST") {\
    const { id } = body;\
    await deleteDocById("calling_card_offers", id);\
    return responseJson({ success: true });\
  }\
\
  if (url === "/api/admin/calling-card/stock") {\
    return responseJson(await getCardStocks());\
  }\
\
  if (url === "/api/admin/calling-card/stock/create" && method === "POST") {\
    const data = body;\
    const newStock = { ...data, id: "cc-stk-" + Date.now() };\
    await setDocById("calling_card_stock", newStock.id, newStock);\
    return responseJson({ success: true, stock: newStock });\
  }\
\
  if (url === "/api/admin/calling-card/stock/bulk" && method === "POST") {\
    const { pins } = body;\
    for (const pin of pins) {\
      await setDocById("calling_card_stock", pin.id, pin);\
    }\
    return responseJson({ success: true });\
  }\
\
  if (url === "/api/admin/calling-card/stock/update" && method === "POST") {\
    const data = body;\
    await setDocById("calling_card_stock", data.id, data);\
    return responseJson({ success: true });\
  }\
\
  if (url === "/api/admin/calling-card/stock/delete" && method === "POST") {\
    const { id } = body;\
    await deleteDocById("calling_card_stock", id);\
    return responseJson({ success: true });\
  }\
\
  if (url === "/api/admin/orders/update-calling-card" && method === "POST") {\
    const { orderId, cardPin, cardPassword, cardExpiry, cardImageUrl } = body;\
    const orders = await getOrders();\
    const order = orders.find(o => o.id === orderId);\
    if (!order) return responseJson({ error: "অর্ডার খুঁজে পাওয়া যায়নি।" }, 404);\
    order.cardPin = cardPin;\
    order.cardPassword = cardPassword;\
    order.cardExpiry = cardExpiry;\
    order.cardImageUrl = cardImageUrl;\
    await setDocById("orders", orderId, order);\
    return responseJson({ success: true });\
  }\
' src/utils/mockDb.ts
