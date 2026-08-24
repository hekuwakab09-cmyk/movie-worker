import execa from 'yt-dlp-exec';
import ffmpeg from 'fluent-ffmpeg';

// 1. Отримання прямого посилання на m3u8 потік
export async function getStreamUrl(moviePageUrl) {
  const output = await execa(moviePageUrl, {
    getUrl: true,
    format: 'best',
  });
  return output.stdout.trim();
}

// 2. Скачування ТІЛЬКИ аудіодоріжки
export function extractAudioFromStream(streamUrl, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(streamUrl)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate(64)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

// 3. Скачування ТІЛЬКИ потрібного 20-секундного кліпу
export function extractVideoClip(streamUrl, startTime, duration, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(streamUrl)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions('-c copy') // Fast seek без перекодування
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}
