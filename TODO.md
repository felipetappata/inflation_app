# TODO

## Bug Fixes
- [ ] Fix tooltip flickering in PriceChart component
  - Issue: Tooltip flickers when hovering over certain areas of the chart
  - Potential causes:
    - Point finding algorithm sensitivity
    - Rapid state updates
    - Mouse position calculation
  - Priority: Medium
- [ ] Make historical data accessible in deployed version
  - Issue: Historical data not loading in production build
  - Tasks:
    - Move USA data to public directory
    - Update data fetching path
    - Test in production environment
  - Priority: High

## UI Enhancements
- [ ] Update range selection information box
  - Tasks:
    - Change text color from orange to black for simulated values
    - Rename "Annual" to "Annualized"
    - Show information while dragging (not just after)
  - Priority: Medium