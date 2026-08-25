import OpenAI from 'openai';
import fs from 'fs';
import { config } from '../config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

/**
 * Перекладає або адаптує назву фільму офіційною українською назвою для кінопрокату
 */
export async function getUkrainianTitle(originalTitle) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Ти — кіноексперт. Надай офіційну українську назву фільму для кінопрокату за його оригінальною (англійською або іншою) назвою. Відповідай ВИКЛЮЧНО назвою фільму українською мовою, без лапок, пояснень, додаткових слів чи крапок.'
        },
        {
          role: 'user',
          content: originalTitle
        }
      ],
      temperature: 0.2,
    });

    const ukrainianTitle = response.choices[0].message.content.trim();
    console.log(`[AI] Переклад назви: "${originalTitle}" -> "${ukrainianTitle}"`);
    return ukrainianTitle;
  } catch (error) {
    console.error('[AI Error] Помилка перекладу назви:', error.message);
    return originalTitle;
  }
}

/**
 * Транскрибує аудіофайл за допомогою OpenAI Whisper
 */
export async function transcribeAudio(audioFilePath) {
  try {
    console.log('[AI] Початок транскрибації аудіо через Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    });

    return transcription;
  } catch (error) {
    console.error('[AI Error] Помилка Whisper:', error.message);
    throw error;
  }
}

/**
 * Знаходить найцікавіший 20-секундний фрагмент у транскрипті
 */
export async function findBestClipSegment(transcription) {
  try {
    console.log('[AI] Пошук найкращого фрагменту через GPT-4o...');
    
    const prompt = `
Аналiзуй наступний транскрипт фільму з часовими мітками (в секундах). 
Знайди найдинамічніший, емоційний або цікавий діалог/момент тривалістю від 15 до 25 секунд.

Поверни результат ВИКЛЮЧНО у форматі JSON з полями:
- "start": timestamp початку у секундах (число)
- "end": timestamp кінця у секундах (число)
- "reason": коротке пояснення чому обрано цей момент

Транскрипт:
${JSON.stringify(transcription.segments || transcription.text)}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: "json_object" },
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`[AI] Знайдено фрагмент: з ${result.start}s по ${result.end}s`);
    return result;
  } catch (error) {
    console.error('[AI Error] Помилка аналізу GPT-4o:', error.message);
    throw error;
  }
}
