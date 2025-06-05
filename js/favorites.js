// Module Quản lý Yêu thích
import { showNotification } from './notifications.js';
import { isDatabaseOperational, getDatabaseInstance } from './database.js';

// Toggle yêu thích bài hát (phiên bản mới không cần re-render)
async function toggleSongFavoriteNew(songIndex, songs, updateLikeButton) {
    const song = songs[songIndex];
    if (!song) return;

    try {
        const heartBtn = document.querySelector(`.heart-btn[data-song-index="${songIndex}"]`);
        const icon = heartBtn.querySelector('i');
        const favoriteTag = document.querySelector(`[data-index="${songIndex}"] .song-tag.favorite`);
        
        // Thêm animation click
        heartBtn.classList.add('clicking');
        setTimeout(() => heartBtn.classList.remove('clicking'), 400);
        
        let isFavorite = false;
        
        // Kiểm tra trạng thái yêu thích hiện tại và toggle
        if (isDatabaseOperational() && song.dbId) {
            const musicDB = getDatabaseInstance();
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
            // Fallback về localStorage
            isFavorite = checkIfSongIsLiked(song);
            
            if (isFavorite) {
                removeFromFavorites(song);
                showNotification('💔 Đã xóa khỏi yêu thích!', 'info');
            } else {
                addToFavorites(song);
                showNotification('💖 Đã thêm vào yêu thích!', 'success');
            }
        }
        
        // Cập nhật UI button dựa trên trạng thái mới với animation
        const newFavoriteStatus = !isFavorite;
        
        // Thêm delay transition cho animation mượt
        setTimeout(() => {
            if (newFavoriteStatus) {
                icon.className = 'fas fa-heart';
                heartBtn.classList.add('active');
                heartBtn.title = 'Bỏ yêu thích';
                
                // Kích hoạt animation trái tim bay
                createFloatingHearts(heartBtn);
                
                // Thêm tag yêu thích nếu chưa có
                if (!favoriteTag) {
                    const tagsContainer = document.querySelector(`[data-index="${songIndex}"] .song-tags`);
                    if (tagsContainer) {
                        const newTag = document.createElement('span');
                        newTag.className = 'song-tag favorite';
                        newTag.innerHTML = '<i class="fas fa-heart"></i> Yêu thích';
                        newTag.style.opacity = '0';
                        newTag.style.transform = 'scale(0.8)';
                        tagsContainer.appendChild(newTag);
                        
                        // Animate hiện tag
                        setTimeout(() => {
                            newTag.style.transition = 'all 0.3s ease';
                            newTag.style.opacity = '1';
                            newTag.style.transform = 'scale(1)';
                        }, 100);
                    }
                }
            } else {
                icon.className = 'far fa-heart';
                heartBtn.classList.remove('active');
                heartBtn.title = 'Yêu thích';
                
                // Xóa tag yêu thích với animation nếu có
                if (favoriteTag) {
                    favoriteTag.style.transition = 'all 0.3s ease';
                    favoriteTag.style.opacity = '0';
                    favoriteTag.style.transform = 'scale(0.8)';
                    setTimeout(() => favoriteTag.remove(), 300);
                }
            }
        }, 200);
        
        // Cập nhật button like trong dashboard nếu đây là bài hát hiện tại
        if (typeof updateLikeButton === 'function') {
            setTimeout(updateLikeButton, 100);
        }
         
    } catch (error) {
        showNotification('❌ Có lỗi xảy ra khi thao tác yêu thích!', 'error');
    }
}

// Tạo animation trái tim bay
function createFloatingHearts(button) {
    // Tạo nhiều trái tim với thời gian khác nhau
    const heartCount = 4;
    const heartSymbols = ['💖', '❤️', '💕', '💗'];
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = heartSymbols[i % heartSymbols.length];
            heart.className = 'floating-heart';
            
            // Lấy vị trí button so với viewport
            const rect = button.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // Đặt trái tim ở giữa button
            heart.style.left = (rect.left + scrollLeft + rect.width / 2 - 6) + 'px';
            heart.style.top = (rect.top + scrollTop - 10) + 'px';
            
            // Thêm chuyển động ngang ngẫu nhiên
            const randomX = (Math.random() - 0.5) * 40;
            heart.style.setProperty('--random-x', randomX + 'px');
            
            // Animation tùy chỉnh với chuyển động ngẫu nhiên
            heart.style.animation = `floatingHeartEffect 1.5s ease-out forwards`;
            heart.style.transform = `translateX(${randomX}px)`;
            
            document.body.appendChild(heart);
            
            // Dọn dẹp sau animation
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 1600);
        }, i * 150);
    }
    
    // Thêm hiệu ứng particle vào chính button
    const button_rect = button.getBoundingClientRect();
    createHeartParticles(button_rect);
}

// Tạo particle trái tim xung quanh button
function createHeartParticles(buttonRect) {
    const particleCount = 6;
    const particles = ['✨', '💫', '⭐', '💝'];
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.innerHTML = particles[Math.floor(Math.random() * particles.length)];
            particle.style.position = 'absolute';
            particle.style.fontSize = '10px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '999';
            particle.style.color = '#ff6b9d';
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // Vị trí ngẫu nhiên xung quanh button
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 30 + Math.random() * 20;
            const x = buttonRect.left + scrollLeft + buttonRect.width / 2 + Math.cos(angle) * radius;
            const y = buttonRect.top + scrollTop + buttonRect.height / 2 + Math.sin(angle) * radius;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.transition = 'all 1s ease-out';
            particle.style.opacity = '1';
            particle.style.transform = 'scale(0.5)';
            
            document.body.appendChild(particle);
            
            // Animate particle
            setTimeout(() => {
                particle.style.opacity = '0';
                particle.style.transform = `scale(0) translateY(-40px) translateX(${(Math.random() - 0.5) * 30}px)`;
            }, 100);
            
            // Xóa particle
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1100);
        }, i * 100);
    }
}

// Hàm helper cho yêu thích (fallback localStorage)
function addToFavorites(song) {
    let favorites = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    const songKey = song.name + '_' + song.singer;
    if (!favorites.includes(songKey)) {
        favorites.push(songKey);
        localStorage.setItem('favoriteSongs', JSON.stringify(favorites));
    }
}

function removeFromFavorites(song) {
    let favorites = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    const songKey = song.name + '_' + song.singer;
    favorites = favorites.filter(fav => fav !== songKey);
    localStorage.setItem('favoriteSongs', JSON.stringify(favorites));
}

function checkIfSongIsLiked(song) {
    const favorites = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    const songKey = song.name + '_' + song.singer;
    return favorites.includes(songKey);
}

// Cập nhật button yêu thích trong dropdown
async function updateFavoriteButtonInDropdown(songIndex, songs) {
    const heartBtn = document.querySelector(`.heart-btn[data-song-index="${songIndex}"]`);
    if (!heartBtn) return;
    
    const song = songs[songIndex];
    if (!song) return;
    
    const icon = heartBtn.querySelector('i');
    let isFavorite = false;
    
    try {
        if (isDatabaseOperational() && song.dbId) {
            const musicDB = getDatabaseInstance();
            const songId = song.dbId;
            const songType = song.dbType || 'original';
            isFavorite = await musicDB.isSongFavorite(songId, songType);
        } else {
            // Fallback về localStorage
            isFavorite = checkIfSongIsLiked(song);
        }
        
        // Cập nhật UI dựa trên trạng thái
        if (isFavorite) {
            icon.className = 'fas fa-heart';
            heartBtn.classList.add('active');
            heartBtn.title = 'Bỏ yêu thích';
        } else {
            icon.className = 'far fa-heart';
            heartBtn.classList.remove('active');
            heartBtn.title = 'Yêu thích';
        }
        
    } catch (error) {
        // Lỗi khi cập nhật button yêu thích
    }
}

// Toggle like bài hát từ dashboard
async function toggleLikeSong(currentSong, likeSongBtn, toggleDashboardDropdown) {
    if (!currentSong) return;
    
    try {
        let isLiked = false;
        
        if (isDatabaseOperational() && currentSong.dbId) {
            const musicDB = getDatabaseInstance();
            const songId = currentSong.dbId;
            const songType = currentSong.dbType || 'original';
            isLiked = await musicDB.isSongFavorite(songId, songType);
            
            if (isLiked) {
                await musicDB.removeFromFavorites(songId, songType);
                showNotification('💔 Đã xóa khỏi yêu thích!', 'info');
            } else {
                await musicDB.addToFavorites(songId, songType);
                showNotification('💖 Đã thêm vào yêu thích!', 'success');
            }
        } else {
            // Fallback về localStorage
            isLiked = checkIfSongIsLiked(currentSong);
            
            if (isLiked) {
                removeFromFavorites(currentSong);
                showNotification('💔 Đã xóa khỏi yêu thích!', 'info');
            } else {
                addToFavorites(currentSong);
                showNotification('💖 Đã thêm vào yêu thích!', 'success');
            }
        }
        
        // Đóng dropdown
        toggleDashboardDropdown();
        
    } catch (error) {
        showNotification('❌ Có lỗi xảy ra!', 'error');
    }
}

// Cập nhật button like trong dashboard
async function updateLikeButton(currentSong, likeSongBtn) {
    if (!currentSong || !likeSongBtn) return;
    
    try {
        let isLiked = false;
        
        if (isDatabaseOperational() && currentSong.dbId) {
            const musicDB = getDatabaseInstance();
            const songId = currentSong.dbId;
            const songType = currentSong.dbType || 'original';
            isLiked = await musicDB.isSongFavorite(songId, songType);
        } else {
            // Fallback về localStorage
            isLiked = checkIfSongIsLiked(currentSong);
        }
        
        const icon = likeSongBtn.querySelector('i');
        if (isLiked) {
            icon.className = 'fas fa-heart';
            likeSongBtn.title = 'Bỏ yêu thích';
        } else {
            icon.className = 'far fa-heart';
            likeSongBtn.title = 'Yêu thích bài hát';
        }
        
    } catch (error) {
        // Lỗi khi cập nhật button like
    }
}

export {
    toggleSongFavoriteNew,
    createFloatingHearts,
    createHeartParticles,
    addToFavorites,
    removeFromFavorites,
    checkIfSongIsLiked,
    updateFavoriteButtonInDropdown,
    toggleLikeSong,
    updateLikeButton
}; 