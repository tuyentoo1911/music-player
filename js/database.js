// Module Quản lý Cơ sở dữ liệu
let musicDB = null;

// Khởi tạo cơ sở dữ liệu
async function initializeDatabase() {
    try {
        // Kiểm tra xem IndexedDB có được hỗ trợ không
        if (!window.indexedDB) {
            return false;
        }
        
        // Khởi tạo cơ sở dữ liệu với cơ chế thử lại
        let dbInitialized = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!dbInitialized && retryCount < maxRetries) {
            try {
                musicDB = new MusicDatabase();
                await musicDB.init();
                
                // Xác minh cơ sở dữ liệu thực sự hoạt động
                if (musicDB.db && musicDB.db.objectStoreNames.length > 0) {
                    dbInitialized = true;
                } else {
                    throw new Error('Database structure not properly created');
                }
                
            } catch (error) {
                retryCount++;
                
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        if (!dbInitialized) {
            return false;
        }
        
        await musicDB.initializeDefaultData();
        
        return true;
        
    } catch (error) {
        return false;
    }
}

// Kiểm tra xem cơ sở dữ liệu có sẵn sàng hoạt động không
function isDatabaseOperational() {
    const operational = musicDB && musicDB.db && musicDB.db.objectStoreNames.length > 0;
    return operational;
}

// Tải bài hát từ cơ sở dữ liệu
async function loadSongsFromDatabase() {
    try {
        if (!isDatabaseOperational()) {
            return null;
        }
        
        const originalSongs = await musicDB.getAllSongs();
        const uploadedSongs = await musicDB.getAllUploadedSongs();
        
        // Kết hợp cả hai loại và thêm metadata cơ sở dữ liệu
        const songs = [
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
        
        return songs;
    } catch (error) {
        return null;
    }
}

// Thêm bài hát đã tải lên vào cơ sở dữ liệu
async function addUploadedSongToDatabase(file, audioURL, songData) {
    try {
        if (!isDatabaseOperational()) {
            return null;
        }
        
        const songId = await musicDB.addUploadedSong(file, audioURL, songData);
        return songId;
    } catch (error) {
        throw error;
    }
}

// Xóa bài hát khỏi cơ sở dữ liệu
async function deleteSongFromDatabase(songId, songType = 'uploaded') {
    try {
        if (!isDatabaseOperational()) {
            return false;
        }
        
        if (songType === 'uploaded') {
            await musicDB.deleteUploadedSong(songId);
        } else {
            await musicDB.deleteSong(songId);
        }
        return true;
    } catch (error) {
        throw error;
    }
}

// Lấy instance cơ sở dữ liệu
function getDatabaseInstance() {
    return musicDB;
}

// Debug trạng thái cơ sở dữ liệu
function debugDatabaseState() {
    // Kiểm tra dữ liệu localStorage
    try {
        const uploadedSongs = JSON.parse(localStorage.getItem('uploadedSongs') || '[]');
    } catch (error) {
        // Lỗi đọc localStorage
    }
}

export {
    initializeDatabase,
    isDatabaseOperational,
    loadSongsFromDatabase,
    addUploadedSongToDatabase,
    deleteSongFromDatabase,
    getDatabaseInstance,
    debugDatabaseState
}; 