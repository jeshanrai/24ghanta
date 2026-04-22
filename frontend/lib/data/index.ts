export {
  mockArticles,
  getFeaturedArticle,
  getRelatedArticles,
  getArticlesByCategory,
  getLatestArticles,
  getArticleBySlug,
  getAllArticleSlugs,
} from './mockArticles';

export {
  mockVideos,
  mockShortStories,
  getLatestVideos,
  getShortStories,
  getAllVideos,
  getVideoBySlug,
  getRelatedVideos,
} from './mockVideos';

export {
  genzArticles,
  getGenzArticles,
  getGenzArticleBySlug,
} from './genzArticles';
export type { GenZArticle } from './genzArticles';

export {
  upliftLocalMedia,
  getUpliftLocalMedia,
} from './upliftLocalMedia';
export type { LocalMedia } from './upliftLocalMedia';

export {
  polls,
  getPolls,
  getActivePoll,
  getPollById,
} from './polls';
export type { Poll, PollOption } from './polls';
