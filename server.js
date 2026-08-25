import express from 'express';
// Імпортуємо тільки ті файли, які дійсно є в папці services/
import { getStreamUrl, extractVideoClip } from './services/stream.js';
// Якщо логіка AI/пошуку у вас в ai.js, імпортуйте її звідси:
// import { processTitleWithAI } from './services/ai.js'; 

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Перевірка статусу сервера
app.get('/', (req, res) => {
  res.send({ status: 'active', message: 'Worker is running!' });
});

// Ендпоінт для обробки назви
app.post('/process-title', async (req, res) => {
  try {
    const { title, originalTitle } = req.body;

    return res.json({
      success: true,
      originalTitle: originalTitle || title,
      processedTitle: title,
      message: 'Назву успішно опрацьовано'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Ендпоінт для роботи з відео
app.post('/process-video', async (req, res) => {
  try {
    const { videoUrl, startTime, duration } = req.body;

    // Отримуємо прямий потік із сторінки фільму
    const streamUrl = await getStreamUrl(videoUrl);

    // Вирізаємо потрібний відрізок у файл
    const outputPath = `/tmp/clip_${Date.now()}.mp4`;
    const result = await extractVideoClip(streamUrl, startTime, duration, outputPath);

    return res.json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Worker running on port ${PORT}`);
}); 
