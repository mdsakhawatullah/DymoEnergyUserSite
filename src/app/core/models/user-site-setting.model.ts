export interface UserSiteSettingImage {
  id: number;
  userSiteSettingId: number;
  imageUrl?: string;
  title?: string;
  altText?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UserSiteSetting {
  id: number;
  portalId?: number;
  backgroundImage?: string;
  description?: string;
  buttonColor?: string;
  primaryColor?: string;
  bodyColor?: string;
  backgroundColor?: string;
  cardBgColor?: string;
  navbarBgColor?: string;
  navbarTextColor?: string;
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  sidebarActiveBgColor?: string;
  buttonPrimaryBgColor?: string;
  buttonPrimaryTextColor?: string;
  fontFamily?: string;
  fontSizeBase?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  isActive: boolean;
  images: UserSiteSettingImage[];
}
