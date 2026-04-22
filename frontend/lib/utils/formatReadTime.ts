export function formatReadTime(minutes: number): string {
  if (minutes < 1) {
    return 'Less than 1 min read';
  }

  if (minutes === 1) {
    return '1 min read';
  }

  return `${minutes} min read`;
}

export function formatReadTimeShort(minutes: number): string {
  return `${minutes} MIN READ`;
}
