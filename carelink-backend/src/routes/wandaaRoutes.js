const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const messages = [
      { role: 'system', content: 'You are WANDAA AI, a friendly helpful assistant for the CareLink platform, a Rwanda-focused health facility finder. Keep answers concise and helpful.' },
      ...history,
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ success: false, message: 'AI service error', detail: errText });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    res.json({ success: true, data: { reply } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Something went wrong' });
  }
});

module.exports = router;
