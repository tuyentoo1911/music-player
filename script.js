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
const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    wavesurfers: [], // Array to store WaveSurfer instances
    songs: [
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
            name: 'Supernatural ',
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
        },
      
            
    ],

    render: function() {
        const htmls = this.songs.map((song, index) => {
            const isFirst = index === 0;
            return `
            <div class="song-card" data-index="${index}">
                <div class="song-header">
                    <div class="song-artwork" style="background-image: url('${song.image}')"></div>
                    <div class="song-info">
                        <div class="song-title">
                            ${song.name}
                            ${isFirst ? '<button class="follow-btn">FOLLOW</button>' : ''}
                        </div>
                        <div class="song-artist">${song.singer}</div>
                    </div>
                    <div class="song-actions">
                        <button class="action-btn play-count">
                            <i class="fas fa-play"></i>
                            <span>${Math.floor(Math.random() * 1000)}</span>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                </div>
                
                <div class="waveform-section">
                    <div class="waveform-controls">
                        <button class="song-play-btn">
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
                    <span class="song-tag">Music</span>
                    ${index === 1 ? '<span class="song-tag">pop</span>' : ''}
                    ${index === 2 ? '<span class="song-tag">Podcast</span>' : ''}
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
                
                if (_this.currentIndex === index) {
                    // Nếu là bài hiện tại
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
                    _this.currentIndex = index;
                    _this.loadCurrentSong();
                    
                    // Đợi một chút để audio load xong
                    setTimeout(() => {
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
        // Reset tất cả waveforms trước khi load bài mới
        this.resetAllWaveforms();

        header.textContent = this.currentSong.name;
        cdthumb.style.backgroundImage = '';
        cdthumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.music;

        // Reset audio state
        this.isPlaying = false;
        player.classList.remove('playing');

        // Cập nhật bottom player
        this.updateBottomPlayer();
        
        // Cập nhật UI
        this.highlightCurrentSong();
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
}

app.start();
    