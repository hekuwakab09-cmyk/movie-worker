import axios from 'axios';
import * as cheerio from 'cheerio';
import ffmpeg from 'fluent-ffmpeg';
import ytdlp from 'yt-dlp-exec';

/**
 * Отримує пряме посилання на відеопотік
 */
export async function getStreamUrl(pageUrl) {
  try {
    if (!pageUrl) throw new Error('URL відсутній');

    // Спочатку пробуємо через yt-dlp (працює для більшості плеєрів)
    try {
      const output = await ytdlp(pageUrl, {
        getUrl: true,
        noWarnings: true
      });
      if (output && output.trim()) {
        return output.trim();
      }
    } catch (e) {
      console.log('yt-dlp не зміг витягти посилання, пробуємо cheerio...');
    }

    // Резервний варіант через Axios + Cheerio
    const { data: html } = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const m3u8Match = html.match(/(https?:\/\/[^\s"',]+?\.m3u8[^\s"',]*)/i);
    const mp4Match = html.match(/(https?:\/\/[^\s"',]+?\.mp4[^\s"',]*)/i);

    return m3u8Match ? m3u8Match[0] : (mp4Match ? mp4Match[0] : null);

  } catch (error) {
    console.error('Помилка в getStreamUrl:', error.message);
    throw error;
  }
}

/**
 * Вирізає фрагмент відео через FFmpeg
 */
export async function extractVideoClip(streamUrl, startTime, duration, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(streamUrl)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions(['-c copy', '-bsf:a aac_adtstoasc'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

export async function downloadStream(url) {
  return await getStreamUrl(url);
}
