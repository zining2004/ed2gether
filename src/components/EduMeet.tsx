import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/EduMeet.module.css';

const ICE_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const EduMeet: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const signOutputRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);

  // Initialize speech transcription
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

  // Join or create a room
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
        const [incoming] = event.streams;
        if (incoming) {
          setRemoteStream(incoming);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = incoming;
        }
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({ type: 'ice', candidate: event.candidate }));
        }
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

  // Start the WebRTC call by sending an offer
  const startCall = async () => {
    const pc = pcRef.current;
    const ws = socketRef.current;
    if (!pc || !ws) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', offer }));
  };

  // End the call: close connections and cleanup
  const endCall = () => {
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => sender.track?.stop());
      pcRef.current.close();
      pcRef.current = null;
    }
    // Close socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    // Clear remote stream
    setRemoteStream(null);
    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // Send chat message
  const sendChat = (message: string) => {
    socketRef.current?.send(JSON.stringify({ type: 'chat', message }));
  };

  // Mute/unmute
  const toggleMute = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
  };
  // Camera on/off
  const toggleCamera = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
  };

  // Start/stop transcription
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

    // Start/stop sign interpretation
    const toggleSign = () => {
        const rec = recognitionRef.current;
        if (!rec) return;
        if (isSigning) {
          rec.stop();
          setIsSigning(false);
        } else {
          rec.start();
          setIsSigning(true);
        }
      };

      useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSigning) {
          interval = setInterval(async () => {
            try {
              const res = await fetch('http://localhost:5001/sign-word');
              const data = await res.json();
              if (signOutputRef.current) {
                signOutputRef.current.textContent = data.word || 'No sign detected';
              }
            } catch (err) {
              console.error('Sign polling error:', err);
            }
          }, 1000); // Poll every second
        }
        return () => clearInterval(interval);
      }, [isSigning]);
      

  return (
    <div className={styles.container}>
      <div className={styles.room}>
      <input
        type="text"
        placeholder="Enter room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
      </div>
      <div className={styles.buttons}>
        <button onClick={startCall}>Start Call</button>
        <button onClick={endCall}>End Call</button>
        <button onClick={toggleMute}>Mute/Unmute</button>
        <button onClick={toggleCamera}>Camera On/Off</button>
        <button onClick={toggleTranscription}>
          {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
        </button>
        <button onClick={toggleSign}>
          {isSigning ? 'Stop Sign Intepretation' : 'Start Sign Interpretation'}
        </button>
      </div>
      <div className={styles.videoContainer}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted/>
        { !remoteStream && (
          <div className={styles.waiting}>
          </div>
        ) }
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline/>
      </div>
      <div className={styles.transcriptContainer}>
      <div ref={transcriptRef} className={styles.transcript}>
        <em>No transcription yet.</em>
      </div>
      </div>
      <div className={styles.signContainer}>
        <h3>Sign Interpretation:</h3>
        <div ref={signOutputRef} className={styles.signOutput}>
            <em>No sign detected.</em>
        </div>
      </div>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
            <h3>Chatbox</h3>
        <div ref={chatBoxRef} />
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
      </div>
    </div>
  );
};

export default EduMeet;