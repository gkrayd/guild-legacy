# Guild Legacy

Guild Legacy is a mobile-landscape medieval fantasy guild simulation centered on autonomous expeditions, persistent adventurers, relationships, recovery and generational legacy.

## Version
V1.2.4 — Cache-Safe Layout

## Core loop
Recruit adventurers -> form a party -> plan a mission -> watch an autonomous expedition -> review consequences -> improve the guild -> build relationships and careers -> retire veterans -> continue through future generations.

## V1.2.4 cache-safe layout
- Versioned CSS and JavaScript URLs prevent GitHub Pages/browser cache from mixing new HTML with old styles
- Fixes the exact failure seen on the 1920×1080 Opera screenshot where V1.2.3 HTML loaded with stale V1.2.2 CSS
- Future builds can bump the asset version to force a matched UI bundle

## V1.2.3 planning rebuild
- Rebuilt the mission planning header structurally instead of continuing to patch fixed heights
- Primary row: mission title, contract, pace, priority, supplies, party and dispatch
- Secondary row: mission details and live plan estimate
- Prevents the planning title and controls from slipping underneath the expedition stage ribbon
- Keeps the Story Theater composition and 1080p viewport fit intact

## V1.2.2 layout fix
- Planning bar no longer overlaps the stage ribbon on 1080p desktop browser viewports
- Pre-expedition planning keeps enough vertical room for mission title, controls and estimates
- During an expedition the planning area collapses to a compact read-only status strip
- Story Theater still fits the viewport without reintroducing page scrolling

## V1.2.1 viewport fix
- Desktop Story Theater now fits within common 1080p browser viewports without page scrolling
- Final expedition summary overlays the theater instead of adding vertical page height
- Planning, stage ribbon, event card, party cards and bottom panels compact responsively on shorter desktop viewports
- Composition remains unchanged; only vertical density and internal scrolling were adjusted

## V1.2 additions
- New Story Theater expedition composition based on the approved visual reference
- Five-stage illustrated-style ribbon: Travel, Exploration, Encounter, Camp and Return
- Large central story scene with a different atmosphere for each expedition stage
- Persistent party portrait cards inside the scene
- Featured-character highlighting during narrative moments
- Parchment-style event card with current event, consequences and character quote
- Animated feedback for positive events, danger/injuries and relationship moments
- Recent-consequence cards for Bond, XP, injuries, gold and other outcomes
- Stage-event list and expedition narrative log
- Planning UI automatically compresses while an expedition is running
- Final expedition results stay integrated into the same storytelling composition
- Scene/event art is currently procedural/placeholder so real illustrations can replace it later without changing the layout

## V1.1 systems retained
- Campaign diagnostics and balance metrics
- Adventurer titles earned through play
- Mechanical specialization roles
- Pre-mission success/risk estimates
- Slower, event-driven relationship growth

## Core systems
- Six base classes and specializations
- Personality traits, origins and motivations
- Party chemistry and class synergies
- Mission planning: pace, priority and supplies
- Named injuries and recovery
- Guild facilities and life events
- Reputation-gated regions and contracts
- Relationships, romance and marriage
- Retirement, families and descendants
- Multi-generation legacy
- Chronicle and browser save migration

## Visual direction
The Story Theater composition is now the visual contract for future expedition art. Future scene illustrations and character portraits should plug into this structure rather than redesigning the expedition screen.

## Tone
Grounded medieval fantasy with meaningful consequences but not grimdark. The game emphasizes adventure, community, recovery, friendship, family and legacy.

## Web build
https://gkrayd.github.io/guild-legacy/
