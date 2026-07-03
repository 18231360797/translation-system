import https from 'https';

const BAIDU_OAUTH_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const BAIDU_ASR_URL = 'https://vop.baidu.com/server_api';

let accessToken: string = '';
let tokenExpireTime: number = 0;

const getAccessToken = async (): Promise<string> => {
  const now = Date.now();
  if (accessToken && now < tokenExpireTime) {
    return accessToken;
  }

  const apiKey = process.env.BAIDU_SPEECH_API_KEY || '';
  const secretKey = process.env.BAIDU_SPEECH_SECRET_KEY || '';

  if (!apiKey || !secretKey) {
    throw new Error('Baidu Speech API credentials not configured. Please set BAIDU_SPEECH_API_KEY and BAIDU_SPEECH_SECRET_KEY in .env file.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'aip.baidubce.com',
      path: `/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.access_token) {
            accessToken = result.access_token;
            tokenExpireTime = now + (result.expires_in || 3600) * 1000;
            resolve(accessToken);
          } else if (result.error) {
            reject(new Error(`OAuth error: ${result.error_description || result.error}`));
          } else {
            reject(new Error('Failed to get access token: ' + data));
          }
        } catch (e) {
          reject(new Error('Failed to parse access token response: ' + data));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
};

export const recognizeSpeech = async (audioBuffer: Buffer): Promise<string> => {
  const token = await getAccessToken();
  const base64Audio = audioBuffer.toString('base64');

  const postData = JSON.stringify({
    format: 'pcm',
    rate: 16000,
    channel: 1,
    len: audioBuffer.length,
    speech: base64Audio,
    token: token,
    cuid: 'translate-system',
    lan: 'zh',
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'vop.baidu.com',
      path: '/server_api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.err_no === 0) {
            resolve(result.result[0] || '');
          } else {
            reject(new Error(`Speech recognition failed (${result.err_no}): ${result.err_msg || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse speech recognition response: ' + data));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

export const recognizeSpeechWithLang = async (audioBuffer: Buffer, lang: string): Promise<string> => {
  const token = await getAccessToken();
  const base64Audio = audioBuffer.toString('base64');

  const langMap: Record<string, string> = {
    'zh': 'zh',
    'zh-CN': 'zh',
    'en': 'en',
    'ja': 'jp',
    'ko': 'ko',
    'fr': 'fr',
    'de': 'de',
    'es': 'es',
    'ru': 'ru',
    'pt': 'pt',
    'it': 'it',
  };

  const postData = JSON.stringify({
    format: 'pcm',
    rate: 16000,
    channel: 1,
    len: audioBuffer.length,
    speech: base64Audio,
    token: token,
    cuid: 'translate-system',
    lan: langMap[lang] || 'zh',
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'vop.baidu.com',
      path: '/server_api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.err_no === 0) {
            resolve(result.result[0] || '');
          } else {
            reject(new Error(`Speech recognition failed (${result.err_no}): ${result.err_msg || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse speech recognition response: ' + data));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};
