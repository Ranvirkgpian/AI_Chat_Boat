import { useState, useEffect } from 'react';
import { kbAPI } from '../../lib/api';
import { Search, Plus, Edit, Trash2, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GradientButton from '../ui/GradientButton';

export default function KBManager() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editArticle, setEditArticle] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'faq', tags: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadArticles(); }, []);

  async function loadArticles() {
    try {
      const { data } = await kbAPI.list({ search });
      setArticles(data.articles || []);
    } catch (err) { console.error('Error loading articles:', err); }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editArticle) {
        await kbAPI.update(editArticle.id, payload);
        setSuccessMsg('Article updated!');
      } else {
        await kbAPI.create(payload);
        setSuccessMsg('Article added! Ask the bot about it in the chat.');
      }
      setShowModal(false);
      setEditArticle(null);
      setForm({ title: '', content: '', category: 'faq', tags: '' });
      loadArticles();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) { console.error('Error saving:', err); }
    setIsSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this article?')) return;
    try {
      await kbAPI.delete(id);
      loadArticles();
    } catch (err) { console.error('Error deleting:', err); }
  }

  function openEdit(article) {
    setEditArticle(article);
    const parsedTags = Array.isArray(article.tags) ? article.tags : JSON.parse(article.tags || '[]');
    setForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: parsedTags.join(', '),
    });
    setShowModal(true);
  }

  const categories = ['faq', 'shipping', 'returns_refunds', 'billing', 'account', 'technical', 'product', 'orders', 'loyalty', 'privacy', 'contact'];

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Success message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-white gradient-primary"
          >
            ✅ {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold theme-text-primary">Knowledge Base</h2>
          <p className="text-sm theme-text-muted">{articles.length} articles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadArticles()}
              placeholder="Search articles..."
              className="pl-9 pr-4 py-2 rounded-xl glass bg-transparent text-sm outline-none w-64"
            />
          </div>
          <GradientButton size="sm" onClick={() => { setEditArticle(null); setForm({ title: '', content: '', category: 'faq', tags: '' }); setShowModal(true); }}>
            <Plus size={16} className="inline mr-1" /> Add Article
          </GradientButton>
        </div>
      </div>

      {/* Articles grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <motion.div
            key={article.id}
            className="glass rounded-xl p-4 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-tight">{article.title}</h3>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(article)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"><Edit size={14} /></button>
                <button onClick={() => handleDelete(article.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-xs opacity-50 line-clamp-2">{article.content}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded-full bg-white/10">{article.category}</span>
              <span className="opacity-40 flex items-center gap-1">
                <BookOpen size={12} /> {article.retrieval_count || 0} retrievals
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="glass-strong rounded-2xl p-6 w-full max-w-lg space-y-4"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{editArticle ? 'Edit Article' : 'New Article'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 cursor-pointer"><X size={20} /></button>
              </div>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-4 py-2.5 rounded-xl glass bg-transparent text-sm outline-none" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl glass bg-transparent text-sm outline-none">
                {categories.map(c => <option key={c} value={c} className="bg-dark-bg">{c}</option>)}
              </select>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Article content (supports Markdown)" rows={8} className="w-full px-4 py-2.5 rounded-xl glass bg-transparent text-sm outline-none resize-none" />
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma-separated)" className="w-full px-4 py-2.5 rounded-xl glass bg-transparent text-sm outline-none" />
              <GradientButton className="w-full" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : (editArticle ? 'Update' : 'Create')} Article</GradientButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
