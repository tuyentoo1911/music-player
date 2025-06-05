// Module Trình phát nhạc chính
import { $, $$, formatTime, updateWaveformTime, syncAudioState } from './utils.js';

// Các element DOM
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

// Trạng thái player
let currentIndex = 0;
let isPlaying = false;
let isRandom = false;
let isRepeat = false;
let wavesurfers = [];
let currentBackgroundIndex = 1;
let songs = [];
let currentSongData = null;

// Tải bài hát hiện tại
function loadCurrentSong() {
    if (!songs.length) {
        return;
    }
    
    // Đảm bảo index hợp lệ
    if (currentIndex < 0 || currentIndex >= songs.length) {
        currentIndex = 0;
    }
    
    const song = songs[currentIndex];
    if (!song) {
        return;
    }
    
    // Reset tất cả waveform trước khi tải bài mới
    resetAllWaveforms();

    header.textContent = song.name;
    cdthumb.style.backgroundImage = '';
    cdthumb.style.backgroundImage = `url('${song.image}')`;
    audio.src = song.music;

    // Thiết lập dữ liệu bài hát hiện tại với thông tin database
    currentSongData = song;

    // Reset trạng thái audio
    isPlaying = false;
    player.classList.remove('playing');

    // Cập nhật UI
    highlightCurrentSong();
    
    // Cập nhật background với ảnh bài hát hiện tại
    updateBackground();
    
    // Cập nhật bottom player nếu đang hiển thị
    if (typeof app !== 'undefined' && app.updateBottomPlayer) {
        app.updateBottomPlayer();
    }
}

// Bài hát tiếp theo
function nextSong() {
    if (isRandom) {
        currentIndex = Math.floor(Math.random() * songs.length);
    } else {
        currentIndex++;
        if (currentIndex >= songs.length) {
            currentIndex = 0;
        }
    }
    loadCurrentSong();
    highlightCurrentSong();
}

// Bài hát trước đó
function prevSong() {
    if (isRandom) {
        currentIndex = Math.floor(Math.random() * songs.length);
    } else {
        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = songs.length - 1;
        }
    }
    loadCurrentSong();
    highlightCurrentSong();
}

// Bài hát ngẫu nhiên
function randomSong() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * songs.length);
    } while (randomIndex === currentIndex && songs.length > 1);
    currentIndex = randomIndex;
    loadCurrentSong();
    highlightCurrentSong();
}

// Làm nổi bật bài hát hiện tại trong playlist
function highlightCurrentSong() {
    $$('.song-card').forEach((songCard, index) => {
        const playBtn = songCard.querySelector('.song-play-btn i');
        
        if (!playBtn) return; // Bỏ qua nếu không tìm thấy button
        
        if (index === currentIndex) {
            songCard.classList.add('active');
            // Cập nhật icon play/pause
            if (isPlaying) {
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
}

// Xử lý events
function handleEvent(updateBottomPlayerIcon, updateBottomPlayerTime, updateCurrentWaveform) {
    const cdWidth = cd.offsetWidth;
    // Xử lý xoay CD
    const cdThumbAnimation = cdthumb.animate({
        transform: 'rotate(360deg)'
    }, {
        duration: 10000,
        iterations: Infinity,
        direction: 'normal'
    });
    cdThumbAnimation.pause();

    // Xử lý zoom CD khi scroll
    document.onscroll = function() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const newcdWidth = cdWidth - scrollTop;

        cd.style.width = newcdWidth > 0 ? newcdWidth + 'px' : 0;
        cd.style.opacity = newcdWidth / cdWidth;
        
        // Hiển thị/ẩn bottom player dựa trên scroll
        if (typeof app !== 'undefined' && app.showBottomPlayer && app.hideBottomPlayer) {
            if (scrollTop > 50) { // Hiện khi scroll xuống 50px
                app.showBottomPlayer();
            } else {
                app.hideBottomPlayer();
            }
        }
    };

    // Click nút play
    playBTN.onclick = function() { 
        if (isPlaying) {
            audio.pause();
        } else {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    isPlaying = false;
                    player.classList.remove('playing');
                });
            }
        }
    };

    // Khi bài hát đang phát
    audio.onplay = function() {
        isPlaying = true;
        player.classList.add('playing');
        cdThumbAnimation.play();
        updateBottomPlayerIcon();
        highlightCurrentSong();
    };

    // Khi bài hát bị tạm dừng
    audio.onpause = function() {
        isPlaying = false;
        player.classList.remove('playing');
        cdThumbAnimation.pause();
        updateBottomPlayerIcon();
        highlightCurrentSong();
    };

    // Khi tiến trình bài hát thay đổi
    audio.ontimeupdate = function() {
        if (audio.duration) {
            const progressPercent = Math.floor(audio.currentTime / audio.duration * 100);
            progress.value = progressPercent;
            
            // Cập nhật bottom player
            updateBottomPlayerTime();
            
            // Cập nhật waveform hiện tại
            updateCurrentWaveform();
        }
    };

    // Tua nhạc
    progress.onchange = function() {
        const seekTime = audio.duration * (progress.value / 100);
        audio.currentTime = seekTime;
    };

    // Next button
    nextBTN.onclick = nextSong;
    
    // Previous button
    prevBTN.onclick = prevSong;
    
    // Random button
    randomBTN.onclick = function() {
        isRandom = !isRandom;
        randomBTN.classList.toggle('active', isRandom);
    };

    // Khi bài hát kết thúc
    audio.onended = function() {
        if (isRepeat) {
            audio.currentTime = 0;
            audio.play();
        } else {
            nextSong();
            audio.play();
        }
    };

    // Xử lý lỗi audio
    audio.onerror = function(e) {
        isPlaying = false;
        player.classList.remove('playing');
        cdThumbAnimation.pause();
        highlightCurrentSong();
    };
}

// Đặt bài hát hiện tại
function setCurrentSong(songIndex) {
    if (songIndex >= 0 && songIndex < songs.length) {
        currentIndex = songIndex;
        loadCurrentSong();
    }
}

// Phát/tạm dừng
function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
}

// Cập nhật waveform hiện tại
function updateCurrentWaveform() {
    if (wavesurfers[currentIndex] && audio.duration) {
        const progress = audio.currentTime / audio.duration;
        wavesurfers[currentIndex].seekTo(progress);
        
        // Cập nhật thời gian waveform
        updateWaveformTime(currentIndex, audio.currentTime, audio.duration, formatTime);
    }
}

// Reset tất cả waveforms
function resetAllWaveforms() {
    wavesurfers.forEach(wavesurfer => {
        if (wavesurfer) {
            wavesurfer.seekTo(0);
        }
    });
}

// Parse duration string
function parseDuration(durationStr) {
    const parts = durationStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Xử lý click WaveSurfer
function handleWaveSurferClick(songIndex, progress, wavesurfer) {
    if (songIndex === currentIndex && audio.duration) {
        const seekTime = progress * audio.duration;
        audio.currentTime = seekTime;
        
        // Cập nhật waveform
        wavesurfer.seekTo(progress);
        
        // Phát nhạc nếu chưa phát
        if (!isPlaying) {
            audio.play();
        }
    } else if (songIndex !== currentIndex) {
        // Chuyển sang bài hát được click
        currentIndex = songIndex;
        loadCurrentSong();
        
        // Đợi audio load xong rồi seek
        audio.addEventListener('loadeddata', function seekAfterLoad() {
            if (audio.duration) {
                const seekTime = progress * audio.duration;
                audio.currentTime = seekTime;
                wavesurfer.seekTo(progress);
                audio.play();
            }
            audio.removeEventListener('loadeddata', seekAfterLoad);
        });
    }
}

// Cập nhật background
function updateBackground() {
    // Sử dụng ảnh của bài hát hiện tại làm background
    const currentSong = songs[currentIndex];
    if (!currentSong || !currentSong.image) return;
    
    // Cập nhật background cho dynamic background container
    const backgroundImg1 = document.getElementById('background-image-1');
    const backgroundImg2 = document.getElementById('background-image-2');
    
    if (backgroundImg1 && backgroundImg2) {
        // Kiểm tra background nào đang active
        const activeImg = document.querySelector('.background-image.active');
        let inactiveImg;
        
        if (activeImg === backgroundImg1) {
            inactiveImg = backgroundImg2;
        } else if (activeImg === backgroundImg2) {
            inactiveImg = backgroundImg1;
        } else {
            // Nếu không có active, đặt img1 làm active
            backgroundImg1.classList.add('active');
            inactiveImg = backgroundImg2;
        }
        
        // Thiết lập background mới từ ảnh bài hát hiện tại
        inactiveImg.style.backgroundImage = `url('${currentSong.image}')`;
        
        // Chuyển đổi active class
        if (activeImg) {
            activeImg.classList.remove('active');
        }
        inactiveImg.classList.add('active');
        
        // Debug: Hiển thị thông báo tạm thời
        const debugMsg = document.createElement('div');
        debugMsg.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;border-radius:5px;z-index:9999;font-size:12px;';
        debugMsg.textContent = `Background: ${currentSong.name} - ${currentSong.singer}`;
        document.body.appendChild(debugMsg);
        setTimeout(() => debugMsg.remove(), 2000);
    }
}

// Getters và Setters
function getCurrentIndex() { return currentIndex; }
function setCurrentIndex(index) { currentIndex = index; }
function getCurrentSong() { return songs[currentIndex]; }
function getSongs() { return songs; }
function setSongs(newSongs) { songs = newSongs; }
function getIsPlaying() { return isPlaying; }
function setIsPlaying(playing) { isPlaying = playing; }
function getWavesurfers() { return wavesurfers; }
function setWavesurfers(newWavesurfers) { wavesurfers = newWavesurfers; }
function getCurrentSongData() { return currentSongData; }
function getAudio() { return audio; }
function getPlayer() { return player; }

export {
    loadCurrentSong,
    nextSong,
    prevSong,
    randomSong,
    highlightCurrentSong,
    handleEvent,
    setCurrentSong,
    togglePlayPause,
    updateCurrentWaveform,
    resetAllWaveforms,
    parseDuration,
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
    getCurrentSongData,
    getAudio,
    getPlayer
}; 