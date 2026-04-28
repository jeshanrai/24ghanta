export type AdType = 'image' | 'html';

export type AdPlacement =
  | 'header_banner'
  | 'hero_sidebar'
  | 'article_inline'
  | 'article_sidebar'
  | 'between_sections'
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
