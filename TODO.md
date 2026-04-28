# TODO - StratumMail Mzansi

## Development Progress

### Phase 1: Project Setup ✅
- [x] Initialize Expo project with name EmailApp
- [x] Create assets folder and copy logo/favicon
- [x] Set up app.json for Vercel web deployment
- [x] Configure gitignore to exclude planning-folder

### Phase 2: Core Infrastructure ✅
- [x] Install dependencies (React Navigation, Zustand, etc.)
- [x] Set up navigation structure
- [x] Configure Tailwind/NativeWind theming
- [x] Set up API service layer

### Phase 3: Account Management ✅
- [x] Build account setup wizard UI
- [x] Implement auto-detection logic for SA hosting providers
- [ ] Create account validation API endpoint (backend)
- [x] Implement multi-account switching

### Phase 4: Email Features ✅
- [x] Build inbox list UI with date grouping
- [x] Implement email viewer with HTML rendering
- [x] Add compose screen with rich text editor
- [ ] Implement signature editor UI
- [x] Build folder management

### Phase 5: Backend Integration (Pending)
- [ ] Create Vercel API routes
- [ ] Implement IMAP/SMTP integration
- [ ] Add encryption for credentials
- [ ] Set up PostgreSQL database

### Phase 6: Polish & Deploy
- [ ] Add push notifications
- [ ] Implement offline support
- [ ] Test responsive web layout
- [ ] Deploy to Vercel

---

## Task Details

### Current Priority: High
1. Backend API integration
2. IMAP/SMTP implementation

### Medium Priority
1. HTML signature editor
2. Background sync
3. Push notifications

### Low Priority
1. Advanced offline support
2. Mobile store deployment

---

## Notes
- App name: Email (as specified in Expo)
- Deployment target: Vercel for web, Expo EAS for mobile
- Target users: South African business owners
- Key feature: Auto-detect IMAP/SMTP for local hosting providers
- Currently running on: http://localhost:8084