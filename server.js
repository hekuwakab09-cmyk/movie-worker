import express from 'express';
import { config } from './config.js';
import { getUkrainianTitle, transcribeAudio, findBestClipSegment } from './services/ai.js';
import { downloadStream, cutVideoSegment } from './services/stream.js';
import { uploadClipToS3 } from './services/storage.js';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Movie Worker is running!');
});

app.post('/process-movie', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Потрібно вказати параметр "title"' });
  }

  console.log(`\n===========================================`);
  console.log(`[Worker] Нова задача отримана для: "${title}"`);

  try {
    // 1. Переклад назви
    const ukrainianTitle = await getUkrainianTitle(title);

    // 2. Пошук та завантаження аудіо
    const audioPath = await downloadStream(ukrainianTitle);

    // 3. Аналіз Whisper + GPT-4o
    const transcription = await transcribeAudio(audioPath);
    const segment = await findBestClipSegment(transcription);

    // 4. Нарізка відео через FFmpeg
    const clipPath = await cutVideoSegment(segment.start, segment.end);

    // 5. Завантаження у Cloudflare R2
    const clipUrl = await uploadClipToS3(clipPath, `clip-${Date.now()}.mp4`);

    // Повертаємо готову відповідь для n8n
    res.json({
      success: true,
      originalTitle: title,
      processedTitle: ukrainianTitle,
      clipUrl: clipUrl,
      segment: segment
    });

  } catch (error) {
    console.error('[Worker Error] Помилка виконання:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(config.port, () => {
  console.log(`Worker running on port ${config.port}`);
});
