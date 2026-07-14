// Mock E-Commerce API — Simulated order/account data for demo personalization

const MOCK_ORDERS = [
  {
    id: 'NVM-4521',
    status: 'shipped',
    items: [{ name: 'NovaMart Pro Wireless Earbuds', qty: 1, price: 79.99 }],
    total: 79.99,
    ordered_at: '2026-07-01',
    shipped_at: '2026-07-02',
    tracking: 'TRK9281764523',
    carrier: 'FedEx',
    estimated_delivery: '2026-07-07',
  },
  {
    id: 'NVM-4498',
    status: 'delivered',
    items: [
      { name: 'Smart Home Hub v3', qty: 1, price: 149.99 },
      { name: 'USB-C Cable Pack (3-pack)', qty: 1, price: 19.99 },
    ],
    total: 169.98,
    ordered_at: '2026-06-25',
    shipped_at: '2026-06-26',
    delivered_at: '2026-06-29',
    tracking: 'TRK8173625491',
    carrier: 'UPS',
  },
  {
    id: 'NVM-4456',
    status: 'processing',
    items: [{ name: 'NovaMart 4K Webcam', qty: 1, price: 129.99 }],
    total: 129.99,
    ordered_at: '2026-07-04',
    estimated_ship: '2026-07-06',
  },
  {
    id: 'NVM-4312',
    status: 'delivered',
    items: [{ name: 'Ergonomic Keyboard Elite', qty: 1, price: 199.99 }],
    total: 199.99,
    ordered_at: '2026-06-15',
    delivered_at: '2026-06-19',
    tracking: 'TRK6254891073',
    carrier: 'USPS',
  },
  {
    id: 'NVM-4201',
    status: 'returned',
    items: [{ name: 'Portable Bluetooth Speaker', qty: 1, price: 49.99 }],
    total: 49.99,
    ordered_at: '2026-06-05',
    returned_at: '2026-06-12',
    refund_status: 'completed',
    refund_amount: 49.99,
  },
];

const MOCK_USER_PROFILE = {
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  member_since: '2025-03-15',
  loyalty_tier: 'Gold',
  loyalty_points: 2450,
  preferred_language: 'en',
  total_orders: 12,
  lifetime_value: 1289.87,
};

/**
 * Get order details by order ID
 */
export function getOrder(orderId) {
  return MOCK_ORDERS.find(o => o.id === orderId) || null;
}

/**
 * Get all orders for the mock user
 */
export function getOrders() {
  return MOCK_ORDERS;
}

/**
 * Get user profile
 */
export function getUserProfile() {
  return MOCK_USER_PROFILE;
}

/**
 * Format order info as a context string for the LLM
 */
export function getOrderContext(message) {
  const lowerMsg = message.toLowerCase();

  // Check if asking about a specific order
  const orderMatch = lowerMsg.match(/(?:order|#)\s*(?:nvm-?)?(\d{4})/i);
  if (orderMatch) {
    const orderId = `NVM-${orderMatch[1]}`;
    const order = getOrder(orderId);
    if (order) {
      return formatOrderDetails(order);
    }
    return `No order found with ID ${orderId}.`;
  }

  // Check if asking about orders in general
  if (lowerMsg.includes('order') || lowerMsg.includes('tracking') || lowerMsg.includes('delivery') || lowerMsg.includes('shipped')) {
    const recentOrders = MOCK_ORDERS.slice(0, 3);
    return `Customer: ${MOCK_USER_PROFILE.name} (${MOCK_USER_PROFILE.loyalty_tier} member)\nRecent orders:\n${recentOrders.map(o => `- ${o.id}: ${o.items.map(i => i.name).join(', ')} — Status: ${o.status}`).join('\n')}`;
  }

  return null;
}

function formatOrderDetails(order) {
  let details = `Order ${order.id}:
- Items: ${order.items.map(i => `${i.name} (x${i.qty}) — $${i.price}`).join(', ')}
- Total: $${order.total}
- Status: ${order.status}
- Ordered: ${order.ordered_at}`;

  if (order.tracking) details += `\n- Tracking: ${order.tracking} (${order.carrier})`;
  if (order.shipped_at) details += `\n- Shipped: ${order.shipped_at}`;
  if (order.estimated_delivery) details += `\n- Estimated delivery: ${order.estimated_delivery}`;
  if (order.delivered_at) details += `\n- Delivered: ${order.delivered_at}`;
  if (order.refund_status) details += `\n- Refund: ${order.refund_status} ($${order.refund_amount})`;

  return `Customer: ${MOCK_USER_PROFILE.name} (${MOCK_USER_PROFILE.loyalty_tier} member, ${MOCK_USER_PROFILE.loyalty_points} points)\n${details}`;
}
