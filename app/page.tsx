'use client';

import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Zordon</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map(m => (
            <Card key={m.id} className={m.role === 'user' ? 'bg-secondary' : ''}>
              <CardHeader>
                <CardTitle>{m.role === 'user' ? 'You' : 'Zordon'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <footer className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            placeholder="Ask Zordon anything..."
            onChange={handleInputChange}
          />
          <Button type="submit">Send</Button>
        </form>
      </footer>
    </div>
  );
}
