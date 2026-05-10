import * as Icons from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export function Icon({ name, size = 24, color, className = '' }: IconProps) {
  const LucideIconComponent = (Icons as Record<string, LucideIcon>)[name];

  if (!LucideIconComponent || typeof LucideIconComponent !== 'function') {
    return null;
  }

  return <LucideIconComponent size={size} color={color} className={className} />;
}

export const iconCategories = {
  'Product-Specific': [
    'Activity', 'AlertCircle', 'AlertTriangle', 'Archive', 'BarChart', 'BarChart2', 'BarChart3',
    'Bell', 'BellOff', 'Bookmark', 'Box', 'Briefcase', 'Calendar', 'Camera', 'Check',
    'CheckCircle', 'CheckSquare', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp',
    'Clipboard', 'Clock', 'Cloud', 'Code', 'Copy', 'Database', 'Download', 'Edit', 'Edit2',
    'Edit3', 'Eye', 'EyeOff', 'File', 'FileText', 'Filter', 'Flag', 'Folder', 'Globe', 'Grid',
    'Hash', 'Heart', 'Home', 'Image', 'Info', 'Layers', 'Layout', 'Link', 'List', 'Lock',
    'LogIn', 'LogOut', 'Mail', 'Map', 'MapPin', 'Menu', 'MessageCircle', 'MessageSquare',
    'Minus', 'MinusCircle', 'Monitor', 'Moon', 'MoreHorizontal', 'MoreVertical', 'Move',
    'Package', 'Paperclip', 'Pause', 'Phone', 'PieChart', 'Play', 'Plus', 'PlusCircle',
    'Power', 'Printer', 'RefreshCw', 'Repeat', 'Save', 'Search', 'Send', 'Settings', 'Share',
    'Share2', 'Shield', 'ShoppingCart', 'Shuffle', 'Sidebar', 'SkipBack', 'SkipForward',
    'Slash', 'Sliders', 'SlidersHorizontal', 'Smartphone', 'Star', 'Sun', 'Tag', 'Target',
    'Terminal', 'ThumbsDown', 'ThumbsUp', 'ToggleLeft', 'ToggleRight', 'Trash', 'Trash2',
    'TrendingDown', 'TrendingUp', 'Triangle', 'Upload', 'User', 'UserCheck', 'UserMinus',
    'UserPlus', 'Users', 'Video', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Watch', 'Wifi',
    'WifiOff', 'X', 'XCircle', 'XSquare', 'Zap', 'ZapOff', 'ZoomIn', 'ZoomOut',
  ],
  'Reports': [
    'BarChart', 'BarChart2', 'BarChart3', 'BarChart4', 'LineChart', 'PieChart',
    'TrendingUp', 'TrendingDown', 'Activity', 'FileText', 'FileBarChart',
    'FileSpreadsheet', 'Table', 'Columns', 'Grid', 'Layout',
  ],
  'Tables & Data': [
    'Table', 'Columns', 'Grid', 'List', 'AlignLeft', 'AlignCenter', 'AlignRight',
    'AlignJustify', 'Database', 'Server', 'HardDrive', 'Archive', 'FolderOpen',
    'Folder', 'File', 'FileText',
  ],
  'Third-Party': [
    'Github', 'Gitlab', 'Figma', 'Chrome', 'Slack', 'Linkedin', 'Twitter',
    'Facebook', 'Instagram', 'Youtube', 'Twitch',
  ],
};
