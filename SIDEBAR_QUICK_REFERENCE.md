# Collapsible Sidebar - Quick Reference

## At a Glance

### States
| State | Width | Shows |
|-------|-------|-------|
| Expanded | 288px (w-72) | Icons + Text |
| Collapsed | 80px (w-20) | Icons Only |

### Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Toggle Sidebar | `Ctrl+B` (Win/Linux) or `Cmd+B` (Mac) |

### Key Components
```
DashboardPage.tsx          → State management
├── isSidebarCollapsed     → Boolean state
├── toggleSidebarCollapse  → Toggle function
└── DashboardSidebar.tsx   → UI component
    ├── isCollapsed        → Prop (boolean)
    └── onToggleCollapse   → Prop (function)
```

## Code Examples

### Using the Sidebar
```typescript
<DashboardSidebar
  isCollapsed={isSidebarCollapsed}
  onToggleCollapse={toggleSidebarCollapse}
  // ... other props
/>
```

### State Management
```typescript
// Initialize with localStorage
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
  const saved = localStorage.getItem('sidebarCollapsed');
  return saved ? JSON.parse(saved) : false;
});

// Persist to localStorage
useEffect(() => {
  localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
}, [isSidebarCollapsed]);

// Toggle function
const toggleSidebarCollapse = () => {
  setIsSidebarCollapsed(!isSidebarCollapsed);
};
```

### Adding Navigation Item
```typescript
// In productItems array
{ name: 'New Page', icon: IconComponent, id: 'new-page' }

// Automatically gets:
// - Collapse support
// - Active state highlighting
// - Accessibility labels
// - Hover states
```

## CSS Classes Reference

### Width Classes
```css
/* Expanded */
w-72         → 288px (18rem)

/* Collapsed */
w-20         → 80px (5rem)
```

### Transition Classes
```css
transition-all duration-300 ease-in-out
```

### Conditional Text Display
```typescript
// Expanded: visible
className="w-auto opacity-100"

// Collapsed: hidden
className="w-0 opacity-0"
```

### Icon Centering
```typescript
// Expanded
className="flex items-center gap-3"

// Collapsed
className="flex items-center justify-center"
```

## Common Patterns

### Button with Text that Hides
```typescript
<button className={`
  w-full flex items-center rounded-lg
  ${isCollapsed ? 'justify-center px-3' : 'gap-3 px-3'}
`}>
  <Icon className="w-4 h-4 flex-shrink-0" />
  <span className={`
    transition-all duration-300 whitespace-nowrap
    ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
  `}>
    Button Text
  </span>
</button>
```

### Section Header that Hides
```typescript
{!isCollapsed && (
  <h3 className="text-xs font-semibold uppercase">
    Section Title
  </h3>
)}
```

### Container Padding Adjustment
```typescript
<div className={isCollapsed ? 'p-2' : 'p-4'}>
  {/* content */}
</div>
```

## Accessibility Checklist

```typescript
// ✅ Navigation container
aria-label="Main navigation"

// ✅ Navigation sections
role="navigation"
aria-label="Product pages"

// ✅ Buttons
aria-label="Dashboard"
title={isCollapsed ? 'Dashboard' : undefined}

// ✅ Toggle button
aria-expanded={!isCollapsed}
aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}

// ✅ Active page
aria-current={isActive ? 'page' : undefined}
```

## Troubleshooting Quick Fixes

### Text Not Hiding
```typescript
// Add these classes to text element
className="overflow-hidden whitespace-nowrap"
```

### Icon Not Centered
```typescript
// Add flex-shrink-0 to icon
<Icon className="w-4 h-4 flex-shrink-0" />
```

### Animation Not Smooth
```typescript
// Ensure both container and content have transitions
className="transition-all duration-300 ease-in-out"
```

### State Not Saving
```typescript
// Check localStorage permissions
// Verify useEffect dependencies
useEffect(() => {
  localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
}, [isSidebarCollapsed]);
```

## Customization Quick Edits

### Change Default State
```typescript
// Change false to true for collapsed by default
return saved ? JSON.parse(saved) : true;
```

### Change Width
```typescript
// In DashboardSidebar.tsx, replace:
${isCollapsed ? 'w-20' : 'w-72'}

// With your desired width:
${isCollapsed ? 'w-16' : 'w-80'}
```

### Change Animation Speed
```typescript
// Replace duration-300 with:
duration-200  // 200ms (faster)
duration-500  // 500ms (slower)
```

### Disable Keyboard Shortcut
```typescript
// Comment out or remove the useEffect in DashboardSidebar.tsx
// that handles the keydown event
```

## Testing Scenarios

1. **Basic Toggle**
   - Click collapse button
   - Verify width changes
   - Check text hides/shows

2. **Keyboard Shortcut**
   - Press Ctrl+B (or Cmd+B)
   - Verify sidebar toggles

3. **State Persistence**
   - Toggle sidebar
   - Refresh page
   - Verify state maintained

4. **Navigation**
   - Click menu items in both states
   - Verify page changes work

5. **Accessibility**
   - Tab through menu
   - Check screen reader announcements
   - Verify ARIA attributes

## Performance Tips

- Use CSS transitions, not JavaScript animations
- Keep transition duration reasonable (200-300ms)
- Use `flex-shrink-0` on icons to prevent layout shifts
- Batch state updates to avoid multiple re-renders
- Use `whitespace-nowrap` to prevent text wrapping during transition

## Common Mistakes to Avoid

❌ **Don't**: Animate width without overflow-hidden
```typescript
<span className="w-0">Text</span>  // Text overflows!
```

✅ **Do**: Always include overflow-hidden
```typescript
<span className="w-0 overflow-hidden">Text</span>
```

❌ **Don't**: Forget flex-shrink-0 on icons
```typescript
<Icon className="w-4 h-4" />  // Icon shrinks!
```

✅ **Do**: Prevent icon shrinking
```typescript
<Icon className="w-4 h-4 flex-shrink-0" />
```

❌ **Don't**: Use display: none for transitions
```typescript
<span className={isCollapsed ? 'hidden' : 'block'}>  // No animation!
```

✅ **Do**: Use width and opacity
```typescript
<span className={isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}>
```

## Files Modified

```
src/
├── components/
│   └── DashboardSidebar.tsx    ← Main changes
└── pages/
    └── DashboardPage.tsx       ← State management
```

## Dependencies

No new dependencies required! Uses existing:
- React hooks (useState, useEffect)
- Lucide React icons (ChevronLeft, ChevronRight)
- Tailwind CSS classes

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Support

For issues or questions:
1. Check console for errors
2. Verify props are passed correctly
3. Test with React DevTools
4. Review accessibility with browser tools
5. Check localStorage in Application tab
