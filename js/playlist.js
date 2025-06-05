// Module Quản lý Playlist
import { showNotification } from './notifications.js';
import { addToFavorites } from './favorites.js';

// Chức năng thêm bài hát vào playlist
function addSongToPlaylist(songIndex, songs) {
    const song = songs[songIndex];
    if (!song) return;

    // Hiển thị modal chọn playlist
    showPlaylistModal(song, songIndex);
}

// Hiển thị modal chọn playlist
function showPlaylistModal(song, songIndex) {
    const playlistModal = document.createElement('div');
    playlistModal.className = 'playlist-modal-overlay';
    playlistModal.innerHTML = `
        <div class="playlist-modal">
            <div class="playlist-modal-header">
                <h3>Thêm vào Playlist</h3>
                <button class="close-playlist-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="playlist-modal-body">
                <div class="song-info-mini">
                    <img src="${song.image}" alt="${song.name}">
                    <div>
                        <strong>${song.name}</strong>
                        <span>${song.singer}</span>
                    </div>
                </div>
                <div class="playlist-options">
                    <div class="create-new-playlist">
                        <button class="create-playlist-btn">
                            <i class="fas fa-plus"></i>
                            <span>Tạo playlist mới</span>
                        </button>
                    </div>
                    <div class="existing-playlists">
                        <div class="playlist-item" data-playlist="favorites">
                            <i class="fas fa-heart"></i>
                            <span>Yêu thích</span>
                            <button class="add-to-playlist-btn" data-playlist="favorites">Thêm</button>
                        </div>
                        <div class="playlist-item" data-playlist="recently-played">
                            <i class="fas fa-history"></i>
                            <span>Phát gần đây</span>
                            <button class="add-to-playlist-btn" data-playlist="recently-played">Thêm</button>
                        </div>
                        <div class="playlist-item" data-playlist="my-music">
                            <i class="fas fa-music"></i>
                            <span>Nhạc của tôi</span>
                            <button class="add-to-playlist-btn" data-playlist="my-music">Thêm</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(playlistModal);
    setTimeout(() => playlistModal.classList.add('show'), 100);

    // Xử lý nút đóng
    const closeBtn = playlistModal.querySelector('.close-playlist-modal');
    closeBtn.addEventListener('click', () => {
        closePlaylistModal(playlistModal);
    });

    // Xử lý tạo playlist mới
    const createBtn = playlistModal.querySelector('.create-playlist-btn');
    createBtn.addEventListener('click', () => {
        createNewPlaylist(song);
        closePlaylistModal(playlistModal);
    });

    // Xử lý thêm vào playlist có sẵn
    const addToPlaylistBtns = playlistModal.querySelectorAll('.add-to-playlist-btn');
    addToPlaylistBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const playlistType = btn.dataset.playlist;
            addToExistingPlaylist(song, playlistType);
            closePlaylistModal(playlistModal);
        });
    });

    // Đóng khi click overlay
    playlistModal.addEventListener('click', (e) => {
        if (e.target === playlistModal) {
            closePlaylistModal(playlistModal);
        }
    });
}

// Đóng modal playlist
function closePlaylistModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

// Tạo playlist mới
function createNewPlaylist(song) {
    const playlistName = prompt('Nhập tên playlist mới:');
    if (playlistName && playlistName.trim()) {
        try {
            // Lấy playlist hiện có từ localStorage
            let playlists = JSON.parse(localStorage.getItem('userPlaylists') || '{}');
            
            // Tạo playlist mới nếu chưa tồn tại
            if (!playlists[playlistName]) {
                playlists[playlistName] = [];
            }
            
            // Thêm bài hát vào playlist
            const songExists = playlists[playlistName].some(s => 
                s.name === song.name && s.singer === song.singer
            );
            
            if (!songExists) {
                playlists[playlistName].push({
                    name: song.name,
                    singer: song.singer,
                    image: song.image,
                    music: song.music,
                    duration: song.duration,
                    dbId: song.dbId,
                    dbType: song.dbType
                });
                
                localStorage.setItem('userPlaylists', JSON.stringify(playlists));
                showNotification(`🎵 Đã thêm "${song.name}" vào playlist "${playlistName}"!`, 'success');
            } else {
                showNotification(`ℹ️ Bài hát đã có trong playlist "${playlistName}"!`, 'info');
            }
        } catch (error) {
            showNotification('❌ Có lỗi khi tạo playlist!', 'error');
        }
    }
}

// Thêm vào playlist có sẵn
function addToExistingPlaylist(song, playlistType) {
    try {
        let message = '';
        
        switch (playlistType) {
            case 'favorites':
                addToFavorites(song);
                message = `💖 Đã thêm "${song.name}" vào yêu thích!`;
                break;
                
            case 'recently-played':
                addToRecentlyPlayed(song);
                message = `🕐 Đã thêm "${song.name}" vào phát gần đây!`;
                break;
                
            case 'my-music':
                addToMyMusic(song);
                message = `🎵 Đã thêm "${song.name}" vào nhạc của tôi!`;
                break;
                
            default:
                message = `✅ Đã thêm "${song.name}" vào playlist!`;
        }
        
        showNotification(message, 'success');
    } catch (error) {
        showNotification('❌ Có lỗi khi thêm vào playlist!', 'error');
    }
}

// Thêm vào danh sách phát gần đây
function addToRecentlyPlayed(song) {
    let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
    
    // Xóa nếu đã tồn tại
    recentlyPlayed = recentlyPlayed.filter(s => 
        !(s.name === song.name && s.singer === song.singer)
    );
    
    // Thêm vào đầu danh sách
    recentlyPlayed.unshift({
        name: song.name,
        singer: song.singer,
        image: song.image,
        music: song.music,
        duration: song.duration,
        dbId: song.dbId,
        dbType: song.dbType,
        playedAt: new Date().toISOString()
    });
    
    // Giới hạn 50 bài hát gần đây
    if (recentlyPlayed.length > 50) {
        recentlyPlayed = recentlyPlayed.slice(0, 50);
    }
    
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
}

// Thêm vào nhạc của tôi
function addToMyMusic(song) {
    let myMusic = JSON.parse(localStorage.getItem('myMusicPlaylist') || '[]');
    
    // Kiểm tra xem bài hát đã tồn tại chưa
    const songExists = myMusic.some(s => 
        s.name === song.name && s.singer === song.singer
    );
    
    if (!songExists) {
        myMusic.push({
            name: song.name,
            singer: song.singer,
            image: song.image,
            music: song.music,
            duration: song.duration,
            dbId: song.dbId,
            dbType: song.dbType,
            addedAt: new Date().toISOString()
        });
        
        localStorage.setItem('myMusicPlaylist', JSON.stringify(myMusic));
    }
}

// Test chức năng lưu trữ playlist
function testPlaylistStorage() {
    try {
        // Test tạo playlist
        const testSong = {
            name: 'Test Song',
            singer: 'Test Singer',
            image: 'test.jpg',
            music: 'test.mp3',
            duration: '3:30'
        };
        
        addToMyMusic(testSong);
        addToRecentlyPlayed(testSong);
        
        // Kiểm tra localStorage
        const myMusic = localStorage.getItem('myMusicPlaylist');
        const recentlyPlayed = localStorage.getItem('recentlyPlayed');
        
        if (myMusic && recentlyPlayed) {
            showNotification('✅ Chức năng playlist hoạt động bình thường!', 'success');
        } else {
            showNotification('❌ Có vấn đề với chức năng playlist!', 'error');
        }
        
    } catch (error) {
        showNotification('❌ Lỗi test playlist!', 'error');
    }
}

export {
    addSongToPlaylist,
    showPlaylistModal,
    closePlaylistModal,
    createNewPlaylist,
    addToExistingPlaylist,
    addToRecentlyPlayed,
    addToMyMusic,
    testPlaylistStorage
}; 