import React, { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { fetchProfilesBatch } from '@/services/profiles';
import { FallbackImage } from '@/components/MediaFallback';
import type { ChatMessage, UserProfile } from '@/types';

// FIX: Removed the redundant useNavigate + useEffect redirect.
// The route is already protected by <ProtectedRoute> in App.tsx.

export function ChatPage() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // FIX: profilesRef mirrors the profiles state so the real-time subscription
  // callback always reads the latest profile map without needing to be
  // re-created every time profiles state changes.
  const profilesRef = useRef<Map<string, UserProfile>>(new Map());

  // Keep ref in sync with state
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(200);

        if (error) throw error;

        const loadedMessages = (data || []).map((msg) => ({
          id: msg.id,
          userId: msg.user_id,
          username: msg.user_id.slice(0, 8),
          avatarUrl: null,
          text: msg.message_text,
          imageUrl: msg.image_url,
          timestamp: msg.created_at,
        })) as ChatMessage[];

        setMessages(loadedMessages);

        // Fetch profiles for all users in the initial batch
        const userIds = [...new Set(loadedMessages.map((m) => m.userId))];
        const profileMap = await fetchProfilesBatch(userIds);
        setProfiles(profileMap);

        // Update messages with real usernames
        setMessages((prev) =>
          prev.map((msg) => {
            const profile = profileMap.get(msg.userId);
            return {
              ...msg,
              username: profile?.username || msg.username,
              avatarUrl: profile?.avatarUrl || null,
            };
          })
        );
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  // FIX: Real-time subscription has NO dependency on the `profiles` state.
  // Instead it reads from profilesRef.current so the subscription is created
  // exactly once and never torn down due to profile updates. This prevents
  // dropped messages when a new user's profile is fetched.
  useEffect(() => {
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            user_id: string;
            message_text: string | null;
            image_url: string | null;
            created_at: string;
          };

          // Use the ref to check current cached profiles without re-subscribing
          let profile = profilesRef.current.get(newMsg.user_id);

          if (!profile) {
            // Fetch missing profile and add to both ref and state
            const profileMap = await fetchProfilesBatch([newMsg.user_id]);
            const fetched = profileMap.get(newMsg.user_id);
            if (fetched) {
              profilesRef.current.set(newMsg.user_id, fetched);
              setProfiles((prev) => new Map([...prev, [newMsg.user_id, fetched]]));
              profile = fetched;
            }
          }

          const chatMessage: ChatMessage = {
            id: newMsg.id,
            userId: newMsg.user_id,
            username: profile?.username || newMsg.user_id.slice(0, 8),
            avatarUrl: profile?.avatarUrl || null,
            text: newMsg.message_text,
            imageUrl: newMsg.image_url,
            timestamp: newMsg.created_at,
          };

          setMessages((prev) => {
            // Deduplicate
            if (prev.some((m) => m.id === chatMessage.id)) {
              return prev;
            }
            return [...prev, chatMessage];
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []); // Empty deps — subscription is stable for the lifetime of the component

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || (!newMessage.trim() && !fileInputRef.current?.files?.length)) return;

    setSending(true);

    try {
      let imageUrl: string | null = null;

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `chat-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        message_text: newMessage.trim() || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      setNewMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Community Chat</h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-green-500">Live Community</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No messages yet. Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.userId === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      isOwnMessage ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.avatarUrl ? (
                        <img
                          src={message.avatarUrl}
                          alt={message.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium">
                          {message.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div>
                      {!isOwnMessage && (
                        <div className="text-xs text-orange-500 mb-1">
                          {message.username}
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-800 text-gray-200'
                        }`}
                      >
                        {message.text && <p className="text-sm">{message.text}</p>}
                        {message.imageUrl && (
                          <div className="mt-2">
                            <FallbackImage
                              src={message.imageUrl}
                              alt="Shared image"
                              className="max-w-full rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-xs text-gray-500 mt-1 ${
                          isOwnMessage ? 'text-right' : ''
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-900 border-t border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-white"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border-white/10 text-white placeholder:text-gray-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || (!newMessage.trim() && !fileInputRef.current?.files?.length)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
