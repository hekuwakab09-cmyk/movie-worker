import OpenAI from 'openai';
import fs from 'fs';
import { config } from '../config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

// 1. Транскрибація аудіо з отриманням таймкодів
export async function transcribeAudio(audioFilePath) {
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
    language: 'uk',
  });
  return response.segments;
}

// 2. Аналіз субтитрів через GPT-4o
export async function selectBestDialogueTime(segments) {
  const formattedSubtitles = segments
    .map(s => `[${Math.floor(s.start)}s - ${Math.floor(s.end)}s]: ${s.text}`)
    .join('\n');

  const prompt = `
Проаналізуй субтитри фільму:
${formattedSubtitles}

Знайди 1 найцікавіший або емоційний діалог тривалістю від 15 до 25 секунд.
Поверни JSON строго у такому форматі:
{
  "startTime": число_секунда_початку,
  "duration": число_тривалість_у_секундах
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
