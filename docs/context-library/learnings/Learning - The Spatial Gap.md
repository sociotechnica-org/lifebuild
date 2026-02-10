# Learning - The Spatial Gap

## Divergence

**Vision:** The Life Map is a hex-grid landscape where directors spatially place projects, navigate via zoom levels, and develop understanding through the bidirectional loop of placement and observation. This is Strategic Plank 1 (Spatial Visibility).

**Reality:** The Life Map is a flat grid of category cards. Projects are listed within categories, not spatially placed. No hex tiles, no zoom navigation, no spatial indicators, no diorama-style illustrations. The UI is closer to a dashboard with cards than a navigable landscape.

## Scale

This is the single largest gap between vision and reality. The entire Spatial Visibility strategy — and all features that depend on it — are blocked by this. Affected cards:

- [[Structure - Hex Grid]] — Not started. Top upgrade priority.
- [[Component - Hex Tile]] — Not started. Depends on Hex Grid.
- [[Capability - Zoom Navigation]] — Not started. Depends on Hex Grid.
- [[System - Clustering]] — Not started. Depends on Hex Grid.
- [[System - Smoke Signals]] — Not started. Depends on Hex Tile.
- [[Standard - Spatial Interaction Rules]] — Not started. Depends on Hex Grid.
- [[Standard - Image Evolution]] — Not started. Depends on Hex Tile.
- [[Principle - Bidirectional Loop]] — Cannot function without spatial substrate.
- [[Principle - Visual Recognition]] — Cannot be evaluated without illustrated tiles.

## Why It Exists

The spatial vision requires significant frontend engineering (custom hex grid renderer, zoom mechanics, drag-and-drop placement) and design work (illustration generation pipeline). The MVP prioritized process infrastructure (three-stream portfolio, priority queue, pipeline architecture) over spatial infrastructure. This was a reasonable sequencing decision — process mechanics work without spatial representation, but spatial representation without process mechanics would be an empty landscape.

## Implications

- Builders should not assume any spatial UI exists. All current navigation is route-based (URL paths).
- The Life Map category cards are a placeholder, not a degraded hex grid. The transition from cards to hexes will be a rebuild, not a refactor.
- Features that reference "hex tile visual treatment" or "spatial placement" are describing future state. Current equivalents (if any) are project cards in lists/kanbans.
- The Spatial Visibility strategy can only be partially evaluated until the Hex Grid exists.

## When This Closes

When [[Structure - Hex Grid]] is implemented. This is identified as the top upgrade priority in the Status Audit.
