export type AdType = 'image' | 'html';

export type AdPlacement =
  | 'header_banner'
  | 'hero_sidebar'
  | 'article_inline'
  | 'article_sidebar'
  | 'article_more_in_category'
  | 'between_sections'
  | 'between_sections_2'
  | 'footer_banner'
  | 'popup_landing'
  | 'mobile_sticky';

export interface Ad {
  id: string;
  name: string;
  placement: AdPlacement | string;
  adType: AdType;
  imageUrl?: string;
  linkUrl?: string;
  altText?: string;
  htmlContent?: string;
}
