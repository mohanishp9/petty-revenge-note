# Graph Report - .  (2026-05-05)

## Corpus Check
- Corpus is ~13,631 words - fits in a single context window. You may not need a graph.

## Summary
- 131 nodes · 93 edges · 12 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.87)
- Token cost: 35,957 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Auth Middleware|Backend Auth Middleware]]
- [[_COMMUNITY_Profile and Navbar|Profile and Navbar]]
- [[_COMMUNITY_Note Creation APIs|Note Creation APIs]]
- [[_COMMUNITY_Docker and Next.js Config|Docker and Next.js Config]]
- [[_COMMUNITY_Public Note APIs|Public Note APIs]]
- [[_COMMUNITY_Auth API and Slice|Auth API and Slice]]
- [[_COMMUNITY_App Layout and Providers|App Layout and Providers]]
- [[_COMMUNITY_Comments API|Comments API]]
- [[_COMMUNITY_Database and Server|Database and Server]]
- [[_COMMUNITY_AppError Utility|AppError Utility]]
- [[_COMMUNITY_Vercel Branding Assets|Vercel Branding Assets]]
- [[_COMMUNITY_File and Window Icons|File and Window Icons]]

## God Nodes (most connected - your core abstractions)
1. `getErrorMessage()` - 7 edges
2. `asyncHandler()` - 5 edges
3. `Next.js Project` - 5 edges
4. `verifyToken()` - 4 edges
5. `useAppDispatch()` - 4 edges
6. `Frontend Service` - 4 edges
7. `Backend Service` - 3 edges
8. `Next SVG Icon` - 3 edges
9. `connectDB()` - 2 edges
10. `optionalAuth()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Frontend Service` --semantically_similar_to--> `Next.js Project`  [INFERRED] [semantically similar]
  docker-compose.yml → frontend/README.md
- `Globe SVG Icon` --semantically_similar_to--> `Vercel SVG Icon`  [INFERRED] [semantically similar]
  frontend/public/globe.svg → frontend/public/vercel.svg
- `Window SVG Icon` --semantically_similar_to--> `File SVG Icon`  [INFERRED] [semantically similar]
  frontend/public/window.svg → frontend/public/file.svg
- `Next SVG Icon` --semantically_similar_to--> `Vercel SVG Icon`  [INFERRED] [semantically similar]
  frontend/public/next.svg → frontend/public/vercel.svg
- `optionalAuth()` --calls--> `verifyToken()`  [INFERRED]
  backend/src/middleware/optionalAuth.middleware.ts → backend/src/utils/jwt.ts

## Hyperedges (group relationships)
- **Docker Compose Frontend Stack** — dockercompose_frontend_service, frontend_env_docker, NEXT_PUBLIC_API_URL [EXTRACTED 1.00]
- **Vercel Branding Assets** — globe_svg, next_svg, vercel_svg [EXTRACTED 1.00]

## Communities (50 total, 6 thin omitted)

### Community 1 - "Backend Auth Middleware"
Cohesion: 0.22
Nodes (4): optionalAuth(), asyncHandler(), generateToken(), verifyToken()

### Community 3 - "Note Creation APIs"
Cohesion: 0.18
Nodes (4): createNoteAPI(), getMyNotesAPI(), getTopNoteByEmojiAPI(), getErrorMessage()

### Community 4 - "Docker and Next.js Config"
Cohesion: 0.2
Nodes (11): NEXT_PUBLIC_API_URL Environment Variable, Backend Environment File, Backend Service, Frontend Service, app/page.tsx, Development Server, Frontend Docker Environment File, Geist Font Family (+3 more)

### Community 5 - "Public Note APIs"
Cohesion: 0.29
Nodes (3): getAllNotesAPI(), reactionApi(), toggleLikeApi()

### Community 6 - "Auth API and Slice"
Cohesion: 0.53
Nodes (4): getCurrentUserAPI(), loginAPI(), logoutAPI(), registerAPI()

### Community 11 - "Vercel Branding Assets"
Cohesion: 1.0
Nodes (3): Globe SVG Icon, Next SVG Icon, Vercel SVG Icon

## Knowledge Gaps
- **9 isolated node(s):** `Backend Environment File`, `Frontend Docker Environment File`, `Development Server`, `app/page.tsx`, `Geist Font Family` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getErrorMessage()` connect `Note Creation APIs` to `Comments API`, `Public Note APIs`, `Auth API and Slice`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `useAppDispatch()` connect `Profile and Navbar` to `HomePage UI Handlers`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `Backend Environment File`, `Frontend Docker Environment File`, `Development Server` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `HomePage UI Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._