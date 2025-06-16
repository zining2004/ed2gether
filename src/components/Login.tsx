import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password.trim());

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      setMessage('Invalid username or password');
    } else {
      setMessage(`Welcome, ${data[0].username}!`);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', data[0].username);

      navigate('/');
      window.location.reload()
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
        <p>
            Don't have an account? <button onClick={goToRegister}>Register</button>
        </p>
    </div>
  );
}

export default Login;