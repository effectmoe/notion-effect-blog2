# Timezone Note for Formula Properties

## Issue
The formula property "最終更新日" (Last Update Date) is displaying dates that appear to be one day behind the actual JST (Japan Standard Time) date.

## Analysis
- The `last_edited_time` property shows: `2025-06-04T15:17:00.000Z` (UTC)
- This converts to `2025-06-05 00:17:00` in JST (UTC+9)
- However, the formula property returns: `2025年6月4日` (June 4th)
- The text field "テキスト" correctly shows: `2025年6月5日` (June 5th)

## Root Cause
The issue is in the Notion formula configuration itself. The formula appears to be using the UTC date instead of converting to JST.

## Solution
To fix this, you need to modify the formula in Notion:

1. Go to your Notion database
2. Edit the "最終更新日" formula property
3. Update the formula to properly handle timezone conversion

### Current Formula (likely):
```
formatDate(prop("Last Updated"), "YYYY年M月D日")
```

### Recommended Formula:
```
formatDate(dateAdd(prop("Last Updated"), 9, "hours"), "YYYY年M月D日")
```

This adds 9 hours to convert from UTC to JST before formatting.

## Alternative Solution
If you want to handle this in code instead of fixing the Notion formula, you could:
1. Check if the formula returns a date type instead of string
2. Apply timezone conversion in the code
3. Format the date in Japanese

However, since Notion is already returning a formatted string, the best solution is to fix the formula in Notion itself.