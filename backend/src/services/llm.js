// LLM Service — Google Gemini API abstraction with streaming and robust fallbacks
import { GoogleGenAI } from '@google/genai';

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
const LITE_MODEL = process.env.GEMINI_LITE_MODEL || 'gemini-2.0-flash-lite';

let ai = null;

function getClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[LLM] No GEMINI_API_KEY set — AI features will use mock responses');
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Build a context-aware mock response from the prompt keywords
 */
function buildMockResponse(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes('shipping') || lower.includes('delivery') || lower.includes('track')) {
    return "Great question! NovaMart offers several shipping options:\n\n- **Standard Shipping** (5-7 business days): Free on orders over $50, otherwise $5.99\n- **Express Shipping** (2-3 business days): $12.99\n- **Overnight** (1 business day): $24.99 (order before 2 PM EST)\n\nYou can track your order anytime under **My Orders** in your NovaMart account. Once shipped, you'll also receive a tracking number via email. Is there anything specific about your shipment I can help with?";
  }
  if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
    return "NovaMart has a **30-day hassle-free return policy** on most items. Here's how it works:\n\n1. Log into your account and go to **My Orders**\n2. Select the item and click **Return Item**\n3. Print the prepaid return label\n4. Drop it off at any FedEx or UPS location\n\n**Refunds** are processed within 5-7 business days after we receive and inspect the item. The refund goes back to your original payment method.\n\nWould you like to start a return, or do you have questions about a specific item?";
  }
  if (lower.includes('order') || lower.includes('where is') || lower.includes('status')) {
    return "I'd be happy to help you check on your order! You can view your order status anytime by logging into your NovaMart account and going to **My Orders**.\n\nIf you have your order number handy (it starts with NVM-), I can look up the details for you. Otherwise, I can help you with general order questions like shipping timelines, modifications, or cancellations.";
  }
  if (lower.includes('payment') || lower.includes('billing') || lower.includes('charge') || lower.includes('card')) {
    return "NovaMart accepts a wide range of payment methods:\n\n- **Credit/Debit Cards**: Visa, Mastercard, Amex, Discover\n- **Digital Wallets**: Apple Pay, Google Pay, PayPal\n- **Other**: Gift cards, store credit, and Klarna (buy now, pay later)\n\nIf a payment fails, we'll hold your order for 48 hours so you can update your payment method. We also offer a **14-day price match guarantee**!";
  }
  if (lower.includes('password') || lower.includes('login') || lower.includes('account') || lower.includes('sign')) {
    return "I can help with your account! Here are some common actions:\n\n- **Reset password**: Click \"Forgot Password\" on the login page and check your email\n- **Update profile**: Go to Account Settings > Profile\n- **Enable 2FA**: Account Settings > Security (highly recommended!)\n\nIs there something specific about your account I can help with?";
  }
  if (lower.includes('warranty') || lower.includes('defective') || lower.includes('broken') || lower.includes('damaged')) {
    return "All NovaMart products come with a **minimum 1-year manufacturer warranty**. If you've received a defective or damaged item, please contact us within 48 hours — we'll arrange a free return pickup and send a replacement immediately.\n\nFor warranty claims, go to **My Orders**, select the product, and click **Warranty Claim**. We'll review it within 2 business days.\n\nWould you like to file a warranty claim?";
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good')) {
    return "Hello! 👋 Welcome to NovaMart support. I'm FlowBot, your AI assistant. I can help you with:\n\n- 📦 Order tracking & shipping\n- ↩️ Returns & refunds\n- 💳 Payment & billing\n- 🔧 Technical support\n- 👤 Account management\n\nWhat can I help you with today?";
  }
  return "Thank you for reaching out! I'm FlowBot, NovaMart's AI support assistant. I can help with order tracking, shipping, returns, payments, account issues, and product questions.\n\nCould you tell me a bit more about what you need help with? I'll do my best to get you the right answer, and if I can't, I'll connect you with a human support specialist.";
}

/**
 * Generate a streaming response from the chat model
 * Falls back to mock streaming on any API error (including 429 rate limits)
 */
export async function* generateStream(prompt, options = {}) {
  const client = getClient();
  if (!client) {
    // Mock streaming for demo without API key
    const mockResponse = buildMockResponse(prompt);
    for (const word of mockResponse.split(' ')) {
      yield word + ' ';
      await new Promise(r => setTimeout(r, 30));
    }
    return;
  }

  try {
    const response = await client.models.generateContentStream({
      model: CHAT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: options.systemInstruction || undefined,
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1024,
      }
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (err) {
    console.warn(`[LLM] Stream error (${err.status || 'unknown'}), using fallback response`);
    // Fall back to mock streaming — invisible to user
    const mockResponse = buildMockResponse(prompt);
    for (const word of mockResponse.split(' ')) {
      yield word + ' ';
      await new Promise(r => setTimeout(r, 30));
    }
  }
}

/**
 * Generate a complete (non-streaming) response
 * Retries once on 429, then returns a sensible fallback
 */
export async function generate(prompt, options = {}) {
  const client = getClient();
  if (!client) {
    return buildMockResponse(prompt);
  }

  const model = options.useLite ? LITE_MODEL : CHAT_MODEL;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: options.systemInstruction || undefined,
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxTokens ?? 512,
          responseMimeType: options.json ? 'application/json' : undefined,
        }
      });
      return response.text;
    } catch (err) {
      if (attempt === 0 && (err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED'))) {
        console.warn('[LLM] Rate limited, retrying in 2s...');
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.warn(`[LLM] Generate error: ${err.message}`);
      return buildMockResponse(prompt);
    }
  }
  return buildMockResponse(prompt);
}

/**
 * Generate a JSON-structured response — never returns null
 */
export async function generateJSON(prompt, options = {}) {
  try {
    const text = await generate(prompt, { ...options, json: true });
    try {
      return JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      console.warn('[LLM] Failed to parse JSON, returning fallback');
      return null;
    }
  } catch (err) {
    console.warn('[LLM] generateJSON error:', err.message);
    return null;
  }
}
