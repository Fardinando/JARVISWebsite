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
    fetchData();
    
    // Inscrição Realtime para Chat
    const chatChannel = supabase
      .channel('chat_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_history' }, () => {
        fetchData();
      })
      .subscribe();

    // Inscrição Realtime para Notas
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
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    
    // Salva no Supabase
    await supabase.from('chat_history').insert([{ role: 'user', content: userMsg }]);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await supabase.from('developer_notes').insert([{ content: newNote }]);
    setNewNote('');
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="orb-container">
          <div className="orb"></div>
        </div>
        
        <h2 className="notes-header">Developer Notes</h2>
        <div className="notes-list">
          {notes.map(note => (
            <div key={note.id} className="note-item">
              <p>{note.content}</p>
              <small style={{ color: 'var(--jarvis-cyan)', opacity: 0.6 }}>
                {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          ))}
        </div>

        <div className="input-area" style={{ marginTop: '20px', padding: '10px' }}>
          <input 
            placeholder="Nova nota..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <button onClick={handleAddNote} style={{ padding: '8px 15px' }}>+</button>
        </div>
      </aside>

      <main className="main-content">
        <section className="chat-container">
          <h2 className="notes-header">Sistemas Centrais</h2>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <input 
              placeholder="Falar com o JARVIS..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>ENVIAR</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
