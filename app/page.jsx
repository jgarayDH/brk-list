"use client";
import React, { useState, useEffect } from 'react';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import ParticipantList from './listComponent';
import './globals.css';

const Home = () => {
 
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const storedLoggedIn = localStorage.getItem('loggedIn') === 'true';
    setLoggedIn(storedLoggedIn);
  }, []);

  const handleLogin = () => {
    // Verificar la contraseña (puedes cambiar la contraseña aquí)
    const correctPassword = 'opendicks';

    if (password === correctPassword) {
      // Contraseña correcta, permitir acceso
      setLoggedIn(true);
      localStorage.setItem('loggedIn', 'true');
    } else {
      // Contraseña incorrecta, puedes mostrar un mensaje de error o tomar otra acción
      alert('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  return (
    <div className='p-2'>
      {!loggedIn ? (
        <div className='flex flex-column align-items-center'>
          <h1 className='mb-3'>THE BRK Lists</h1>
          <Password className='mb-3' feedback={false} tabIndex={1} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button label="Ingresar" className='w-' onClick={handleLogin} />
        </div>
      ) : (
        <div>
          <ParticipantList />
        </div>
      )}
    </div>
  );
};

export default Home;
