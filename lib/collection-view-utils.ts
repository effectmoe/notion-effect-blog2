// Utility functions for handling collection views

export function prioritizeListView(views: any[]): any[] {
  if (!views || !Array.isArray(views)) return views;
  
  // Priority order: list > table > board > gallery > calendar
  const viewPriority = {
    'list': 1,
    'table': 2,
    'board': 3,
    'gallery': 4,
    'calendar': 5
  };
  
  return [...views].sort((a, b) => {
    const aType = a?.value?.type || 'unknown';
    const bType = b?.value?.type || 'unknown';
    const aPriority = viewPriority[aType] || 999;
    const bPriority = viewPriority[bType] || 999;
    return aPriority - bPriority;
  });
}