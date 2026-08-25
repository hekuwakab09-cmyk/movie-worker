import express from 'express';
import { config } from './config.js';
import { getUkrainianTitle, transcribeAudio, findBestClipSegment } from './services/ai.js';
// Переконайтеся, що імпортуєте ваші функції обробки відео/стріму
// import { downloadStream, cutVideoSegment } from './services/stream.js';
// import { uploadClipToS3 } from './services/storage.js';

const app = express();
app.use(express.json());

// Простий статус-ендпоінт для перевірки роботоздатності
app.get('/', (req, res) => {
  res.send('Movie Worker is running!');
});

// Основний ендпоінт обробки запиту від n8n
app.post('/process-movie', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Потрібно вказати параметр "title"' });
  }

  console.log(`\n===========================================`);
  console.log(`[Worker] Нова задача отримана для: "${title}"`);

  try {
    // 1. Адаптація/переклад назви на українську через GPT-4o
    const ukrainianTitle = await getUkrainianTitle(title);

    // 2. Логіка пошуку на uakino та завантаження аудіо/відео
    // const audioPath = await downloadStream(ukrainianTitle);

    // 3. Аналіз аудіо через OpenAI (Whisper + GPT-4o)
    // const transcription = await transcribeAudio(audioPath);
    // const segment = await findBestClipSegment(transcription);

    // 4. Нарізка потрібного фрагмента через FFmpeg
    // const clipPath = await cutVideoSegment(segment.start, segment.end);

    // 5. Завантаження нарізаного кліпу у Cloudflare R2
    // const clipUrl = await uploadClipToS3(clipPath, `clip-${Date.now()}.mp4`);

    // Тимчасова відповідь для тесту (замініть на реальні дані після інтеграції stream.js)
    res.json({
      success: true,
      originalTitle: title,
      processedTitle: ukrainianTitle,
      message: 'Назву успішно адаптовано для пошуку на uakino',
      // clipUrl: clipUrl
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
