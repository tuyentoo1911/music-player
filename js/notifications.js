// Module Hệ thống Thông báo

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Xóa thông báo hiện tại
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Tạo element thông báo
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Thêm vào body
    document.body.appendChild(notification);

    // Hiển thị thông báo
    setTimeout(() => notification.classList.add('show'), 100);

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);

    // Chức năng nút đóng
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

export {
    showNotification
}; 