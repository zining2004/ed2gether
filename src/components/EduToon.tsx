import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/EduToon.module.css';
import ReactMarkdown from 'react-markdown';

function EduToon() {
  const [summary, setSummary] = useState('');
  const [videoPaths, setVideoPaths] = useState<string[]>([]);
  const [audioPath, setAudioPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('username', localStorage.getItem('username') || 'guest');

    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      setSummary(result.summary);
      setVideoPaths(result.videoPaths || []);
      setAudioPath(`http://localhost:5000${result.audioPath}`);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <main className={styles.container}>
      {/* Upload Section */}
      <section className={styles.uploadSection}>
        <h2>📤 Upload Your Document</h2>
        <form onSubmit={handleUpload}>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            required
          />
          <button type="submit">Generate 🎨</button>
        </form>
      </section>

      {/* Output Type Buttons */}
      <div className={styles.outputButtons}>
        <button type="button" data-value="video">🎥 Video</button>
        <button type="button" data-value="comic">📚 Comic</button>
      </div>

      {/* Summary Section */}
      <section className={styles.summarySection}>
        <h2>📝 Summary</h2>
        <ReactMarkdown>
          {summary || 'No summary generated yet.'}
        </ReactMarkdown>
      </section>

      {/* Video Outputs */}
      <section className={styles.videoSection}>
        <h2>🎬 Video Outputs</h2>
        {videoPaths.length > 0 ? (
          videoPaths.map((path, index) => (
            <video key={index} controls>
              <source src={`http://localhost:5000${path}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ))
        ) : (
          <p>No videos generated yet.</p>
        )}
      </section>

      {/* Audio Output */}
      <section className={styles.audioSection}>
        <h2>🔊 Audio Narration</h2>
        {audioPath ? (
          <audio controls className="w-full">
            <source src={audioPath} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        ) : (
          <p>No audio narration available.</p>
        )}
      </section>
    </main>
  );
}

export default EduToon;
