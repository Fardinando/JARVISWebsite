import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Message {
  id: string;
  role: 'jarvis' | 'user';
  content: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [newNote, setNewNote] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    // Busca Notas
    const { data: notesData } = await supabase
      .from('developer_notes')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Busca Histórico
    const { data: historyData } = await supabase
      .from('chat_history')
      .select('*')
      .order('created_at', { ascending: true });

    if (notesData) setNotes(notesData);
    if (historyData) setMessages(historyData);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchData();
    
    const chatChannel = supabase
      .channel('chat_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_history' }, () => {
        fetchData();
      })
      .subscribe();

    const notesChannel = supabase
      .channel('notes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'developer_notes' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(notesChannel);
    };
  }, [isAuthenticated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'stark2026') {
      setIsAuthenticated(true);
    } else {
      alert('Acesso Negado: Código de Autorização Inválido.');
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    await supabase.from('chat_history').insert([{ role: 'user', content: userMsg }]);
  };

  const handleAddNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newNote.trim()) return;
    await supabase.from('developer_notes').insert([{ content: newNote }]);
    setNewNote('');
  };

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="orb-container">
          <div className="orb"></div>
        </div>
        <h1 className="jarvis-title">J.A.R.V.I.S.</h1>
        <p className="subtitle">SISTEMA CENTRAL DE COMANDO</p>
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="password" 
            placeholder="Insira a credencial de segurança"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          <button type="submit">AUTENTICAR</button>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="orb-container-small">
          <div className="orb orb-small"></div>
          <h2 className="notes-header">Developer Notes</h2>
        </div>
        
        <div className="notes-list">
          {notes.map(note => (
            <div key={note.id} className="note-item">
              <p>{note.content}</p>
              <small className="timestamp">
                {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddNote} className="input-area note-input">
          <input 
            placeholder="Salvar nova nota..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button type="submit">+</button>
        </form>
      </aside>

      <main className="main-content">
        <section className="chat-container">
          <h2 className="notes-header">Transmissão em Tempo Real</h2>
          
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`message-wrapper ${msg.role}`}>
                <div className="message-sender">{msg.role === 'jarvis' ? 'J.A.R.V.I.S.' : 'FERNANDO'}</div>
                <div className={`message ${msg.role}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="input-area chat-input">
            <input 
              placeholder="Digite um comando para o JARVIS..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">ENVIAR</button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
