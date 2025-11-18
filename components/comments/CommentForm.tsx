'use client';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useFormStatus } from 'react-dom';
import { SendHorizonal } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';

interface CommentFormProps {
  entityId: string;
  parentId?: string | null;
  onCommentAdded?: () => void;
  className?: string;
  addCommentAction: (formData: FormData) => Promise<void>;
}

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment cannot exceed 1000 characters'),
  image: z.instanceof(File).optional(),
});

type CommentFormData = z.infer<typeof commentSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} className="rounded-full">
      <SendHorizonal size={18} />
    </Button>
  );
}

export function CommentForm({ entityId, parentId, onCommentAdded, className, addCommentAction }: CommentFormProps) {
  const { user } = useUser();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit: SubmitHandler<CommentFormData> = async (data) => {
    if (!user) {
        // Here you might want to trigger a login modal
        alert("Please log in to comment.");
        return;
    }

    const formData = new FormData();
    formData.append('entityId', entityId);
    if (parentId) {
      formData.append('parentId', parentId);
    }
    formData.append('content', data.content);
    if (data.image) {
      formData.append('image', data.image);
    }
    formData.append('userId', user.id); // Assuming user object has an id
    formData.append('userAvatar', user.avatar || '');
    formData.append('userUsername', user.username || 'guest');

    await addCommentAction(formData);

    reset();
    onCommentAdded?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('flex w-full flex-col space-y-2', className)}
    >
        <div className="flex w-full items-center space-x-2">
            <Input
                {...register('image')}
                type="file"
                accept="image/*"
                className="flex-1"
            />
            <Input
                {...register('content')}
                placeholder="Add a comment..."
                className="flex-1"
                autoComplete="off"
            />
            <SubmitButton />
        </div>
        {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
    </form>
  );
}
