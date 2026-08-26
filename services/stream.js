import axios from 'axios';
import * as cheerio from 'cheerio';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Отримує пряме посилання на відеопотік (.m3u8 або .mp4) зі сторінки фільму/серіалу
 * @param {string} pageUrl - Посилання на сторінку фільму (наприклад, uakino)
 * @returns {Promise<string|null>} - Пряме посилання на медіапотік або null
 */
export async function getStreamUrl(pageUrl) {
  try {
    if (!pageUrl) {
      throw new Error('URL сторінки не вказано');
    }

    // Завантажуємо HTML-код сторінки
    const { data: html } = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    const $ = cheerio.load(html);

    // 1. Пошук посилання в iframe або плеєрах на сторінці
    let streamUrl = null;

    // Шукаємо посилання на плеєр в iframe
    const iframeSrc = $('iframe').attr('src');
    if (iframeSrc) {
      // Якщо в iframe є прямий шлях до м3у8 або медіафайлу
      if (iframeSrc.includes('.m3u8') || iframeSrc.includes('.mp4')) {
        streamUrl = iframeSrc;
      }
    }

    // 2. Якщо посилання зашифроване/знаходиться в скриптах, шукаємо регулярним виразом
    if (!streamUrl) {
      const m3u8Match = html.match(/(https?:\/\/[^\s"',]+?\.m3u8[^\s"',]*)/i);
      const mp4Match = html.match(/(https?:\/\/[^\s"',]+?\.mp4[^\s"',]*)/i);

      if (m3u8Match) {
        streamUrl = m3u8Match[0];
      } else if (mp4Match) {
        streamUrl = mp4Match[0];
      }
    }

    if (!streamUrl) {
      console.warn(`Не вдалося витягти потік з: ${pageUrl}`);
      return null;
    }

    return streamUrl;
  } catch (error) {
    console.error('Помилка в getStreamUrl:', error.message);
    throw new Error(`Не вдалося отримати відеопотік: ${error.message}`);
  }
}

/**
 * Завантажує та вирізає фрагмент відео з потоку за допомогою FFmpeg
 * @param {string} streamUrl - Пряме посилання на .m3u8 або .mp4
 * @param {string|number} startTime - Початок (наприклад, "00:01:30" або секунди)
 * @param {string|number} duration - Тривалість відрізка в секундах
 * @param {string} outputPath - Шлях для збереження файлу (наприклад, '/tmp/clip.mp4')
 * @returns {Promise<string>} - Повертає шлях до створеного файлу
 */
export async function extractVideoClip(streamUrl, startTime, duration, outputPath) {
  return new Promise((resolve, reject) => {
    if (!streamUrl) {
      return reject(new Error('Потік streamUrl відсутній'));
    }

    ffmpeg(streamUrl)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions([
        '-c copy', // Швидке копіювання без перекодування
        '-bsf:a aac_adtstoasc'
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`Кліп успішно збережено: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Помилка FFmpeg:', err.message);
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .run();
  });
}

/**
 * Заглушка або функція скачування потоку
 */
export async function downloadStream(url) {
  return await getStreamUrl(url);
}
