'use client';

import React, { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { SendHorizonal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { addComment } from '@/lib/comment-actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CommentFormProps {
  entityId: string;
  parentId?: string | null;
  onCommentAdded?: () => void;
  className?: string;
  addCommentAction: (formData: FormData) => Promise<void>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} className="rounded-full">
      <SendHorizonal size={18} />
    </Button>
  );
}

export function CommentForm({ entityId, parentId, onCommentAdded, className, addCommentAction }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleAction = async (formData: FormData) => {
    // Basic check to prevent empty submissions client-side
    if (!formData.get('content')?.toString().trim()) {
        return;
    }
    await addCommentAction(formData);
    formRef.current?.reset();
    onCommentAdded?.();
  };

  return (
    <form
      ref={formRef}
      action={handleAction}
      className={cn('flex w-full items-center space-x-2', className)}
    >
      <input type="hidden" name="entityId" value={entityId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      <Input
        name="content"
        required
        placeholder="Add a comment..."
        className="flex-1"
        autoComplete="off"
      />
      <SubmitButton />
    </form>
  );
}
