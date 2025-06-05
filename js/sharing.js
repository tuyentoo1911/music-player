// Module Chia sẻ
import { showNotification } from './notifications.js';

// Chức năng chia sẻ bài hát
function shareSong(songIndex, songs) {
    const song = songs[songIndex];
    if (!song) return;

    // Hiển thị modal chia sẻ nâng cao với khả năng chỉnh sửa
    showEnhancedShareModal(song);
}

// Modal chia sẻ nâng cao với chỉnh sửa link
function showEnhancedShareModal(song) {
    const defaultShareText = `Nghe "${song.name}" by ${song.singer} - ${window.location.href}`;
    
    const modal = document.createElement('div');
    modal.className = 'share-modal-overlay';
    modal.innerHTML = `
        <div class="share-modal enhanced">
            <div class="share-modal-header">
                <h3>
                    <i class="fas fa-share-alt"></i>
                    Chia sẻ bài hát
                </h3>
                <button class="modal-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="share-modal-body">
                <div class="song-share-info">
                    <img src="${song.image}" alt="${song.name}" onerror="this.src='assets/img/default-song.jpg'">
                    <div>
                        <h4>${song.name}</h4>
                        <p>${song.singer}</p>
                        ${song.duration ? `<span class="song-duration-share">⏱️ ${song.duration}</span>` : ''}
                    </div>
                </div>
                
                <div class="share-options">
                    <div class="share-tab-buttons">
                        <button class="share-tab-btn active" data-tab="text">
                            <i class="fas fa-edit"></i>
                            Chỉnh sửa text
                        </button>
                        <button class="share-tab-btn" data-tab="quick">
                            <i class="fas fa-zap"></i>
                            Chia sẻ nhanh
                        </button>
                    </div>
                    
                    <div class="share-tab-content">
                        <div class="share-tab-panel active" id="text-tab">
                            <div class="input-group">
                                <label>
                                    <i class="fas fa-music"></i>
                                    Tên bài hát
                                </label>
                                <input type="text" class="share-input" id="share-song-name" value="${song.name}">
                            </div>
                            <div class="input-group">
                                <label>
                                    <i class="fas fa-user"></i>
                                    Ca sĩ
                                </label>
                                <input type="text" class="share-input" id="share-artist-name" value="${song.singer}">
                            </div>
                            <div class="input-group">
                                <label>
                                    <i class="fas fa-link"></i>
                                    Link chia sẻ
                                </label>
                                <input type="text" class="share-input" id="share-custom-link" value="${window.location.href}" placeholder="Nhập link tùy chỉnh...">
                            </div>
                            <div class="input-group">
                                <label>
                                    <i class="fas fa-comment"></i>
                                    Tin nhắn tùy chỉnh
                                </label>
                                <textarea class="share-textarea" id="share-custom-message" placeholder="Thêm tin nhắn cá nhân...">${defaultShareText}</textarea>
                            </div>
                        </div>
                        
                        <div class="share-tab-panel" id="quick-tab">
                            <div class="quick-share-buttons">
                                <button class="quick-share-btn" data-type="web-share">
                                    <i class="fas fa-share"></i>
                                    Chia sẻ hệ thống
                                </button>
                                <button class="quick-share-btn" data-type="copy-link">
                                    <i class="fas fa-copy"></i>
                                    Sao chép link
                                </button>
                                <button class="quick-share-btn" data-type="copy-text">
                                    <i class="fas fa-clipboard"></i>
                                    Sao chép text
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="share-preview">
                    <label>
                        <i class="fas fa-eye"></i>
                        Xem trước
                    </label>
                    <div class="share-preview-content" id="share-preview"></div>
                </div>
            </div>
            
            <div class="share-modal-actions">
                <button class="cancel-share-btn">
                    <i class="fas fa-times"></i>
                    Hủy
                </button>
                <button class="copy-share-btn">
                    <i class="fas fa-copy"></i>
                    Sao chép
                </button>
                <button class="send-share-btn">
                    <i class="fas fa-paper-plane"></i>
                    Chia sẻ
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Khởi tạo chức năng modal chia sẻ
    initializeShareModal(modal, song);
    
    setTimeout(() => modal.classList.add('show'), 100);
}

// Khởi tạo chức năng modal chia sẻ
function initializeShareModal(modal, song) {
    // Chuyển đổi tab
    const tabButtons = modal.querySelectorAll('.share-tab-btn');
    const tabPanels = modal.querySelectorAll('.share-tab-panel');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            modal.querySelector(`#${tabId}-tab`).classList.add('active');
        });
    });
    
    // Cập nhật preview khi input thay đổi
    const inputs = modal.querySelectorAll('.share-input, .share-textarea');
    const updatePreview = () => {
        const songName = modal.querySelector('#share-song-name').value;
        const artistName = modal.querySelector('#share-artist-name').value;
        const customLink = modal.querySelector('#share-custom-link').value;
        const customMessage = modal.querySelector('#share-custom-message').value;
        
        const preview = modal.querySelector('#share-preview');
        const previewText = customMessage || `Nghe "${songName}" by ${artistName} - ${customLink}`;
        preview.textContent = previewText;
    };
    
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });
    
    // Cập nhật preview ban đầu
    updatePreview();
    
    // Nút chia sẻ nhanh
    const quickShareButtons = modal.querySelectorAll('.quick-share-btn');
    quickShareButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            handleQuickShare(type, song, modal);
        });
    });
    
    // Nút hành động modal
    const cancelBtn = modal.querySelector('.cancel-share-btn');
    const copyBtn = modal.querySelector('.copy-share-btn');
    const sendBtn = modal.querySelector('.send-share-btn');
    
    cancelBtn.addEventListener('click', () => {
        closeShareModal(modal);
    });
    
    copyBtn.addEventListener('click', () => {
        copyShareContent(modal);
    });
    
    sendBtn.addEventListener('click', () => {
        sendShare(modal, song);
    });
    
    // Đóng modal khi click nút X hoặc overlay
    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => {
        closeShareModal(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeShareModal(modal);
        }
    });
}

// Xử lý chia sẻ nhanh
function handleQuickShare(type, song, modal) {
    const shareText = `Nghe "${song.name}" by ${song.singer} - ${window.location.href}`;
    
    switch (type) {
        case 'web-share':
            if (navigator.share) {
                navigator.share({
                    title: `${song.name} - ${song.singer}`,
                    text: shareText,
                    url: window.location.href
                }).then(() => {
                    showNotification('✅ Đã chia sẻ thành công!', 'success');
                    closeShareModal(modal);
                }).catch(() => {
                    showNotification('❌ Không thể chia sẻ!', 'error');
                });
            } else {
                showNotification('❌ Trình duyệt không hỗ trợ chia sẻ!', 'error');
            }
            break;
            
        case 'copy-link':
            navigator.clipboard.writeText(window.location.href).then(() => {
                showNotification('📋 Đã sao chép link!', 'success');
            }).catch(() => {
                showNotification('❌ Không thể sao chép link!', 'error');
            });
            break;
            
        case 'copy-text':
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('📋 Đã sao chép text!', 'success');
            }).catch(() => {
                showNotification('❌ Không thể sao chép text!', 'error');
            });
            break;
    }
}

// Sao chép nội dung chia sẻ
function copyShareContent(modal) {
    const customMessage = modal.querySelector('#share-custom-message').value;
    
    navigator.clipboard.writeText(customMessage).then(() => {
        showNotification('📋 Đã sao chép nội dung!', 'success');
    }).catch(() => {
        showNotification('❌ Không thể sao chép!', 'error');
    });
}

// Gửi chia sẻ
function sendShare(modal, song) {
    const customMessage = modal.querySelector('#share-custom-message').value;
    const customLink = modal.querySelector('#share-custom-link').value;
    
    if (navigator.share) {
        navigator.share({
            title: `${song.name} - ${song.singer}`,
            text: customMessage,
            url: customLink
        }).then(() => {
            showNotification('✅ Đã chia sẻ thành công!', 'success');
            closeShareModal(modal);
        }).catch(() => {
            // Nếu không thể chia sẻ, sao chép vào clipboard
            navigator.clipboard.writeText(customMessage).then(() => {
                showNotification('📋 Đã sao chép vào clipboard!', 'info');
            }).catch(() => {
                showNotification('❌ Không thể chia sẻ!', 'error');
            });
        });
    } else {
        // Fallback: sao chép vào clipboard
        navigator.clipboard.writeText(customMessage).then(() => {
            showNotification('📋 Đã sao chép vào clipboard!', 'info');
        }).catch(() => {
            showNotification('❌ Không thể chia sẻ!', 'error');
        });
    }
}

// Đóng modal chia sẻ
function closeShareModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

// Tải xuống bài hát
function downloadSong(songIndex, songs) {
    const song = songs[songIndex];
    if (!song) return;
    
    // Kiểm tra nếu là blob URL (uploaded song)
    if (song.music && song.music.startsWith('blob:')) {
        // Tạo link tải xuống cho blob
        const link = document.createElement('a');
        link.href = song.music;
        link.download = `${song.name} - ${song.singer}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('⬇️ Đang tải xuống bài hát...', 'info');
    } else {
        // Đối với bài hát gốc, fetch và tạo blob
        fetch(song.music)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${song.name} - ${song.singer}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                showNotification('⬇️ Đang tải xuống bài hát...', 'info');
            })
            .catch(() => {
                showNotification('❌ Không thể tải xuống bài hát!', 'error');
            });
    }
}

export {
    shareSong,
    showEnhancedShareModal,
    initializeShareModal,
    handleQuickShare,
    copyShareContent,
    sendShare,
    closeShareModal,
    downloadSong
}; 