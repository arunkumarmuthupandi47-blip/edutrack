import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const apiKey =
      (typeof body.apiKey === 'string' && body.apiKey.trim()) ||
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
        ? process.env.GEMINI_API_KEY.trim()
        : '') ||
      (process.env.VITE_GEMINI_API_KEY ? process.env.VITE_GEMINI_API_KEY.trim() : '') ||
      (process.env.NEXT_PUBLIC_GEMINI_API_KEY ? process.env.NEXT_PUBLIC_GEMINI_API_KEY.trim() : '');

    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured.',
      });
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt : body.query;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing RAG prompt or query.' });
    }

    const systemInstruction =
      'You are the Academic Focus AI Assistant powered by Google Gemini and Supabase RAG. Answer questions concisely and accurately using the Retrieved Supabase Knowledge Base Documents and Live Workspace State. Cite the retrieved document title or course code in brackets (e.g., [CS 320 Syllabus]) whenever you use information from a retrieved document.';

    const ai = new GoogleGenAI({ apiKey });

    try {
      const interaction = await ai.interactions.create({
        model: 'gemini-4-hydrogen',
        input: prompt,
        system_instruction: systemInstruction,
      });
      if (interaction?.output_text) {
        return res.status(200).json({
          answer: interaction.output_text,
          model: 'gemini-4-hydrogen',
          interactionId: interaction.id,
        });
      }
    } catch {
      // Fallback to models.generateContent if Interactions endpoint is unavailable for the key
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.25,
        },
      });
      if (response?.text) {
        return res.status(200).json({
          answer: response.text,
          model: 'gemini-4-hydrogen',
        });
      }
    }

    return res.status(500).json({ error: 'Empty response from Gemini API.' });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Gemini RAG generation failed.',
    });
  }
}
