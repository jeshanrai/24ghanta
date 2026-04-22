export interface LocalMedia {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  mediaUrl: string;
  caption?: string;
  location?: string;
  publishedAt: string;
  likes: number;
}

const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

export const upliftLocalMedia: LocalMedia[] = [
  {
    id: 'ul1',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local1/600/600',
    mediaUrl: 'https://picsum.photos/seed/local1/1200/1200',
    caption: 'Morning chai at the local tapri - nothing beats this vibe',
    location: 'Juhu Beach, Mumbai',
    publishedAt: hoursAgo(1),
    likes: 1234,
  },
  {
    id: 'ul2',
    type: 'video',
    thumbnailUrl: 'https://picsum.photos/seed/local2/600/600',
    mediaUrl: 'https://picsum.photos/seed/local2/1200/1200',
    caption: 'Street food magic - watch this pav bhaji master at work',
    location: 'Mohammed Ali Road, Mumbai',
    publishedAt: hoursAgo(2),
    likes: 2567,
  },
  {
    id: 'ul3',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local3/600/600',
    mediaUrl: 'https://picsum.photos/seed/local3/1200/1200',
    caption: 'The colors of our local market',
    location: 'Crawford Market, Mumbai',
    publishedAt: hoursAgo(3),
    likes: 890,
  },
  {
    id: 'ul4',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local4/600/600',
    mediaUrl: 'https://picsum.photos/seed/local4/1200/1200',
    caption: 'Sunset views from Marine Drive',
    location: 'Marine Drive, Mumbai',
    publishedAt: hoursAgo(4),
    likes: 3456,
  },
  {
    id: 'ul5',
    type: 'video',
    thumbnailUrl: 'https://picsum.photos/seed/local5/600/600',
    mediaUrl: 'https://picsum.photos/seed/local5/1200/1200',
    caption: 'Local train life - the real Mumbai experience',
    location: 'Dadar Station, Mumbai',
    publishedAt: hoursAgo(5),
    likes: 1890,
  },
  {
    id: 'ul6',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local6/600/600',
    mediaUrl: 'https://picsum.photos/seed/local6/1200/1200',
    caption: 'Heritage architecture that tells our story',
    location: 'Fort Area, Mumbai',
    publishedAt: hoursAgo(6),
    likes: 678,
  },
  {
    id: 'ul7',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local7/600/600',
    mediaUrl: 'https://picsum.photos/seed/local7/1200/1200',
    caption: 'Community temple celebrations',
    location: 'Siddhivinayak, Mumbai',
    publishedAt: hoursAgo(7),
    likes: 2345,
  },
  {
    id: 'ul8',
    type: 'video',
    thumbnailUrl: 'https://picsum.photos/seed/local8/600/600',
    mediaUrl: 'https://picsum.photos/seed/local8/1200/1200',
    caption: 'Dabbawalas in action - precision at its finest',
    location: 'Churchgate, Mumbai',
    publishedAt: hoursAgo(8),
    likes: 4567,
  },
  {
    id: 'ul9',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local9/600/600',
    mediaUrl: 'https://picsum.photos/seed/local9/1200/1200',
    caption: 'Local artisan creating magic with hands',
    location: 'Dharavi, Mumbai',
    publishedAt: hoursAgo(9),
    likes: 1567,
  },
  {
    id: 'ul10',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local10/600/600',
    mediaUrl: 'https://picsum.photos/seed/local10/1200/1200',
    caption: 'Fresh catch of the day at the fish market',
    location: 'Sassoon Dock, Mumbai',
    publishedAt: hoursAgo(10),
    likes: 789,
  },
  {
    id: 'ul11',
    type: 'video',
    thumbnailUrl: 'https://picsum.photos/seed/local11/600/600',
    mediaUrl: 'https://picsum.photos/seed/local11/1200/1200',
    caption: 'Street cricket - where legends are made',
    location: 'Shivaji Park, Mumbai',
    publishedAt: hoursAgo(11),
    likes: 3234,
  },
  {
    id: 'ul12',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local12/600/600',
    mediaUrl: 'https://picsum.photos/seed/local12/1200/1200',
    caption: 'Flower market early morning vibes',
    location: 'Dadar Flower Market, Mumbai',
    publishedAt: hoursAgo(12),
    likes: 2890,
  },
  {
    id: 'ul13',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local13/600/600',
    mediaUrl: 'https://picsum.photos/seed/local13/1200/1200',
    caption: 'The iconic Gateway at golden hour',
    location: 'Gateway of India, Mumbai',
    publishedAt: hoursAgo(13),
    likes: 5678,
  },
  {
    id: 'ul14',
    type: 'video',
    thumbnailUrl: 'https://picsum.photos/seed/local14/600/600',
    mediaUrl: 'https://picsum.photos/seed/local14/1200/1200',
    caption: 'Monsoon magic on the streets',
    location: 'Bandra, Mumbai',
    publishedAt: hoursAgo(14),
    likes: 1456,
  },
  {
    id: 'ul15',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local15/600/600',
    mediaUrl: 'https://picsum.photos/seed/local15/1200/1200',
    caption: 'Local bakery serving fresh bread since 1952',
    location: 'Irani Cafe, Mumbai',
    publishedAt: hoursAgo(15),
    likes: 987,
  },
  {
    id: 'ul16',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local16/600/600',
    mediaUrl: 'https://picsum.photos/seed/local16/1200/1200',
    caption: 'Street art that speaks volumes',
    location: 'Bandra Bandstand, Mumbai',
    publishedAt: hoursAgo(16),
    likes: 2123,
  },
  {
    id: 'ul17',
    type: 'video',
    thumbnailUrl: 'https://picsum.photos/seed/local17/600/600',
    mediaUrl: 'https://picsum.photos/seed/local17/1200/1200',
    caption: 'Kathak performance at local cultural center',
    location: 'NCPA, Mumbai',
    publishedAt: hoursAgo(17),
    likes: 1678,
  },
  {
    id: 'ul18',
    type: 'image',
    thumbnailUrl: 'https://picsum.photos/seed/local18/600/600',
    mediaUrl: 'https://picsum.photos/seed/local18/1200/1200',
    caption: 'Night skyline from Worli Sea Face',
    location: 'Worli, Mumbai',
    publishedAt: hoursAgo(18),
    likes: 4321,
  },
];

export const getUpliftLocalMedia = (limit?: number): LocalMedia[] => {
  return limit ? upliftLocalMedia.slice(0, limit) : upliftLocalMedia;
};
