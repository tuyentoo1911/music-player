// Module Hàm Tiện ích

// Shortcuts cho DOM selector
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Định dạng thời gian từ giây thành mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Tạo thời lượng ngẫu nhiên
function getRandomDuration() {
    const minutes = Math.floor(Math.random() * 8) + 2; // 2-9 phút
    const seconds = Math.floor(Math.random() * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Chuyển đổi chuỗi thời lượng thành giây
function parseDuration(durationStr) {
    const parts = durationStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Cập nhật thời lượng bài hát từ file audio thực tế
function updateSongDurations(songs, formatTime) {
    songs.forEach((song, index) => {
        const tempAudio = new Audio(song.music);
        tempAudio.addEventListener('loadedmetadata', function() {
            const duration = formatTime(tempAudio.duration);
            // Cập nhật thời lượng trong object bài hát
            songs[index].duration = duration;
            
            // Cập nhật hiển thị UI
            const waveformTime = document.querySelector(`[data-index="${index}"] .waveform-time`);
            if (waveformTime) {
                waveformTime.textContent = `00:00-${duration}`;
            }
        });
    });
}

// Cập nhật hiển thị thời gian waveform
function updateWaveformTime(songIndex, currentTime, duration, formatTime) {
    const waveformTime = document.querySelector(`[data-index="${songIndex}"] .waveform-time`);
    if (waveformTime && duration) {
        const current = formatTime(currentTime);
        const total = formatTime(duration);
        waveformTime.textContent = `${current}-${total}`;
    }
}

// Định nghĩa properties cho app object
function defineProperties(app) {
    Object.defineProperty(app, 'currentSong', {
        get: function() {
            return this.songs[this.currentIndex];
        }
    });
}

// Tạo WaveSurfer instance
function createWaveSurfer(songIndex, container, songs, handleWaveSurferClick) {
    const song = songs[songIndex];
    
    if (!song || !container) return null;
    
    if (typeof WaveSurfer === 'undefined') {
        return null;
    }
    
    try {
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
        
        // Tải file audio
        wavesurfer.load(song.music);
        
        // Xử lý click để seek
        wavesurfer.on('click', function(progress) {
            handleWaveSurferClick(songIndex, progress, wavesurfer);
        });
        
        // Cập nhật progress cho bài hát hiện tại
        wavesurfer.on('audioprocess', function() {
            // Sẽ được xử lý bởi music player
        });
        
        wavesurfer.on('ready', function() {
            // WaveSurfer đã sẵn sàng
        });
        
        return wavesurfer;
    } catch (error) {
        return null;
    }
}

// Đồng bộ trạng thái audio
function syncAudioState(isPlaying, audio, player, highlightCurrentSong, updateBottomPlayerIcon) {
    // Kiểm tra trạng thái thực tế của audio
    const actuallyPlaying = !audio.paused && !audio.ended && audio.currentTime > 0 && audio.readyState > 2;
    
    if (actuallyPlaying !== isPlaying) {
        isPlaying = actuallyPlaying;
        
        if (actuallyPlaying) {
            player.classList.add('playing');
        } else {
            player.classList.remove('playing');
        }
        
        highlightCurrentSong();
        updateBottomPlayerIcon();
    }
    
    return isPlaying;
}

// Dọn dẹp blob URLs
function cleanupBlobUrls(song) {
    if (song.music && song.music.startsWith('blob:')) {
        URL.revokeObjectURL(song.music);
    }
    if (song.image && song.image.startsWith('blob:')) {
        URL.revokeObjectURL(song.image);
    }
}

export {
    $,
    $$,
    formatTime,
    getRandomDuration,
    parseDuration,
    updateSongDurations,
    updateWaveformTime,
    defineProperties,
    createWaveSurfer,
    syncAudioState,
    cleanupBlobUrls
}; 