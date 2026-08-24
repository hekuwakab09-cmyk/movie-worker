import express from 'express';
import fs from 'fs';
import { config } from './config.js';
import { getStreamUrl, extractAudioFromStream, extractVideoClip } from './services/stream.js';
import { transcribeAudio, selectBestDialogueTime } from './services/ai.js';
import { uploadClipToS3 } from './services/storage.js';
import { sendToShotstack } from './services/shotstack.js';

const app = express();
app.use(express.json());

app.post('/process-movie', async (req, res) => {
  const { title } = req.body;
  const tempAudioPath = `./audio_${Date.now()}.mp3`;
  const tempClipPath = `./clip_${Date.now()}.mp4`;

  try {
    res.status(202).json({ status: 'processing', message: 'Запити обробляються' });

    // 1. Формуємо пошукове посилання uakino та отримуємо m3u8
    const pageUrl = `https://uakino.best/index.php?do=search&subaction=search&story=${encodeURIComponent(title)}`;
    const streamUrl = await getStreamUrl(pageUrl);

    // 2. Скачуємо ТІЛЬКИ аудіо (~15 МБ)
    await extractAudioFromStream(streamUrl, tempAudioPath);

    // 3. AI Аналіз
    const segments = await transcribeAudio(tempAudioPath);
    const { startTime, duration } = await selectBestDialogueTime(segments);

    // 4. Скачуємо ТІЛЬКИ 20 секунд відео
    await extractVideoClip(streamUrl, startTime, duration, tempClipPath);

    // 5. S3 завантаження
    const s3Url = await uploadClipToS3(tempClipPath, `clip_${Date.now()}.mp4`);

    // 6. Відправка у Shotstack
    await sendToShotstack(s3Url, duration);

    // Очищення файлів
    if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
    if (fs.existsSync(tempClipPath)) fs.unlinkSync(tempClipPath);

  } catch (error) {
    console.error('Помилка виконання:', error);
  }
});

app.listen(config.port, () => {
  console.log(`Worker запущено на порту ${config.port}`);
});
