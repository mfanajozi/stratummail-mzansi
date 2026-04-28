export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const emailDate = new Date(date);
  
  const diffTime = now.getTime() - emailDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return emailDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return emailDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return emailDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export function formatFullDate(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getDateGroup(date: Date): string {
  const now = new Date();
  const emailDate = new Date(date);
  
  const diffTime = now.getTime() - emailDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return 'Last Week';
  } else {
    return 'Older';
  }
}

export function groupEmailsByDate<T extends { date: Date }>(emails: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  
  emails.forEach((email) => {
    const group = getDateGroup(email.date);
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(email);
  });
  
  return grouped;
}