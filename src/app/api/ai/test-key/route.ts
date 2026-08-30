import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-3.6-flash'
];

export async function POST(req: NextRequest) {
  try {
    const { provider = 'gemini', apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json({ success: false, error: 'Please enter an API key to test.' }, { status: 400 });
    }

    const key = apiKey.trim();
    const startTime = Date.now();

    // 1. TEST GOOGLE GEMINI
    if (provider === 'gemini') {
      let lastErr = '';
      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Respond with exactly: OK' }] }],
              generationConfig: { maxOutputTokens: 10 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const latencyMs = Date.now() - startTime;
              return NextResponse.json({
                success: true,
                provider: 'gemini',
                model,
                latencyMs,
                message: `Google Gemini connected successfully (${model} • ${latencyMs}ms latency)`
              });
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            lastErr = errData.error?.message || `Status ${res.status}: ${res.statusText}`;
            if (res.status === 400 && lastErr.includes('API_KEY_INVALID')) {
              break;
            }
          }
        } catch (err: any) {
          lastErr = err.message || 'Network error';
        }
      }

      return NextResponse.json({ success: false, error: lastErr || 'Failed to connect to Google Gemini API.' }, { status: 400 });
    }

    // 2. TEST OPENAI
    if (provider === 'openai') {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Respond with OK' }],
            max_tokens: 10
          })
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({
            success: true,
            provider: 'openai',
            model: 'gpt-4o-mini',
            latencyMs,
            message: `OpenAI connected successfully (gpt-4o-mini • ${latencyMs}ms latency)`
          });
        }

        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `OpenAI Error (Status ${res.status})`;
        return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Failed to connect to OpenAI.' }, { status: 400 });
      }
    }

    // 3. TEST DEEPSEEK
    if (provider === 'deepseek') {
      try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Respond with OK' }],
            max_tokens: 10
          })
        });

        if (res.ok) {
          const latencyMs = Date.now() - startTime;
          return NextResponse.json({
            success: true,
            provider: 'deepseek',
            model: 'deepseek-chat',
            latencyMs,
            message: `DeepSeek connected successfully (deepseek-chat • ${latencyMs}ms latency)`
          });
        }

        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `DeepSeek Error (Status ${res.status})`;
        return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Failed to connect to DeepSeek.' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: 'Unknown provider specified.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Test failed' }, { status: 500 });
  }
}
