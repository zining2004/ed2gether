import { useState } from 'react';
import { supabase } from '../utils/supabase';
import styles from '../styles/Register.module.css'; 

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    const { error } = await supabase
      .from('users') // Replace 'users' with your actual table name
      .insert([{ username, password }]); // Consider hashing the password

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('User registered successfully!');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className={styles.registerBackground}>
    <div className={styles.registerContainer}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
    </div>
  );
}

export default Register;