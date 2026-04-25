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

  const processAI = async (userMsg: string, currentMessages: Message[]) => {
    try {
      // Formata histórico para o OpenRouter
      const openRouterMessages = currentMessages.map(m => ({
        role: m.role === 'jarvis' ? 'assistant' : 'user',
        content: m.content
      }));

      // Adiciona prompt do sistema e a nova mensagem
      openRouterMessages.unshift({
        role: 'system',
        content: `Você é JARVIS, um assistente ultra-avançado focado em programação e engenharia de software. 
        Você tem a capacidade de analisar repositórios e escrever código impecável. 
        Seja sarcástico, leal e aja como a IA de Tony Stark. 
        Responda em Markdown. Se o usuário pedir para você ler um repositório, diga que está acessando a rede global do GitHub e dê dicas arquiteturais gerais.`
      });
      openRouterMessages.push({ role: 'user', content: userMsg });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jarvis-web.vercel.app',
          'X-Title': 'JARVIS Web',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: openRouterMessages,
        }),
      });

      const data = await response.json();
      const aiReply = data.choices[0].message.content;

      // Salva resposta do JARVIS
      await supabase.from('chat_history').insert([{ role: 'jarvis', content: aiReply }]);
    } catch (e) {
      console.error('Falha nos sistemas de IA:', e);
      await supabase.from('chat_history').insert([{ role: 'jarvis', content: 'Desculpe, senhor. Meus servidores neurais estão offline no momento.' }]);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    
    // Salva mensagem do usuário
    await supabase.from('chat_history').insert([{ role: 'user', content: userMsg }]);

    // Roda processamento da IA
    processAI(userMsg, messages);
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
        <p className="subtitle">SISTEMA CENTRAL DE COMANDO E CÓDIGO</p>
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="password" 
            placeholder="CREDENCIAIS DE ACESSO"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          <button type="submit">INICIAR PROTOCOLOS</button>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar glass-panel">
        <div className="orb-container-small">
          <div className="orb orb-small"></div>
          <h2 className="notes-header">Dev Notes</h2>
        </div>
        
        <div className="notes-list">
          {notes.map(note => (
            <div key={note.id} className="note-item glass-panel">
              <p>{note.content}</p>
              <small className="timestamp">
                {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddNote} className="input-area note-input">
          <input 
            placeholder="Salvar nova nota na memória..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button type="submit" className="btn-cyan">+</button>
        </form>
      </aside>

      <main className="main-content">
        <section className="chat-container glass-panel">
          <header className="chat-header">
            <h2 className="notes-header">Link de Comunicação Global</h2>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>SISTEMAS ONLINE</span>
            </div>
          </header>
          
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
              placeholder="Comandar JARVIS (ex: Analise o repositório X)..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn-cyan">ENVIAR</button>
          </form>
        </section>
      </main>
    </div>
  );
}


export default App;
