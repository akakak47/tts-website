const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const MIMO_API_KEY = '';
const MIMO_API_URL = 'https://api.xiaomimimo.com/v1/chat/completions';

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice, style, format, model, voiceDesign, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: '请先输入你的 API Key' });
    }

    const messages = [];

    if (model === 'mimo-v2.5-tts-voicedesign' && voiceDesign) {
      messages.push({ role: 'user', content: voiceDesign });
    } else if (style) {
      messages.push({ role: 'user', content: style });
    }

    // Text goes in assistant role
    let assistantContent = text;
    if (model === 'mimo-v2.5-tts' && !style) {
      // For preset voice without style, user message is optional
      // But we still need at least assistant message
    }
    messages.push({ role: 'assistant', content: assistantContent });

    const audioConfig = { format: format || 'wav' };
    if (model === 'mimo-v2.5-tts') {
      audioConfig.voice = voice || '冰糖';
    } else if (model === 'mimo-v2.5-tts-voicedesign') {
      // No voice field for voicedesign
    } else if (model === 'mimo-v2.5-tts-voiceclone') {
      // Voice clone needs audio sample - not supported in this basic UI
    }

    const body = {
      model: model || 'mimo-v2.5-tts',
      messages,
      audio: audioConfig,
    };

    const response = await fetch(MIMO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('MiMo API error:', response.status, errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const audioData = data.choices?.[0]?.message?.audio?.data;

    if (!audioData) {
      return res.status(500).json({ error: 'No audio data returned from API' });
    }

    res.json({ audio: audioData, format: format || 'wav' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3456;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TTS Website running at http://localhost:${PORT}`);
});
