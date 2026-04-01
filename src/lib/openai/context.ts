export type PageId =
  | 'dashboard'
  | 'medical-forms'
  | 'health-records'
  | 'insurance'
  | 'medical-profile'
  | 'care'
  | 'network'
  | 'vitals';

export interface PageContextData {
  selectedItemId?: string;
  selectedItemTitle?: string;
  visibleCategories?: string[];
  totalCount?: number;
  incompleteCount?: number;
  connectedProviderCount?: number;
  activeCoverageCount?: number;
  searchQuery?: string;
  [key: string]: unknown;
}

export function buildPageContext(
  page: string,
  overrides?: Partial<PageContextData>
): Record<string, unknown> {
  const base: Record<string, unknown> = { currentPage: page };

  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined && value !== null) {
        base[key] = value;
      }
    }
  }

  return base;
}
