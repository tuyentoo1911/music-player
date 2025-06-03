import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import WaveSurfer from 'wavesurfer.js';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Playlist from './components/Playlist';
import BottomPlayer from './components/BottomPlayer';

// Hooks
import { useMusicDatabase } from './hooks/useMusicDatabase';
import { useAudioPlayer } from './hooks/useAudioPlayer';

function App() {
  // State management
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRandom, setIsRandom] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showBottomPlayer, setShowBottomPlayer] = useState(false);
  
  // Custom hooks
  const { songs, loading, addSong, deleteSong, favorites, toggleFavorite } = useMusicDatabase();
  const { 
    currentTime, 
    duration, 
    volume, 
    play, 
    pause, 
    seekTo, 
    setVolume: changeVolume 
  } = useAudioPlayer(songs[currentSongIndex]);

  // Refs
  const audioRef = useRef(null);
  const waveSurferRef = useRef(null);

  // Current song
  const currentSong = songs[currentSongIndex];

  // Effects
  useEffect(() => {
    // Initialize WaveSurfer
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
    }
    
    if (currentSong) {
      waveSurferRef.current = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'rgba(255, 255, 255, 0.3)',
        progressColor: '#ec1f55',
        height: 60,
        responsive: true
      });
      
      waveSurferRef.current.load(currentSong.music);
    }

    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
      }
    };
  }, [currentSong]);

  // Player controls
  const handlePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (isRandom) {
      setCurrentSongIndex(Math.floor(Math.random() * songs.length));
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    }
  };

  const handlePrevious = () => {
    if (isRandom) {
      setCurrentSongIndex(Math.floor(Math.random() * songs.length));
    } else {
      setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    }
  };

  const handleSongSelect = (index) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
    play();
  };

  const handleUpload = async (file) => {
    try {
      const audioUrl = URL.createObjectURL(file);
      const newSong = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        singer: 'Local Upload',
        image: '/default-artwork.jpg',
        music: audioUrl,
        duration: '00:00',
        type: 'uploaded'
      };
      
      await addSong(newSong);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading music library...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Dynamic Background */}
      <div className="dynamic-background">
        <div 
          className="background-image active"
          style={{ backgroundImage: `url(${currentSong?.image})` }}
        />
        <div className="background-overlay" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="main-content">
        <div className="player">
          {/* Dashboard */}
          <Dashboard
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onUpload={handleUpload}
            onToggleFavorite={() => toggleFavorite(currentSong)}
            isFavorite={favorites.includes(currentSong?.id)}
            isRandom={isRandom}
            onToggleRandom={() => setIsRandom(!isRandom)}
            currentTime={currentTime}
            duration={duration}
            onSeek={seekTo}
          />

          {/* Playlist */}
          <Playlist
            songs={songs}
            currentIndex={currentSongIndex}
            isPlaying={isPlaying}
            onSongSelect={handleSongSelect}
            onDeleteSong={deleteSong}
          />
        </div>

        {/* Bottom Player */}
        {showBottomPlayer && (
          <BottomPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentTime={currentTime}
            duration={duration}
            onSeek={seekTo}
            volume={volume}
            onVolumeChange={changeVolume}
            onClose={() => setShowBottomPlayer(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App; 