import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function EduToon() {
  const [summary, setSummary] = useState('')
  const [videoPath, setVideoPath] = useState('')
  const [audioPath, setAudioPath] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/login')
    }
  }, [navigate])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
  
    if (!selectedFile) return
  
    const formData = new FormData()
    formData.append('document', selectedFile)
    formData.append('username', localStorage.getItem('username') || 'guest')
  
    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      })
  
      const result = await res.json()
      setSummary(result.summary)
      setVideoPath(`http://localhost:5000${result.videoPath}`)  
      setAudioPath(`http://localhost:5000${result.audioPath}`)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
  

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 font-sans p-10 space-y-8 overflow-y-auto">
      {/* Upload Section */}
      <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">📤 Upload Your Document</h2>
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="border border-gray-300 p-3 rounded-md w-full sm:w-auto"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md shadow-md transition"
          >
            Generate 🎨
          </button>
        </form>
      </section>

      {/* Output Type Buttons */}
      <div className="flex flex-wrap gap-4 mt-4 mb-8">
        <button
          type="button"
          data-value="video"
          className="output-btn bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600 active"
        >
          🎥 Video
        </button>
        <button
          type="button"
          data-value="comic"
          className="output-btn bg-gray-200 text-gray-700 px-4 py-2 rounded-md shadow hover:bg-gray-300"
        >
          📚 Comic
        </button>
      </div>

      {/* Summary Section */}
      <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">📝 Summary</h2>
        <div className="text-gray-700 leading-relaxed">{summary || 'No summary generated yet.'}</div>
      </section>

      {/* Video Output */}
      <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">🎬 Video Output</h2>
        {videoPath ? (
          <video controls className="w-full max-w-2xl mx-auto rounded-lg">
            <source src={videoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <p className="text-center text-gray-500 italic">No video generated yet.</p>
        )}
      </section>

      {/* Audio Output */}
      <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">🔊 Audio Narration</h2>
        {audioPath ? (
          <audio controls className="w-full">
            <source src={audioPath} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        ) : (
          <p className="text-center text-gray-500 italic">No audio narration available.</p>
        )}
      </section>
    </main>
  )
}

export default EduToon
