# Philosify Community Spaces - Implementation Plan

## Decision Log

| Decision | Choice |
|----------|--------|
| Underground structure | Single global space |
| Collective organization | Artist-based groups |
| Forum MVP scope | Simple posts + comments |
| AI Mentor presence | Lyceum only |
| Access tiers | Credit-gated premium spaces |
| Credit model | Tiered: Agora/Lyceum free, Collective create=1cr, Underground unlock=1cr, Forum post=1cr |
| Community UI | Tabbed sidebar panel (slide-out, 420px, all pages) |
| Collective discoverability | Public + searchable |
| Sidebar availability | All pages (Router-level) |
| Scope | All 5 phases sequentially |

---

## Architecture Overview

Five distinct philosophical spaces, unified in a slide-out Community Hub sidebar:

| Space | Maps To | Status | Credit Cost |
|-------|---------|--------|-------------|
| **The Agora** | Existing global chat | Rebrand only | Free |
| **The Lyceum** | Existing analysis groups | Enable prod route | Free |
| **The Collective** | NEW artist fan groups | Full build | 1 credit to create |
| **The Underground** | NEW single global room | Full build | 1 credit to unlock |
| **The Forum** | NEW user essays | Full build | 1 credit per post |

---

## Phase 1: Community Hub Shell + Rebrand

### New Files

#### `site/src/hooks/useCommunity.js`
- Manages sidebar open/close, active tab, space access status
- Tabs: `['agora', 'lyceum', 'collective', 'underground', 'forum']`
- Free spaces: agora, lyceum
- Calls `GET /api/spaces/:space/status` to check underground access
- Exports: `{ isOpen, open, close, toggle, activeTab, switchTab, tabs, spaceAccess, isSpaceLocked, refreshAccess }`

#### `site/src/components/community/CommunityHub.jsx`
- Slide-out sidebar panel (420px, from right)
- Backdrop overlay (click-to-close)
- Tab bar at top: Agora | Lyceum | Collective | Underground | Forum
- Locked tabs show padlock icon
- Renders active tab content:
  - agora → `<AgoraChat />`
  - lyceum → `<LyceumGroups />`
  - collective → `<CollectiveList />` (Phase 2 placeholder)
  - underground → locked ? `<SpaceLock />` : `<UndergroundChat />` (Phase 3 placeholder)
  - forum → `<ForumList />` (Phase 4 placeholder)
- Close button top-right

#### `site/src/components/community/CommunityTabs.jsx`
- Tab navigation component
- Props: `{ activeTab, onTabChange, spaceAccess, isSpaceLocked }`
- Renders 5 tab buttons with labels and optional lock icons
- Active tab highlighted with cyan accent

#### `site/src/components/community/SpaceLock.jsx`
- "Unlock" overlay for gated spaces
- Shows space name, cost (1 credit), and unlock button
- Props: `{ space, cost, onUnlock, loading }`
- Calls unlock API, then `refreshAccess(space)`

#### `site/src/components/community/index.js`
```js
export { CommunityHub } from './CommunityHub.jsx';
export { CommunityTabs } from './CommunityTabs.jsx';
export { SpaceLock } from './SpaceLock.jsx';
```

#### `site/src/styles/community.css`
- Sidebar: fixed right, 420px, full height, dark bg, slide-in animation
- Backdrop: semi-transparent overlay
- Tab bar: horizontal tabs, Orbitron font, cyan active, locked = dimmed + padlock
- Responsive: full-width on mobile (<480px)
- Matches existing cyberpunk palette (deep purple bg, cyan/purple accents)

### Modified Files

#### `site/src/components/chat/AgoraChat.jsx` (new, alongside ChatModal)
- Embeddable version of ChatModal without the `<Modal>` wrapper
- Same internals as ChatModal: messages list, ChatMessage, ChatInput, useChat hook
- No title/subtitle (CommunityHub provides the header)
- Used inside CommunityHub's agora tab

#### `site/src/components/groups/LyceumGroups.jsx` (new, alongside GroupsModal)
- Embeddable version of GroupsModal without the `<Modal>` wrapper
- Same internals: group list, create/join sub-views
- Navigate to `/group/:id` on group click
- Used inside CommunityHub's lyceum tab

#### `site/src/Router.jsx`
Changes:
1. Import `CommunityHub` and `useCommunity`
2. Replace `chatModal` + `groupsModal` useModal hooks with `useCommunity()` hook
3. Remove `<ChatModal>` and `<GroupsModal>` from LandingPage
4. Add `<CommunityHub>` at the Router level (rendered for all routes, outside `<Routes>`)
5. Remove `import.meta.env.DEV` guard on `/group/:id` route
6. Add new routes: `/collective/:id`, `/forum/:postId`
7. Pass `communityHub.open` down to LandingPage as `onCommunity`

#### `site/src/components/LandingScreen.jsx`
Changes:
1. Replace `onChat, onGroups` props with `onCommunity`
2. Replace the DEV-gated FAB container with a single community FAB for all users
3. Single floating button that opens the Community Hub sidebar

#### `site/src/components/index.js`
Add: `export * from './community';`

#### `site/src/components/chat/index.js`
Add: `export { AgoraChat } from './AgoraChat.jsx';`

#### `site/src/components/groups/index.js`
Add: `export { LyceumGroups } from './LyceumGroups.jsx';`

#### `site/src/hooks/index.js`
Add: `export { useCommunity } from './useCommunity.js';`

---

## Phase 2: The Collective (Artist Fan Groups)

### Database: `database/COLLECTIVE_MIGRATION.sql`

```sql
-- ============================================================
-- THE COLLECTIVE - ARTIST FAN GROUPS MIGRATION
-- ============================================================

CREATE TABLE IF NOT EXISTS collective_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_name TEXT NOT NULL,
  spotify_artist_id TEXT,
  description TEXT CHECK (char_length(description) <= 500),
  image_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collective_groups_artist ON collective_groups(artist_name);
CREATE INDEX idx_collective_groups_spotify ON collective_groups(spotify_artist_id);
CREATE INDEX idx_collective_groups_owner ON collective_groups(owner_id);
CREATE INDEX idx_collective_groups_invite ON collective_groups(invite_code);
CREATE INDEX idx_collective_groups_created ON collective_groups(created_at DESC);

ALTER TABLE collective_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can browse collectives"
  ON collective_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create collectives"
  ON collective_groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update collectives"
  ON collective_groups FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete collectives"
  ON collective_groups FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Service role full access collective_groups"
  ON collective_groups FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON collective_groups TO authenticated;
GRANT ALL ON collective_groups TO service_role;

-- ============================================================

CREATE TABLE IF NOT EXISTS collective_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES collective_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role VARCHAR(10) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_collective_members_group ON collective_members(group_id);
CREATE INDEX idx_collective_members_user ON collective_members(user_id);

ALTER TABLE collective_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON collective_members FOR SELECT TO authenticated
  USING (group_id IN (SELECT group_id FROM collective_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Users can join collectives"
  ON collective_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave or owners can kick"
  ON collective_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM collective_groups WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role full access collective_members"
  ON collective_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, DELETE ON collective_members TO authenticated;
GRANT ALL ON collective_members TO service_role;

-- ============================================================

CREATE TABLE IF NOT EXISTS collective_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES collective_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  analysis_id UUID REFERENCES analyses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collective_messages_group ON collective_messages(group_id);
CREATE INDEX idx_collective_messages_created ON collective_messages(created_at DESC);
CREATE INDEX idx_collective_messages_group_created ON collective_messages(group_id, created_at DESC);

ALTER TABLE collective_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read collective chat"
  ON collective_messages FOR SELECT TO authenticated
  USING (group_id IN (SELECT group_id FROM collective_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can send collective messages"
  ON collective_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND group_id IN (SELECT group_id FROM collective_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access collective_messages"
  ON collective_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON collective_messages TO authenticated;
GRANT ALL ON collective_messages TO service_role;

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE collective_messages;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Enable collective_messages realtime manually.';
END; $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE collective_members;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Enable collective_members realtime manually.';
END; $$;
```

### Backend: `api/src/handlers/collective.js`

Follows exact same patterns as `api/src/handlers/groups.js`:
- Uses `getSupabaseForUser()` for auth + RLS
- Uses `addRefreshedCookieToResponse()` on every response
- Rate limits on send message

Endpoints:
| Handler | Method | Path | Notes |
|---------|--------|------|-------|
| `handleCreateCollective` | POST | `/api/collective` | Costs 1 credit (reserve/confirm pattern). Body: `{ artistName, spotifyArtistId?, description? }` |
| `handleListCollectives` | GET | `/api/collective` | Returns user's joined collectives |
| `handleBrowseCollectives` | GET | `/api/collective/browse` | Public browse with `?q=` search param |
| `handleJoinCollective` | POST | `/api/collective/join` | Body: `{ code }` or `{ groupId }` (direct join for public groups) |
| `handleGetCollectiveDetail` | GET | `/api/collective/:id` | Members + recent chat + analysis samples |
| `handleGetCollectiveChat` | GET | `/api/collective/:id/chat` | Paginated messages |
| `handleSendCollectiveMessage` | POST | `/api/collective/:id/chat` | Body: `{ message, analysisId? }` |
| `handleLeaveCollective` | POST | `/api/collective/:id/leave` | Leave group |
| `handleKickCollectiveMember` | DELETE | `/api/collective/:id/members/:userId` | Owner only |

### Backend: `api/index.js` additions
Add ~15 route entries for `/api/collective/*` following the existing group routing pattern (regex path matching).

### Frontend Service: `site/src/services/api/collective.js`
Same pattern as `groups.js`:
- `createCollective(artistName, description, spotifyArtistId)`
- `browseCollectives(query)`
- `getMyCollectives()`
- `joinCollective(code)` / `joinCollectiveById(groupId)`
- `getCollectiveDetail(groupId)`
- `getCollectiveChat(groupId, before)`
- `sendCollectiveMessage(groupId, message, analysisId)`
- `leaveCollective(groupId)`
- `kickCollectiveMember(groupId, userId)`

### Frontend Hook: `site/src/hooks/useCollective.js`
Same pattern as `useGroup.js`:
- Realtime subscriptions for messages + members
- Two channels: `collective-chat-${groupId}` and `collective-members-${groupId}`
- State: `{ detail, messages, members, loading, sending, sendMessage, loadMore, hasMore }`

### Frontend Components: `site/src/components/collective/`

| Component | Purpose |
|-----------|---------|
| `CollectiveList.jsx` | Browse + search artist groups, join button, create button (inside Hub tab) |
| `CreateCollectiveModal.jsx` | Form: artist name, description, optional Spotify search |
| `CollectiveView.jsx` | Full view: chat + members + shared analyses (route: `/collective/:id`) |
| `SharedAnalysisCard.jsx` | Inline card showing song/artist/scores when analysis_id attached to message |
| `index.js` | Barrel exports |

### Frontend Styles: `site/src/styles/collective.css`
- Extends cyberpunk palette with golden accent for "The Collective" branding
- Browse grid: card layout for artist groups
- Analysis card: compact inline preview

---

## Phase 3: The Underground (Global Contrarian Space)

### Database: `database/UNDERGROUND_MIGRATION.sql`

```sql
-- ============================================================
-- THE UNDERGROUND - GLOBAL CONTRARIAN SPACE
-- ============================================================

CREATE TABLE IF NOT EXISTS space_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space TEXT NOT NULL CHECK (space IN ('underground')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, space)
);

ALTER TABLE space_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own access"
  ON space_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages access"
  ON space_access FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT ON space_access TO authenticated;
GRANT ALL ON space_access TO service_role;

-- ============================================================

CREATE TABLE IF NOT EXISTS underground_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_underground_messages_created ON underground_messages(created_at DESC);
CREATE INDEX idx_underground_messages_user ON underground_messages(user_id);

ALTER TABLE underground_messages ENABLE ROW LEVEL SECURITY;

-- Only users with underground access can read/write
CREATE POLICY "Underground members can read"
  ON underground_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM space_access WHERE user_id = auth.uid() AND space = 'underground')
  );

CREATE POLICY "Underground members can write own"
  ON underground_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM space_access WHERE user_id = auth.uid() AND space = 'underground')
  );

CREATE POLICY "Service role full access underground"
  ON underground_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON underground_messages TO authenticated;
GRANT ALL ON underground_messages TO service_role;

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE underground_messages;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Enable underground_messages realtime manually.';
END; $$;
```

### Backend: `api/src/handlers/underground.js`

Follows `chat.js` pattern exactly:
| Handler | Method | Path | Notes |
|---------|--------|------|-------|
| `handleGetUndergroundMessages` | GET | `/api/underground` | Paginated, access-checked |
| `handleSendUndergroundMessage` | POST | `/api/underground` | 1000 char limit, access-checked |

### Backend: `api/src/handlers/spaces.js`

| Handler | Method | Path | Notes |
|---------|--------|------|-------|
| `handleCheckSpaceAccess` | GET | `/api/spaces/:space/status` | Returns `{ hasAccess }` |
| `handleUnlockSpace` | POST | `/api/spaces/:space/unlock` | Reserve 1 credit, insert space_access, confirm |

### Backend: `api/index.js` additions
Add ~4 route entries for `/api/underground` and `/api/spaces/*`.

### Frontend Service: `site/src/services/api/underground.js`
- `getMessages(before)` - paginated
- `sendMessage(message)` - 1000 char limit

### Frontend Hook: `site/src/hooks/useUnderground.js`
Same pattern as `useChat.js`:
- Realtime subscription: channel `'the-underground'`, table `underground_messages`
- State: `{ messages, loading, sending, hasMore, sendMessage, loadMore }`

### Frontend Components: `site/src/components/underground/`

| Component | Purpose |
|-----------|---------|
| `UndergroundChat.jsx` | Chat interface (like AgoraChat but with 1000 char input, darker theme) |
| `UnlockPrompt.jsx` | "Enter The Underground - 1 credit" screen with description |
| `index.js` | Barrel exports |

### Frontend Styles: `site/src/styles/underground.css`
- Dark/moody theme: near-black bg, dim green text, red accents
- Rotating philosophical quote header (Nietzsche, Kierkegaard, Camus)
- 1000-char input (taller textarea)

---

## Phase 4: The Forum (User Essays)

### Database: `database/FORUM_MIGRATION.sql`

```sql
-- ============================================================
-- THE FORUM - USER ESSAYS & COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_user ON forum_posts(user_id);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read posts"
  ON forum_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create posts"
  ON forum_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update own posts"
  ON forum_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can delete own posts"
  ON forum_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access forum_posts"
  ON forum_posts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON forum_posts TO authenticated;
GRANT ALL ON forum_posts TO service_role;

-- ============================================================

CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_comments_post ON forum_comments(post_id);
CREATE INDEX idx_forum_comments_created ON forum_comments(created_at ASC);
CREATE INDEX idx_forum_comments_user ON forum_comments(user_id);

ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read comments"
  ON forum_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments"
  ON forum_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can delete own comments"
  ON forum_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access forum_comments"
  ON forum_comments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, DELETE ON forum_comments TO authenticated;
GRANT ALL ON forum_comments TO service_role;
```

### Backend: `api/src/handlers/forum.js`

| Handler | Method | Path | Notes |
|---------|--------|------|-------|
| `handleListPosts` | GET | `/api/forum` | Paginated. Returns posts with comment_count |
| `handleCreatePost` | POST | `/api/forum` | Costs 1 credit. Body: `{ title, content }` |
| `handleGetPost` | GET | `/api/forum/:id` | Post + all comments |
| `handleAddComment` | POST | `/api/forum/:id/comments` | Free. Body: `{ content }` |
| `handleDeletePost` | DELETE | `/api/forum/:id` | Author only |

### Backend: `api/index.js` additions
Add ~5 route entries for `/api/forum/*`.

### Frontend Service: `site/src/services/api/forum.js`
- `listPosts(before)` - paginated
- `createPost(title, content)` - costs 1 credit
- `getPost(postId)` - post + comments
- `addComment(postId, content)` - free
- `deletePost(postId)` - author only

### Frontend Hooks
- `site/src/hooks/useForum.js` - post list + pagination
- `site/src/hooks/useForumPost.js` - single post + comments

### Frontend Components: `site/src/components/forum/`

| Component | Purpose |
|-----------|---------|
| `ForumList.jsx` | Post feed with preview cards (inside Hub tab) |
| `ForumPostCard.jsx` | Compact post preview: title, author, date, comment count |
| `ForumPostView.jsx` | Full post + comments thread (route: `/forum/:postId`) |
| `CreatePostModal.jsx` | Write: title input + markdown textarea (10000 chars) |
| `ForumComment.jsx` | Single comment component |
| `index.js` | Barrel exports |

### Frontend Styles: `site/src/styles/forum.css`
- Clean reading experience, wider text area
- Post cards: minimal borders, emphasis on title/content
- Markdown rendering for post content

---

## Phase 5: Integration & Polish

### Credit Integration (already described per-phase)
- Collective create: `reserveCredit` → create group → `confirmReservation`
- Underground unlock: `reserveCredit` → insert `space_access` → `confirmReservation`
- Forum post: `reserveCredit` → insert post → `confirmReservation`
- All use existing reserve/confirm/release pattern from `api/src/credits/`

### Full Route Map Update (`api/index.js`)

New routes to add (total ~24 new route entries):
```
GET    /api/collective
POST   /api/collective
GET    /api/collective/browse
POST   /api/collective/join
GET    /api/collective/:id
GET    /api/collective/:id/chat
POST   /api/collective/:id/chat
POST   /api/collective/:id/leave
DELETE /api/collective/:id/members/:userId
GET    /api/underground
POST   /api/underground
GET    /api/spaces/:space/status
POST   /api/spaces/:space/unlock
GET    /api/forum
POST   /api/forum
GET    /api/forum/:id
POST   /api/forum/:id/comments
DELETE /api/forum/:id
```

### Router Updates (`site/src/Router.jsx`)

New routes:
```jsx
<Route path="/collective/:id" element={<CollectiveView />} />
<Route path="/forum/:postId" element={<ForumPostView />} />
```

Remove dev gate:
```jsx
// Before: {import.meta.env.DEV && <Route path="/group/:id" ... />}
// After:  <Route path="/group/:id" element={<GroupAnalysisView />} />
```

### Hook Barrel (`site/src/hooks/index.js`)

Add:
```js
export { useCommunity } from './useCommunity.js';
export { useCollective } from './useCollective.js';
export { useUnderground } from './useUnderground.js';
export { useForum } from './useForum.js';
export { useForumPost } from './useForumPost.js';
```

---

## File Impact Summary

### New Files: ~35

**Database** (4):
- `database/COLLECTIVE_MIGRATION.sql`
- `database/UNDERGROUND_MIGRATION.sql`
- `database/FORUM_MIGRATION.sql`
- (space_access included in UNDERGROUND_MIGRATION.sql)

**Backend** (4 handlers):
- `api/src/handlers/collective.js`
- `api/src/handlers/underground.js`
- `api/src/handlers/forum.js`
- `api/src/handlers/spaces.js`

**Frontend Services** (3):
- `site/src/services/api/collective.js`
- `site/src/services/api/underground.js`
- `site/src/services/api/forum.js`

**Frontend Hooks** (5):
- `site/src/hooks/useCommunity.js`
- `site/src/hooks/useCollective.js`
- `site/src/hooks/useUnderground.js`
- `site/src/hooks/useForum.js`
- `site/src/hooks/useForumPost.js`

**Frontend Components** (~18 JSX):
- `site/src/components/community/CommunityHub.jsx`
- `site/src/components/community/CommunityTabs.jsx`
- `site/src/components/community/SpaceLock.jsx`
- `site/src/components/community/index.js`
- `site/src/components/chat/AgoraChat.jsx`
- `site/src/components/groups/LyceumGroups.jsx`
- `site/src/components/collective/CollectiveList.jsx`
- `site/src/components/collective/CreateCollectiveModal.jsx`
- `site/src/components/collective/CollectiveView.jsx`
- `site/src/components/collective/SharedAnalysisCard.jsx`
- `site/src/components/collective/index.js`
- `site/src/components/underground/UndergroundChat.jsx`
- `site/src/components/underground/UnlockPrompt.jsx`
- `site/src/components/underground/index.js`
- `site/src/components/forum/ForumList.jsx`
- `site/src/components/forum/ForumPostCard.jsx`
- `site/src/components/forum/ForumPostView.jsx`
- `site/src/components/forum/CreatePostModal.jsx`
- `site/src/components/forum/ForumComment.jsx`
- `site/src/components/forum/index.js`

**Frontend Styles** (5 CSS):
- `site/src/styles/community.css`
- `site/src/styles/collective.css`
- `site/src/styles/underground.css`
- `site/src/styles/forum.css`

### Modified Files: ~7
- `api/index.js` — Add ~24 new route entries
- `site/src/Router.jsx` — CommunityHub integration, remove dev gate, new routes
- `site/src/components/LandingScreen.jsx` — Replace chat/groups FABs with community FAB
- `site/src/components/index.js` — Add community barrel export
- `site/src/components/chat/index.js` — Add AgoraChat export
- `site/src/components/groups/index.js` — Add LyceumGroups export
- `site/src/hooks/index.js` — Add new hook exports
