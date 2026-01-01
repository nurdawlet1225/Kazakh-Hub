# Z-Index Мәндерінің Талдауы

Бұл құжат сайттағы барлық z-index мәндерін көрсетеді.

## Z-Index Мәндерінің Тізімі

### 1. Globals.css
- `body::before`: **z-index: 0** (фон градиенті)

### 2. Header.css
- `.header`: **z-index: var(--z-header)** = **9999** (бас бет)
- `.header-search-icon`: **z-index: 1** (іздеу иконкасы)
- `.theme-toggle-btn svg`: **z-index: 1** (тема ауыстыру иконкасы)
- `.language-menu`: **z-index: 1000** (тілдер менюсі)
- `.user-avatar::before`: **z-index: -1** (аватар фоны)

### 3. Sidebar.css
- `.sidebar`: **z-index: 900** (бүйір панелі)
- `.sidebar-overlay`: **z-index: 40** (бүйір панель overlay)

### 4. Home.css
- `.home-controls-header .view-toggle`: **z-index: 10 !important** (көрініс ауыстыру)
- `.codes-list-dropdown-menu`: **z-index: 1000** (тізім dropdown)
- `.home-controls .view-toggle`: **z-index: 10** (көрініс ауыстыру)
- `.search-icon`: **z-index: 1** (іздеу иконкасы)
- `.home-controls .language-filter .filter-select`: **z-index: 1** (тіл фильтрі)
- `.home-controls .sort-filter .filter-select`: **z-index: 1** (сұрыптау фильтрі)
- `.codes-container.grid-view`: **z-index: 0** (тор көрінісі)
- `.codes-container.list-view`: **z-index: 0** (тізім көрінісі)

### 5. Profile.css
- `.profile-header .profile-header-overlay`: **z-index: 1** (профиль header overlay)
- `.profile-header > *`: **z-index: 2** (профиль header элементтері)
- `.profile-menu-wrapper`: **z-index: 1001** (профиль меню wrapper)
- `.profile-menu-button`: **z-index: 1002** (профиль меню батырмасы)
- `.profile-menu-dropdown`: **z-index: 10003** (профиль меню dropdown)
- `.profile-menu-item`: **z-index: 1** (профиль меню элементі)
- `.profile-menu-item svg`: **z-index: 2** (профиль меню иконкасы)
- `.profile-menu-item span`: **z-index: 2** (профиль меню мәтіні)
- `.modal-overlay`: **z-index: 11000** (модалды терезе overlay)
- `.background-preview-overlay-full::after`: **z-index: 1** (фон preview overlay)
- `.background-preview-overlay-full .modal-content`: **z-index: 2** (фон preview модалды мазмұны)
- `.background-preview-overlay`: **z-index: 1** (фон preview overlay)
- `.background-preview-info`: **z-index: 2** (фон preview ақпараты)

### 6. Chat.css
- `.chat-container`: **z-index: 999** (чат контейнері)
- `.chat-clear-search-btn`: **z-index: 1** (іздеуді тазалау батырмасы)
- `.chat-search-icon`: **z-index: 1** (іздеу иконкасы)
- `.chat-search-input-wrapper .chat-clear-search-btn`: **z-index: 1** (іздеуді тазалау батырмасы)

### 7. CodeCard.css
- `.code-card-wrapper`: **z-index: 0** (карточка wrapper)
- `.code-card-checkbox`: **z-index: 3** (чекбокс)
- `.code-card`: **z-index: 1** (карточка)
- `.code-card::before`: **z-index: 2** (карточка фоны)
- `.code-card-wrapper:hover`: **z-index: 10** (hover кезінде)
- `.code-card:hover`: **z-index: 2** (hover кезінде)
- `.code-card.list-mode .code-card-footer`: **z-index: 1** (тізім режимінде footer)
- `.code-card.list-mode:hover`: **z-index: 2** (тізім режимінде hover)

### 8. FolderItem.css
- `.folder-item:hover`: **z-index: 10** (hover кезінде)
- `.folder-item-icon-wrapper::before`: **z-index: 1** (иконка wrapper фоны)
- `.folder-item-icon-wrapper::after`: **z-index: 1** (иконка wrapper фоны)
- `.folder-item-icon`: **z-index: 2** (иконка)
- `.folder-item-title`: **z-index: 2** (тақырып)
- `.folder-item-description`: **z-index: 2** (сипаттама)
- `.folder-item-checkbox`: **z-index: 100** (чекбокс)
- `.folder-item-footer`: **z-index: 2** (footer)

### 9. CodeItem.css
- `.code-item-checkbox`: **z-index: 100** (чекбокс)
- `.code-item`: **z-index: 1** (элемент)
- `.code-item::before`: **z-index: 2** (элемент фоны)
- `.code-item:hover`: **z-index: 10** (hover кезінде)

### 10. ViewCode.css
- `.view-code-container`: **z-index: 1** (контейнер)
- `.meta-actions`: **z-index: 10** (мета әрекеттер)
- `.folder-explorer`: **z-index: 100** (папка explorer)
- `.actions-menu-dropdown`: **z-index: 1000** (әрекеттер меню dropdown)

### 11. EditProfileModal.css
- `.modal-overlay`: **z-index: 11000** (модалды терезе overlay)
- `.avatar-upload-container::before`: **z-index: 1** (аватар жүктеу контейнері фоны)
- `.avatar-actions`: **z-index: 2** (аватар әрекеттері)
- `.password-section-header`: **z-index: 1** (құпия сөз бөлімі header)
- `.password-section-content`: **z-index: 1** (құпия сөз бөлімі мазмұны)
- `.btn-upload-avatar`: **z-index: 10** (аватар жүктеу батырмасы)
- `.btn-remove-avatar svg`: **z-index: 1** (аватар жою иконкасы)
- `.btn-remove-avatar span`: **z-index: 1** (аватар жою мәтіні)

### 12. ProfileModal.css
- `.profile-dropdown`: **z-index: 10000** (профиль dropdown)

### 13. CodesListModal.css
- `.codes-modal-overlay`: **z-index: var(--z-modal, 2000)** = **11000** (модалды терезе overlay)

### 14. MessageInput.css
- `.emoji-picker`: **z-index: 1000** (emoji picker)

### 15. Footer.css
- `.footer`: **z-index: 100** (footer)
- `.footer-container`: **z-index: 1** (footer контейнері)
- `.social-icon`: **z-index: 1** (әлеуметтік желі иконкасы)
- `.link-icon`: **z-index: 1** (сілтеме иконкасы)

### 16. Auth.css
- `.landing-hero::before`: **z-index: 0** (hero фоны)
- `.hero-content`: **z-index: 2** (hero мазмұны)
- `.auth-card`: **z-index: 1** (аутентификация карточкасы)
- `.auth-divider span`: **z-index: 1** (бөлгіш мәтіні)

### 17. UploadModal.css
- `.modal-overlay`: **z-index: var(--z-modal)** = **11000** (модалды терезе overlay)
- `.mode-btn::before`: **z-index: 0** (режим батырмасы фоны)

### 18. GalaxyBackground.tsx & CursorTrail.tsx
- `zIndex: 0` (фон эффекттері)

## Z-Index Мәндерінің Топтастыруы

### Төменгі деңгейлер (0-10)
- **0**: Фон элементтері, контейнерлер
- **1**: Кіші элементтер, иконкалар, мәтін
- **2**: Орташа элементтер, карточкалар
- **3**: Чекбокстар
- **10**: Hover кезіндегі элементтер

### Орта деңгейлер (40-100)
- **40**: Sidebar overlay
- **100**: Footer, folder explorer, чекбокстар

### Жоғары деңгейлер (900-12000)
- **900**: Sidebar
- **999**: Chat контейнері
- **1000**: Dropdown менюлер, emoji picker
- **1001-1002**: Профиль меню элементтері
- **10003**: Профиль меню dropdown (өте жоғары!)
- **9999**: Header (var(--z-header))
- **10000**: Профиль dropdown
- **11000**: Модалды терезелер (var(--z-modal))
- **12000**: Tooltip (var(--z-tooltip))

### Ең жоғары деңгейлер (10000+)
- **10000**: Профиль dropdown
- **11000**: Модалды терезе overlay (EditProfileModal, Profile, UploadModal, CodesListModal)
- **12000**: Tooltip (var(--z-tooltip)) - анықталған, бірақ қолданылмаған

## Мәселелер мен Ұсыныстар

### ⚠️ Мәселелер:

1. **Өте жоғары z-index мәндері:**
   - `.profile-menu-dropdown`: **z-index: 10003** - бұл өте жоғары мән
   - `.modal-overlay`: **z-index: 11000** - бұл да өте жоғары

2. **Z-index мәндерінің дұрыс реттелуі:**
   - Кейбір элементтер бір-бірімен қақтығысуы мүмкін
   - Тұрақты z-index жүйесі қажет
   - `.profile-menu-dropdown` (10003) > `var(--z-modal)` (11000) - бұл қақтығысқа әкелуі мүмкін

3. **CSS айнымалылары:**
   - `var(--z-header)` = **9999** (theme.css-те анықталған)
   - `var(--z-modal)` = **11000** (theme.css-те анықталған)
   - `var(--z-tooltip)` = **12000** (theme.css-те анықталған)
   - `var(--z-modal, 2000)` - fallback бар, бірақ айнымалы 11000 мәнін қабылдайды

### ✅ Ұсыныстар:

1. **Z-index жүйесін стандарттау:**
   ```
   0-10: Фон элементтері
   10-100: Негізгі контент
   100-1000: Dropdown менюлер
   1000-10000: Модалды терезелер
   10000+: Ең жоғары деңгей (сирек қолдану)
   ```

2. **CSS айнымалыларын қолдану:**
   ```css
   :root {
     --z-base: 0;
     --z-dropdown: 1000;
     --z-sticky: 100;
     --z-fixed: 200;
     --z-modal-backdrop: 10000;
     --z-modal: 10001;
     --z-popover: 10002;
     --z-tooltip: 10003;
   }
   ```
   
   **Қазіргі айнымалылар (theme.css):**
   - `--z-header: 9999`
   - `--z-modal: 11000`
   - `--z-tooltip: 12000`

3. **Z-index мәндерін төмендету:**
   - `.profile-menu-dropdown`: `10003` → `var(--z-modal)` (11000) немесе одан төмен
   - Профиль меню dropdown модалды терезелерден төмен болуы керек
   - Барлық модалды терезелер `var(--z-modal)` айнымалысын қолдануы керек

## Файлдар бойынша Z-Index Саны

- **Home.css**: 8 z-index мәндері
- **Profile.css**: 15 z-index мәндері
- **Header.css**: 5 z-index мәндері
- **ViewCode.css**: 4 z-index мәндері
- **CodeCard.css**: 8 z-index мәндері
- **FolderItem.css**: 8 z-index мәндері
- **CodeItem.css**: 4 z-index мәндері
- **Chat.css**: 4 z-index мәндері
- **EditProfileModal.css**: 7 z-index мәндері
- **Footer.css**: 4 z-index мәндері
- **Auth.css**: 4 z-index мәндері
- **UploadModal.css**: 2 z-index мәндері
- **MessageInput.css**: 1 z-index мәні
- **ProfileModal.css**: 1 z-index мәні
- **CodesListModal.css**: 1 z-index мәні
- **Sidebar.css**: 2 z-index мәндері
- **Globals.css**: 1 z-index мәні

**Барлығы: ~78 z-index мәні**

