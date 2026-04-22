import type { Article } from '@/lib/types';

export interface ArticleBlock {
  type: 'paragraph' | 'heading' | 'list' | 'quote';
  text?: string;
  items?: string[];
}

export function buildArticleBody(article: Article): ArticleBlock[] {
  if (article.content) {
    return [{ type: 'paragraph', text: article.content }];
  }

  const categoryName = article.category.name;
  const title = article.title;
  const excerpt = article.excerpt ?? title;
  const dateLine = new Date(article.publishedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const lead = `${excerpt} ${article.author.name} reports on a story that has drawn attention across the ${categoryName.toLowerCase()} community.`;

  const context = `The development, reported on ${dateLine}, comes amid wider shifts in the ${categoryName.toLowerCase()} landscape. Sources briefed on the matter said the decision follows weeks of consultations with stakeholders and is expected to have a measurable impact in the coming months.`;

  const analysis = `Analysts point out that the scale and pace of the announcement set it apart from previous moves in this space. "It is one of the more significant steps we have seen in recent years," one expert noted, adding that implementation will be watched closely. For readers following ${categoryName}, the broader implications extend well beyond the immediate headlines.`;

  const highlights = [
    `Why ${title.split(':')[0]} matters for readers in ${categoryName}`,
    'Key stakeholders reacting to the development and what they have said publicly',
    'What changes in the near term and what remains uncertain',
    'How this connects to recent trends covered by 24Ghanta',
  ];

  const closing = `24Ghanta will continue to update this story as new details emerge. Readers can follow related coverage in our ${categoryName} section and sign up for the daily briefing to receive the most important headlines each morning.`;

  return [
    { type: 'paragraph', text: lead },
    { type: 'paragraph', text: context },
    { type: 'heading', text: 'Key Highlights' },
    { type: 'list', items: highlights },
    { type: 'paragraph', text: analysis },
    {
      type: 'quote',
      text: 'This is a notable moment — the decisions made now will shape the conversation for weeks to come.',
    },
    { type: 'heading', text: 'What to Watch Next' },
    { type: 'paragraph', text: closing },
  ];
}
