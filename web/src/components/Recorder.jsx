import { useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import api from '../lib/api';

export default function Recorder({ circleId, alertId, onUploaded }) {
  const { t } = useI18n();
  const [mode, setMode] = useState(null);     // 'audio' | 'video'
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [status, setStatus] = useState('');
  const mediaRef = useRef(null); const chunks = useRef([]); const streamRef = useRef(null); const videoRef = useRef(null);

  const startRec = async (kind) => {
    setStatus(''); setBlob(null); setMode(kind);
    try {
      const constraints = kind === 'video' ? { audio: true, video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (kind === 'video' && videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      const mr = new MediaRecorder(stream); mediaRef.current = mr; chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => { setBlob(new Blob(chunks.current, { type: kind === 'video' ? 'video/webm' : 'audio/webm' })); stream.getTracks().forEach((tr) => tr.stop()); };
      mr.start(); setRecording(true);
    } catch (e) { setStatus(t('recorder.permission')); }
  };
  const stopRec = () => { mediaRef.current?.stop(); setRecording(false); };
  const upload = async () => {
    if (!blob) return;
    const fd = new FormData();
    fd.append('file', blob, `evidence.${mode === 'video' ? 'webm' : 'webm'}`);
    setStatus('…');
    try {
      await api.post(`/circles/${circleId}/alerts/${alertId}/media`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStatus(t('recorder.uploaded')); setBlob(null); onUploaded?.();
    } catch (e) { setStatus(e.response?.data?.message || 'error'); }
  };

  return (
    <div className="col" style={{ gap: 10 }}>
      {mode === 'video' && <video ref={videoRef} muted playsInline style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 200 }} />}
      <div className="row" style={{ gap: 8 }}>
        {!recording && <button className="btn" onClick={() => startRec('audio')}>🎙 {t('recorder.audio')}</button>}
        {!recording && <button className="btn" onClick={() => startRec('video')}>🎥 {t('recorder.video')}</button>}
        {recording && <button className="btn danger" onClick={stopRec}>⏹ {t('recorder.stop')} <span className="mono">●</span></button>}
        {blob && !recording && <button className="btn primary" onClick={upload}>⬆ {t('recorder.upload')}</button>}
      </div>
      {recording && <div className="pill danger"><span className="dot" />{t('recorder.recording')}</div>}
      {status && <div className="dim" style={{ fontSize: 12 }}>{status}</div>}
    </div>
  );
}
