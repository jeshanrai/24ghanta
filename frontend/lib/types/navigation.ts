export interface NavItem {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
}

export interface TrendingTopic {
  id: string;
  label: string;
  href: string;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}
