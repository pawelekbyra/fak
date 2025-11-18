'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadVideo } from '@/lib/actions'; // This action needs to be created
import { useUser } from '@/context/UserContext';

const videoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  video: z.instanceof(File).refine((file) => file.size > 0, 'Video is required'),
});

type VideoFormData = z.infer<typeof videoSchema>;

export default function PublishTab() {
  const { user } = useUser();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
  });

  const onSubmit = async (data: VideoFormData) => {
    if (!user) {
      alert('You must be logged in to publish a video.');
      return;
    }

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('video', data.video);
    formData.append('userId', user.id);
    formData.append('username', user.username);
    formData.append('avatar', user.avatar || '');

    try {
      await uploadVideo(formData);
      alert('Video uploaded successfully!');
    } catch (error) {
      alert('Failed to upload video.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input id="title" {...register('title')} className="w-full p-2 border" />
        {errors.title && <p className="text-red-500">{errors.title.message}</p>}
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" {...register('description')} className="w-full p-2 border" />
        {errors.description && <p className="text-red-500">{errors.description.message}</p>}
      </div>
      <div>
        <label htmlFor="video">Video</label>
        <input id="video" type="file" accept="video/*" {...register('video')} />
        {errors.video && <p className="text-red-500">{errors.video.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-500 text-white rounded">
        {isSubmitting ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
