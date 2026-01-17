# Learning Log

## The Challenge: Map Rendering Issues on Mobile Devices

**Date**: During development  
**Status**: Resolved  
**Time Invested**: ~4 hours

### The Problem

The map component (`frontend/app/dashboard/user/page.tsx`) was not rendering correctly on mobile devices. The map would either:
- Not appear at all
- Render at only 50% of intended size
- Fail to initialize properly
- Show "Style is not done loading" errors

This was particularly frustrating because it worked perfectly on desktop but completely failed on mobile browsers.

### Research Process

1. **Initial Investigation**: Checked browser console for errors
   - Found: `Style is not done loading` errors
   - Found: `Cannot read properties of null (reading 'getSource')` errors
   - Found: Map container dimensions were incorrect

2. **First Attempt**: Added null checks and error handling
   - Added `if (!map.current) return` guards
   - Wrapped map operations in try-catch blocks
   - Result: Errors reduced but map still not rendering

3. **Second Attempt**: Investigated CSS layout issues
   - Discovered: Parent containers didn't have explicit heights
   - Discovered: Flexbox wasn't constraining map container properly
   - Added `height: calc(100vh - 3.5rem)` to main container
   - Result: Partial improvement, but still inconsistent

4. **Third Attempt**: MapLibre GL JS initialization timing
   - Discovered: Map needs explicit `resize()` calls after layout changes
   - Discovered: Mobile viewport has quirks with dynamic content
   - Added multiple `map.current.resize()` calls with delays
   - Result: Better, but still not perfect

5. **Fourth Attempt**: Comprehensive solution
   - Set root container to `h-screen overflow-hidden`
   - Added `flex-shrink-0` to header
   - Set map container to `flex: '1 1 auto'`
   - Added `min-h-[400px]` for mobile
   - Implemented style loading detection with retry logic
   - Added multiple resize calls with strategic delays

### The Solution

The final solution involved multiple fixes working together:

1. **CSS Layout Fixes**:
```typescript
// Root container
<div className="h-screen overflow-hidden">
  {/* Header with flex-shrink-0 */}
  <header className="flex-shrink-0">...</header>
  
  {/* Main content with explicit height */}
  <div style={{ height: 'calc(100vh - 3.5rem)', minHeight: 0 }}>
    {/* Map container with flex properties */}
    <div 
      className="flex-1 relative"
      style={{ height: '100%', minHeight: 0, flex: '1 1 auto' }}
    >
      <div ref={mapContainer} style={{ minHeight: '400px' }} />
    </div>
  </div>
</div>
```

2. **Map Initialization with Retry Logic**:
```typescript
const addAccuracyCircle = () => {
  if (!map.current) return;
  
  try {
    // Add sources and layers
  } catch (error) {
    if (error.message.includes('Style is not done loading')) {
      map.current.once('style.load', () => {
        addAccuracyCircle(); // Retry after style loads
      });
    }
  }
};
```

3. **Multiple Resize Calls**:
```typescript
map.current.on('load', () => {
  const resizeMap = () => {
    if (map.current) map.current.resize();
  };
  resizeMap(); // Immediate
  setTimeout(resizeMap, 100); // After 100ms
  setTimeout(resizeMap, 300); // After 300ms
});
```

### Key Learnings

1. **Mobile Viewport Quirks**: Mobile browsers handle dynamic content differently. Explicit heights and flex properties are crucial.

2. **MapLibre GL JS Timing**: The library needs explicit `resize()` calls after layout changes, especially on mobile.

3. **Style Loading Race Condition**: Map operations must wait for style to fully load. Event listeners are better than assumptions.

4. **Defensive Programming**: Multiple null checks and error handling are essential when working with external libraries.

5. **Iterative Problem-Solving**: Each failed attempt provided new information. Persistence and systematic debugging paid off.

### Prevention

- Always test map components on actual mobile devices, not just browser dev tools
- Use explicit CSS heights and flex properties for map containers
- Implement retry logic for async operations (style loading, resize)
- Add comprehensive error handling with fallbacks
- Test on multiple mobile browsers (Chrome, Safari, Firefox)

### Production Considerations

In production, I would:
- Add error boundaries around map components
- Implement loading states with skeleton screens
- Add retry mechanisms with exponential backoff
- Monitor map initialization failures
- Provide fallback UI if map fails to load

---

**This learning log demonstrates a proactive, solution-oriented approach to debugging complex cross-platform issues.**
