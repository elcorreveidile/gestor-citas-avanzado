// /client/src/Chat.js
import React, { useState, useContext } from 'react';
import { useAuth } from './context/AuthContext';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Obtenemos los datos de autenticación directamente aquí
  const { user, token } = useAuth();

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;

    // Verificamos el usuario justo antes de enviar
    if (!user || !user.id) {
      alert("Parece que no has iniciado sesión. Recarga la página e intenta loguearte de nuevo.");
      console.error("ERROR DE CHAT: El objeto 'user' es:", user); // Línea para depurar
      return;
    }

    const userMessage = { role: 'user', content: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const payload = { 
        messages: newMessages, 
        userName: user.name, 
        userId: user.id 
      };

      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessages = data.messages_to_display || [];
        const visibleMessages = assistantMessages.filter(msg => !msg.content.startsWith('🔧'));
        setMessages(prev => [...prev, ...visibleMessages]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error. ¿Puedes intentarlo de nuevo?' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Revisa tu red.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '300px', maxWidth: '600px', margin: 'auto' }}>
      <div style={{ flex: 1, padding: '10px', overflowY: 'auto', border: '1px solid #444', borderRadius: '8px', background: '#282c34' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <span style={{ backgroundColor: msg.role === 'user' ? '#007bff' : '#f1f1f1', color: msg.role === 'user' ? 'white' : 'black', padding: '8px 12px', borderRadius: '12px' }}>
              {msg.content}
            </span>
          </div>
        ))}
        {isLoading && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><span style={{ backgroundColor: '#f1f1f1', padding: '8px 12px', borderRadius: '12px' }}>Escribiendo...</span></div>}
      </div>
      <form onSubmit={handleSendMessage} style={{ display: 'flex', marginTop: '10px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe tu mensaje..."
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} style={{ marginLeft: '8px', padding: '8px 12px' }}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default Chat;