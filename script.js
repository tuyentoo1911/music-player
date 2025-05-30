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
    songs: [
        {
            name: 'Blue',
            singer: 'yung kai',
            image: 'assets/img/Song 1.jpeg',
            music: 'assets/music/Song 1.mp3'
        },
        {
            name: 'Cupid',
            singer: 'FIFTY FIFTY (피프티프티)',
            image: 'assets/img/Song 2.jpeg',
            music: 'assets/music/Song 2.mp3'
        },
        {
            name: 'Trap Royalty',
            singer: 'Singer 3',
            image: 'assets/img/Song 3.jpeg',
            music: 'assets/music/Song 3.mp3'
        },
        {
            name: 'Supernatural ',
            singer: 'Ariana Grande',
            image: 'assets/img/Song 4.jpeg',
            music: 'assets/music/Song 4.mp3'
        },
        {
            name: 'End Of Beginning',
            singer: 'Djo',
            image: 'assets/img/Song 5.jpeg',
            music: 'assets/music/Song 5.mp3'
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
                    <button class="song-play-btn">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="waveform-container">
                        <div class="waveform-progress"></div>
                        <div class="waveform-time">00:00-${this.getRandomDuration()}</div>
                    </div>
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
    },

    // Tạo thời gian ngẫu nhiên
    getRandomDuration: function() {
        const minutes = Math.floor(Math.random() * 8) + 2; // 2-9 phút
        const seconds = Math.floor(Math.random() * 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
                player.classList.remove('playing');
                _this.isPlaying = false;
            } else {
                audio.play();
                player.classList.add('playing');
                _this.isPlaying = true;
            }
       }
       // khi song đang phát
       audio.onplay = function() {
        _this.isPlaying = true;
        player.classList.add('playing');
        cdThumbAnimation.play();
        _this.updateBottomPlayerIcon();
       }
       // khi song đang tạm dừng
       audio.onpause = function() {
        _this.isPlaying = false;
        player.classList.remove('playing');
        cdThumbAnimation.pause();
        _this.updateBottomPlayerIcon();
       }
       //khi tiến độ bài hát thay đổi
       audio.ontimeupdate = function() {
        if(audio.duration) {
            const progressPercent = Math.floor(audio.currentTime / audio.duration * 100);
            progress.value = progressPercent;
            
            // Cập nhật bottom player
            _this.updateBottomPlayerTime();
        }
        //khi click tua bài hát
        progress.onchange = function() {
            const seekTime = (progress.value / 100) * audio.duration;
            audio.currentTime = seekTime;
        }
       }
        // xử lý khi click vào song trong playlist
        $$('.song-card').forEach((songCard, index) => {
            const playBtn = songCard.querySelector('.song-play-btn');
            const waveformContainer = songCard.querySelector('.waveform-container');
            
            // Click vào play button hoặc waveform
            const playHandler = () => {
                app.currentIndex = index;
                app.loadCurrentSong();
                audio.play();
                
                // Highlight bài hát đang phát
                app.highlightCurrentSong();
                
                // Hiệu ứng click tạm thời
                songCard.style.transform = 'scale(0.98)';
                songCard.style.transition = 'transform 0.1s ease';
                setTimeout(() => {
                    songCard.style.transform = 'scale(1)';
                }, 100);
            };
            
            if (playBtn) playBtn.onclick = playHandler;
            if (waveformContainer) waveformContainer.onclick = playHandler;
        });

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
        
    },
    loadCurrentSong: function() {

        header.textContent = this.currentSong.name;
        cdthumb.style.backgroundImage = '';
        cdthumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.music;

        // Cập nhật bottom player
        this.updateBottomPlayer();
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
            if (index === this.currentIndex) {
                songCard.classList.add('active');
            } else {
                songCard.classList.remove('active');
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
}

app.start();
    