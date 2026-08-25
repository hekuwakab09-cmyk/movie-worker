import express from 'express';
import { downloadStream, cutVideoSegment } from './services/stream.js';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send({ status: 'active', message: 'Worker is running!' });
});

app.post('/process-title', async (req, res) => {
  try {
    const { title, originalTitle } = req.body;

    return res.json({
      success: true,
      originalTitle: originalTitle || title,
      processedTitle: title,
      message: 'Назву успішно оброблено'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Worker running on port ${PORT}`);
});
