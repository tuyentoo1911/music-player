import { useState, useEffect, useCallback } from 'react';

// IndexedDB Music Database Hook
export const useMusicDatabase = () => {
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [db, setDb] = useState(null);

  const DB_NAME = 'MusicPlayerDB';
  const DB_VERSION = 1;

  // Initialize IndexedDB
  const initDatabase = useCallback(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        const database = request.result;
        setDb(database);
        resolve(database);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        // Create object stores
        if (!database.objectStoreNames.contains('songs')) {
          const songsStore = database.createObjectStore('songs', {
            keyPath: 'id',
            autoIncrement: true
          });
          songsStore.createIndex('name', 'name', { unique: false });
          songsStore.createIndex('singer', 'singer', { unique: false });
        }

        if (!database.objectStoreNames.contains('uploadedSongs')) {
          const uploadedStore = database.createObjectStore('uploadedSongs', {
            keyPath: 'id',
            autoIncrement: true
          });
          uploadedStore.createIndex('name', 'name', { unique: false });
        }

        if (!database.objectStoreNames.contains('favorites')) {
          const favoritesStore = database.createObjectStore('favorites', {
            keyPath: 'id',
            autoIncrement: true
          });
          favoritesStore.createIndex('songId', 'songId', { unique: false });
        }

        if (!database.objectStoreNames.contains('playlists')) {
          const playlistsStore = database.createObjectStore('playlists', {
            keyPath: 'id',
            autoIncrement: true
          });
          playlistsStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }, []);

  // Generic database operations
  const performTransaction = useCallback((storeName, mode, operation) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Load all songs
  const loadSongs = useCallback(async () => {
    try {
      setLoading(true);
      
      const originalSongs = await performTransaction('songs', 'readonly', 
        (store) => store.getAll()
      );
      
      const uploadedSongs = await performTransaction('uploadedSongs', 'readonly',
        (store) => store.getAll()
      );

      const allSongs = [
        ...originalSongs.map(song => ({ ...song, type: 'original' })),
        ...uploadedSongs.map(song => ({ ...song, type: 'uploaded' }))
      ];

      setSongs(allSongs);
    } catch (err) {
      setError(err.message);
      console.error('Error loading songs:', err);
    } finally {
      setLoading(false);
    }
  }, [performTransaction]);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    try {
      const favoritesData = await performTransaction('favorites', 'readonly',
        (store) => store.getAll()
      );
      setFavorites(favoritesData.map(fav => fav.songId));
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }, [performTransaction]);

  // Add song
  const addSong = useCallback(async (songData) => {
    try {
      const storeName = songData.type === 'uploaded' ? 'uploadedSongs' : 'songs';
      const song = {
        ...songData,
        dateAdded: new Date().toISOString(),
        playCount: 0,
        lastPlayed: null
      };

      const id = await performTransaction(storeName, 'readwrite',
        (store) => store.add(song)
      );

      // Reload songs
      await loadSongs();
      return id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [performTransaction, loadSongs]);

  // Delete song
  const deleteSong = useCallback(async (songId, songType = 'original') => {
    try {
      const storeName = songType === 'uploaded' ? 'uploadedSongs' : 'songs';
      
      await performTransaction(storeName, 'readwrite',
        (store) => store.delete(songId)
      );

      // Also remove from favorites if exists
      await removeFromFavorites(songId);
      
      // Reload songs
      await loadSongs();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [performTransaction, loadSongs]);

  // Add to favorites
  const addToFavorites = useCallback(async (songId) => {
    try {
      // Check if already exists
      const existingFavorites = await performTransaction('favorites', 'readonly',
        (store) => store.getAll()
      );
      
      const exists = existingFavorites.some(fav => fav.songId === songId);
      if (exists) return;

      const favorite = {
        songId: songId,
        dateAdded: new Date().toISOString()
      };

      await performTransaction('favorites', 'readwrite',
        (store) => store.add(favorite)
      );

      await loadFavorites();
    } catch (err) {
      console.error('Error adding to favorites:', err);
      throw err;
    }
  }, [performTransaction, loadFavorites]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (songId) => {
    try {
      const existingFavorites = await performTransaction('favorites', 'readonly',
        (store) => store.getAll()
      );
      
      const favorite = existingFavorites.find(fav => fav.songId === songId);
      if (!favorite) return;

      await performTransaction('favorites', 'readwrite',
        (store) => store.delete(favorite.id)
      );

      await loadFavorites();
    } catch (err) {
      console.error('Error removing from favorites:', err);
      throw err;
    }
  }, [performTransaction, loadFavorites]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (song) => {
    if (!song || !song.id) return;

    try {
      if (favorites.includes(song.id)) {
        await removeFromFavorites(song.id);
      } else {
        await addToFavorites(song.id);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }, [favorites, addToFavorites, removeFromFavorites]);

  // Update play count
  const updatePlayCount = useCallback(async (songId, songType = 'original') => {
    try {
      const storeName = songType === 'uploaded' ? 'uploadedSongs' : 'songs';
      
      const song = await performTransaction(storeName, 'readonly',
        (store) => store.get(songId)
      );

      if (song) {
        song.playCount = (song.playCount || 0) + 1;
        song.lastPlayed = new Date().toISOString();

        await performTransaction(storeName, 'readwrite',
          (store) => store.put(song)
        );
      }
    } catch (err) {
      console.error('Error updating play count:', err);
    }
  }, [performTransaction]);

  // Initialize default songs
  const initializeDefaultSongs = useCallback(async () => {
    try {
      const existingSongs = await performTransaction('songs', 'readonly',
        (store) => store.getAll()
      );

      if (existingSongs.length === 0) {
        const defaultSongs = [
          {
            name: 'Blue',
            singer: 'yung kai',
            image: '/assets/img/Song 1.jpeg',
            music: '/assets/music/Song 1.mp3',
            duration: '03:24',
            category: 'Pop'
          },
          {
            name: 'Cupid',
            singer: 'FIFTY FIFTY (피프티프티)',
            image: '/assets/img/Song 2.jpeg',
            music: '/assets/music/Song 2.mp3',
            duration: '02:54',
            category: 'K-Pop'
          },
          {
            name: 'Trap Royalty',
            singer: 'Singer 3',
            image: '/assets/img/Song 3.jpeg',
            music: '/assets/music/Song 3.mp3',
            duration: '03:15',
            category: 'Hip-Hop'
          },
          {
            name: 'Supernatural',
            singer: 'Ariana Grande',
            image: '/assets/img/Song 4.jpeg',
            music: '/assets/music/Song 4.mp3',
            duration: '03:07',
            category: 'Pop'
          },
          {
            name: 'End Of Beginning',
            singer: 'Djo',
            image: '/assets/img/Song 5.jpeg',
            music: '/assets/music/Song 5.mp3',
            duration: '04:19',
            category: 'Alternative'
          }
        ];

        for (const song of defaultSongs) {
          await addSong({ ...song, type: 'original' });
        }
      }
    } catch (err) {
      console.error('Error initializing default songs:', err);
    }
  }, [performTransaction, addSong]);

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        await initializeDefaultSongs();
        await loadSongs();
        await loadFavorites();
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    init();
  }, [initDatabase, initializeDefaultSongs, loadSongs, loadFavorites]);

  return {
    songs,
    favorites,
    playlists,
    loading,
    error,
    addSong,
    deleteSong,
    toggleFavorite,
    updatePlayCount,
    loadSongs,
    loadFavorites
  };
}; 