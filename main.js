// Main Music Player Application
import { $, $$, formatTime, updateSongDurations, defineProperties, createWaveSurfer } from './js/utils.js';
import { showNotification } from './js/notifications.js';
import { 
    initializeDatabase, 
    isDatabaseOperational, 
    loadSongsFromDatabase,
    addUploadedSongToDatabase,
    deleteSongFromDatabase,
    debugDatabaseState 
} from './js/database.js';
import { 
    loadCurrentSong,
    nextSong,
    prevSong,
    randomSong,
    highlightCurrentSong,
    handleEvent,
    updateCurrentWaveform,
    resetAllWaveforms,
    handleWaveSurferClick,
    updateBackground,
    getCurrentIndex,
    setCurrentIndex,
    getCurrentSong,
    getSongs,
    setSongs,
    getIsPlaying,
    setIsPlaying,
    getWavesurfers,
    setWavesurfers,
    getCurrentSongData
} from './js/musicPlayer.js';
import { 
    toggleSongFavoriteNew,
    checkIfSongIsLiked,
    toggleLikeSong,
    updateLikeButton
} from './js/favorites.js';
import { shareSong, downloadSong } from './js/sharing.js';
import { addSongToPlaylist } from './js/playlist.js';

// Main App Object
const app = {
    // State properties
    get currentIndex() { return getCurrentIndex(); },
    set currentIndex(value) { setCurrentIndex(value); },
    get currentSong() { return getCurrentSong(); },
    get songs() { return getSongs(); },
    set songs(value) { setSongs(value); },
    get isPlaying() { return getIsPlaying(); },
    set isPlaying(value) { setIsPlaying(value); },
    get wavesurfers() { return getWavesurfers(); },
    set wavesurfers(value) { setWavesurfers(value); },
    get currentSongData() { return getCurrentSongData(); },
    isDatabaseReady: false,
    dashboard: null,

    // Initialize app with database
    async initializeApp() {
        try {
            console.log('Initializing music player app...');
            
            // Check if IndexedDB is supported
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported, using fallback');
                this.initializeFallback();
                return;
            }
            
            // Initialize database
            const dbInitialized = await initializeDatabase();
            
            if (!dbInitialized) {
                console.error('Database initialization failed, using fallback');
                this.initializeFallback();
                return;
            }
            
            this.isDatabaseReady = true;
            
            // Load songs from database
            await this.loadSongsFromDatabase();
            console.log('Songs loaded from database:', this.songs.length);
            
            // Start the app
            this.start();
            
            console.log('App initialized with database successfully');
        } catch (error) {
            console.error('Failed to initialize app with database:', error);
            this.isDatabaseReady = false;
            
            // Fallback to old system if database fails
            console.log('Using fallback initialization...');
            this.initializeFallback();
        }
    },

    // Check if database is ready for operations
    isDatabaseOperational() {
        return this.isDatabaseReady && isDatabaseOperational();
    },

    // Load songs from database
    async loadSongsFromDatabase() {
        try {
            const songs = await loadSongsFromDatabase();
            if (songs) {
                this.songs = songs;
            }
        } catch (error) {
            console.error('Error loading songs from database:', error);
        }
    },

    // Fallback initialization without database
    initializeFallback() {
        console.log('Initializing with fallback method (no database)');
        
        // Default songs
        this.songs = [
            {
                name: 'Blue',
                singer: 'yung kai',
                image: 'assets/img/Song 1.jpeg',
                music: 'assets/music/Song 1.mp3',
                duration: '03:24'
            },
            {
                name: 'Cupid',
                singer: 'FIFTY FIFTY (피프티프티)',
                image: 'assets/img/Song 2.jpeg',
                music: 'assets/music/Song 2.mp3',
                duration: '02:54'
            },
            {
                name: 'Trap Royalty',
                singer: 'Singer 3',
                image: 'assets/img/Song 3.jpeg',
                music: 'assets/music/Song 3.mp3',
                duration: '03:15'
            },
            {
                name: 'Supernatural',
                singer: 'Ariana Grande',
                image: 'assets/img/Song 4.jpeg',
                music: 'assets/music/Song 4.mp3',
                duration: '03:07'
            },
            {
                name: 'End Of Beginning',
                singer: 'Djo',
                image: 'assets/img/Song 5.jpeg',
                music: 'assets/music/Song 5.mp3',
                duration: '04:19'
            }
        ];
        
        // Load uploaded songs from localStorage
        try {
            const uploadedSongs = JSON.parse(localStorage.getItem('uploadedSongs') || '[]');
            console.log('Found uploaded songs in localStorage:', uploadedSongs.length);
            
            // Add uploaded songs to the beginning of the playlist
            for (const song of uploadedSongs.reverse()) {
                this.songs.unshift({
                    name: song.name,
                    singer: song.singer,
                    image: song.image || 'assets/img/default-song.jpg',
                    music: song.music,
                    duration: song.duration || '00:00',
                    category: song.category || 'Unknown',
                    dbId: song.dbId,
                    dbType: 'uploaded'
                });
            }
            
            console.log('Total songs after loading localStorage:', this.songs.length);
        } catch (error) {
            console.warn('Failed to load uploaded songs from localStorage:', error);
        }
        
        // Set currentIndex to 0 (first song)
        this.currentIndex = 0;
        console.log('Set currentIndex to 0 for fallback mode');
        
        this.start();
        console.log('App started with fallback method');
    },

    // Render playlist
    render() {
        const htmls = this.songs.map((song, index) => {
            const isFirst = index === 0;
            const isFavorite = checkIfSongIsLiked(song);
            const isUserUploaded = song.dbType === 'uploaded' || song.type === 'uploaded';
            
            return `
            <div class="song-card ${isUserUploaded ? 'user-uploaded' : ''}" data-index="${index}">
                <div class="song-header">
                    <div class="song-artwork-container">
                        <div class="song-artwork" style="background-image: url('${song.image}')"></div>
                        ${isUserUploaded ? '<div class="upload-indicator"><i class="fas fa-upload"></i></div>' : ''}
                    </div>
                    <div class="song-info">
                        <div class="song-title">
                            ${song.name}
                            ${isFirst ? '<button class="follow-btn">FOLLOW</button>' : ''}
                        </div>
                        <div class="song-artist">${song.singer}</div>
                        ${song.duration ? `<div class="song-duration">
                            <i class="fas fa-clock"></i>
                            ${song.duration}
                        </div>` : ''}
                    </div>
                    <div class="song-actions">
                        <button class="action-btn heart-btn ${isFavorite ? 'active' : ''}" data-song-index="${index}" title="${isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}">
                            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <button class="action-btn share-btn" data-song-index="${index}" title="Chia sẻ">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button class="action-btn download-btn" data-song-index="${index}" title="Tải xuống">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn playlist-btn" data-song-index="${index}" title="Thêm vào playlist">
                            <i class="fas fa-plus"></i>
                        </button>
                        ${isUserUploaded ? `
                        <button class="action-btn delete-btn" data-song-index="${index}" title="Xóa bài hát">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                    </div>
                </div>
                
                <div class="waveform-section">
                    <div class="waveform-controls">
                        <button class="song-play-btn" data-song-index="${index}">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="waveform-container">
                            <div class="waveform-visual" id="waveform-${index}">
                            </div>
                        </div>
                    </div>
                    <div class="waveform-time">00:00-${song.duration}</div>
                </div>
                
                <div class="song-tags">
                    <span class="song-tag primary">
                        <i class="fas fa-music"></i>
                        Music
                    </span>
                    ${song.category && song.category !== 'Unknown' ? `<span class="song-tag category">
                        <i class="fas fa-tags"></i>
                        ${song.category}
                    </span>` : ''}
                    ${isUserUploaded ? `<span class="song-tag user-upload">
                        <i class="fas fa-user"></i>
                        Bài hát của bạn
                    </span>` : ''}
                    ${index === 1 ? '<span class="song-tag trending"><i class="fas fa-fire"></i> Trending</span>' : ''}
                    ${isFavorite ? '<span class="song-tag favorite"><i class="fas fa-heart"></i> Yêu thích</span>' : ''}
                </div>
            </div>
            `
        });
        
        $('.playlist').innerHTML = $('.playlist').innerHTML.split('<!-- Song cards')[0] + 
                                   '<!-- Song cards will be rendered here by JavaScript -->\n' + 
                                   htmls.join('');
        
        // Initialize event listeners after rendering
        this.initializeEventListeners();
    },

    // Initialize event listeners for song cards
    initializeEventListeners() {
        const _this = this;
        
        // Clear existing wavesurfers
        this.wavesurfers.forEach(ws => {
            if (ws) ws.destroy();
        });
        this.wavesurfers = [];
        
        // Handle song card clicks
        $$('.song-card').forEach((songCard, index) => {
            const playBtn = songCard.querySelector('.song-play-btn');
            const waveformVisual = songCard.querySelector('.waveform-visual');
            
            // Create WaveSurfer for this song
            if (waveformVisual) {
                const wavesurfer = createWaveSurfer(index, waveformVisual, this.songs, handleWaveSurferClick);
                this.wavesurfers[index] = wavesurfer;
            }
            
            // Click on play button
            const playHandler = (e) => {
                e.stopPropagation();
                
                console.log('Play button clicked for song index:', index);
                
                if (_this.currentIndex === index) {
                    // If it's the current song
                    if (_this.isPlaying) {
                        $('#audio').pause();
                    } else {
                        const playPromise = $('#audio').play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.log('Audio play failed:', error);
                                _this.isPlaying = false;
                                highlightCurrentSong();
                            });
                        }
                    }
                } else {
                    // Switch to another song
                    _this.currentIndex = index;
                    loadCurrentSong();
                    
                    setTimeout(() => {
                        const playPromise = $('#audio').play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.log('Audio play failed:', error);
                                _this.isPlaying = false;
                                highlightCurrentSong();
                            });
                        }
                    }, 100);
                }
                
                // Click animation
                songCard.style.transform = 'scale(0.98)';
                songCard.style.transition = 'transform 0.1s ease';
                setTimeout(() => {
                    songCard.style.transform = 'scale(1)';
                }, 100);
            };
            
            // Attach event listeners
            if (playBtn) {
                playBtn.addEventListener('click', playHandler);
            }
        });

        // Initialize action button event listeners  
        this.initializeActionButtons();
    },

    // Initialize action button event listeners  
    initializeActionButtons() {
        const _this = this;
        
        // Heart/favorite buttons
        $$('.heart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                toggleSongFavoriteNew(songIndex, _this.songs, () => updateLikeButton(_this.currentSong, $('#like-song')));
            });
        });

        // Share buttons
        $$('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                shareSong(songIndex, _this.songs);
            });
        });

        // Download buttons
        $$('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                downloadSong(songIndex, _this.songs);
            });
        });

        // Playlist buttons
        $$('.playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                addSongToPlaylist(songIndex, _this.songs);
            });
        });

        // Delete buttons (chỉ cho bài hát uploaded)
        $$('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                const song = _this.songs[songIndex];
                
                // Kiểm tra xem có phải bài hát uploaded không
                if (song && (song.dbType === 'uploaded' || song.type === 'uploaded')) {
                    console.log('Delete button clicked for song:', song.name);
                    _this.confirmDeleteSong(songIndex);
                } else {
                    console.warn('Attempted to delete non-uploaded song');
                }
            });
        });

    },

    // Start the app
    // Initialize background
    initializeBackground() {
        const backgroundImg1 = document.getElementById('background-image-1');
        const backgroundImg2 = document.getElementById('background-image-2');
        
        if (backgroundImg1 && backgroundImg2 && this.songs.length > 0) {
            // Thiết lập background từ bài hát đầu tiên
            const firstSong = this.songs[0];
            backgroundImg1.style.backgroundImage = `url('${firstSong.image}')`;
            backgroundImg1.classList.add('active');
            
            // Đảm bảo background thứ 2 không active
            backgroundImg2.classList.remove('active');
        }
    },

    start() {
        defineProperties(this);
        this.render();
        handleEvent(this.updateBottomPlayerIcon.bind(this), this.updateBottomPlayerTime.bind(this), updateCurrentWaveform);
        loadCurrentSong();
        this.connectBottomPlayer();
        this.dashboard = $('.dashboard');
        
        // Update actual durations from audio files
        updateSongDurations(this.songs, formatTime);
        
        // Initialize background on startup
        this.initializeBackground();
    },

    // Update bottom player
    updateBottomPlayer() {
        const playerArtwork = $('#player-artwork');
        const playerTitle = $('#player-title');
        const playerArtist = $('#player-artist');
        
        if (playerArtwork) {
            playerArtwork.style.backgroundImage = `url('${this.currentSong.image}')`;
        }
        if (playerTitle) {
            playerTitle.textContent = this.currentSong.name;
        }
        if (playerArtist) {
            playerArtist.textContent = this.currentSong.singer;
        }
    },

    // Connect bottom player controls
    connectBottomPlayer() {
        const _this = this;
        const playBtn = $('#play-btn');
        const prevBtn = $('#prev-btn');
        const nextBtn = $('#next-btn');
        const bottomProgress = $('#bottom-progress');
        const closeBtn = $('#close-bottom-player');
        
        // Play/Pause button
        if (playBtn) {
            playBtn.onclick = function() {
                if (_this.isPlaying) {
                    $('#audio').pause();
                } else {
                    $('#audio').play();
                }
            };
        }
        
        // Previous button
        if (prevBtn) {
            prevBtn.onclick = function() {
                prevSong();
                $('#audio').play();
            };
        }
        
        // Next button  
        if (nextBtn) {
            nextBtn.onclick = function() {
                nextSong();
                $('#audio').play();
            };
        }
        
        // Progress bar click
        if (bottomProgress) {
            bottomProgress.onclick = function(e) {
                if ($('#audio').duration) {
                    const rect = bottomProgress.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickPercent = (clickX / rect.width) * 100;
                    
                    $('#audio').currentTime = (clickPercent / 100) * $('#audio').duration;
                    $('#progress').value = clickPercent;
                }
            };
        }

        // Close button
        if (closeBtn) {
            closeBtn.onclick = function() {
                _this.hideBottomPlayer();
            };
        }
    },

    // Update icon play/pause in bottom player
    updateBottomPlayerIcon() {
        const playBtn = $('#play-btn');
        if (playBtn) {
            const icon = playBtn.querySelector('i');
            if (this.isPlaying) {
                icon.className = 'fas fa-pause';
            } else {
                icon.className = 'fas fa-play';
            }
        }
    },

    // Update time in bottom player
    updateBottomPlayerTime() {
        const currentTimeEl = $('#current-time');
        const totalTimeEl = $('#total-time');
        const progressFill = $('.progress-fill');
        
        const audio = $('#audio');
        if (audio.currentTime && audio.duration) {
            const current = formatTime(audio.currentTime);
            const total = formatTime(audio.duration);
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            
            if (currentTimeEl) currentTimeEl.textContent = current;
            if (totalTimeEl) totalTimeEl.textContent = total;
            if (progressFill) progressFill.style.width = progressPercent + '%';
        }
    },

    // Show bottom player
    showBottomPlayer() {
        const bottomPlayer = $('#bottom-player');
        if (bottomPlayer) {
            bottomPlayer.classList.add('show');
            document.body.classList.add('bottom-player-active');
        }
    },

    // Hide bottom player
    hideBottomPlayer() {
        const bottomPlayer = $('#bottom-player');
        if (bottomPlayer) {
            bottomPlayer.classList.remove('show');
            document.body.classList.remove('bottom-player-active');
        }
    },

    // Confirm delete song
    confirmDeleteSong(songIndex) {
        const song = this.songs[songIndex];
        if (!song) return;

        // Show confirmation dialog
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-dialog-overlay';
        confirmDialog.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-dialog-header">
                    <h3>Xóa bài hát</h3>
                </div>
                <div class="confirm-dialog-body">
                    <p>Bạn có chắc chắn muốn xóa bài hát này?</p>
                    <div class="song-info-preview">
                        <img src="${song.image}" alt="${song.name}">
                        <div>
                            <strong>${song.name}</strong>
                            <span>${song.singer}</span>
                        </div>
                    </div>
                </div>
                <div class="confirm-dialog-actions">
                    <button class="cancel-btn">Hủy</button>
                    <button class="delete-btn">Xóa</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);
        setTimeout(() => confirmDialog.classList.add('show'), 100);

        // Handle buttons
        const cancelBtn = confirmDialog.querySelector('.cancel-btn');
        const deleteBtn = confirmDialog.querySelector('.delete-btn');

        cancelBtn.addEventListener('click', () => {
            this.closeConfirmDialog(confirmDialog);
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteSong(songIndex);
            this.closeConfirmDialog(confirmDialog);
        });

        // Close on overlay click
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                this.closeConfirmDialog(confirmDialog);
            }
        });
    },

    // Close confirmation dialog
    closeConfirmDialog(dialog) {
        dialog.classList.remove('show');
        setTimeout(() => {
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
        }, 300);
    },

    // Delete song
    async deleteSong(songIndex) {
        const song = this.songs[songIndex];
        if (!song) {
            console.error('Song not found at index:', songIndex);
            showNotification('❌ Không tìm thấy bài hát!', 'error');
            return;
        }

        console.log('Deleting song:', song.name, 'Type:', song.dbType);

        try {
            // Only allow deleting uploaded songs for safety
            if (song.dbType !== 'uploaded') {
                showNotification('❌ Chỉ có thể xóa bài hát đã tải lên!', 'error');
                return;
            }

            // If it's the currently playing song, stop it
            if (songIndex === this.currentIndex) {
                $('#audio').pause();
                this.isPlaying = false;
                
                // Move to next song if available
                if (this.songs.length > 1) {
                    if (songIndex === this.songs.length - 1) {
                        this.currentIndex = 0; // Go to first song if deleting last
                    }
                } else {
                    this.currentIndex = 0;
                }
            } else if (songIndex < this.currentIndex) {
                // If deleting a song before current, adjust current index
                this.currentIndex--;
            }

            // Try database first if available
            if (this.isDatabaseOperational() && song.dbId) {
                console.log('Deleting from database, song ID:', song.dbId);
                try {
                    await deleteSongFromDatabase(song.dbId, 'uploaded');
                    console.log('Song deleted from database successfully');
                    
                    // Reload songs from database
                    await this.loadSongsFromDatabase();
                } catch (dbError) {
                    console.error('Database deletion failed:', dbError);
                    // Fall back to manual removal
                    this.deleteFromMemoryAndLocalStorage(song, songIndex);
                }
            } else {
                // Fallback: delete from memory and localStorage
                console.log('Using fallback deletion method');
                this.deleteFromMemoryAndLocalStorage(song, songIndex);
            }
            
            // Re-render playlist
            this.render();
            
            // Load current song if there are still songs
            if (this.songs.length > 0) {
                loadCurrentSong();
            }

            showNotification('✅ Đã xóa bài hát thành công!', 'success');
            
        } catch (error) {
            console.error('Error deleting song:', error);
            showNotification('❌ Có lỗi xảy ra khi xóa bài hát!', 'error');
        }
    },

    // Delete from memory and localStorage (fallback method)
    deleteFromMemoryAndLocalStorage(song, songIndex) {
        console.log('Deleting from memory and localStorage');
        
        // Remove from app.songs array
        this.songs.splice(songIndex, 1);
        
        // Remove from localStorage
        try {
            const uploadedSongs = JSON.parse(localStorage.getItem('uploadedSongs') || '[]');
            const updatedSongs = uploadedSongs.filter(storedSong => 
                storedSong.dbId !== song.dbId
            );
            localStorage.setItem('uploadedSongs', JSON.stringify(updatedSongs));
            console.log('Song removed from localStorage');
        } catch (error) {
            console.warn('Failed to remove song from localStorage:', error);
        }
    },

    // Add uploaded song to playlist
    async addUploadedSongToPlaylist(file, audioURL, songData = null) {
        console.log('addUploadedSongToPlaylist called');
        
        try {
            // Try database first if available
            if (this.isDatabaseOperational()) {
                console.log('Using database for storage');
                
                const song = songData || {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    singer: 'Local Upload',
                    image: 'assets/img/default-song.jpg',
                    music: audioURL,
                    duration: '00:00',
                    category: 'Unknown',
                    dbType: 'uploaded'
                };
                
                const songId = await addUploadedSongToDatabase(file, audioURL, song);
                console.log('Song saved to database with ID:', songId);
                
                // Remember current song before reloading
                const currentSongName = this.currentSong ? this.currentSong.name : null;
                
                // Reload songs from database
                await this.loadSongsFromDatabase();
                
                // Adjust currentIndex since new song was added at the beginning
                if (currentSongName) {
                    const newIndex = this.songs.findIndex(song => song.name === currentSongName);
                    if (newIndex !== -1) {
                        this.currentIndex = newIndex;
                    }
                } else {
                    this.currentIndex = 0;
                }
                
                // Re-render playlist
                this.render();
                loadCurrentSong();
                
                return songId;
            } else {
                // Fallback: Use localStorage
                console.log('Database not available, using localStorage fallback');
                
                const newSong = songData || {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    singer: 'Local Upload',
                    image: 'assets/img/default-song.jpg',
                    music: audioURL,
                    duration: '00:00',
                    category: 'Unknown',
                    dbId: Date.now(),
                    dbType: 'uploaded'
                };
                
                // Adjust currentIndex before adding new song
                if (this.songs.length > 0) {
                    this.currentIndex++;
                }
                
                // Add to songs array
                this.songs.unshift(newSong);
                
                // Save to localStorage
                try {
                    const uploadedSongs = JSON.parse(localStorage.getItem('uploadedSongs') || '[]');
                    uploadedSongs.unshift({
                        ...newSong,
                        uploadDate: new Date().toISOString(),
                        fileSize: file.size,
                        fileType: file.type
                    });
                    localStorage.setItem('uploadedSongs', JSON.stringify(uploadedSongs));
                } catch (error) {
                    console.warn('Failed to save to localStorage:', error);
                }
                
                // Re-render playlist
                this.render();
                loadCurrentSong();
                
                return newSong.dbId;
            }
        } catch (error) {
            console.error('Error in addUploadedSongToPlaylist:', error);
            throw error;
        }
    }
};

// Make app globally available
window.app = app;

// Initialize app
app.initializeApp();

// Dashboard Menu functionality
const dashboardMenuBtn = document.getElementById('dashboard-menu-btn');
const dashboardDropdown = document.getElementById('dashboard-dropdown');
const uploadSongBtn = document.getElementById('upload-song');
const likeSongBtn = document.getElementById('like-song');

// Toggle dropdown menu
let isDropdownOpen = false;

function toggleDashboardDropdown() {
    isDropdownOpen = !isDropdownOpen;
    
    if (isDropdownOpen) {
        dashboardDropdown.classList.add('show');
        dashboardMenuBtn.classList.add('active');
        
        // Update like button state when opening dropdown
        updateLikeButton(app.currentSong, likeSongBtn);
    } else {
        dashboardDropdown.classList.remove('show');
        dashboardMenuBtn.classList.remove('active');
    }
}

// Close dropdown when clicking outside
function closeDropdownOutside(event) {
    if (dashboardMenuBtn && dashboardDropdown) {
        if (!dashboardMenuBtn.contains(event.target) && !dashboardDropdown.contains(event.target)) {
            if (isDropdownOpen) {
                toggleDashboardDropdown();
            }
        }
    }
}

// Initialize dashboard menu event listeners
function initializeDashboardMenu() {
    // Dashboard menu button click
    if (dashboardMenuBtn) {
        dashboardMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDashboardDropdown();
        });
    }

    // Upload song button click
    if (uploadSongBtn) {
        uploadSongBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            import('./js/upload.js').then(module => {
                module.handleSongUpload();
            });
            toggleDashboardDropdown();
        });
    }

    // Like song button click
    if (likeSongBtn) {
        likeSongBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLikeSong(app.currentSong, likeSongBtn, toggleDashboardDropdown);
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', closeDropdownOutside);
    
    // Update like button when song changes
    if ($('#audio')) {
        $('#audio').addEventListener('loadstart', () => {
            setTimeout(() => updateLikeButton(app.currentSong, likeSongBtn), 500);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    // Wait a bit for app to initialize
    setTimeout(() => {
        updateLikeButton(app.currentSong, likeSongBtn);
        initializeDashboardMenu();
        
        // Debug database state
        debugDatabaseState();
        
        // Show database readiness
        if (app.isDatabaseOperational()) {
            console.log('✅ Database ready for uploads');
        } else {
            console.warn('⚠️ Database not ready, uploads may fail');
        }
    }, 2000);
    
    // Initialize upload modal dynamically
    import('./js/upload.js').then(module => {
        module.initializeUploadModal();
    });
    
    // Add direct close button event listener as backup
    setTimeout(() => {
        const closeBtn = document.getElementById('close-upload-modal');
        const uploadModal = document.getElementById('upload-modal');
        
        if (closeBtn && uploadModal) {
            console.log('Adding backup close button listener');
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                uploadModal.classList.remove('show');
                uploadModal.style.display = 'none';
            });
            
            // Add overlay click to close
            uploadModal.addEventListener('click', (e) => {
                if (e.target === uploadModal) {
                    console.log('Overlay clicked');
                    uploadModal.classList.remove('show');
                    uploadModal.style.display = 'none';
                }
            });
        }
    }, 1000);
});

// Make debug functions globally available
window.debugDatabase = debugDatabaseState;
window.testDelete = (songIndex) => {
    console.log('=== Testing Delete Song ===');
    const song = app.songs[songIndex];
    if (!song) {
        console.error('Song not found at index:', songIndex);
        return;
    }
    
    console.log('Song to delete:', {
        index: songIndex,
        name: song.name,
        singer: song.singer,
        type: song.dbType || song.type,
        dbId: song.dbId,
        canDelete: song.dbType === 'uploaded' || song.type === 'uploaded'
    });
    
    if (song.dbType === 'uploaded' || song.type === 'uploaded') {
        console.log('✅ This song can be deleted');
        app.deleteSong(songIndex);
    } else {
        console.log('❌ This song cannot be deleted (not uploaded)');
    }
};

window.switchSong = (songIndex) => {
    console.log('=== Testing Switch Song ===');
    const song = app.songs[songIndex];
    if (!song) {
        console.error('Song not found at index:', songIndex);
        return;
    }
    
    console.log('Switching to song:', {
        index: songIndex,
        name: song.name,
        singer: song.singer,
        type: song.dbType || song.type
    });
    
    console.log('Before switch - currentIndex:', app.currentIndex);
    app.currentIndex = songIndex;
    loadCurrentSong();
    console.log('After switch - currentIndex:', app.currentIndex);
}; 