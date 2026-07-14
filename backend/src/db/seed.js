// Database Seeder — NovaMart e-commerce knowledge base + demo admin user
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import bcrypt from 'bcryptjs';
import { dbPromise } from './connection.js';
import { ingestArticle } from '../services/rag.js';

const KB_ARTICLES = [
  {
    title: 'Shipping & Delivery Policy',
    category: 'shipping',
    tags: ['shipping', 'delivery', 'tracking', 'timeline'],
    content: `NovaMart offers multiple shipping options for all domestic orders:\n\n**Standard Shipping (5-7 business days):** Free on all orders over $50. For orders under $50, a flat rate of $5.99 applies.\n\n**Express Shipping (2-3 business days):** Available for $12.99 on all orders.\n\n**Overnight Shipping (1 business day):** Available for $24.99. Orders must be placed before 2 PM EST for same-day processing.\n\n**International Shipping:** We ship to over 30 countries. International shipping rates are calculated at checkout based on destination and package weight. Delivery typically takes 7-14 business days.\n\n**Order Tracking:** Once your order ships, you'll receive a tracking number via email. You can also track your order in your NovaMart account under "My Orders." Tracking updates may take 24 hours to appear after shipment.\n\n**Processing Time:** Most orders are processed within 1-2 business days. During sales events, processing may take up to 3 business days.`
  },
  {
    title: 'Returns & Refunds Policy',
    category: 'returns_refunds',
    tags: ['returns', 'refunds', 'exchange', 'policy'],
    content: `NovaMart offers a hassle-free 30-day return policy on most items.\n\n**Eligibility:** Items must be in original condition, unused, and in original packaging. Electronics must include all accessories, manuals, and cables.\n\n**How to Start a Return:**\n1. Log into your NovaMart account\n2. Go to "My Orders" and select the order\n3. Click "Return Item" and select your reason\n4. Print the prepaid return label\n5. Drop off the package at any FedEx or UPS location\n\n**Refund Timeline:** Refunds are processed within 5-7 business days after we receive and inspect the returned item. The refund will be issued to your original payment method.\n\n**Exceptions:** The following items are non-returnable: opened software, personalized/custom items, gift cards, and items marked as "Final Sale."\n\n**Exchanges:** To exchange an item, please return the original and place a new order. We'll expedite shipping on the replacement at no extra cost.\n\n**Damaged or Defective Items:** If you receive a damaged or defective item, contact us within 48 hours. We'll arrange a free return pickup and send a replacement immediately.`
  },
  {
    title: 'Account Management Guide',
    category: 'account',
    tags: ['account', 'profile', 'password', 'settings'],
    content: `**Creating an Account:** Visit novamart.com/register or click "Sign Up" on the app. You'll need a valid email address and a password (minimum 8 characters with at least one number).\n\n**Updating Your Profile:** Go to Account Settings > Profile to update your name, email, phone number, or shipping addresses.\n\n**Password Reset:**\n1. Click "Forgot Password" on the login page\n2. Enter your registered email address\n3. Check your inbox for a reset link (valid for 24 hours)\n4. Create a new password\n\n**Two-Factor Authentication (2FA):** We strongly recommend enabling 2FA. Go to Account Settings > Security > Enable 2FA.\n\n**Deleting Your Account:** Go to Account Settings > Privacy > Delete Account. This action is permanent. Any pending orders must be completed or cancelled first.`
  },
  {
    title: 'Payment Methods & Billing',
    category: 'billing',
    tags: ['payment', 'billing', 'credit card', 'invoice'],
    content: `**Accepted Payment Methods:**\n- Credit/Debit Cards: Visa, Mastercard, American Express, Discover\n- Digital Wallets: Apple Pay, Google Pay, PayPal\n- NovaMart Gift Cards & Store Credit\n- Buy Now, Pay Later: Klarna (4 interest-free payments)\n\n**Failed Payments:** If a payment fails, we'll hold your order for 48 hours and send you a notification. Update your payment method in "My Orders" to complete the purchase.\n\n**Price Match:** NovaMart offers a 14-day price match guarantee. If an item drops in price within 14 days, contact us for a price adjustment refund.\n\n**Sales Tax:** Calculated based on your shipping address and applicable state/local tax rates.`
  },
  {
    title: 'NovaMart Pro Wireless Earbuds — Product Guide',
    category: 'product',
    tags: ['earbuds', 'wireless', 'audio', 'product'],
    content: `**NovaMart Pro Wireless Earbuds — $79.99**\n\n**Key Features:**\n- Active Noise Cancellation (ANC) with 3 adjustable levels\n- 36-hour total battery life (8hrs earbuds + 28hrs case)\n- Bluetooth 5.3 with multipoint connection\n- IPX5 water resistance\n- Touch controls\n- AI noise reduction for calls\n\n**Warranty:** 1-year manufacturer warranty covering defects.\n\n**Troubleshooting:**\n- Not connecting: Reset by holding both earbuds 10 seconds until LED flashes\n- Poor sound: Ensure ear tips are properly sized\n- Battery draining: Disable ANC or reduce volume`
  },
  {
    title: 'Smart Home Hub v3 — Product Guide',
    category: 'product',
    tags: ['smart home', 'hub', 'iot'],
    content: `**Smart Home Hub v3 — $149.99**\n\nCentral hub for controlling 200+ smart home devices. Works with Alexa, Google Assistant, and Apple HomeKit. Matter & Thread protocol support.\n\n**Setup:**\n1. Plug in and connect to Wi-Fi\n2. Download the NovaMart Home app\n3. Follow the setup wizard to add devices\n\n**Troubleshooting:**\n- Hub not finding devices: Ensure devices are in pairing mode within 30 feet\n- Slow response: Reboot by unplugging for 10 seconds\n- App not connecting: Check same Wi-Fi network`
  },
  {
    title: 'Order Modifications & Cancellations',
    category: 'orders',
    tags: ['cancel', 'modify', 'order', 'change'],
    content: `**Modifying an Order:** You can modify within 1 hour of placing, before "Processing" stage. Go to My Orders > Select Order > "Modify Order."\n\n**Cancelling:** Orders can be cancelled before "Shipped" status. Go to My Orders > Cancel Order. Refund processed immediately.\n\n**Partial Cancellation:** You can cancel individual items without affecting the rest.\n\n**Already Shipped:** Cannot cancel. Refuse delivery or initiate return once received.`
  },
  {
    title: 'NovaMart Rewards Loyalty Program',
    category: 'loyalty',
    tags: ['rewards', 'points', 'loyalty', 'membership'],
    content: `**Earning Points:** 1 point per $1 spent. 2x on NovaMart brand products. 3x during Double Points events.\n\n**Redeeming:** 100 points = $1 discount. Min redemption 500 points. Points expire 12 months after earning.\n\n**Tiers:**\n- Silver (0-999 pts/year): Standard benefits, birthday reward\n- Gold (1,000-4,999 pts/year): Free standard shipping, early access, 10% birthday discount\n- Platinum (5,000+ pts/year): Free express shipping, exclusive products, 20% birthday discount, priority support`
  },
  {
    title: 'Technical Troubleshooting — Website & App',
    category: 'technical',
    tags: ['technical', 'app', 'website', 'bug'],
    content: `**Can't Log In:**\n1. Verify email is correct\n2. Reset password via "Forgot Password"\n3. Clear browser cookies/cache\n4. Try incognito mode\n\n**App Crashing:** Update to latest version. Restart device. Clear app cache.\n\n**Payment Not Going Through:** Verify card details. Check bank isn't blocking. Try different method.\n\n**Pages Not Loading:** Check internet. Disable browser extensions. Hard refresh (Ctrl+Shift+R).`
  },
  {
    title: 'Privacy & Data Security',
    category: 'privacy',
    tags: ['privacy', 'data', 'security', 'gdpr'],
    content: `NovaMart is committed to protecting your personal information.\n\n**Your Rights:** Access, correct, delete, or export your data anytime. Unsubscribe from marketing emails at any time.\n\n**Security:** 256-bit SSL encryption, PCI-DSS compliant, regular security audits, SOC 2 Type II certified.\n\nVisit Account Settings > Privacy or contact privacy@novamart.com.`
  },
  {
    title: 'Contact Support & Escalation',
    category: 'contact',
    tags: ['contact', 'support', 'phone', 'email'],
    content: `**Live Chat (FlowBot):** Available 24/7.\n\n**Email:** support@novamart.com — Response within 24 hours.\n\n**Phone:** 1-800-NOVAMART, Mon-Fri 8AM-10PM EST, Sat-Sun 9AM-6PM EST.\n\n**Escalation:** AI assistant will auto-connect you to a human when needed. You can also say "talk to a human" anytime.\n\n**Priority Support:** Platinum members get priority routing with <2 minute wait times.`
  },
  {
    title: 'Warranty Claims & Extended Protection',
    category: 'returns_refunds',
    tags: ['warranty', 'protection', 'claim'],
    content: `**Standard Warranty:** All NovaMart products have minimum 1-year warranty.\n\n**How to Claim:**\n1. Go to My Orders > Select product > "Warranty Claim"\n2. Describe issue and upload photos\n3. Review within 2 business days\n4. If approved, prepaid return label provided\n\n**Extended Protection Plans:**\n- 2-Year: 15% of product price\n- 3-Year: 22% of product price\n- Covers accidental damage, drops, spills\n- No deductibles`
  },
  {
    title: 'Gift Cards & Store Credit',
    category: 'billing',
    tags: ['gift card', 'store credit', 'balance'],
    content: `**Available:** $25, $50, $100, $200, or custom ($10-$500).\n\n**Digital:** Delivered via email instantly. Can be scheduled.\n**Physical:** Shipped in premium packaging.\n\n**Redeem:** Enter code at checkout or add to account balance.\n\n**Key Info:** Gift cards never expire. Non-refundable. Multiple cards per order allowed.`
  },
  {
    title: 'International Orders & Customs',
    category: 'shipping',
    tags: ['international', 'customs', 'duties'],
    content: `**Supported Countries:** 30+ countries including Canada, UK, Germany, Australia, Japan.\n\n**Rates:** Calculated at checkout. Typical: Canada $9.99-$19.99, Europe $14.99-$29.99, Asia-Pacific $19.99-$39.99.\n\n**Timeline:** 7-14 business days standard. Express 3-5 days for select countries.\n\n**Customs & Duties:** NOT included in pricing. Recipient is responsible. Refusing customs charges results in return at customer's expense.`
  },
  {
    title: 'NovaMart 4K Webcam — Product Guide',
    category: 'product',
    tags: ['webcam', '4k', 'camera'],
    content: `**NovaMart 4K Webcam — $129.99**\n\n4K at 30fps, 1080p at 60fps. Auto-focus with face tracking. Built-in ring light. Dual stereo mics with noise cancellation. Privacy shutter. USB-C plug-and-play.\n\nWorks with Windows 10+, macOS 12+, ChromeOS. Compatible with Zoom, Teams, Google Meet.\n\n**Warranty:** 2-year manufacturer warranty.`
  },
];

async function seed() {
  console.log('[Seed] Starting database seeding...\n');
  
  const db = await dbPromise;

  // Create default admin user
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@flowsupport.com');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run('admin@flowsupport.com', hash, 'FlowSupport Admin', 'admin');
    console.log('[Seed] ✅ Admin user created (admin@flowsupport.com / admin123)');
  } else {
    console.log('[Seed] ⏭️  Admin user already exists');
  }

  // Always re-insert KB articles fresh (idempotent)
  console.log('[Seed] Clearing existing KB articles...');
  db.prepare('DELETE FROM kb_articles').run();

  for (const article of KB_ARTICLES) {
    const result = db.prepare(
      'INSERT INTO kb_articles (title, content, category, tags) VALUES (?, ?, ?, ?)'
    ).run(article.title, article.content, article.category, JSON.stringify(article.tags));

    console.log(`[Seed] 📄 KB Article: ${article.title}`);

    try {
      await ingestArticle(result.lastInsertRowid, article.title, article.content);
      console.log(`[Seed] 🔍 Indexed: ${article.title}`);
    } catch (err) {
      console.log(`[Seed] ⚠️  Indexing skipped: ${err.message}`);
    }
  }
  console.log(`\n[Seed] ✅ ${KB_ARTICLES.length} KB articles created`);

  console.log('\n[Seed] 🎉 Seeding complete!\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
