// /client/src/Chat.js
import React, { useState, useContext } from 'react';
import { useAuth } from './context/AuthContext';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage = { role: 'assistant', content: data.reply };
        
        // CAMBIO CLAVE: Limpiamos el historial si la IA modificó algo
        if (data.reply.toLowerCase().includes('cambiada') || data.reply.toLowerCase().includes('creada') || data.reply.toLowerCase().includes('borrada')) {
          console.log("Modificación detectada, limpiando historial del chat.");
          setMessages([assistantMessage]); // Reiniciamos el chat para que la próxima llamada a la base de datos traiga los datos frescos.
        } else {
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        console.error('Error del backend:', data.error);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error. ¿Puedes intentarlo de nuevo?' }]);
      }
    } catch (error) {
      console.error('Error de red:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Revisa tu red.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (el resto del código del componente `return` sigue igual)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', width: '400px', border: '1px solid #ccc', borderRadius: '8px', margin: '20px auto' }}>
      <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <span style={{ backgroundColor: msg.role === 'user' ? '#007bff' : '#f1f1f1', color: msg.role === 'user' ? 'white' : 'black', padding: '8px 12px', borderRadius: '12px' }}>
              {msg.content}
            </span>
          </div>
        ))}
        {isLoading && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><span style={{ backgroundColor: '#f1f1f1', padding: '8px 12px', borderRadius: '12px' }}>Escribiendo...</span></div>}
      </div>
      <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #ccc' }}>
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