# Music Player - Modular Architecture

## 📁 Cấu trúc Module

Dự án Music Player đã được tái cấu trúc từ file `script.js` monolithic thành các module riêng biệt để dễ bảo trì và phát triển.

### 🗂️ Cấu trúc thư mục:

```
├── main.js              # File chính - thay thế script.js
├── js/
│   ├── database.js      # Quản lý database và IndexedDB
│   ├── musicPlayer.js   # Core music player functionality
│   ├── favorites.js     # Chức năng yêu thích
│   ├── sharing.js       # Chức năng chia sẻ
│   ├── playlist.js      # Quản lý playlist
│   ├── upload.js        # Chức năng upload nhạc
│   ├── utils.js         # Các hàm tiện ích
│   └── notifications.js # Hệ thống thông báo
└── script.js            # File gốc (có thể xóa)
```

## 📋 Chi tiết từng Module

### 1. **main.js** - File chính

- Tích hợp tất cả modules
- Khởi tạo ứng dụng
- Dashboard menu functionality
- Quản lý state chính của app

### 2. **js/database.js** - Quản lý Database

**Chức năng:**

- Khởi tạo và kết nối IndexedDB
- Kiểm tra trạng thái database
- Load/save songs từ database
- Xử lý fallback khi database lỗi

**Export functions:**

```javascript
-initializeDatabase() -
  isDatabaseOperational() -
  loadSongsFromDatabase() -
  addUploadedSongToDatabase() -
  deleteSongFromDatabase() -
  getDatabaseInstance() -
  debugDatabaseState();
```

### 3. **js/musicPlayer.js** - Core Player

**Chức năng:**

- Điều khiển phát nhạc (play/pause/next/prev)
- Quản lý audio state
- WaveSurfer integration
- Background effects
- Event handling

**Export functions:**

```javascript
- loadCurrentSong()
- nextSong(), prevSong(), randomSong()
- highlightCurrentSong()
- handleEvent()
- updateCurrentWaveform()
- resetAllWaveforms()
- updateBackground()
- Getters/Setters cho state
```

### 4. **js/favorites.js** - Yêu thích

**Chức năng:**

- Toggle favorite songs
- Heart animations
- Floating heart effects
- Dashboard like functionality
- localStorage fallback

**Export functions:**

```javascript
-toggleSongFavoriteNew() - createFloatingHearts() - addToFavorites(),
  removeFromFavorites() -
    checkIfSongIsLiked() -
    toggleLikeSong() -
    updateLikeButton();
```

### 5. **js/sharing.js** - Chia sẻ

**Chức năng:**

- Share modal với tùy chỉnh text
- Quick share options
- Copy to clipboard
- Web Share API integration
- Download functionality

**Export functions:**

```javascript
-shareSong() - showEnhancedShareModal() - handleQuickShare() - downloadSong();
```

### 6. **js/playlist.js** - Playlist

**Chức năng:**

- Tạo playlist mới
- Thêm vào playlist có sẵn
- Recently played
- My music
- Playlist modal

**Export functions:**

```javascript
-addSongToPlaylist() -
  showPlaylistModal() -
  createNewPlaylist() -
  addToRecentlyPlayed() -
  addToMyMusic();
```

### 7. **js/upload.js** - Upload

**Chức năng:**

- Upload modal
- File validation
- Progress tracking
- Form handling
- Image preview

**Export functions:**

```javascript
-handleSongUpload() -
  showUploadModal() -
  handleUploadFormSubmit() -
  initializeUploadModal();
```

### 8. **js/utils.js** - Tiện ích

**Chức năng:**

- DOM selectors ($, $$)
- Time formatting
- WaveSurfer creation
- Duration parsing
- Audio state sync

**Export functions:**

```javascript
-$,
  $$ -
    formatTime() -
    createWaveSurfer() -
    updateSongDurations() -
    syncAudioState();
```

### 9. **js/notifications.js** - Thông báo

**Chức năng:**

- Show notifications
- Auto-hide
- Different types (success, error, info)

**Export functions:**

```javascript
-showNotification();
```

## 🔄 Migration từ script.js

### Bước 1: Backup

```bash
cp script.js script.js.backup
```

### Bước 2: Cập nhật HTML

Thay đổi trong `index.html`:

```html
<!-- Cũ -->
<script src="script.js"></script>

<!-- Mới -->
<script type="module" src="main.js"></script>
```

### Bước 3: Kiểm tra Dependencies

Đảm bảo các thư viện sau vẫn được load:

- WaveSurfer.js
- Font Awesome icons
- MusicDatabase class (nếu có)

## 🚀 Sử dụng

### Khởi động ứng dụng:

```javascript
// Tự động khởi chạy khi load main.js
// Không cần code thêm
```

### Truy cập app object:

```javascript
// App object có sẵn global
console.log(window.app.currentSong);
console.log(window.app.songs);
```

### Debug functions:

```javascript
// Debug database
window.debugDatabase();

// Test delete song
window.testDelete(0);

// Switch song
window.switchSong(1);
```

## 🔧 Tùy chỉnh

### Thêm chức năng mới:

1. Tạo file module mới trong `js/`
2. Export các functions cần thiết
3. Import vào `main.js`
4. Tích hợp vào app object

### Modify existing functionality:

1. Tìm module tương ứng
2. Chỉnh sửa function
3. Đảm bảo export/import đúng

## 🐛 Troubleshooting

### Lỗi phổ biến:

1. **Module not found**

   - Kiểm tra đường dẫn import
   - Đảm bảo file tồn tại

2. **Function not exported**

   - Kiểm tra export statement
   - Đảm bảo import đúng tên

3. **Database issues**

   - Check console cho database debug info
   - Fallback sẽ dùng localStorage

4. **Audio không phát**
   - Kiểm tra file paths
   - Check browser permissions

## 📊 Performance

### Lợi ích của modular architecture:

- **Code splitting**: Chỉ load module cần thiết
- **Maintainability**: Dễ debug và sửa lỗi
- **Reusability**: Có thể tái sử dụng modules
- **Testing**: Dễ test từng module riêng
- **Collaboration**: Team có thể làm việc song song

### Lazy loading:

```javascript
// Upload module được load động
import("./js/upload.js").then((module) => {
  module.handleSongUpload();
});
```

## 🔮 Future Enhancements

1. **Service Worker** cho offline functionality
2. **Web Workers** cho audio processing
3. **TypeScript** conversion
4. **Unit tests** cho từng module
5. **CSS modules** tương tự
6. **Bundle optimization** với Webpack/Vite

## 📝 Notes

- Giữ nguyên toàn bộ logic và functionality
- Không thay đổi UI/UX
- Backward compatible với existing data
- Support cả database và localStorage fallback
- ES6 modules với tree-shaking capability

---

**Tác giả**: AI Assistant  
**Ngày tạo**: 2024  
**Version**: 1.0.0
