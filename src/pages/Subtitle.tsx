import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Settings, Volume2, AlertCircle, Keyboard, Info } from 'lucide-react';
import { languages, getNativeName } from '@/utils/languages';
import { translate } from '@/utils/api';

interface SubtitleEntry {
  id: number;
  original: string;
  translated: string;
  timestamp: string;
}

const mapLangCode = (code: string): string => {
  const langMap: Record<string, string> = {
    'en': 'en-US',
    'zh': 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES',
    'ru': 'ru-RU',
    'pt': 'pt-PT',
    'it': 'it-IT',
    'ar': 'ar-SA',
    'hi': 'hi-IN',
    'th': 'th-TH',
    'vi': 'vi-VN',
    'id': 'id-ID',
    'ms': 'ms-MY',
    'tr': 'tr-TR',
    'nl': 'nl-NL',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'no': 'no-NO',
    'fi': 'fi-FI',
    'pl': 'pl-PL',
    'cs': 'cs-CZ',
    'hu': 'hu-HU',
    'ro': 'ro-RO',
    'bg': 'bg-BG',
    'el': 'el-GR',
  };
  return langMap[code] || code;
};

const speechToText = async (audioBase64: string, lang: string): Promise<{ success: boolean; text: string; message?: string }> => {
  try {
    const response = await fetch('/api/speech/speech-to-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio: audioBase64, lang }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, text: '', message: error instanceof Error ? error.message : 'Speech recognition failed' };
  }
};

export const Subtitle = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLang, setSourceLang] = useState('zh');
  const [targetLang, setTargetLang] = useState('en');
  const [currentText, setCurrentText] = useState('');
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [subtitleSize, setSubtitleSize] = useState(18);
  const [subtitleColor, setSubtitleColor] = useState('#ffffff');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string>('');
  const [useTextInputMode, setUseTextInputMode] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [speechApiStatus, setSpeechApiStatus] = useState<'loading' | 'available' | 'unavailable'>('available');
  const [showSpeechInfo, setShowSpeechInfo] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const dataArrayRef = useRef<any>(null);
  const animationRef = useRef<any>(null);
  const audioLevelRef = useRef(0);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const testSpeechApi = async () => {
      try {
        const response = await fetch('/api/health');
        const result = await response.json();
        if (!result.success) {
          setSpeechApiStatus('unavailable');
        }
      } catch {
        setSpeechApiStatus('unavailable');
      }
    };
    testSpeechApi();
  }, []);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const updateAudioLevel = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const average = dataArrayRef.current.reduce((a: number, b: number) => a + b) / dataArrayRef.current.length;
      audioLevelRef.current = average / 255;
      
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  const startAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      return stream;
    } catch (err) {
      throw err;
    }
  };

  const handleSpeechResult = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setCurrentText(text);
    setIsTranslating(true);
    
    try {
      const translateResult = await translate(text, sourceLang, targetLang);
      
      if (translateResult.success) {
        const newEntry: SubtitleEntry = {
          id: Date.now(),
          original: text,
          translated: translateResult.translation,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
        };
        setSubtitles((prev) => [...prev, newEntry]);
      } else {
        setError(translateResult.message || '翻译失败');
      }
    } catch (err) {
      console.error('Translation failed:', err);
      setError('翻译服务暂时不可用');
    } finally {
      setIsTranslating(false);
      setCurrentText('');
    }
  }, [sourceLang, targetLang]);

  const toggleRecording = useCallback(async () => {
    setError('');

    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsRecording(false);
      setRecordingStatus('idle');
      return;
    }

    if (speechApiStatus === 'unavailable') {
      setError('语音识别服务未配置，请使用手动输入模式');
      return;
    }

    try {
      setRecordingStatus('requesting');
      const stream = await startAudioContext();
      
      setRecordingStatus('starting');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          setRecordingStatus('processing');
          setCurrentText('正在识别语音...');
          
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await (audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)()).decodeAudioData(arrayBuffer);
          
          const offlineContext = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, audioBuffer.length, 16000);
          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          
          const filter = offlineContext.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 8000;
          
          source.connect(filter);
          filter.connect(offlineContext.destination);
          source.start(0);
          
          const resampledBuffer = await offlineContext.startRendering();
          const rawData = resampledBuffer.getChannelData(0);
          
          const pcmData = new Int16Array(rawData.length);
          for (let i = 0; i < rawData.length; i++) {
            const s = Math.max(-1, Math.min(1, rawData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          const pcmBlob = new Blob([pcmData.buffer], { type: 'audio/pcm' });
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            const speechResult = await speechToText(base64Audio, sourceLang);
            
            if (speechResult.success && speechResult.text) {
              await handleSpeechResult(speechResult.text);
            } else {
              let msg = speechResult.message || '语音识别失败';
              if (msg.includes('not configured') || msg.includes('unknown client id')) {
                msg = '语音识别服务未配置，请使用手动输入模式';
                setSpeechApiStatus('unavailable');
              }
              setError(msg);
              setCurrentText('');
            }
          };
          
          reader.readAsDataURL(pcmBlob);
        } catch (err) {
          console.error('Audio processing error:', err);
          setError('音频处理失败，请重试');
          setCurrentText('');
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingStatus('recording');
    } catch (err: any) {
      console.error('Recording error:', err);
      setRecordingStatus('error');
      
      const permissionErrors: Record<string, string> = {
        'NotAllowedError': '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
        'NotFoundError': '未找到麦克风设备',
        'NotReadableError': '麦克风设备被占用',
        'OverconstrainedError': '麦克风参数不匹配',
      };
      setError(permissionErrors[err.name] || `无法访问麦克风: ${err.message || err}`);
    }
  }, [isRecording, sourceLang, speechApiStatus, handleSpeechResult]);

  const handleManualTranslate = async () => {
    if (!manualInput.trim()) {
      setError('请输入要翻译的文字');
      return;
    }

    setError('');
    setCurrentText(manualInput);
    setIsTranslating(true);

    try {
      const result = await translate(manualInput, sourceLang, targetLang);
      if (result.success) {
        const newEntry: SubtitleEntry = {
          id: Date.now(),
          original: manualInput,
          translated: result.translation,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
        };
        setSubtitles((prev) => [...prev, newEntry]);
        setManualInput('');
      } else {
        setError(result.message || '翻译失败');
      }
    } catch (err) {
      console.error('Translation failed:', err);
      setError('翻译服务暂时不可用');
    } finally {
      setIsTranslating(false);
      setCurrentText('');
    }
  };

  const clearSubtitles = () => {
    setSubtitles([]);
  };

  const speakTranslation = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = mapLangCode(targetLang);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">实时字幕</h1>

        {speechApiStatus === 'unavailable' && (
          <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded-lg p-4 mb-6 flex items-start">
            <Info className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-medium">语音识别服务未配置</p>
              <p className="text-yellow-400 text-sm mt-1">
                当前使用的是百度翻译 API 凭据，语音识别需要单独的百度语音识别 API Key 和 Secret Key。
                请切换到手动输入模式使用翻译功能。
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        <div className="relative bg-black rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="aspect-video bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Mic className={`w-16 h-16 mx-auto ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                {isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-accent-500 border-opacity-30 rounded-full animate-ping" />
                    <div className="w-16 h-16 border-2 border-accent-500 border-opacity-60 rounded-full animate-ping delay-100" />
                  </div>
                )}
              </div>
              <p className="text-gray-400">
                {recordingStatus === 'requesting' && '请求麦克风权限...'}
                {recordingStatus === 'starting' && '正在启动录音...'}
                {recordingStatus === 'recording' && '正在录音...请说话，点击停止结束'}
                {recordingStatus === 'processing' && '正在识别语音...'}
                {recordingStatus === 'error' && '录音失败，请检查错误信息'}
                {recordingStatus === 'idle' && (useTextInputMode ? '使用下方输入框手动输入' : '点击开始按钮开始录音')}
              </p>
              {isRecording && (
                <div className="mt-4 flex items-center justify-center space-x-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-accent-500 rounded-full transition-all duration-75"
                      style={{
                        height: `${20 + Math.random() * audioLevelRef.current * 80}px`,
                        opacity: 0.5 + audioLevelRef.current * 0.5,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div 
            className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-6"
            style={{ fontSize: `${subtitleSize}px`, color: subtitleColor }}
          >
            {currentText ? (
              <div>
                <p className="text-gray-400 text-sm mb-1">正在识别:</p>
                <p className="text-white">{currentText}</p>
              </div>
            ) : isTranslating ? (
              <p className="text-accent-400">正在翻译...</p>
            ) : subtitles.length > 0 ? (
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-gray-500">{subtitles[subtitles.length - 1].timestamp}</span>
                <span className="text-white">{subtitles[subtitles.length - 1].original}</span>
                <span className="text-accent-400">→</span>
                <span className="text-white">{subtitles[subtitles.length - 1].translated}</span>
              </div>
            ) : (
              <p className="text-gray-500">字幕将显示在这里...</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">源语言:</span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                {languages.filter((l) => l.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-400">目标语言:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                {languages.filter((l) => l.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setUseTextInputMode(!useTextInputMode)}
                className={`p-3 rounded-lg transition-colors ${
                  useTextInputMode 
                    ? 'bg-accent-500 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <Keyboard className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-white font-medium mb-4">字幕设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 block mb-2">字幕大小</label>
                  <input
                    type="range"
                    min="14"
                    max="32"
                    value={subtitleSize}
                    onChange={(e) => setSubtitleSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-gray-500 text-sm">{subtitleSize}px</span>
                </div>
                <div>
                  <label className="text-gray-400 block mb-2">字幕颜色</label>
                  <input
                    type="color"
                    value={subtitleColor}
                    onChange={(e) => setSubtitleColor(e.target.value)}
                    className="w-full h-10 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {useTextInputMode && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualTranslate()}
                  placeholder="输入要翻译的文字，按回车翻译..."
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <button
                  onClick={handleManualTranslate}
                  className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition-colors"
                >
                  翻译
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center space-x-4 mb-6">
          {!useTextInputMode && (
            <button
              onClick={toggleRecording}
              disabled={speechApiStatus !== 'available'}
              className={`flex items-center px-8 py-4 rounded-full font-medium text-lg transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : speechApiStatus !== 'available'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-accent-500 hover:bg-accent-600 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-6 h-6 mr-2" />
                  停止录音
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 mr-2" />
                  开始录音
                </>
              )}
            </button>
          )}

          <button
            onClick={clearSubtitles}
            className="flex items-center px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-medium transition-colors"
          >
            清空字幕
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">字幕历史</h3>
          {subtitles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无字幕记录</p>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {subtitles.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-700 rounded-lg p-4"
                  style={{ fontSize: `${subtitleSize - 4}px` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gray-500 text-sm">{entry.timestamp}</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-400 text-sm">
                          {getNativeName(sourceLang)} → {getNativeName(targetLang)}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-2">{entry.original}</p>
                      <p className="text-accent-400">{entry.translated}</p>
                    </div>
                    <button
                      onClick={() => speakTranslation(entry.translated)}
                      className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-accent-400 transition-colors ml-4"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
