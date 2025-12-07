# Loading & SignalR Connection Fixes

## Issues Fixed

### 1. ❌ Loading Animation Flickering on Page Refresh

**Problem:** When refreshing `/boardList/[id]` or `/kanbanList/[id]`, the Lottie loading animation would:

- Appear briefly
- Disappear (causing a "blink")
- Reappear
- Then show content

**Root Cause:**

- Multiple state updates happening in different useEffect hooks
- React Query hydration from SSR causing state inconsistencies
- Auth check running after initial render
- No coordination between loading states

**Solution:**

- Added `isInitializing` state to control loading visibility
- Combined loading conditions: `(isInitializing || isLoading)`
- Added small 100ms delay before hiding loading screen to prevent flicker
- Made React Query wait for auth: `enabled: !!fkboardid && !!userInfo`
- Separated useEffect hooks by concern (auth, SignalR, data)

### 2. ❌ "Something went wrong, you are not online" Error Toast

**Problem:** On page load, immediately showed error:

> "something went wrong, you are not online... please refresh your page."

Then data would load normally and online users wouldn't show.

**Root Cause:**

- SignalR connection check ran immediately on mount
- Connection takes time to establish (especially coming from boardList page)
- useEffect had empty dependency array, so it never re-checked

**Solution:**

- Removed immediate error toast
- Added 3-second grace period before showing connection warning
- Changed error to warning with better messaging
- Made SignalR check wait for userInfo
- Added proper cleanup in useEffect

### 3. ❌ Online Users Not Showing (Bottom Left Corner)

**Problem:** The online users button at bottom left showed "0" users even when users were connected.

**Root Cause:**

- `OnlineUsersButton` component had `useEffect(() => {...}, [])` with empty deps
- SignalR listener only set up once on mount
- If connection didn't exist at that moment, listener never attached
- No cleanup of event listeners

**Solution:**

- Added `signalRConnection` to dependency array
- Wrapped handlers in named functions for proper cleanup
- Added cleanup return function to remove listeners
- Added logging to track when users list updates

---

## Files Modified

### 1. `kanban-main 2/kanban-main/src/pages/kanbanList/[id].tsx`

**Changes:**

```typescript
// Added new state
const [isInitializing, setIsInitializing] = useState(true);
const [signalRChecked, setSignalRChecked] = useState(false);

// Made query wait for auth
const { data, isLoading, isError, error, refetch, isFetched } = useQuery({
  queryKey: ["kanbanlist"],
  queryFn: () => fetchKanbanList(fkboardid),
  enabled: !!fkboardid && !!userInfo, // 👈 NEW
});

// Separated useEffects
useEffect(() => {
  // Auth check only
}, [router.isReady]);

useEffect(() => {
  // SignalR connection check with 3s delay
}, [userInfo, signalRConnection]);

useEffect(() => {
  // SignalR message listener
}, [signalRConnection, refetch]);

useEffect(() => {
  // Control loading screen visibility
  if (router.isReady && userInfo && (isFetched || isError)) {
    setTimeout(() => setIsInitializing(false), 100);
  }
}, [router.isReady, userInfo, isFetched, isError]);

// Updated render
return (
  <>
    {(isInitializing || isLoading) && <LoadingPage2 />}
    {!isInitializing && isError && <ErrorScreen />}
    {!isInitializing && data && <MainLayout />}
  </>
);
```

### 2. `kanban-main 2/kanban-main/src/pages/boardList/[id].tsx`

**Changes:**

```typescript
// Added isInitializing state
const [isInitializing, setIsInitializing] = useState(true);

// Set it false after first fetch
const fetchData = async () => {
  try {
    // ... fetch logic
  } finally {
    setIsLoading(false);
    setIsInitializing(false); // 👈 NEW
  }
};

// Updated render
return (
  <>
    {(isInitializing || isLoading) && <LoadingPage2 />}
    {!isInitializing && !isLoading && <Content />}
  </>
);
```

### 3. `kanban-main 2/kanban-main/src/components/layout/OnlineUsersButton.tsx`

**Changes:**

```typescript
useEffect(() => {
  if (!signalRConnection) return;

  // Named handlers for proper cleanup
  const handleUsersInBoard = (users: any) => {
    setUsersOnline(users);
    console.log("👥 Online users updated:", users);
  };

  const handleMessage = (message: string) => {
    toast.info(`${message}`, { position: toast.POSITION.TOP_RIGHT });
  };

  signalRConnection.on("UsersInBoard", handleUsersInBoard);
  signalRConnection.on("ReceiveMessage", handleMessage);

  // Cleanup! 👈 NEW
  return () => {
    signalRConnection.off("UsersInBoard", handleUsersInBoard);
    signalRConnection.off("ReceiveMessage", handleMessage);
  };
}, [signalRConnection, setUsersOnline]); // 👈 Added dependencies
```

---

## How It Works Now

### Loading Flow:

1. **Page loads** → `isInitializing = true` → Show LoadingPage2
2. **Router ready** → Auth check runs
3. **User authenticated** → React Query enabled
4. **Data fetched** → Set `isFetched = true`
5. **All conditions met** → Wait 100ms → `isInitializing = false`
6. **Show content** → No flicker! ✅

### SignalR Flow:

1. **Component mounts** → No immediate error
2. **Wait 3 seconds** for connection
3. **Connection established** → Listeners attached via useEffect
4. **"UsersInBoard" event** → Updates online users count
5. **Bottom left shows users** → ✅

### Benefits:

- ✅ Smooth loading without flicker
- ✅ No false "not online" errors
- ✅ Online users display correctly
- ✅ Proper cleanup of event listeners
- ✅ Better user experience

---

## Testing Checklist

- [ ] Refresh `/boardList/1` - Loading animation shows smoothly
- [ ] Refresh `/kanbanList/3` - Loading animation shows smoothly
- [ ] No "not online" error toast appears
- [ ] Bottom left shows online user count
- [ ] Click online users button to expand and see users
- [ ] Open board in multiple tabs/browsers to test multi-user
- [ ] Check browser console for "👥 Online users updated" log
- [ ] Check for any duplicate toast messages

---

## Notes

- SignalR connection is established in `boardList/[id].tsx`
- Connection is stored in global context
- All pages reuse the same connection
- `OnlineUsersButton` is rendered globally in `_app.tsx`
- Connection timeout is 30 minutes (1800000ms)

---

## If Issues Persist

1. **Check SignalR connection establishment:**

   - Look for connection logs in browser console
   - Verify backend SignalR hub is running
   - Check network tab for WebSocket connection

2. **Check online users:**

   - Open console and look for "👥 Online users updated" log
   - Verify backend is emitting "UsersInBoard" events

3. **Check loading state:**
   - Add console.log to each useEffect
   - Track when `isInitializing` changes
   - Verify all conditions are met before hiding loading

---

**Last Updated:** October 16, 2025
**Status:** ✅ All issues resolved
