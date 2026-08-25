import express from 'express';
// Переконайтеся, що в файлі ./services/stream.js ці функції дійсно мають `export function ...`
import { downloadStream, cutVideoSegment } from './services/stream.js';
// Переконайтеся, що у вас є сервіс для пошуку (назва та шлях можуть відрізнятися у вашому проекті)
import { searchUakino } from './services/search.js'; 

const app = express();
const PORT = process.env.PORT || 10000;

// Мідлвар для читання JSON від n8n
app.use(express.json());

// Перевірка працездатності сервера (Health Check)
app.get('/', (req, res) => {
  res.send({ status: 'active', message: 'Worker is running!' });
});

// Ендпоінт для обробки назви та пошуку посилання
app.post('/process-title', async (req, res) => {
  try {
    const { title, originalTitle } = req.body;

    if (!title && !originalTitle) {
      return res.status(400).json({
        success: false,
        message: 'Потрібно передати title або originalTitle'
      });
    }

    const query = title || originalTitle;
    
    // Виклик вашої функції пошуку посилання на uakino
    const searchResult = await searchUakino(query);

    return res.json({
      success: true,
      originalTitle: originalTitle || title,
      processedTitle: title,
      link: searchResult?.link || null, // Передаємо знайдене посилання
      message: searchResult?.link 
        ? 'Успішно знайдено посилання на uakino' 
        : 'Назву опрацьовано, але посилання на uakino не знайдено'
    });

  } catch (error) {
    console.error('Помилка при обробці запиту:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера',
      error: error.message
    });
  }
});

// Ендпоінт для нарізки/завантаження відео (за потреби)
app.post('/process-video', async (req, res) => {
  try {
    const { videoUrl, startTime, duration } = req.body;

    // Приклад використання cutVideoSegment
    const result = await cutVideoSegment(videoUrl, startTime, duration);

    return res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Помилка обробки відео:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Worker running on port ${PORT}`);
});
