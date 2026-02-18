export interface Brand {
  id: string;
  name: string;
  avatar: string;
  activeAdmins: number;
}

export interface NavigationItem {
  label: string;
  icon: string;
  path: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}
