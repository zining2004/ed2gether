import React, { useEffect, useRef, useState } from 'react'
import styles from '../styles/EduMeet.module.css'

const ICE_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const EduMeet: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream|null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return console.warn('Web Speech API not supported.');
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (evt: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        interim += evt.results[i][0].transcript;
      }
      socketRef.current?.send(JSON.stringify({ type: 'transcript', text: interim }));
      if (transcriptRef.current) transcriptRef.current.textContent = interim || '(no speech detected)';
    };
    recognitionRef.current = rec;
  }, []);

  const joinRoom = async () => {
    if (!roomId.trim()) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId.trim()}`);
    socketRef.current = ws;

    ws.onopen = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) ws.send(JSON.stringify({ type: 'ice', candidate: event.candidate }));
      };
    };

    ws.onmessage = async ({ data }) => {
      const msg = JSON.parse(data);
      const pc = pcRef.current;
      if (!pc) return;
      switch (msg.type) {
        case 'offer':
          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: 'answer', answer }));
          break;
        case 'answer':
          await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          break;
        case 'ice':
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
          break;
        case 'chat':
          if (chatBoxRef.current) {
            const div = document.createElement('div');
            div.textContent = msg.message;
            chatBoxRef.current.appendChild(div);
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
          }
          break;
        case 'transcript':
          if (transcriptRef.current) transcriptRef.current.textContent = msg.text;
          break;
        default:
          console.warn('Unknown message type:', msg.type);
      }
    };
  };

  const startCall = async () => {
    const pc = pcRef.current;
    const ws = socketRef.current;
    if (!pc || !ws) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', offer }));
  };

  const sendChat = (message: string) => {
    socketRef.current?.send(JSON.stringify({ type: 'chat', message }));
  };

  const toggleMute = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
  };

  const toggleCamera = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
  };

  const toggleTranscription = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isTranscribing) {
      rec.stop();
      setIsTranscribing(false);
    } else {
      rec.start();
      setIsTranscribing(true);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
      <div style={{ marginTop: 10 }}>
        <button onClick={startCall}>Start Call</button>
        <button onClick={toggleMute}>Mute/Unmute</button>
        <button onClick={toggleCamera}>Camera On/Off</button>
        <button onClick={toggleTranscription}>
          {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
        </button>
      </div>
      <div style={{ display: 'flex', marginTop: 10 }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '45%', marginRight: 10 }}
        />
        {!remoteStream && <div style={{ width:'45%', height:200, background:'#eee', textAlign:'center', lineHeight: '200px' }}>
        Waiting for remote video…
        </div>}
        <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width:'45%', display: remoteStream ? 'block' : 'none' }}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <div
          ref={chatBoxRef}
          style={{ border: '1px solid #ccc', padding: 8, height: 150, overflowY: 'auto' }}
        />
        <input
          type="text"
          placeholder="Type message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              sendChat(e.currentTarget.value.trim());
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
      <div
        ref={transcriptRef}
        style={{
          border: '1px solid #666',
          padding: 8,
          marginTop: 10,
          height: 100,
          overflowY: 'auto',
          fontStyle: 'italic',
        }}
      >
        <em>No transcription yet.</em>
      </div>
    </div>
  );
};

export default EduMeet;
