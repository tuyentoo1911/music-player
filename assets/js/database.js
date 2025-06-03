/**
 * Music Player Database Manager
 * Using IndexedDB for client-side storage
 */

class MusicDatabase {
    constructor() {
        this.dbName = 'MusicPlayerDB';
        this.dbVersion = 2;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (e) => {
                this.db = e.target.result;
                const oldVersion = e.oldVersion;
                const newVersion = e.newVersion;
                
                console.log(`Database upgrade needed from version ${oldVersion} to ${newVersion}`);

                // Create or update object stores (tables)
                this.createStores(oldVersion);
            };
        });
    }

    // Create database stores (tables)
    createStores(oldVersion = 0) {
        // Songs store - for original songs
        if (!this.db.objectStoreNames.contains('songs')) {
            const songsStore = this.db.createObjectStore('songs', {
                keyPath: 'id',
                autoIncrement: true
            });
            songsStore.createIndex('name', 'name', { unique: false });
            songsStore.createIndex('singer', 'singer', { unique: false });
            songsStore.createIndex('category', 'category', { unique: false });
        }

        // Uploaded songs store - for user uploaded songs with enhanced metadata
        if (!this.db.objectStoreNames.contains('uploadedSongs')) {
            const uploadedStore = this.db.createObjectStore('uploadedSongs', {
                keyPath: 'id',
                autoIncrement: true
            });
            uploadedStore.createIndex('name', 'name', { unique: false });
            uploadedStore.createIndex('singer', 'singer', { unique: false });
            uploadedStore.createIndex('category', 'category', { unique: false });
            uploadedStore.createIndex('uploadDate', 'uploadDate', { unique: false });
            uploadedStore.createIndex('fileSize', 'fileSize', { unique: false });
            uploadedStore.createIndex('fileType', 'fileType', { unique: false });
            uploadedStore.createIndex('originalFileName', 'originalFileName', { unique: false });
            uploadedStore.createIndex('playCount', 'playCount', { unique: false });
            uploadedStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });
        } else if (oldVersion < 2) {
            // Upgrade existing uploadedSongs store for version 2
            const transaction = this.db.transaction(['uploadedSongs'], 'versionchange');
            const uploadedStore = transaction.objectStore('uploadedSongs');
            
            // Add new indexes if they don't exist
            try {
                if (!uploadedStore.indexNames.contains('category')) {
                    uploadedStore.createIndex('category', 'category', { unique: false });
                }
                if (!uploadedStore.indexNames.contains('fileType')) {
                    uploadedStore.createIndex('fileType', 'fileType', { unique: false });
                }
                if (!uploadedStore.indexNames.contains('originalFileName')) {
                    uploadedStore.createIndex('originalFileName', 'originalFileName', { unique: false });
                }
                if (!uploadedStore.indexNames.contains('playCount')) {
                    uploadedStore.createIndex('playCount', 'playCount', { unique: false });
                }
                if (!uploadedStore.indexNames.contains('lastPlayed')) {
                    uploadedStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });
                }
            } catch (error) {
                console.warn('Some indexes may already exist:', error);
            }
        }

        // Favorites store
        if (!this.db.objectStoreNames.contains('favorites')) {
            const favoritesStore = this.db.createObjectStore('favorites', {
                keyPath: 'id',
                autoIncrement: true
            });
            favoritesStore.createIndex('songId', 'songId', { unique: false });
            favoritesStore.createIndex('songType', 'songType', { unique: false }); // 'original' or 'uploaded'
            favoritesStore.createIndex('dateAdded', 'dateAdded', { unique: false });
            favoritesStore.createIndex('combined', ['songId', 'songType'], { unique: false });
        }

        // Playlists store
        if (!this.db.objectStoreNames.contains('playlists')) {
            const playlistsStore = this.db.createObjectStore('playlists', {
                keyPath: 'id',
                autoIncrement: true
            });
            playlistsStore.createIndex('name', 'name', { unique: false });
            playlistsStore.createIndex('createdDate', 'createdDate', { unique: false });
            playlistsStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // User settings store
        if (!this.db.objectStoreNames.contains('settings')) {
            const settingsStore = this.db.createObjectStore('settings', {
                keyPath: 'key'
            });
        }

        console.log('Database stores created/updated successfully');
    }

    // Generic method to add data to any store
    async addData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to get all data from a store
    async getAllData(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to get data by ID
    async getDataById(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to update data
    async updateData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Generic method to delete data
    async deleteData(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // === SONGS METHODS ===

    // Add original song
    async addSong(songData) {
        const song = {
            ...songData,
            type: 'original',
            dateAdded: new Date().toISOString(),
            playCount: 0,
            lastPlayed: null
        };
        return await this.addData('songs', song);
    }

    // Get all original songs
    async getAllSongs() {
        return await this.getAllData('songs');
    }

    // Update song play count
    async updateSongPlayCount(songId) {
        const song = await this.getDataById('songs', songId);
        if (song) {
            song.playCount = (song.playCount || 0) + 1;
            song.lastPlayed = new Date().toISOString();
            return await this.updateData('songs', song);
        }
    }

    // === UPLOADED SONGS METHODS ===

    // Add uploaded song with enhanced metadata
    async addUploadedSong(file, audioURL, songData = null) {
        // Validate file
        if (!file || !file.type.startsWith('audio/')) {
            throw new Error('Invalid audio file');
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('File too large. Maximum size is 50MB');
        }

        const uploadedSong = songData ? {
            ...songData,
            originalFileName: file.name,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileMimeType: file.type,
            uploadDate: new Date().toISOString(),
            type: 'uploaded',
            playCount: 0,
            lastPlayed: null,
            audioBlob: audioURL, // Store the blob URL
            customMetadata: {
                hasCustomName: songData.name !== file.name.replace(/\.[^/.]+$/, ""),
                hasCustomArtist: songData.singer !== 'Local Upload',
                hasCustomImage: songData.image !== 'assets/img/default-song.jpg',
                uploadVersion: '1.0'
            }
        } : {
            name: file.name.replace(/\.[^/.]+$/, ""),
            originalFileName: file.name,
            fileName: file.name,
            singer: 'Local Upload',
            image: 'assets/img/default-song.jpg',
            music: audioURL,
            fileSize: file.size,
            fileType: file.type,
            fileMimeType: file.type,
            duration: '00:00',
            category: 'Unknown',
            uploadDate: new Date().toISOString(),
            type: 'uploaded',
            playCount: 0,
            lastPlayed: null,
            audioBlob: audioURL,
            customMetadata: {
                hasCustomName: false,
                hasCustomArtist: false,
                hasCustomImage: false,
                uploadVersion: '1.0'
            }
        };
        
        // Store the file as blob if needed for future access
        if (songData) {
            uploadedSong.music = audioURL;
        }
        
        try {
            const result = await this.addData('uploadedSongs', uploadedSong);
            console.log('Uploaded song saved to database:', uploadedSong.name);
            return result;
        } catch (error) {
            console.error('Database save error:', error);
            // Don't clean up blob URL here - let the calling function decide
            // The URL might still be usable even if database save fails
            throw new Error('Database save failed: ' + error.message);
        }
    }

    // Get all uploaded songs with sorting options
    async getAllUploadedSongs(sortBy = 'uploadDate', sortOrder = 'desc') {
        const songs = await this.getAllData('uploadedSongs');
        
        // Sort songs
        songs.sort((a, b) => {
            let valueA = a[sortBy];
            let valueB = b[sortBy];
            
            if (sortBy === 'uploadDate' || sortBy === 'lastPlayed') {
                valueA = new Date(valueA || 0);
                valueB = new Date(valueB || 0);
            } else if (sortBy === 'name' || sortBy === 'singer') {
                valueA = (valueA || '').toLowerCase();
                valueB = (valueB || '').toLowerCase();
            }
            
            if (sortOrder === 'desc') {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            } else {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            }
        });
        
        return songs;
    }

    // Get uploaded songs by category
    async getUploadedSongsByCategory(category) {
        const songs = await this.getAllData('uploadedSongs');
        return songs.filter(song => song.category === category);
    }

    // Update uploaded song metadata
    async updateUploadedSongMetadata(songId, metadata) {
        const song = await this.getDataById('uploadedSongs', songId);
        if (song) {
            // Update allowed fields
            const allowedFields = ['name', 'singer', 'category', 'image'];
            for (const field of allowedFields) {
                if (metadata[field] !== undefined) {
                    song[field] = metadata[field];
                }
            }
            
            // Update custom metadata flags
            if (song.customMetadata) {
                if (metadata.name !== undefined) {
                    song.customMetadata.hasCustomName = metadata.name !== song.originalFileName.replace(/\.[^/.]+$/, "");
                }
                if (metadata.singer !== undefined) {
                    song.customMetadata.hasCustomArtist = metadata.singer !== 'Local Upload';
                }
                if (metadata.image !== undefined) {
                    song.customMetadata.hasCustomImage = metadata.image !== 'assets/img/default-song.jpg';
                }
            }
            
            return await this.updateData('uploadedSongs', song);
        }
        return null;
    }

    // Delete uploaded song with cleanup
    async deleteUploadedSong(songId) {
        const song = await this.getDataById('uploadedSongs', songId);
        if (!song) {
            throw new Error('Song not found');
        }
        
        // Clean up blob URLs
        if (song.music && song.music.startsWith('blob:')) {
            URL.revokeObjectURL(song.music);
        }
        if (song.audioBlob && song.audioBlob.startsWith('blob:')) {
            URL.revokeObjectURL(song.audioBlob);
        }
        if (song.image && song.image.startsWith('blob:')) {
            URL.revokeObjectURL(song.image);
        }
        
        // Remove from favorites if exists
        const favorites = await this.getAllData('favorites');
        const favoritesToRemove = favorites.filter(fav => 
            fav.songId === songId && fav.songType === 'uploaded'
        );
        
        for (const favorite of favoritesToRemove) {
            await this.deleteData('favorites', favorite.id);
        }
        
        // Remove from playlists
        const playlists = await this.getAllData('playlists');
        for (const playlist of playlists) {
            const originalLength = playlist.songs.length;
            playlist.songs = playlist.songs.filter(s => 
                !(s.songId === songId && s.songType === 'uploaded')
            );
            
            if (playlist.songs.length !== originalLength) {
                playlist.lastModified = new Date().toISOString();
                await this.updateData('playlists', playlist);
            }
        }
        
        // Finally delete the song
        const result = await this.deleteData('uploadedSongs', songId);
        console.log('Uploaded song deleted from database:', song.name);
        return result;
    }

    // Update uploaded song play count
    async updateUploadedSongPlayCount(songId) {
        const song = await this.getDataById('uploadedSongs', songId);
        if (song) {
            song.playCount = (song.playCount || 0) + 1;
            song.lastPlayed = new Date().toISOString();
            return await this.updateData('uploadedSongs', song);
        }
        return null;
    }

    // Get uploaded song statistics
    async getUploadedSongsStats() {
        const songs = await this.getAllData('uploadedSongs');
        
        if (songs.length === 0) {
            return {
                totalSongs: 0,
                totalSize: 0,
                totalDuration: 0,
                categories: {},
                avgFileSize: 0,
                oldestUpload: null,
                newestUpload: null
            };
        }
        
        const totalSize = songs.reduce((sum, song) => sum + (song.fileSize || 0), 0);
        const categories = {};
        
        songs.forEach(song => {
            const category = song.category || 'Unknown';
            categories[category] = (categories[category] || 0) + 1;
        });
        
        const sortedByDate = [...songs].sort((a, b) => 
            new Date(a.uploadDate) - new Date(b.uploadDate)
        );
        
        return {
            totalSongs: songs.length,
            totalSize: totalSize,
            totalSizeFormatted: this.formatFileSize(totalSize),
            categories: categories,
            avgFileSize: Math.round(totalSize / songs.length),
            avgFileSizeFormatted: this.formatFileSize(Math.round(totalSize / songs.length)),
            oldestUpload: sortedByDate[0]?.uploadDate,
            newestUpload: sortedByDate[sortedByDate.length - 1]?.uploadDate,
            mostPlayedUploaded: songs.reduce((max, song) => 
                (song.playCount || 0) > (max.playCount || 0) ? song : max, songs[0]
            )
        };
    }

    // Helper method to format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // === FAVORITES METHODS ===

    // Add to favorites
    async addToFavorites(songId, songType = 'original') {
        // Check if already exists
        const existingFavorites = await this.getAllData('favorites');
        const exists = existingFavorites.some(fav => 
            fav.songId === songId && fav.songType === songType
        );

        if (!exists) {
            const favorite = {
                songId: songId,
                songType: songType,
                dateAdded: new Date().toISOString()
            };
            return await this.addData('favorites', favorite);
        }
        return null;
    }

    // Remove from favorites
    async removeFromFavorites(songId, songType = 'original') {
        const favorites = await this.getAllData('favorites');
        const favorite = favorites.find(fav => 
            fav.songId === songId && fav.songType === songType
        );
        
        if (favorite) {
            return await this.deleteData('favorites', favorite.id);
        }
        return null;
    }

    // Get all favorites with song details
    async getAllFavorites() {
        const favorites = await this.getAllData('favorites');
        const favoriteSongs = [];

        for (const favorite of favorites) {
            let song;
            if (favorite.songType === 'original') {
                song = await this.getDataById('songs', favorite.songId);
            } else {
                song = await this.getDataById('uploadedSongs', favorite.songId);
            }
            
            if (song) {
                favoriteSongs.push({
                    ...song,
                    favoriteId: favorite.id,
                    favoriteDate: favorite.dateAdded,
                    isFavorite: true
                });
            }
        }

        return favoriteSongs;
    }

    // Check if song is favorite
    async isSongFavorite(songId, songType = 'original') {
        const favorites = await this.getAllData('favorites');
        return favorites.some(fav => 
            fav.songId === songId && fav.songType === songType
        );
    }

    // === PLAYLISTS METHODS ===

    // Create playlist
    async createPlaylist(name, description = '') {
        const playlist = {
            name: name,
            description: description,
            songs: [], // Array of {songId, songType, dateAdded}
            createdDate: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        return await this.addData('playlists', playlist);
    }

    // Get all playlists
    async getAllPlaylists() {
        return await this.getAllData('playlists');
    }

    // Add song to playlist
    async addSongToPlaylist(playlistId, songId, songType = 'original') {
        const playlist = await this.getDataById('playlists', playlistId);
        if (playlist) {
            // Check if song already in playlist
            const exists = playlist.songs.some(s => 
                s.songId === songId && s.songType === songType
            );
            
            if (!exists) {
                playlist.songs.push({
                    songId: songId,
                    songType: songType,
                    dateAdded: new Date().toISOString()
                });
                playlist.lastModified = new Date().toISOString();
                return await this.updateData('playlists', playlist);
            }
        }
        return null;
    }

    // Remove song from playlist
    async removeSongFromPlaylist(playlistId, songId, songType = 'original') {
        const playlist = await this.getDataById('playlists', playlistId);
        if (playlist) {
            playlist.songs = playlist.songs.filter(s => 
                !(s.songId === songId && s.songType === songType)
            );
            playlist.lastModified = new Date().toISOString();
            return await this.updateData('playlists', playlist);
        }
        return null;
    }

    // Get playlist with song details
    async getPlaylistWithSongs(playlistId) {
        const playlist = await this.getDataById('playlists', playlistId);
        if (!playlist) return null;

        const songsWithDetails = [];
        for (const songRef of playlist.songs) {
            let song;
            if (songRef.songType === 'original') {
                song = await this.getDataById('songs', songRef.songId);
            } else {
                song = await this.getDataById('uploadedSongs', songRef.songId);
            }
            
            if (song) {
                songsWithDetails.push({
                    ...song,
                    playlistDateAdded: songRef.dateAdded
                });
            }
        }

        return {
            ...playlist,
            songsDetails: songsWithDetails
        };
    }

    // === SETTINGS METHODS ===

    // Save setting
    async saveSetting(key, value) {
        const setting = { key, value, lastUpdated: new Date().toISOString() };
        return await this.updateData('settings', setting);
    }

    // Get setting
    async getSetting(key, defaultValue = null) {
        const setting = await this.getDataById('settings', key);
        return setting ? setting.value : defaultValue;
    }

    // === UTILITY METHODS ===

    // Get recently played songs
    async getRecentlyPlayed(limit = 10) {
        const originalSongs = await this.getAllData('songs');
        const uploadedSongs = await this.getAllData('uploadedSongs');
        
        const allSongs = [
            ...originalSongs.map(s => ({...s, type: 'original'})),
            ...uploadedSongs.map(s => ({...s, type: 'uploaded'}))
        ];

        return allSongs
            .filter(song => song.lastPlayed)
            .sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))
            .slice(0, limit);
    }

    // Get most played songs
    async getMostPlayed(limit = 10) {
        const originalSongs = await this.getAllData('songs');
        const uploadedSongs = await this.getAllData('uploadedSongs');
        
        const allSongs = [
            ...originalSongs.map(s => ({...s, type: 'original'})),
            ...uploadedSongs.map(s => ({...s, type: 'uploaded'}))
        ];

        return allSongs
            .filter(song => song.playCount > 0)
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, limit);
    }

    // Search songs
    async searchSongs(query) {
        const originalSongs = await this.getAllData('songs');
        const uploadedSongs = await this.getAllData('uploadedSongs');
        
        const allSongs = [
            ...originalSongs.map(s => ({...s, type: 'original'})),
            ...uploadedSongs.map(s => ({...s, type: 'uploaded'}))
        ];

        const searchTerm = query.toLowerCase();
        return allSongs.filter(song => 
            song.name.toLowerCase().includes(searchTerm) ||
            song.singer.toLowerCase().includes(searchTerm)
        );
    }

    // Initialize with default data
    async initializeDefaultData() {
        const existingSongs = await this.getAllData('songs');
        
        if (existingSongs.length === 0) {
            console.log('Initializing with default songs...');
            
            const defaultSongs = [
                {
                    name: 'Blue',
                    singer: 'yung kai',
                    image: 'assets/img/Song 1.jpeg',
                    music: 'assets/music/Song 1.mp3',
                    duration: '03:24',
                    category: 'Pop'
                },
                {
                    name: 'Cupid',
                    singer: 'FIFTY FIFTY (피프티프티)',
                    image: 'assets/img/Song 2.jpeg',
                    music: 'assets/music/Song 2.mp3',
                    duration: '02:54',
                    category: 'K-Pop'
                },
                {
                    name: 'Trap Royalty',
                    singer: 'Singer 3',
                    image: 'assets/img/Song 3.jpeg',
                    music: 'assets/music/Song 3.mp3',
                    duration: '03:15',
                    category: 'Hip-Hop'
                },
                {
                    name: 'Supernatural',
                    singer: 'Ariana Grande',
                    image: 'assets/img/Song 4.jpeg',
                    music: 'assets/music/Song 4.mp3',
                    duration: '03:07',
                    category: 'Pop'
                },
                {
                    name: 'End Of Beginning',
                    singer: 'Djo',
                    image: 'assets/img/Song 5.jpeg',
                    music: 'assets/music/Song 5.mp3',
                    duration: '04:19',
                    category: 'Alternative'
                }
            ];

            for (const song of defaultSongs) {
                await this.addSong(song);
            }
            
            console.log('Default songs added to database');
        }
    }

    // Get database statistics
    async getStats() {
        const originalSongs = await this.getAllData('songs');
        const uploadedSongs = await this.getAllData('uploadedSongs');
        const favorites = await this.getAllData('favorites');
        const playlists = await this.getAllData('playlists');

        const totalPlayCount = [...originalSongs, ...uploadedSongs]
            .reduce((total, song) => total + (song.playCount || 0), 0);

        return {
            totalSongs: originalSongs.length,
            uploadedSongs: uploadedSongs.length,
            totalFavorites: favorites.length,
            totalPlaylists: playlists.length,
            totalPlayCount: totalPlayCount
        };
    }
}

// Export for use in other files
window.MusicDatabase = MusicDatabase; 