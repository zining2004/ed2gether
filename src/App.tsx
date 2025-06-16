import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/NavBar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import EduMeet from './components/EduMeet'
import EduToon from './components/EduToon'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/edumeet" element={<EduMeet />} />
        <Route path="/edutoon" element={<EduToon />} />
      </Routes>
    </Router>
  )
}

export default App
