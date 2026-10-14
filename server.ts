import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import {
  getAllSchemes,
  getSchemeById,
  evaluateAllSchemes,
  rankEvaluations,
  renderSchemeExplanation,
  createSession,
  getSession,
  restoreOrCreateSession,
  updateSession,
  answerRagQuery,
  generateHtmlReport,
  SCHEMES_DICT,
} from './src/server/engine';

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'SchemeSetu', version: '1.0.0' });
});

// Chat intake API endpoint
const handleChat = (req: Request, res: Response) => {
  const { session_id, message, language, profile, current_question_id } = req.body || {};
  let state = restoreOrCreateSession(session_id, language || 'en', profile, current_question_id);

  if (message) {
    state = updateSession(state.session_id, message);
  }

  const lastAssistantMsg = [...state.history].reverse().find((m) => m.role === 'assistant' || m.role === 'system');
  const replyText = lastAssistantMsg?.content || 'How can I help you today?';
  const quickReplies = lastAssistantMsg?.quick_replies || null;

  let formattedEvaluations: any[] | null = null;
  if (state.is_completed && state.evaluation_results) {
    formattedEvaluations = state.evaluation_results.map((item) => {
      const ev = item.evaluation;
      const s = SCHEMES_DICT[ev.scheme_id];
      const explanation = renderSchemeExplanation(s, ev, state.language);
      return {
        scheme_id: ev.scheme_id,
        scheme_name: ev.scheme_name,
        verdict: ev.verdict,
        score: item.score,
        explanation,
        required_documents: s?.required_documents || [],
        benefit: s?.benefit || { amount_max: 0, description: '' },
        application: s?.application || { link: '', deadline: 'Open' },
        source_url: s?.source_url || '',
        verify: s?.verify || false,
        evaluation: ev,
        criteria_audit: ev.criteria,
      };
    });
  }

  res.json({
    session_id: state.session_id,
    reply: replyText,
    quick_replies: quickReplies,
    is_completed: state.is_completed,
    current_question_id: state.current_question_id,
    early_exit_triggered: state.early_exit_triggered,
    profile: state.profile,
    evaluations: formattedEvaluations,
  });
};

app.post('/api/chat', handleChat);
app.post('/chat', handleChat);

// Direct Eligibility Check API
const handleEligibility = (req: Request, res: Response) => {
  const profile = req.body || {};
  const schemes = getAllSchemes();
  const evals = evaluateAllSchemes(schemes, profile);
  const ranked = rankEvaluations(evals, SCHEMES_DICT, profile);

  const results = ranked.map(({ evaluation: ev, score }) => {
    const s = SCHEMES_DICT[ev.scheme_id];
    const explanation = renderSchemeExplanation(s, ev, profile.language || 'en');
    return {
      scheme_id: ev.scheme_id,
      scheme_name: ev.scheme_name,
      verdict: ev.verdict,
      score,
      explanation,
      required_documents: s?.required_documents || [],
      benefit: s?.benefit || { amount_max: 0, description: '' },
      application: s?.application || { link: '', deadline: 'Open' },
      source_url: s?.source_url || '',
      verify: s?.verify || false,
      evaluation: ev,
      criteria_audit: ev.criteria,
      near_miss_reason: ev.near_miss_reason,
      missing_confirmations: ev.missing_confirmations,
    };
  });

  res.json({
    profile,
    total_schemes_checked: schemes.length,
    results,
  });
};

app.post('/api/check-eligibility', handleEligibility);
app.post('/check-eligibility', handleEligibility);

// Get All Schemes
const handleGetSchemes = (req: Request, res: Response) => {
  res.json(getAllSchemes());
};
app.get('/api/schemes', handleGetSchemes);
app.get('/schemes', handleGetSchemes);

// Get Scheme By ID
const handleGetSchemeById = (req: Request, res: Response) => {
  const scheme = getSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ detail: 'Scheme not found' });
  }
  res.json(scheme);
};
app.get('/api/schemes/:id', handleGetSchemeById);
app.get('/schemes/:id', handleGetSchemeById);

// RAG Ask
const handleRagAsk = (req: Request, res: Response) => {
  const { query, scheme_id } = req.body || {};
  const answer = answerRagQuery(query || '', scheme_id);
  res.json(answer);
};
app.post('/api/rag/ask', handleRagAsk);
app.post('/rag/ask', handleRagAsk);

// Report Download / View
const handleReport = (req: Request, res: Response) => {
  const state = getSession(req.params.sessionId);
  if (!state || !state.is_completed) {
    return res.status(404).send('Report not found');
  }
  const html = generateHtmlReport(state);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
app.get('/api/report/:sessionId', handleReport);
app.get('/report/:sessionId', handleReport);

// Static assets
app.use(express.static(path.resolve(process.cwd(), 'public')));

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';
  const distExists = fs.existsSync(path.resolve(process.cwd(), 'dist', 'index.html'));

  if (isProd && distExists) {
    console.log('[SchemeSetu] Serving optimized production bundle from dist/');
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    console.log('[SchemeSetu] Running with Vite dev middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SchemeSetu] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
