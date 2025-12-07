# Authentication Token Fix

## Problem

When trying to add a board (or perform other authenticated actions), the frontend was getting:

```json
{
  "error": "Access token required"
}
```

## Root Cause

Many API functions in `src/services/kanbanApi.tsx` were using `axios` directly instead of `apiClient`.

- **`apiClient`** has an interceptor that automatically adds the Authorization header with the JWT token
- **`axios`** (direct) does NOT include the Authorization header

## Solution

Updated all authenticated API functions to use `apiClient` instead of `axios`.

### Functions Fixed:

1. ✅ `AddBoard` - Create new board
2. ✅ `EditBoard` - Edit board
3. ✅ `AddKanbanList` - Add kanban list
4. ✅ `EditListName` - Edit list name
5. ✅ `AddCard` - Add card
6. ✅ `EditCard` - Edit card
7. ✅ `AddTag` - Add tag
8. ✅ `DeleteTag` - Delete tag
9. ✅ `AddTask` - Add task
10. ✅ `DeleteTask` - Delete task
11. ✅ `SubmitTask` - Submit task with file
12. ✅ `useOnDragEndList` - Drag and drop lists
13. ✅ `useOnDragEndCard` - Drag and drop cards

## How It Works

### Before (❌ Broken):

```typescript
const response = await axios.post(fetchUrl, data, {
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
// Missing Authorization header!
```

### After (✅ Fixed):

```typescript
const response = await apiClient.post("/ProjKanbanBoards/addboard", data);
// apiClient interceptor automatically adds:
// Authorization: Bearer <token>
```

### The apiClient Interceptor:

```typescript
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

## Testing

After this fix:

1. ✅ Login to get JWT token (automatically saved to localStorage)
2. ✅ Navigate to projects page
3. ✅ Click on a project to view boards
4. ✅ Add a new board - should work now!
5. ✅ All other authenticated actions should work

## Additional Benefits

- **Consistent authentication**: All API calls now use the same method
- **Auto token refresh**: Easy to add token refresh logic in one place
- **Auto logout on 401**: The interceptor already handles redirecting to /unauthorized on auth failure
- **Cleaner code**: No need to manually add headers everywhere

## Note

Functions that don't require authentication (like `authTheUserId`) can still use `axios` directly, but most should use `apiClient` for consistency.
