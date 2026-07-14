// Socket.IO Chat Handler — Real-time chat flow with RAG, intent, sentiment, escalation
import { v4 as uuidv4 } from 'uuid';
import { getOrCreateConversation, saveMessage, getConversationHistory, getSessionConversations, generateQuickReplies } from '../services/chat.js';
import { ragQuery } from '../services/rag.js';
import { classifyIntent } from '../services/intent.js';
import { analyzeSentiment } from '../services/sentiment.js';
import { evaluateEscalation, createEscalationTicket } from '../services/escalation.js';
import { getOrderContext } from '../services/mockEcommerce.js';
import { generate } from '../services/llm.js';
import db from '../db/connection.js';

export function setupChatHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('chat:message', async (data) => {
      const { message, sessionId, conversationId, language } = data;
      if (!message || !sessionId) {
        socket.emit('chat:error', { message: 'Message and sessionId are required' });
        return;
      }

      const startTime = Date.now();

      try {
        // Get or create conversation
        const conversation = getOrCreateConversation(sessionId, conversationId);
        const convId = conversation.id;

        // Join the conversation room for admin monitoring
        socket.join(`conversation:${convId}`);

        // Emit typing indicator
        socket.emit('chat:typing', { conversationId: convId });

        // Run intent classification and sentiment analysis in parallel
        // Each has its own catch so one failing doesn't kill both
        const [intentResult, sentimentResult] = await Promise.all([
          classifyIntent(message, getConversationHistory(convId, 4))
            .catch(e => { console.warn('[Chat] Intent fallback:', e.message); return { intent: 'faq', confidence: 0.3 }; }),
          analyzeSentiment(message)
            .catch(e => { console.warn('[Chat] Sentiment fallback:', e.message); return { score: 0, label: 'neutral', frustration: 1 }; }),
        ]);

        // Save user message
        saveMessage(convId, 'user', message, {
          intent: intentResult.intent,
          sentimentScore: sentimentResult.score,
        });

        // Get recent messages for escalation evaluation
        const recentMessages = getConversationHistory(convId, 6);

        // Check escalation
        const escalation = evaluateEscalation({
          message,
          intent: intentResult.intent,
          sentiment: sentimentResult,
          recentMessages,
          conversationId: convId,
        });

        if (escalation.shouldEscalate) {
          // Create escalation ticket
          const ticket = await createEscalationTicket(convId, escalation.reason, escalation.priority);

          const escalationMessage = "I understand this is important to you, and I want to make sure you get the best help possible. I'm connecting you with a support specialist who can assist you further. They'll have the full context of our conversation, so you won't need to repeat anything.";

          saveMessage(convId, 'bot', escalationMessage, {
            intent: 'escalation',
            confidence: 1,
          });

          socket.emit('chat:stream', {
            chunk: escalationMessage,
            isComplete: true,
            conversationId: convId,
            messageId: uuidv4(),
          });

          socket.emit('chat:escalation', {
            message: 'Connecting you with a support specialist...',
            ticketId: ticket.id,
            estimatedWait: `${Math.floor(Math.random() * 4) + 2}-${Math.floor(Math.random() * 3) + 5} minutes`,
            summary: ticket.summary,
            reason: escalation.reason,
            conversationId: convId,
          });

          // Notify admin room
          io.to('admin').emit('admin:escalation', {
            ticket,
            conversationId: convId,
          });

          // Send updated conversation list
          const conversations = getSessionConversations(sessionId);
          socket.emit('chat:conversationList', conversations);

          return;
        }

        // Get personalized order context if relevant
        const orderContext = getOrderContext(message);

        // Run RAG pipeline with streaming
        const messageId = uuidv4();
        let fullResponse = '';
        let sources = [];
        let confidence = 0;

        for await (const event of ragQuery(message, recentMessages, { orderContext, language })) {
          if (event.chunk) {
            fullResponse += event.chunk;
            socket.emit('chat:stream', {
              chunk: event.chunk,
              isComplete: false,
              conversationId: convId,
              messageId,
            });
          }
          if (event.done) {
            sources = event.sources || [];
            confidence = event.confidence || 0;
          }
        }

        const latencyMs = Date.now() - startTime;

        // Save bot response
        saveMessage(convId, 'bot', fullResponse, {
          intent: intentResult.intent,
          confidence,
          sources,
          latencyMs,
        });

        // Generate quick replies
        const quickReplies = generateQuickReplies(intentResult.intent, recentMessages.length);

        // Send completion event
        socket.emit('chat:stream', {
          chunk: '',
          isComplete: true,
          conversationId: convId,
          messageId,
          sources,
          quickReplies,
          confidence,
          sentiment: sentimentResult.score,
        });

        // Auto-generate conversation title after first exchange
        if (recentMessages.length <= 2) {
          try {
            const title = await generate(
              `Generate a short 3-5 word title for this support conversation. Customer asked: "${message}". Reply with ONLY the title, no quotes, no punctuation.`,
              { useLite: true, temperature: 0.5, maxTokens: 20 }
            );
            const cleanTitle = title.trim().replace(/^["']|["']$/g, '').substring(0, 60);
            if (cleanTitle) {
              db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(cleanTitle, convId);
            }
          } catch (e) {
            // Title generation is non-critical — ignore failures
          }
        }

        // Send updated conversation list to sidebar
        const conversations = getSessionConversations(sessionId);
        socket.emit('chat:conversationList', conversations);

        // Notify admin room of new messages
        io.to('admin').emit('admin:newMessage', {
          conversationId: convId,
          message: { role: 'user', content: message },
          botResponse: fullResponse,
          intent: intentResult.intent,
          sentiment: sentimentResult,
        });

      } catch (err) {
        console.error('[Chat] Error processing message:', err);
        socket.emit('chat:error', {
          message: 'Sorry, I encountered an error processing your message. Please try again.',
        });
      }
    });

    // Admin joins admin room for monitoring
    socket.on('admin:join', () => {
      socket.join('admin');
      console.log(`[Socket] Admin joined: ${socket.id}`);
    });

    // Admin takes over a conversation
    socket.on('admin:takeover', (data) => {
      const { conversationId, agentName } = data;
      // Update conversation status in DB
      try {
        db.prepare('UPDATE conversations SET status = ? WHERE id = ?').run('escalated', conversationId);
      } catch (e) { /* ignore */ }

      io.to(`conversation:${conversationId}`).emit('chat:agentJoined', {
        agentName: agentName || 'Support Agent',
        conversationId,
      });
    });

    // Admin sends a message in a conversation
    socket.on('admin:message', (data) => {
      const { conversationId, message, agentName } = data;
      if (!conversationId || !message) return;

      saveMessage(conversationId, 'agent', message, {});

      io.to(`conversation:${conversationId}`).emit('chat:stream', {
        chunk: message,
        isComplete: true,
        conversationId,
        messageId: uuidv4(),
        isAgent: true,
        agentName: agentName || 'Support Agent',
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
