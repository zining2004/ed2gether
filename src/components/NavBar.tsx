import { useEffect, useState } from 'react'

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loggedInStatus)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    setIsLoggedIn(false)
    window.location.reload() // force navbar to reflect logout
  }

  return (
    <nav style={{ display: 'flex', gap: '20px', padding: '10px' }}>
      <a href="/">Home</a>
      <a href="/edumeet">EduMeet</a>
      <a href="/edutoon">EduToon</a>

      {isLoggedIn ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        <>
          <a href="/login">Login</a>
        </>
      )}
    </nav>
  )
}

export default Navbar
