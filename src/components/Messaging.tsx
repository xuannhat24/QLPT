import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { 
  MessageCircle, Edit3, Settings, Search, Users, Phone, Video, Info, 
  PlusCircle, ImageIcon, Smile, Send
} from 'lucide-react';

interface MessagingProps {
  user: any;
  role: 'landlord' | 'tenant';
  initialActiveChat?: string;
}

const Messaging: React.FC<MessagingProps> = ({ user, role, initialActiveChat }) => {
  const [activeChat, setActiveChat] = useState<string | null>(initialActiveChat || null);

  useEffect(() => {
    if (initialActiveChat) {
      setActiveChat(initialActiveChat);
    }
  }, [initialActiveChat]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    
    const fetchConversations = async () => {
      let { data, error } = await supabase
        .from('conversations')
        .select('id, updated_at, landlord_id, tenant_id')
        .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Lỗi khi tải danh sách chat:', error);
      }

      if (data) {
        // Collect counterpart IDs to fetch profiles
        const targetIds = data.map((c: any) => c.landlord_id === user.id ? c.tenant_id : c.landlord_id);
        
        let profileMap: Record<string, any> = {};
        if (targetIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', targetIds);
            
          if (profiles) {
            profiles.forEach(p => {
              profileMap[p.id] = p;
            });
          }
        }

        setConversations(data.map((c: any) => {
          const targetId = c.landlord_id === user.id ? c.tenant_id : c.landlord_id;
          const userProfile = profileMap[targetId];
          
          return {
            id: c.id,
            name: userProfile?.full_name || (role === 'landlord' ? 'Khách thuê' : 'Chủ phòng'),
            avatar: userProfile?.avatar_url,
            time: new Date(c.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            unread: 0,
            online: true,
            lastMessage: 'Nhấn để xem tin nhắn...'
          };
        }));
        // 4. Nếu có initialActiveChat, ưu tiên nó. Nếu chưa có activeChat nào, chọn chat đầu tiên.
        if (data.length > 0) {
          if (initialActiveChat) {
            setActiveChat(initialActiveChat);
          } else if (!activeChat) {
            setActiveChat(data[0].id);
          }
        }
      }
    };
    fetchConversations();
  }, [user, role]);

  // Fetch messages and subscribe
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeChat)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          text: m.content,
          isMe: m.sender_id === user?.id,
          time: new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        })));
      }
    };
    fetchMessages();

    const channelName = `chat_${role}_${activeChat}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeChat}` 
      }, (payload) => {
        const newMsg = payload.new;
        setMessages(prev => [...prev, {
          id: newMsg.id,
          text: newMsg.content,
          isMe: newMsg.sender_id === user?.id,
          time: new Date(newMsg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, user, role]);

  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;

    const tempMsg = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeChat,
        sender_id: user.id,
        content: tempMsg
      });

    if (!error) {
      await supabase.from('conversations').update({ updated_at: new Date() }).eq('id', activeChat);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] w-full"
    >
      {/* Conversation List */}
      <aside className="w-full max-w-[360px] flex flex-col border-r border-slate-200 bg-white shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-orange-100">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 font-display">Tin nhắn</h2>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
              placeholder="Tìm kiếm cuộc trò chuyện..." 
              type="text"
            />
          </div>
        </div>

        <div className="flex px-6 pt-2 gap-6 border-b border-slate-100 overflow-x-auto scrollbar-hide">
          {['Tất cả', 'Chưa đọc'].map((tab, i) => (
            <button 
              key={tab}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                i === 0 ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-slate-400">
              {role === 'landlord' ? 'Chưa có khách thuê nào liên hệ.' : 'Chưa có phòng nào được phản hồi.'}
            </div>
          ) : conversations.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setActiveChat(conv.id)}
              className={`flex items-center gap-4 px-6 py-5 cursor-pointer transition-all border-l-4 ${
                activeChat === conv.id 
                  ? 'bg-primary/5 border-primary' 
                  : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="relative shrink-0">
                {conv.avatar ? (
                  <img 
                    src={conv.avatar} 
                    alt={conv.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                )}
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`text-sm truncate font-display ${activeChat === conv.id ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                    {conv.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{conv.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate ${conv.unread > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                  </p>
                  {conv.unread > 0 && (
                    <div className="min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1.5 text-[10px] text-white font-black shadow-sm shadow-orange-100">
                      {conv.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-white relative">
        {/* Chat Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-100 shrink-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {conversations.find(c => c.id === activeChat)?.avatar ? (
                <img 
                  src={conversations.find(c => c.id === activeChat)?.avatar!} 
                  alt="Active Chat" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 font-display">
                {conversations.find(c => c.id === activeChat)?.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">    
            <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-all">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        {activeChat ? (
          <>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 flex flex-col bg-slate-50/30">
              <div className="flex justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white border border-slate-100 px-4 py-1.5 rounded-full shadow-sm">
                  Hôm nay
                </span>
              </div>

              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex items-end gap-3 max-w-[80%] ${msg.isMe ? 'self-end flex-row-reverse' : ''}`}
                >
                  {!msg.isMe && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1 border border-white shadow-sm">
                      {conversations.find(c => c.id === activeChat)?.avatar ? (
                        <img 
                          src={conversations.find(c => c.id === activeChat)?.avatar!} 
                          alt="Sender" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : <div className="w-full h-full bg-slate-200" />}
                    </div>
                  )}
                  <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm ${
                      msg.isMe 
                        ? 'bg-primary text-white rounded-br-none shadow-orange-100' 
                        : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 px-1 uppercase tracking-tighter">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <footer className="p-6 border-t border-slate-100 bg-white">
              <div className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-50 rounded-2xl p-3 pl-5 border border-slate-100">
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-primary transition-all shrink-0 self-center">
                  <PlusCircle className="w-6 h-6" />
                </button>
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-primary transition-all shrink-0 self-center">
                  <ImageIcon className="w-6 h-6" />
                </button>
                <textarea 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold py-2.5 resize-none max-h-32 placeholder:text-slate-400 outline-none" 
                  placeholder="Nhập tin nhắn..." 
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                ></textarea>
                <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-primary transition-all shrink-0 self-center">
                  <Smile className="w-6 h-6" />
                </button>
                <button 
                  disabled={!newMessage.trim()}
                  onClick={handleSendMessage}
                  className="w-12 h-12 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-all shrink-0 flex items-center justify-center shadow-lg shadow-orange-100"
                >
                  <Send className="w-5 h-5 -ml-1" />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100"><MessageCircle className="w-10 h-10 text-slate-300" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Bắt đầu trò chuyện</h3>
            <p className="text-sm font-medium text-slate-500">Chọn một cuộc trò chuyện từ danh sách bên trái để kết nối với {role === 'landlord' ? 'khách thuê' : 'chủ trọ'}.</p>
          </div>
        )}
      </main>

    </motion.div>
  );
};

export default Messaging;
