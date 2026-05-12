import express from 'express';
import OpenAI from 'openai';

const app = express();
app.use(express.json());

// Initialize with your API key and custom base URL (if needed)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Your new secret key
  baseURL: process.env.OPENAI_BASE_URL, // Only if using a custom endpoint
});

// Endpoint your frontend will call
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // or whatever model is available
      messages: [{ role: 'user', content: message }],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI request failed' });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));