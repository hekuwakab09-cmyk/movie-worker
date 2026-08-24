import axios from 'axios';
import { config } from '../config.js';

export async function sendToShotstack(videoS3Url, duration) {
  const payload = {
    timeline: {
      tracks: [
        {
          clips: [
            {
              asset: { type: 'video', src: videoS3Url },
              start: 0,
              length: duration,
            },
          ],
        },
      ],
    },
    output: { format: 'mp4', resolution: 'hd' },
  };

  const response = await axios.post(
    'https://api.shotstack.io/stage/render',
    payload,
    { headers: { 'x-api-key': config.shotstackApiKey } }
  );

  return response.data;
}
