// Module Tải lên
import { showNotification } from './notifications.js';

// Chức năng tải lên bài hát
function handleSongUpload() {
    showUploadModal();
}

// Hiển thị modal tải lên
function showUploadModal() {
    const uploadModal = document.getElementById('upload-modal');
    if (uploadModal) {
        uploadModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Reset form
        resetUploadForm();
    }
}

// Ẩn modal tải lên
function hideUploadModal() {
    const uploadModal = document.getElementById('upload-modal');
    if (uploadModal) {
        console.log('Hiding upload modal');
        uploadModal.classList.remove('show');
        uploadModal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset form sau animation
        setTimeout(() => {
            resetUploadForm();
        }, 300);
        
        // Also hide any upload progress
        hideUploadProgress();
    }
}

// Reset form tải lên
function resetUploadForm() {
    const form = document.getElementById('upload-song-form');
    const audioFileDisplay = document.getElementById('audio-file-display');
    const imagePreview = document.getElementById('image-preview');
    const progressSection = document.getElementById('upload-progress');
    
    if (form) {
        form.reset();
    }
    
    // Reset hiển thị file audio
    if (audioFileDisplay) {
        audioFileDisplay.classList.remove('has-file');
        audioFileDisplay.innerHTML = `
            <i class="fas fa-upload"></i>
            <span>Chọn file MP3, WAV, M4A...</span>
        `;
    }
    
    // Reset preview ảnh
    if (imagePreview) {
        imagePreview.innerHTML = `
            <div class="image-placeholder">
                <i class="fas fa-camera"></i>
                <span>Chọn ảnh bìa bài hát</span>
            </div>
        `;
    }
    
    // Ẩn progress
    if (progressSection) {
        progressSection.style.display = 'none';
    }
}

// Xử lý submit form tải lên
async function handleUploadFormSubmit(event) {
    event.preventDefault();
    
    const audioFile = document.getElementById('audio-file-input').files[0];
    const imageFile = document.getElementById('image-file-input').files[0];
    const songName = document.getElementById('song-name-input').value.trim();
    const artistName = document.getElementById('artist-name-input').value.trim();
    const genre = document.getElementById('genre-input').value;
    
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
    
    // Validate loại file
    if (!audioFile.type.startsWith('audio/')) {
        showNotification('❌ Vui lòng chọn file âm thanh hợp lệ!', 'error');
        return;
    }
    
    // Validate kích thước file (tối đa 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (audioFile.size > maxSize) {
        showNotification('❌ File quá lớn! Vui lòng chọn file dưới 50MB.', 'error');
        return;
    }
    
    try {
        // Hiển thị progress
        showUploadProgress();
        
        // Tạo URL cho files
        const audioUrl = URL.createObjectURL(audioFile);
        let imageUrl = 'assets/img/default-song.jpg'; // Ảnh mặc định
        
        if (imageFile) {
            if (imageFile.type.startsWith('image/')) {
                imageUrl = URL.createObjectURL(imageFile);
            } else {
                showNotification('⚠️ File ảnh không hợp lệ, sử dụng ảnh mặc định.', 'info');
            }
        }
        
        // Mô phỏng tiến trình tải lên
        await simulateUploadProgress();
        
        // Tạo object bài hát với metadata đầy đủ
        const newSong = {
            name: songName,
            singer: artistName,
            image: imageUrl,
            music: audioUrl,
            duration: '00:00',
            category: genre || 'Unknown',
            dbType: 'uploaded'
        };
        
        // Thêm vào database và playlist (với xử lý lỗi nâng cao và fallback)
        const songId = await window.app.addUploadedSongToPlaylist(audioFile, audioUrl, newSong);
        
        // Thông báo thành công với chi tiết bài hát
        showNotification(`✅ Đã tải lên "${songName}" by ${artistName} thành công!`, 'success');
        hideUploadModal();
        
    } catch (error) {
        // Hiển thị thông báo lỗi cụ thể từ database
        const errorMessage = error.message || 'Có lỗi xảy ra khi tải bài hát!';
        showNotification(`❌ ${errorMessage}`, 'error');
        
        hideUploadProgress();
    }
}

// Hiển thị tiến trình tải lên
function showUploadProgress() {
    const progressSection = document.getElementById('upload-progress');
    const submitBtn = document.getElementById('submit-upload');
    
    if (progressSection) {
        progressSection.style.display = 'block';
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="loading-spinner"></span>
            Đang tải lên...
        `;
    }
}

// Ẩn tiến trình tải lên
function hideUploadProgress() {
    const progressSection = document.getElementById('upload-progress');
    const submitBtn = document.getElementById('submit-upload');
    const progressBar = document.getElementById('progress-bar-fill');
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
    
    // Reset progress bar
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    
    if (progressText) {
        progressText.textContent = '0%';
    }
}

// Mô phỏng tiến trình tải lên
function simulateUploadProgress() {
    return new Promise((resolve) => {
        const progressBar = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        
        console.log('Progress elements found:', {
            progressBar: !!progressBar,
            progressText: !!progressText
        });
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5; // Tăng 5-20% mỗi lần
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                if (progressBar) {
                    progressBar.style.width = '100%';
                    console.log('Progress bar set to 100%');
                }
                if (progressText) {
                    progressText.textContent = '100%';
                    console.log('Progress text set to 100%');
                }
                
                // Hoàn tất sau một chút delay
                setTimeout(resolve, 500);
            } else {
                if (progressBar) {
                    progressBar.style.width = progress + '%';
                }
                if (progressText) {
                    progressText.textContent = Math.round(progress) + '%';
                }
                console.log('Progress updated:', Math.round(progress) + '%');
            }
        }, 200);
    });
}

// Khởi tạo modal tải lên
function initializeUploadModal() {
    const uploadModal = document.getElementById('upload-modal');
    if (!uploadModal) return;
    
    // Xử lý nút đóng
    const closeBtn = uploadModal.querySelector('#close-upload-modal');
    const cancelBtn = uploadModal.querySelector('#cancel-upload');
    
    if (closeBtn) {
        console.log('Adding close button listener');
        closeBtn.addEventListener('click', hideUploadModal);
    }
    
    if (cancelBtn) {
        console.log('Adding cancel button listener');
        cancelBtn.addEventListener('click', hideUploadModal);
    }
    
    // Xử lý click overlay
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            hideUploadModal();
        }
    });
    
    // Xử lý file input cho audio
    const audioInput = document.getElementById('audio-file-input');
    const audioDisplay = document.getElementById('audio-file-display');
    
    if (audioInput && audioDisplay) {
        audioInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                audioDisplay.classList.add('has-file');
                audioDisplay.innerHTML = `
                    <i class="fas fa-music"></i>
                    <span>${file.name}</span>
                    <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                `;
                
                // Tự động điền tên bài hát nếu chưa có
                const songNameInput = document.getElementById('song-name-input');
                if (songNameInput && !songNameInput.value) {
                    const fileName = file.name.replace(/\.[^/.]+$/, ''); // Bỏ extension
                    songNameInput.value = fileName;
                }
            }
        });
        
        // Click để chọn file
        audioDisplay.addEventListener('click', () => {
            audioInput.click();
        });
    }
    
    // Xử lý file input cho ảnh
    const imageInput = document.getElementById('image-file-input');
    const imagePreview = document.getElementById('image-preview');
    
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <div class="image-overlay">
                            <i class="fas fa-edit"></i>
                            <span>Thay đổi ảnh</span>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Click để chọn ảnh
        imagePreview.addEventListener('click', () => {
            imageInput.click();
        });
    }
    
    // Xử lý form submit
    const uploadForm = document.getElementById('upload-song-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadFormSubmit);
    }
}

export {
    handleSongUpload,
    showUploadModal,
    hideUploadModal,
    resetUploadForm,
    handleUploadFormSubmit,
    showUploadProgress,
    hideUploadProgress,
    simulateUploadProgress,
    initializeUploadModal
}; 