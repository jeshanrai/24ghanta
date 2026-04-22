export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt?: string;
  isActive: boolean;
}

export const polls: Poll[] = [
  {
    id: '1',
    question: 'Which issue matters most to you this election?',
    options: [
      { id: 'a', text: 'Economy', votes: 1245 },
      { id: 'b', text: 'Healthcare', votes: 892 },
      { id: 'c', text: 'Education', votes: 654 },
      { id: 'd', text: 'Infrastructure', votes: 423 },
    ],
    totalVotes: 3214,
    isActive: true,
  },
  {
    id: '2',
    question: 'How do you feel about the new traffic regulations?',
    options: [
      { id: 'a', text: 'Supportive', votes: 567 },
      { id: 'b', text: 'Against', votes: 834 },
      { id: 'c', text: 'Need more info', votes: 321 },
    ],
    totalVotes: 1722,
    isActive: true,
  },
  {
    id: '3',
    question: 'Best local food destination?',
    options: [
      { id: 'a', text: 'Street Food Markets', votes: 1456 },
      { id: 'b', text: 'Traditional Restaurants', votes: 987 },
      { id: 'c', text: 'Cafes & Bakeries', votes: 654 },
      { id: 'd', text: 'Food Courts', votes: 234 },
    ],
    totalVotes: 3331,
    isActive: true,
  },
];

export function getPolls(): Poll[] {
  return polls;
}

export function getActivePoll(): Poll | undefined {
  return polls.find((poll) => poll.isActive);
}

export function getPollById(id: string): Poll | undefined {
  return polls.find((poll) => poll.id === id);
}
