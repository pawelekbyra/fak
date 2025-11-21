import { SlideDTO } from './dto';

export const MOCK_SLIDES: SlideDTO[] = [
    {
        id: 'mock-1',
        type: 'video',
        data: {
            title: 'Mock Slide 1',
            description: 'This is a mock slide for verification.',
            mp4Url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            hlsUrl: '',
            poster: ''
        },
        access: 'public',
        avatar: 'https://i.pravatar.cc/150?u=1',
        username: 'MockUser1',
        initialLikes: 100,
        initialComments: 10,
        isLiked: false,
        createdAt: new Date().toISOString(),
        userId: 'user-1',
    },
    {
        id: 'mock-2',
        type: 'video',
        data: {
            title: 'Mock Slide 2',
            description: 'Another mock slide.',
            mp4Url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            hlsUrl: '',
            poster: ''
        },
        access: 'public',
        avatar: 'https://i.pravatar.cc/150?u=2',
        username: 'MockUser2',
        initialLikes: 200,
        initialComments: 20,
        isLiked: true,
        createdAt: new Date().toISOString(),
        userId: 'user-2',
    }
];
