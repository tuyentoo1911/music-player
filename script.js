const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)
const header = $('header h2');
const cdthumb = $('.cd-thumb');
const audio = $('#audio');
const cd = $('.cd');
const playBTN = $('.btn-toggle-play');
const player = $('.player');
const progress = $('#progress');
const nextBTN = $('.btn-next');
const prevBTN = $('.btn-prev');
const randomBTN = $('.btn-random');

// Initialize database
let musicDB = null;

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    wavesurfers: [], // Array to store WaveSurfer instances
    currentBackgroundIndex: 1, // Track which background is currently active
    songs: [], // Will be loaded from database
    currentSongData: null, // Store current song with database info
    isDatabaseReady: false, // Track database state

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
            
            // Initialize database with retry mechanism
            let dbInitialized = false;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!dbInitialized && retryCount < maxRetries) {
                try {
                    console.log(`Database initialization attempt ${retryCount + 1}/${maxRetries}`);
                    
                    musicDB = new MusicDatabase();
                    await musicDB.init();
                    
                    // Verify database is actually working
                    if (musicDB.db && musicDB.db.objectStoreNames.length > 0) {
                        console.log('Database initialized successfully');
                        this.isDatabaseReady = true;
                        dbInitialized = true;
                    } else {
                        throw new Error('Database structure not properly created');
                    }
                    
                } catch (error) {
                    console.error(`Database init attempt ${retryCount + 1} failed:`, error);
                    retryCount++;
                    
                    if (retryCount < maxRetries) {
                        console.log('Waiting 1 second before retry...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
            
            if (!dbInitialized) {
                console.error('Database initialization failed after all retries, using fallback');
                this.initializeFallback();
                return;
            }
            
            await musicDB.initializeDefaultData();
            console.log('Default data initialized');
            
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
        const operational = this.isDatabaseReady && musicDB && musicDB.db && musicDB.db.objectStoreNames.length > 0;
        if (!operational) {
            console.warn('Database not operational:', {
                isDatabaseReady: this.isDatabaseReady,
                musicDBExists: !!musicDB,
                musicDBConnected: musicDB && !!musicDB.db,
                objectStores: musicDB && musicDB.db ? musicDB.db.objectStoreNames.length : 0
            });
        }
        return operational;
    },

    // Load songs from database
    async loadSongsFromDatabase() {
        try {
            if (!this.isDatabaseOperational()) {
                console.warn('Database not operational, loading from fallback');
                return;
            }
            
            const originalSongs = await musicDB.getAllSongs();
            const uploadedSongs = await musicDB.getAllUploadedSongs();
            
            // Combine both types and add database metadata
            this.songs = [
                ...originalSongs.map(song => ({
                    ...song,
                    dbId: song.id,
                    dbType: 'original'
                })),
                ...uploadedSongs.map(song => ({
                    ...song,
                    dbId: song.id,
                    dbType: 'uploaded'
                }))
            ];
            
            console.log(`Loaded ${this.songs.length} songs from database (${originalSongs.length} original, ${uploadedSongs.length} uploaded)`);
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

    render: function() {
        const htmls = this.songs.map((song, index) => {
            const isFirst = index === 0;
            const isFavorite = this.checkIfSongIsLiked(song);
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
        })
        $('.playlist').innerHTML = $('.playlist').innerHTML.split('<!-- Song cards')[0] + 
                                   '<!-- Song cards will be rendered here by JavaScript -->\n' + 
                                   htmls.join('');
        
        // Initialize event listeners after rendering
        this.initializeEventListeners();
    },

    // Initialize event listeners for song cards
    initializeEventListeners: function() {
        const _this = this;
        
        // Clear existing wavesurfers
        this.wavesurfers.forEach(ws => {
            if (ws) ws.destroy();
        });
        this.wavesurfers = [];
        
        // xử lý khi click vào song trong playlist
        $$('.song-card').forEach((songCard, index) => {
            const playBtn = songCard.querySelector('.song-play-btn');
            const waveformVisual = songCard.querySelector('.waveform-visual');
            
            // Tạo WaveSurfer cho bài này
            if (waveformVisual) {
                const wavesurfer = this.createWaveSurfer(index, waveformVisual);
                this.wavesurfers[index] = wavesurfer;
            }
            
            // Click vào play button
            const playHandler = (e) => {
                e.stopPropagation(); // Prevent event bubbling
                
                console.log('Play button clicked for song index:', index);
                console.log('Song info:', {
                    name: _this.songs[index]?.name,
                    singer: _this.songs[index]?.singer,
                    type: _this.songs[index]?.dbType || _this.songs[index]?.type
                });
                console.log('Current index before:', _this.currentIndex);
                
                if (_this.currentIndex === index) {
                    // Nếu là bài hiện tại
                    console.log('Playing/pausing current song');
                    if (_this.isPlaying) {
                        audio.pause();
                    } else {
                        // Đảm bảo audio có thể phát
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.log('Audio play failed:', error);
                                // Reset UI state nếu play thất bại
                                _this.isPlaying = false;
                                _this.highlightCurrentSong();
                            });
                        }
                    }
                } else {
                    // Chuyển sang bài khác
                    console.log('Switching to new song, setting currentIndex to:', index);
                    _this.currentIndex = index;
                    _this.loadCurrentSong();
                    
                    // Đợi một chút để audio load xong
                    setTimeout(() => {
                        console.log('Attempting to play after loading');
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.log('Audio play failed:', error);
                                _this.isPlaying = false;
                                _this.highlightCurrentSong();
                            });
                        }
                    }, 100);
                }
                
                // Hiệu ứng click tạm thời
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
    initializeActionButtons: function() {
        const _this = this;
        
        // Heart/favorite buttons
        $$('.heart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                _this.toggleSongFavoriteNew(songIndex);
            });
        });

        // Share buttons
        $$('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                _this.shareSong(songIndex);
            });
        });

        // Download buttons
        $$('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                _this.downloadSong(songIndex);
            });
        });

        // Playlist buttons
        $$('.playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                _this.addSongToPlaylist(songIndex);
            });
        });

        // Delete buttons
        $$('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                _this.confirmDeleteSong(songIndex);
            });
        });
    },

    // New toggle favorite function without re-rendering
    async toggleSongFavoriteNew(songIndex) {
        const song = this.songs[songIndex];
        if (!song) return;

        try {
            const heartBtn = document.querySelector(`.heart-btn[data-song-index="${songIndex}"]`);
            const icon = heartBtn.querySelector('i');
            const favoriteTag = document.querySelector(`[data-index="${songIndex}"] .song-tag.favorite`);
            
            let isFavorite = false;
            
            // Check current favorite status and toggle
            if (this.isDatabaseOperational() && song.dbId) {
                const songId = song.dbId;
                const songType = song.dbType || 'original';
                isFavorite = await musicDB.isSongFavorite(songId, songType);
                
                if (isFavorite) {
                    await musicDB.removeFromFavorites(songId, songType);
                    showNotification('💔 Đã xóa khỏi yêu thích!', 'info');
                } else {
                    await musicDB.addToFavorites(songId, songType);
                    showNotification('💖 Đã thêm vào yêu thích!', 'success');
                }
            } else {
                // Fallback to localStorage
                isFavorite = this.checkIfSongIsLiked(song);
                
                if (isFavorite) {
                    this.removeFromFavorites(song);
                    showNotification('💔 Đã xóa khỏi yêu thích!', 'info');
                } else {
                    this.addToFavorites(song);
                    showNotification('💖 Đã thêm vào yêu thích!', 'success');
                }
            }
            
            // Update button UI based on new status
            const newFavoriteStatus = !isFavorite;
            if (newFavoriteStatus) {
                icon.className = 'fas fa-heart';
                heartBtn.classList.add('active');
                heartBtn.title = 'Bỏ yêu thích';
                
                // Add favorite tag if not exists
                if (!favoriteTag) {
                    const tagsContainer = document.querySelector(`[data-index="${songIndex}"] .song-tags`);
                    if (tagsContainer) {
                        const newTag = document.createElement('span');
                        newTag.className = 'song-tag favorite';
                        newTag.innerHTML = '<i class="fas fa-heart"></i> Yêu thích';
                        tagsContainer.appendChild(newTag);
                    }
                }
            } else {
                icon.className = 'far fa-heart';
                heartBtn.classList.remove('active');
                heartBtn.title = 'Yêu thích';
                
                // Remove favorite tag if exists
                if (favoriteTag) {
                    favoriteTag.remove();
                }
            }
            
            // Update dashboard like button if this is the current song
            if (songIndex === this.currentIndex && typeof updateLikeButton === 'function') {
                setTimeout(updateLikeButton, 100);
            }
             
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showNotification('❌ Có lỗi xảy ra khi thao tác yêu thích!', 'error');
        }
    },

    // Share song functionality
    shareSong: function(songIndex) {
        const song = this.songs[songIndex];
        if (!song) return;

        // Check if Web Share API is supported
        if (navigator.share) {
            navigator.share({
                title: song.name,
                text: `Nghe "${song.name}" by ${song.singer}`,
                url: window.location.href
            }).then(() => {
                showNotification('🔗 Đã chia sẻ bài hát!', 'success');
            }).catch((error) => {
                console.log('Error sharing:', error);
                this.fallbackShare(song);
            });
        } else {
            this.fallbackShare(song);
        }
    },

    // Fallback share functionality
    fallbackShare: function(song) {
        // Copy to clipboard
        const shareText = `Nghe "${song.name}" by ${song.singer} - ${window.location.href}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('📋 Đã sao chép link chia sẻ!', 'success');
            }).catch(() => {
                this.showShareModal(song);
            });
        } else {
            this.showShareModal(song);
        }
    },

    // Show share modal
    showShareModal: function(song) {
        const shareText = `Nghe "${song.name}" by ${song.singer} - ${window.location.href}`;
        
        const modal = document.createElement('div');
        modal.className = 'share-modal-overlay';
        modal.innerHTML = `
            <div class="share-modal">
                <div class="share-modal-header">
                    <h3>Chia sẻ bài hát</h3>
                    <button class="modal-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="share-modal-body">
                    <div class="song-share-info">
                        <img src="${song.image}" alt="${song.name}">
                        <div>
                            <h4>${song.name}</h4>
                            <p>${song.singer}</p>
                        </div>
                    </div>
                    <textarea readonly class="share-text">${shareText}</textarea>
                    <button class="copy-btn" onclick="navigator.clipboard.writeText('${shareText}').then(() => showNotification('📋 Đã sao chép!', 'success'))">
                        <i class="fas fa-copy"></i>
                        Sao chép
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 100);

        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        });
    },

    // Download song functionality
    downloadSong: function(songIndex) {
        const song = this.songs[songIndex];
        if (!song) return;

        try {
            // Create download link
            const link = document.createElement('a');
            link.href = song.music;
            link.download = `${song.name} - ${song.singer}.mp3`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification(`⬇️ Đang tải xuống "${song.name}"`, 'success');
        } catch (error) {
            console.error('Download error:', error);
            showNotification('❌ Không thể tải xuống bài hát này!', 'error');
        }
    },

    // Add song to playlist functionality
    addSongToPlaylist: function(songIndex) {
        const song = this.songs[songIndex];
        if (!song) return;

        // Show playlist selection modal
        this.showPlaylistModal(song, songIndex);
    },

    // Show playlist selection modal
    showPlaylistModal: function(song, songIndex) {
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

        // Handle close button
        const closeBtn = playlistModal.querySelector('.close-playlist-modal');
        closeBtn.addEventListener('click', () => {
            this.closePlaylistModal(playlistModal);
        });

        // Handle create new playlist
        const createBtn = playlistModal.querySelector('.create-playlist-btn');
        createBtn.addEventListener('click', () => {
            this.createNewPlaylist(song);
            this.closePlaylistModal(playlistModal);
        });

        // Handle add to existing playlist buttons
        $$('.add-to-playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playlistType = btn.dataset.playlist;
                this.addToExistingPlaylist(song, playlistType);
                this.closePlaylistModal(playlistModal);
            });
        });

        // Close on overlay click
        playlistModal.addEventListener('click', (e) => {
            if (e.target === playlistModal) {
                this.closePlaylistModal(playlistModal);
            }
        });
    },

    // Close playlist modal
    closePlaylistModal: function(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    },

    // Create new playlist
    createNewPlaylist: function(song) {
        const playlistName = prompt('Nhập tên playlist mới:');
        if (playlistName && playlistName.trim()) {
            try {
                // Get existing playlists from localStorage
                let playlists = JSON.parse(localStorage.getItem('userPlaylists') || '{}');
                
                // Create new playlist if it doesn't exist
                if (!playlists[playlistName]) {
                    playlists[playlistName] = [];
                }
                
                // Add song to playlist
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
                console.error('Error creating playlist:', error);
                showNotification('❌ Có lỗi khi tạo playlist!', 'error');
            }
        }
    },

    // Add to existing playlist
    addToExistingPlaylist: function(song, playlistType) {
        try {
            let message = '';
            
            switch (playlistType) {
                case 'favorites':
                    this.addToFavorites(song);
                    message = `💖 Đã thêm "${song.name}" vào yêu thích!`;
                    break;
                    
                case 'recently-played':
                    this.addToRecentlyPlayed(song);
                    message = `🕐 Đã thêm "${song.name}" vào phát gần đây!`;
                    break;
                    
                case 'my-music':
                    this.addToMyMusic(song);
                    message = `🎵 Đã thêm "${song.name}" vào nhạc của tôi!`;
                    break;
                    
                default:
                    message = `✅ Đã thêm "${song.name}" vào playlist!`;
            }
            
            showNotification(message, 'success');
        } catch (error) {
            console.error('Error adding to playlist:', error);
            showNotification('❌ Có lỗi khi thêm vào playlist!', 'error');
        }
    },

    // Add to recently played
    addToRecentlyPlayed: function(song) {
        let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
        
        // Remove if already exists
        recentlyPlayed = recentlyPlayed.filter(s => 
            !(s.name === song.name && s.singer === song.singer)
        );
        
        // Add to beginning
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
        
        // Keep only last 50 songs
        if (recentlyPlayed.length > 50) {
            recentlyPlayed = recentlyPlayed.slice(0, 50);
        }
        
        localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
    },

    // Add to my music
    addToMyMusic: function(song) {
        let myMusic = JSON.parse(localStorage.getItem('myMusic') || '[]');
        
        // Check if already exists
        const exists = myMusic.some(s => s.name === song.name && s.singer === song.singer);
        
        if (!exists) {
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
            
            localStorage.setItem('myMusic', JSON.stringify(myMusic));
        }
    },

    // Update favorite button icon in dropdown
    updateFavoriteButtonInDropdown: function(songIndex) {
        const song = this.songs[songIndex];
        if (!song) return;
        
        const favoriteBtn = document.querySelector(`#song-dropdown-${songIndex} .song-favorite-btn`);
        if (!favoriteBtn) return;
        
        const isLiked = this.checkIfSongIsLiked(song);
        const icon = favoriteBtn.querySelector('i');
        const text = favoriteBtn.querySelector('span');
        
        if (isLiked) {
            icon.className = 'fas fa-heart';
            text.textContent = 'Bỏ yêu thích';
            favoriteBtn.classList.add('active');
        } else {
            icon.className = 'far fa-heart';
            text.textContent = 'Yêu thích';
            favoriteBtn.classList.remove('active');
        }
    },

    // Helper functions for favorites (localStorage fallback)
    addToFavorites: function(song) {
        let favorites = JSON.parse(localStorage.getItem('favoriteSongs')) || [];
        
        // Check if already exists
        const exists = favorites.some(fav => fav.name === song.name && fav.singer === song.singer);
        
        if (!exists) {
            favorites.push({
                name: song.name,
                singer: song.singer,
                image: song.image,
                music: song.music,
                duration: song.duration,
                category: song.category,
                dbId: song.dbId,
                dbType: song.dbType,
                addedAt: new Date().toISOString()
            });
            localStorage.setItem('favoriteSongs', JSON.stringify(favorites));
        }
    },

    // Remove from favorites
    removeFromFavorites: function(song) {
        let favorites = JSON.parse(localStorage.getItem('favoriteSongs')) || [];
        favorites = favorites.filter(fav => !(fav.name === song.name && fav.singer === song.singer));
        localStorage.setItem('favoriteSongs', JSON.stringify(favorites));
    },

    // Check if song is in favorites
    checkIfSongIsLiked: function(song) {
        const favorites = JSON.parse(localStorage.getItem('favoriteSongs')) || [];
        return favorites.some(fav => fav.name === song.name && fav.singer === song.singer);
    },

    // Confirm delete song
    confirmDeleteSong: function(songIndex) {
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

        // Show dialog
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
    closeConfirmDialog: function(dialog) {
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
                audio.pause();
                this.isPlaying = false;
                
                // Move to next song if available
                if (this.songs.length > 1) {
                    if (songIndex === this.songs.length - 1) {
                        this.currentIndex = 0; // Go to first song if deleting last
                    }
                    // Current index stays the same if not deleting the last song
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
                    await musicDB.deleteUploadedSong(song.dbId);
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
                this.loadCurrentSong();
            }

            // Clean up blob URLs
            if (song.music && song.music.startsWith('blob:')) {
                URL.revokeObjectURL(song.music);
                console.log('Cleaned up blob URL for music');
            }
            if (song.image && song.image.startsWith('blob:')) {
                URL.revokeObjectURL(song.image);
                console.log('Cleaned up blob URL for image');
            }

            showNotification('✅ Đã xóa bài hát thành công!', 'success');
            
        } catch (error) {
            console.error('Error deleting song:', error);
            showNotification('❌ Có lỗi xảy ra khi xóa bài hát!', 'error');
        }
    },

    // Delete from memory and localStorage (fallback method)
    deleteFromMemoryAndLocalStorage: function(song, songIndex) {
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

    // Tạo thời gian ngẫu nhiên
    getRandomDuration: function() {
        const minutes = Math.floor(Math.random() * 8) + 2; // 2-9 phút
        const seconds = Math.floor(Math.random() * 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    // Lấy thời gian thực tế từ audio file
    updateSongDurations: function() {
        const _this = this;
        this.songs.forEach((song, index) => {
            const tempAudio = new Audio(song.music);
            tempAudio.addEventListener('loadedmetadata', function() {
                const duration = _this.formatTime(tempAudio.duration);
                // Cập nhật duration trong song object
                _this.songs[index].duration = duration;
                
                // Cập nhật hiển thị trên UI
                const waveformTime = document.querySelector(`[data-index="${index}"] .waveform-time`);
                if (waveformTime) {
                    waveformTime.textContent = `00:00-${duration}`;
                }
            });
        });
    },

    defineProperties: function() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        });
    },
    
    handleEvent: function() {
        const _this = this;
        const cdWidth = cd.offsetWidth;
        //xử lý CD quay / dừng
        const cdThumbAnimation = cdthumb.animate({
            transform: 'rotate(360deg)'
        }, {
            duration: 10000,
            iterations: Infinity,
            direction: 'normal'
        });
        cdThumbAnimation.pause();
        //xử lý phóng to cd
        document.onscroll = function() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const newcdWidth = cdWidth - scrollTop;

        cd.style.width = newcdWidth > 0 ? newcdWidth + 'px' : 0;
        cd.style.opacity = newcdWidth / cdWidth;
        
        // Xử lý hiển thị bottom player
        if (_this.dashboard) {
            const dashboardRect = _this.dashboard.getBoundingClientRect();
            const dashboardBottom = dashboardRect.bottom;
            
            // Nếu dashboard scroll ra khỏi viewport
            if (dashboardBottom <= 0) {
                _this.showBottomPlayer();
            } else {
                _this.hideBottomPlayer();
            }
        }
       }
       // xử lý khi click vào playlist
       playBTN.onclick = function() { 
            if(_this.isPlaying) {
                audio.pause();
            } else {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Audio play failed:', error);
                        // Reset state nếu không thể phát
                        _this.isPlaying = false;
                        player.classList.remove('playing');
                    });
                }
            }
       }
       // khi song đang phát
       audio.onplay = function() {
        _this.isPlaying = true;
        player.classList.add('playing');
        cdThumbAnimation.play();
        _this.updateBottomPlayerIcon();
        _this.highlightCurrentSong();
       }
       // khi song đang tạm dừng
       audio.onpause = function() {
        _this.isPlaying = false;
        player.classList.remove('playing');
        cdThumbAnimation.pause();
        _this.updateBottomPlayerIcon();
        _this.highlightCurrentSong();
       }
       //khi tiến độ bài hát thay đổi
       audio.ontimeupdate = function() {
        if(audio.duration) {
            const progressPercent = Math.floor(audio.currentTime / audio.duration * 100);
            progress.value = progressPercent;
            
            // Cập nhật bottom player
            _this.updateBottomPlayerTime();
            
            // Cập nhật waveform của bài hát hiện tại
            _this.updateCurrentWaveform();
            
            // Sync audio state để đảm bảo UI đúng
            _this.syncAudioState();
        }
        //khi click tua bài hát
        progress.onchange = function() {
            const seekTime = (progress.value / 100) * audio.duration;
            audio.currentTime = seekTime;
        }
       }
        // xử lý khi click vào nút next
        nextBTN.onclick = function() {
            if(_this.isRandom) {    
                _this.randomSong();
                audio.play();
            } else {
                _this.nextSong();
                audio.play();
            }
            // Hiệu ứng tạm thời
            nextBTN.classList.add('active');
            setTimeout(() => nextBTN.classList.remove('active'), 200);
        }
        // xử lý khi click vào nút prev
        prevBTN.onclick = function() {
            if(_this.isRandom) {
                _this.randomSong();
                audio.play();
            } else {
                _this.prevSong();
                audio.play();
            }
            // Hiệu ứng tạm thời
            prevBTN.classList.add('active');
            setTimeout(() => prevBTN.classList.remove('active'), 200);
        }
        // xử lý khi click vào nút random
        randomBTN.onclick = function() {
            _this.isRandom = !_this.isRandom;
            randomBTN.classList.toggle('active', _this.isRandom);
        }
        // xủ lý khi random song
        audio.onended = function() {
            if(_this.isRandom) {
                _this.randomSong();
                audio.play();
            } else {
                _this.nextSong();
                audio.play();
            }
        }
        // xử lý next song khi audio đã kết thúc
        audio.onended = function() {
            if(_this.isRandom) {
                _this.randomSong();
                audio.play();
            } else {
                _this.nextSong();
                audio.play();
            }
        }
        
        // xử lý khi audio bị lỗi
        audio.onerror = function() {
            console.log('Audio error occurred');
            _this.isPlaying = false;
            player.classList.remove('playing');
            _this.highlightCurrentSong();
            _this.updateBottomPlayerIcon();
        }
        
        // xử lý khi audio không thể load
        audio.onloadstart = function() {
            _this.isPlaying = false;
            player.classList.remove('playing');
            _this.highlightCurrentSong();
        }
        
        // xử lý khi audio đã sẵn sàng phát
        audio.oncanplay = function() {
            console.log('Audio ready to play');
        }
        
        // xử lý khi click tua bài hát
        progress.onchange = function() {
            const seekTime = (progress.value / 100) * audio.duration;
            audio.currentTime = seekTime;
        }
    },
    loadCurrentSong: function() {
        console.log('=== loadCurrentSong called ===');
        console.log('currentIndex:', this.currentIndex);
        console.log('Total songs:', this.songs.length);
        
        if (!this.currentSong) {
            console.error('No current song found!');
            return;
        }
        
        console.log('Loading song:', {
            name: this.currentSong.name,
            singer: this.currentSong.singer,
            music: this.currentSong.music.substring(0, 50) + '...',
            type: this.currentSong.dbType || this.currentSong.type
        });
        
        // Reset tất cả waveforms trước khi load bài mới
        this.resetAllWaveforms();

        header.textContent = this.currentSong.name;
        cdthumb.style.backgroundImage = '';
        cdthumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.music;

        console.log('Audio src set to:', audio.src.substring(0, 50) + '...');

        // Set current song data with database info
        this.currentSongData = this.currentSong;

        // Reset audio state
        this.isPlaying = false;
        player.classList.remove('playing');

        // Cập nhật bottom player
        this.updateBottomPlayer();
        
        // Cập nhật background
        this.updateBackground();
        
        // Cập nhật UI
        this.highlightCurrentSong();
        
        // Cập nhật like button cho bài hát mới
        setTimeout(() => {
            if (typeof updateLikeButton === 'function') {
                updateLikeButton();
            }
        }, 100);
        
        console.log('=== loadCurrentSong completed ===');
    },
    //next song
    nextSong: function() {
        this.currentIndex++;
        if(this.currentIndex >= this.songs.length) {
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
        // Highlight ô nhạc tương ứng
        this.highlightCurrentSong();
    },
    //prev song
    prevSong: function() {
        this.currentIndex--;
        if(this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1;
        }
        this.loadCurrentSong();
        // Highlight ô nhạc tương ứng
        this.highlightCurrentSong();
    },
    //random song
    randomSong: function() {
        let randomIndex
        do {
            randomIndex = Math.floor(Math.random() * this.songs.length);
        } while (randomIndex === this.currentIndex);
        this.currentIndex = randomIndex;
        this.loadCurrentSong();
        // Highlight ô nhạc tương ứng
        this.highlightCurrentSong();
    },
    // Highlight bài hát hiện tại trong playlist
    highlightCurrentSong: function() {
        $$('.song-card').forEach((songCard, index) => {
            const playBtn = songCard.querySelector('.song-play-btn i');
            
            if (!playBtn) return; // Skip if button not found
            
            if (index === this.currentIndex) {
                songCard.classList.add('active');
                // Cập nhật icon play/pause
                if (this.isPlaying) {
                    playBtn.className = 'fas fa-pause';
                } else {
                    playBtn.className = 'fas fa-play';
                }
            } else {
                songCard.classList.remove('active');
                // Reset icon về play
                playBtn.className = 'fas fa-play';
            }
        });
    },
    start: function() {
        this.defineProperties();
        this.render();
        this.handleEvent();
        this.loadCurrentSong();
        this.connectBottomPlayer();
        this.dashboard = $('.dashboard');
        
        // Cập nhật thời gian thực tế từ audio files
        this.updateSongDurations();
        
        // Initialize background on startup
        setTimeout(() => {
            this.updateBackground();
        }, 500);
    },

    // Cập nhật bottom player
    updateBottomPlayer: function() {
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

    // Kết nối bottom player controls
    connectBottomPlayer: function() {
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
                    audio.pause();
                } else {
                    audio.play();
                }
            };
        }
        
        // Previous button
        if (prevBtn) {
            prevBtn.onclick = function() {
                _this.prevSong();
                audio.play();
            };
        }
        
        // Next button  
        if (nextBtn) {
            nextBtn.onclick = function() {
                _this.nextSong();
                audio.play();
            };
        }
        
        // Progress bar click
        if (bottomProgress) {
            bottomProgress.onclick = function(e) {
                if (audio.duration) {
                    const rect = bottomProgress.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickPercent = (clickX / rect.width) * 100;
                    
                    audio.currentTime = (clickPercent / 100) * audio.duration;
                    progress.value = clickPercent;
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

    // Cập nhật icon play/pause trong bottom player
    updateBottomPlayerIcon: function() {
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

    // Cập nhật thời gian trong bottom player
    updateBottomPlayerTime: function() {
        const currentTimeEl = $('#current-time');
        const totalTimeEl = $('#total-time');
        const progressFill = $('.progress-fill');
        
        if (audio.currentTime && audio.duration) {
            const current = this.formatTime(audio.currentTime);
            const total = this.formatTime(audio.duration);
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            
            if (currentTimeEl) currentTimeEl.textContent = current;
            if (totalTimeEl) totalTimeEl.textContent = total;
            if (progressFill) progressFill.style.width = progressPercent + '%';
        }
    },

    // Hiển thị bottom player
    showBottomPlayer: function() {
        const bottomPlayer = $('#bottom-player');
        if (bottomPlayer) {
            bottomPlayer.classList.add('show');
            document.body.classList.add('bottom-player-active');
        }
    },

    // Ẩn bottom player
    hideBottomPlayer: function() {
        const bottomPlayer = $('#bottom-player');
        if (bottomPlayer) {
            bottomPlayer.classList.remove('show');
            document.body.classList.remove('bottom-player-active');
        }
    },

    // Format thời gian mm:ss
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Cập nhật thời gian hiển thị trên waveform
    updateWaveformTime: function(songIndex, currentTime, duration) {
        const waveformTime = document.querySelector(`[data-index="${songIndex}"] .waveform-time`);
        if (waveformTime && duration) {
            const current = this.formatTime(currentTime);
            const total = this.formatTime(duration);
            waveformTime.textContent = `${current}-${total}`;
        }
    },

    // Cập nhật waveform progress cho bài hát hiện tại
    updateCurrentWaveform: function() {
        if (audio.duration && this.wavesurfers[this.currentIndex]) {
            const progressPercent = audio.currentTime / audio.duration;
            const wavesurfer = this.wavesurfers[this.currentIndex];
            
            // Sync WaveSurfer với audio progress
            if (wavesurfer && !wavesurfer.isPlaying()) {
                wavesurfer.seekTo(progressPercent);
            }
            
            // Cập nhật thời gian hiển thị
            this.updateWaveformTime(this.currentIndex, audio.currentTime, audio.duration);
        }
    },

    // Reset waveform của tất cả bài hát
    resetAllWaveforms: function() {
        this.wavesurfers.forEach((wavesurfer, index) => {
            if (wavesurfer) {
                wavesurfer.seekTo(0);
                if (wavesurfer.isPlaying()) {
                    wavesurfer.pause();
                }
            }
        });
        
        // Reset thời gian hiển thị về 00:00-duration cho tất cả bài
        this.songs.forEach((song, index) => {
            this.updateWaveformTime(index, 0, this.parseDuration(song.duration));
        });
    },

    // Chuyển đổi duration string thành seconds
    parseDuration: function(durationStr) {
        const parts = durationStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    },

    // Tạo WaveSurfer instance cho mỗi bài hát
    createWaveSurfer: function(songIndex, container) {
        const _this = this;
        const song = this.songs[songIndex];
        
        if (!song || !container) return null;
        
        const wavesurfer = WaveSurfer.create({
            container: container,
            waveColor: 'rgba(255, 255, 255, 0.3)',
            progressColor: '#ec1f55',
            cursorColor: '#ff6b9d',
            barWidth: 2,
            barGap: 1,
            barRadius: 1,
            responsive: true,
            height: 40,
            normalize: true,
            backend: 'WebAudio',
            interact: true
        });
        
        // Load audio file
        wavesurfer.load(song.music);
        
        // Handle click to seek
        wavesurfer.on('click', function(progress) {
            _this.handleWaveSurferClick(songIndex, progress, wavesurfer);
        });
        
        // Update progress for current song
        wavesurfer.on('audioprocess', function() {
            if (songIndex === _this.currentIndex) {
                _this.updateWaveformTime(songIndex, wavesurfer.getCurrentTime(), wavesurfer.getDuration());
            }
        });
        
        wavesurfer.on('ready', function() {
            console.log(`WaveSurfer ready for song ${songIndex}`);
        });
        
        return wavesurfer;
    },

    // Xử lý click trên WaveSurfer
    handleWaveSurferClick: function(songIndex, progress, wavesurfer) {
        // Nếu là bài đang phát
        if (songIndex === this.currentIndex) {
            const seekTime = progress * audio.duration;
            audio.currentTime = seekTime;
            // Sync WaveSurfer với audio element
            const audioProgress = audio.currentTime / audio.duration;
            wavesurfer.seekTo(audioProgress);
        } else {
            // Chuyển sang bài này và seek
            this.currentIndex = songIndex;
            this.loadCurrentSong();
            
            setTimeout(() => {
                if (audio.duration) {
                    const seekTime = progress * audio.duration;
                    audio.currentTime = seekTime;
                    wavesurfer.seekTo(progress);
                }
                audio.play();
                this.highlightCurrentSong();
            }, 100);
        }
    },

    // Debug và sync audio state
    syncAudioState: function() {
        // Kiểm tra state thực tế của audio
        const actuallyPlaying = !audio.paused && !audio.ended && audio.currentTime > 0 && audio.readyState > 2;
        
        if (actuallyPlaying !== this.isPlaying) {
            console.log('State mismatch detected. Fixing...');
            this.isPlaying = actuallyPlaying;
            
            if (actuallyPlaying) {
                player.classList.add('playing');
            } else {
                player.classList.remove('playing');
            }
            
            this.highlightCurrentSong();
            this.updateBottomPlayerIcon();
        }
    },

    // Cập nhật background với hình ảnh bài hát hiện tại
    updateBackground: function() {
        if (!this.currentSong || !this.currentSong.image) return;
        
        // Toggle between background images for cross-fade
        const currentBg = document.getElementById(`background-image-${this.currentBackgroundIndex}`);
        const nextIndex = this.currentBackgroundIndex === 1 ? 2 : 1;
        const nextBg = document.getElementById(`background-image-${nextIndex}`);
        
        if (!currentBg || !nextBg) return;
        
        // Preload the new image
        const img = new Image();
        img.onload = () => {
            // Set new image to the inactive background
            nextBg.style.backgroundImage = `url('${this.currentSong.image}')`;
            
            if (!currentBg.classList.contains('active')) {
                // First time - just show the first background
                currentBg.classList.add('active');
            } else {
                // Cross-fade: show next background, hide current
                nextBg.classList.add('active');
                setTimeout(() => {
                    currentBg.classList.remove('active');
                    this.currentBackgroundIndex = nextIndex;
                }, 600); // Wait for transition to complete
            }
        };
        img.src = this.currentSong.image;
    },

    // Add uploaded song to database and playlist
    async addUploadedSongToPlaylist(file, audioURL, songData = null) {
        console.log('addUploadedSongToPlaylist called with:', {
            fileName: file.name,
            fileSize: file.size,
            audioURL: audioURL.substring(0, 50) + '...',
            songData: songData ? songData.name : 'null'
        });
        
        try {
            // Try database first if available
            if (this.isDatabaseOperational()) {
                console.log('Using database for storage');
                
                // Use provided song data or create from file
                const song = songData || {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    singer: 'Local Upload',
                    image: 'assets/img/default-song.jpg',
                    music: audioURL,
                    duration: '00:00',
                    category: 'Unknown',
                    type: 'uploaded'
                };
                
                console.log('Saving song to database:', song.name);
                
                // Save to database with enhanced metadata
                const songId = await musicDB.addUploadedSong(file, audioURL, song);
                console.log('Song saved to database with ID:', songId);
                
                // Remember current song before reloading
                const currentSongName = this.currentSong ? this.currentSong.name : null;
                
                // Reload songs from database to get latest data with proper dbId
                await this.loadSongsFromDatabase();
                console.log('Songs reloaded from database, total:', this.songs.length);
                
                // Adjust currentIndex since new song was added at the beginning
                if (currentSongName) {
                    // Find the previous current song in the new array
                    const newIndex = this.songs.findIndex(song => song.name === currentSongName);
                    if (newIndex !== -1) {
                        this.currentIndex = newIndex;
                        console.log('Adjusted currentIndex to:', this.currentIndex);
                    }
                } else {
                    // If no previous song, set to the newly uploaded song (index 0)
                    this.currentIndex = 0;
                    console.log('Set currentIndex to 0 for new upload');
                }
                
                // Re-render playlist with new songs
                this.render();
                console.log('Playlist re-rendered');
                
                // Load current song to refresh UI
                this.loadCurrentSong();
                
                return songId;
            } else {
                // Fallback: Use localStorage and in-memory storage
                console.log('Database not available, using localStorage fallback');
                
                const newSong = songData || {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    singer: 'Local Upload',
                    image: 'assets/img/default-song.jpg',
                    music: audioURL,
                    duration: '00:00',
                    category: 'Unknown',
                    dbId: Date.now(), // Fallback ID using timestamp
                    dbType: 'uploaded'
                };
                
                // Adjust currentIndex before adding new song since unshift adds to beginning
                if (this.songs.length > 0) {
                    this.currentIndex++;
                    console.log('Adjusted currentIndex for fallback mode to:', this.currentIndex);
                }
                
                // Add to songs array
                this.songs.unshift(newSong);
                
                // Save to localStorage as backup
                try {
                    const uploadedSongs = JSON.parse(localStorage.getItem('uploadedSongs') || '[]');
                    uploadedSongs.unshift({
                        ...newSong,
                        uploadDate: new Date().toISOString(),
                        fileSize: file.size,
                        fileType: file.type
                    });
                    localStorage.setItem('uploadedSongs', JSON.stringify(uploadedSongs));
                    console.log('Song saved to localStorage');
                } catch (error) {
                    console.warn('Failed to save to localStorage:', error);
                }
                
                // Re-render playlist
                this.render();
                console.log('Song added using fallback method');
                
                // Load current song to refresh UI
                this.loadCurrentSong();
                
                return newSong.dbId;
            }
        } catch (error) {
            console.error('Error in addUploadedSongToPlaylist:', error);
            
            // Re-throw with user-friendly message
            if (error.message.includes('Invalid audio file')) {
                throw new Error('Vui lòng chọn file âm thanh hợp lệ (MP3, WAV, M4A...)');
            } else if (error.message.includes('File too large')) {
                throw new Error('File quá lớn! Vui lòng chọn file dưới 50MB');
            } else if (error.message.includes('Database')) {
                throw new Error('Lỗi database: ' + error.message);
            } else {
                throw new Error('Có lỗi xảy ra khi lưu bài hát: ' + error.message);
            }
        }
    },
}

// Initialize app with database
app.initializeApp();

// Dashboard Menu functionality
const dashboardMenuBtn = document.getElementById('dashboard-menu-btn');
const dashboardDropdown = document.getElementById('dashboard-dropdown');
const uploadSongBtn = document.getElementById('upload-song');
const likeSongBtn = document.getElementById('like-song');
const songUploadInput = document.getElementById('song-upload-input');

// Toggle dropdown menu
let isDropdownOpen = false;

function toggleDashboardDropdown() {
    isDropdownOpen = !isDropdownOpen;
    
    if (isDropdownOpen) {
        dashboardDropdown.classList.add('show');
        dashboardMenuBtn.classList.add('active');
        
        // Update like button state when opening dropdown
        updateLikeButton();
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
            handleSongUpload();
            toggleDashboardDropdown(); // Close dropdown after opening upload modal
        });
    }

    // Like song button click
    if (likeSongBtn) {
        likeSongBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLikeSong();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', closeDropdownOutside);
    
    // Update like button when song changes
    if (audio) {
        audio.addEventListener('loadstart', () => {
            setTimeout(updateLikeButton, 500);
        });
    }
}

// Upload song functionality
function handleSongUpload() {
    showUploadModal();
}

// Show upload modal
function showUploadModal() {
    const uploadModal = document.getElementById('upload-modal');
    if (uploadModal) {
        uploadModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Reset form
        resetUploadForm();
    }
}

// Hide upload modal
function hideUploadModal() {
    const uploadModal = document.getElementById('upload-modal');
    if (uploadModal) {
        uploadModal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Reset form after animation
        setTimeout(() => {
            resetUploadForm();
        }, 300);
    }
}

// Reset upload form
function resetUploadForm() {
    const form = document.getElementById('upload-song-form');
    const audioFileDisplay = document.getElementById('audio-file-display');
    const imagePreview = document.getElementById('image-preview');
    const progressSection = document.getElementById('upload-progress');
    
    if (form) {
        form.reset();
    }
    
    // Reset audio file display
    if (audioFileDisplay) {
        audioFileDisplay.classList.remove('has-file');
        audioFileDisplay.innerHTML = `
            <i class="fas fa-upload"></i>
            <span>Chọn file MP3, WAV, M4A...</span>
        `;
    }
    
    // Reset image preview
    if (imagePreview) {
        imagePreview.innerHTML = `
            <div class="image-placeholder">
                <i class="fas fa-camera"></i>
                <span>Chọn ảnh bìa bài hát</span>
            </div>
        `;
    }
    
    // Hide progress
    if (progressSection) {
        progressSection.style.display = 'none';
    }
}

// Handle upload form submission
async function handleUploadFormSubmit(event) {
    event.preventDefault();
    
    console.log('Upload form submitted');
    
    const formData = new FormData(event.target);
    const audioFile = document.getElementById('audio-file-input').files[0];
    const imageFile = document.getElementById('image-file-input').files[0];
    const songName = document.getElementById('song-name-input').value.trim();
    const artistName = document.getElementById('artist-name-input').value.trim();
    const genre = document.getElementById('genre-input').value;
    
    console.log('Form data:', {
        audioFile: audioFile ? audioFile.name : 'None',
        imageFile: imageFile ? imageFile.name : 'None',
        songName,
        artistName,
        genre
    });
    
    // Validation
    if (!audioFile) {
        showNotification('❌ Vui lòng chọn file âm thanh!', 'error');
        return;
    }
    
    if (!songName) {
        showNotification('❌ Vui lòng nhập tên bài hát!', 'error');
        return;
    }
    
    if (!artistName) {
        showNotification('❌ Vui lòng nhập tên ca sĩ!', 'error');
        return;
    }
    
    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
        console.error('Invalid file type:', audioFile.type);
        showNotification('❌ Vui lòng chọn file âm thanh hợp lệ!', 'error');
        return;
    }
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (audioFile.size > maxSize) {
        console.error('File too large:', audioFile.size);
        showNotification('❌ File quá lớn! Vui lòng chọn file dưới 50MB.', 'error');
        return;
    }
    
    try {
        console.log('Starting upload process...');
        
        // Show progress
        showUploadProgress();
        
        // Create URLs for files
        const audioUrl = URL.createObjectURL(audioFile);
        let imageUrl = 'assets/img/default-song.jpg'; // Default image
        
        console.log('Created audio URL:', audioUrl);
        
        if (imageFile) {
            if (imageFile.type.startsWith('image/')) {
                imageUrl = URL.createObjectURL(imageFile);
                console.log('Created image URL:', imageUrl);
            } else {
                showNotification('⚠️ File ảnh không hợp lệ, sử dụng ảnh mặc định.', 'info');
            }
        }
        
        // Simulate upload progress
        await simulateUploadProgress();
        
        // Create song object with complete metadata
        const newSong = {
            name: songName,
            singer: artistName,
            image: imageUrl,
            music: audioUrl,
            duration: '00:00',
            category: genre || 'Unknown',
            type: 'uploaded'
        };
        
        console.log('Song object created:', newSong);
        
        // Add to database and playlist (with enhanced error handling and fallback)
        const songId = await app.addUploadedSongToPlaylist(audioFile, audioUrl, newSong);
        
        console.log('Upload successful, song ID:', songId);
        
        // Success notification with song details
        showNotification(`✅ Đã tải lên "${songName}" by ${artistName} thành công!`, 'success');
        hideUploadModal();
        
        // Close dashboard dropdown if open
        if (isDropdownOpen) {
            toggleDashboardDropdown();
        }
        
        // Log success for debugging
        console.log('Upload completed successfully:', {
            songId,
            name: songName,
            artist: artistName,
            fileSize: audioFile.size,
            fileType: audioFile.type,
            audioUrl: audioUrl
        });
        
    } catch (error) {
        console.error('Upload error details:', error);
        console.error('Error stack:', error.stack);
        
        // Show specific error message from database
        const errorMessage = error.message || 'Có lỗi xảy ra khi tải bài hát!';
        showNotification(`❌ ${errorMessage}`, 'error');
        
        hideUploadProgress();
    }
}

// Show upload progress
function showUploadProgress() {
    const progressSection = document.getElementById('upload-progress');
    const submitBtn = document.getElementById('submit-upload');
    
    if (progressSection) {
        progressSection.style.display = 'block';
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>Đang tải lên...</span>
        `;
    }
}

// Hide upload progress
function hideUploadProgress() {
    const progressSection = document.getElementById('upload-progress');
    const submitBtn = document.getElementById('submit-upload');
    const progressFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressSection) {
        progressSection.style.display = 'none';
    }
    
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <i class="fas fa-upload"></i>
            <span>Tải lên</span>
        `;
    }
    
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    
    if (progressText) {
        progressText.textContent = 'Đang tải lên... 0%';
    }
}

// Simulate upload progress
function simulateUploadProgress() {
    return new Promise((resolve) => {
        const progressFill = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 95) progress = 95;
            
            if (progressFill) {
                progressFill.style.width = progress + '%';
            }
            
            if (progressText) {
                progressText.textContent = `Đang tải lên... ${Math.round(progress)}%`;
            }
            
            if (progress >= 95) {
                clearInterval(interval);
                
                // Complete the progress
                setTimeout(() => {
                    if (progressFill) progressFill.style.width = '100%';
                    if (progressText) progressText.textContent = 'Hoàn thành! 100%';
                    
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }, 300);
            }
        }, 200);
    });
}

// Handle file input changes
function initializeUploadModal() {
    const audioFileInput = document.getElementById('audio-file-input');
    const imageFileInput = document.getElementById('image-file-input');
    const audioFileDisplay = document.getElementById('audio-file-display');
    const imagePreview = document.getElementById('image-preview');
    const uploadForm = document.getElementById('upload-song-form');
    const closeModalBtn = document.getElementById('close-upload-modal');
    const cancelBtn = document.getElementById('cancel-upload');
    const songNameInput = document.getElementById('song-name-input');
    
    // Audio file input change
    if (audioFileInput && audioFileDisplay) {
        audioFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                audioFileDisplay.classList.add('has-file');
                audioFileDisplay.innerHTML = `
                    <i class="fas fa-music"></i>
                    <span>${file.name}</span>
                `;
                
                // Auto-fill song name if empty
                if (songNameInput && !songNameInput.value) {
                    const fileName = file.name.replace(/\.[^/.]+$/, "");
                    songNameInput.value = fileName;
                }
            }
        });
    }
    
    // Image file input change
    if (imageFileInput && imagePreview) {
        imageFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadFormSubmit);
    }
    
    // Close modal buttons
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideUploadModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideUploadModal);
    }
    
    // Close modal on overlay click
    const uploadModal = document.getElementById('upload-modal');
    if (uploadModal) {
        uploadModal.addEventListener('click', function(e) {
            if (e.target === uploadModal) {
                hideUploadModal();
            }
        });
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);

    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// Initialize like button when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    // Wait a bit for app to initialize
    setTimeout(() => {
        updateLikeButton();
        initializeDashboardMenu();
        
        // Debug database state
        debugDatabaseState();
        
        // Show database readiness to user
        if (app.isDatabaseOperational()) {
            console.log('✅ Database ready for uploads');
        } else {
            console.warn('⚠️ Database not ready, uploads may fail');
        }
    }, 2000); // Increased timeout to ensure database is ready
    
    // Initialize upload modal
    initializeUploadModal();
});

// Like song functionality
let isCurrentSongLiked = false;

function toggleLikeSong() {
    isCurrentSongLiked = !isCurrentSongLiked;
    
    const currentSong = app.currentSong;
    
    if (isCurrentSongLiked) {
        likeSongBtn.classList.add('liked');
        likeSongBtn.querySelector('span').textContent = 'Đã yêu thích';
        likeSongBtn.querySelector('i').className = 'fas fa-heart';
        
        // Add to favorites (localStorage)
        addToFavorites(currentSong);
        showNotification('💖 Đã thêm vào yêu thích!', 'success');
    } else {
        likeSongBtn.classList.remove('liked');
        likeSongBtn.querySelector('span').textContent = 'Yêu thích';
        likeSongBtn.querySelector('i').className = 'far fa-heart';
        
        // Remove from favorites
        removeFromFavorites(currentSong);
        showNotification('💔 Đã xóa khỏi yêu thích!', 'info');
    }
    
    // Close dropdown
    toggleDashboardDropdown();
}

// Favorites management (localStorage)
function addToFavorites(song) {
    let favorites = JSON.parse(localStorage.getItem('favoriteSongs')) || [];
    
    // Check if already exists
    const exists = favorites.some(fav => fav.name === song.name && fav.singer === song.singer);
    
    if (!exists) {
        favorites.push({
            name: song.name,
            singer: song.singer,
            image: song.image,
            music: song.music,
            duration: song.duration,
            category: song.category,
            dbId: song.dbId,
            dbType: song.dbType,
            addedAt: new Date().toISOString()
        });
        localStorage.setItem('favoriteSongs', JSON.stringify(favorites));
    }
}

function removeFromFavorites(song) {
    let favorites = JSON.parse(localStorage.getItem('favoriteSongs')) || [];
    favorites = favorites.filter(fav => !(fav.name === song.name && fav.singer === song.singer));
    localStorage.setItem('favoriteSongs', JSON.stringify(favorites));
}

function checkIfSongIsLiked(song) {
    if (!song) return false;
    const favorites = JSON.parse(localStorage.getItem('favoriteSongs')) || [];
    return favorites.some(fav => fav.name === song.name && fav.singer === song.singer);
}

// Update like button when song changes
function updateLikeButton() {
    if (app.currentSong && likeSongBtn) {
        isCurrentSongLiked = checkIfSongIsLiked(app.currentSong);
        
        if (isCurrentSongLiked) {
            likeSongBtn.classList.add('liked');
            likeSongBtn.querySelector('span').textContent = 'Đã yêu thích';
            likeSongBtn.querySelector('i').className = 'fas fa-heart';
        } else {
            likeSongBtn.classList.remove('liked');
            likeSongBtn.querySelector('span').textContent = 'Yêu thích';
            likeSongBtn.querySelector('i').className = 'far fa-heart';
        }
    }
}

// Debug database state
function debugDatabaseState() {
    console.log('=== Database Debug Info ===');
    console.log('app.isDatabaseReady:', app.isDatabaseReady);
    console.log('musicDB exists:', !!musicDB);
    console.log('musicDB.db exists:', musicDB && !!musicDB.db);
    console.log('app.isDatabaseOperational():', app.isDatabaseOperational());
    console.log('Total songs in app:', app.songs.length);
    
    if (musicDB && musicDB.db) {
        console.log('Database name:', musicDB.dbName);
        console.log('Database version:', musicDB.dbVersion);
        console.log('Database object stores:', Array.from(musicDB.db.objectStoreNames));
    } else {
        console.log('🔄 Running in FALLBACK MODE (using localStorage)');
        
        // Check localStorage data
        try {
            const uploadedSongs = JSON.parse(localStorage.getItem('uploadedSongs') || '[]');
            console.log('Uploaded songs in localStorage:', uploadedSongs.length);
            
            uploadedSongs.forEach((song, index) => {
                console.log(`  ${index + 1}. ${song.name} by ${song.singer}`);
            });
        } catch (error) {
            console.warn('Error reading localStorage:', error);
        }
    }
    
    // Check song types in app
    const originalSongs = app.songs.filter(s => s.dbType !== 'uploaded' && s.type !== 'uploaded').length;
    const uploadedSongs = app.songs.filter(s => s.dbType === 'uploaded' || s.type === 'uploaded').length;
    console.log('Original songs:', originalSongs);
    console.log('Uploaded songs:', uploadedSongs);
    
    // List all songs with their types
    console.log('\n=== All Songs ===');
    app.songs.forEach((song, index) => {
        console.log(`${index}. "${song.name}" by ${song.singer} - Type: ${song.dbType || song.type || 'original'} - ID: ${song.dbId || 'none'}`);
    });
    
    console.log('=== End Debug Info ===');
}

// Test delete functionality
function testDeleteSong(songIndex) {
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
}

// Test song switching
function testSwitchSong(songIndex) {
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
    app.loadCurrentSong();
    console.log('After switch - currentIndex:', app.currentIndex);
}

// Test dropdown functionality
function testDropdownFunctions(songIndex = 0) {
    console.log('=== Testing Dropdown Functions ===');
    const song = app.songs[songIndex];
    if (!song) {
        console.error('Song not found at index:', songIndex);
        return;
    }
    
    console.log('Testing with song:', {
        index: songIndex,
        name: song.name,
        singer: song.singer,
        type: song.dbType || song.type,
        isFavorite: app.checkIfSongIsLiked(song)
    });
    
    // Test favorite toggle
    console.log('Testing favorite toggle...');
    app.toggleSongFavorite(songIndex);
    
    // Test playlist functionality
    console.log('Testing playlist functionality...');
    app.addSongToPlaylist(songIndex);
}

// Test playlist storage
function testPlaylistStorage() {
    console.log('=== Testing Playlist Storage ===');
    
    // Check localStorage data
    const favorites = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    const playlists = JSON.parse(localStorage.getItem('userPlaylists') || '{}');
    const recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
    const myMusic = JSON.parse(localStorage.getItem('myMusic') || '[]');
    
    console.log('Favorites:', favorites.length, 'songs');
    console.log('User Playlists:', Object.keys(playlists).length, 'playlists');
    console.log('Recently Played:', recentlyPlayed.length, 'songs');
    console.log('My Music:', myMusic.length, 'songs');
    
    favorites.forEach((song, index) => {
        console.log(`  Favorite ${index + 1}: ${song.name} by ${song.singer}`);
    });
    
    Object.keys(playlists).forEach(playlistName => {
        console.log(`  Playlist "${playlistName}":`, playlists[playlistName].length, 'songs');
    });
}

// Make debug functions globally available
window.debugDatabase = debugDatabaseState;
window.testDelete = testDeleteSong;
window.switchSong = testSwitchSong;
window.testDropdown = testDropdownFunctions;
window.testPlaylists = testPlaylistStorage;
    