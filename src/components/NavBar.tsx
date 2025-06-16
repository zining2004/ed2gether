import { useEffect, useState } from 'react';
import styles from '../styles/NavBar.module.css'; 

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
    <nav>

      {isLoggedIn ? (
        <div className={styles.loggedin}>
            <div className={styles.navLinks}>
                <a href="/">Home</a>
                <a href="/edumeet">EduMeet</a>
                <a href="/edutoon">EduToon</a>
            </div>
        <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div className={styles.loggedout}>
          <a href="/login">Login</a>
        </div>
      )}
    </nav>
  )
}

export default Navbar;
