import React, { useState, useEffect } from 'react';
import { api } from '../src/lib/api';

interface Message {
    id: string;
    senderType: 'AGENT' | 'CONTACT';
    content: string;
    status: string;
    createdAt: string;
}

export const WhatsAppDebug: React.FC = () => {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState('');

    const fetchMessages = async () => {
        try {
            const data = await api.whatsapp.getConversations();
            if (data && data.length > 0) {
                // Just flattening first conversation matches the previous debug logic
                setMessages(data[0].messages || []);
            }
        } catch (e) {
            console.error('Debug fetch error:', e);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const sendMessage = async () => {
        if (!phone || !message) {
            setStatus('Error: Phone and message are required');
            return;
        }
        setStatus('Sending...');
        try {
            const result = await api.whatsapp.sendMessage(phone, message);
            setStatus('Sent!');
            setMessage('');
            fetchMessages();
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
    };

    return (
        <div className="p-4 border rounded shadow bg-white max-w-md mx-auto mt-10">
            <h2 className="text-xl font-bold mb-4">WhatsApp Debugger</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Phone Number (with country code)</label>
                <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. 5215555555555"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                />
            </div>

            <button
                onClick={sendMessage}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
                Send Message
            </button>

            {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}

            <hr className="my-6" />

            <h3 className="font-bold mb-2">Recent Messages</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {messages.map(msg => (
                    <div key={msg.id} className={`p-2 rounded ${msg.senderType === 'AGENT' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs text-gray-500">{msg.senderType} - {msg.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
