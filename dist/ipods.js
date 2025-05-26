document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const menuLinks = document.querySelectorAll('.screen .menu li a');
    const screenElement = document.querySelector('.ipod-frame .screen');
    
    let songListElement = null;
    let nowPlayingElement = null;

    const playPauseBtn = document.querySelector('.vertical-button button:last-child');
    const menuBtn = document.querySelector('.vertical-button button:first-child');
    const nextBtn = document.querySelector('.horizontal-button button:last-child');
    const prevBtn = document.querySelector('.horizontal-button button:first-child');
    const centerBtn = document.querySelector('.center-button');

    let songTitleElement = null;
    let songArtistElement = null;
    let progressElement = null;
    let currentTimeElement = null;
    let totalTimeElement = null;
    let playbackStatusElement = null;
    let albumArtElement = null;

    const songs = [
        { 
            title: 'Memories',
            artist: 'Benjamin Tissot',
            url: 'https://www.bensound.com/bensound-music/bensound-memories.mp3',
            duration: '',
            cover: '',
        },
        { 
            title: 'Happy Rock',
            artist: 'Benjamin Tissot',
            url: 'https://www.bensound.com/bensound-music/bensound-happyrock.mp3',
            duration: '',
            cover: '',
        },
        { 
            title: 'Jazzy Frenchy',
            artist: 'Benjamin Tissot',
            url: 'https://www.bensound.com/bensound-music/bensound-jazzyfrenchy.mp3',
            duration: '',
            cover: '',
        },
    ];

    let currentMenuIndex = 0;
    let currentSongIndex = -1;
    let isPlaying = false;
    let currentView = 'menu';
    let isLoading = false;
    let volume = 1.0;

    function renderMenu() {
        const menuHtml = `
            <div class="notification-bar">
                <div>iPod</div>
                <div class="battery"></div>
                <button id="close-ipod-btn">
                    <i class="material-icons" style="font-size: 12px;">close</i>
                </button>
            </div>
            <ul class="menu">
                <li data-view="songList"><a href="#" class="${currentMenuIndex === 0 ? 'active' : ''}">Music <span>></span></a></li>
                <li data-view="notImplemented"><a href="#" class="${currentMenuIndex === 1 ? 'active' : ''}">Videos <span>></span></a></li>
                <li data-view="notImplemented"><a href="#" class="${currentMenuIndex === 2 ? 'active' : ''}">Photos <span>></span></a></li>
                <li data-view="notImplemented"><a href="#" class="${currentMenuIndex === 3 ? 'active' : ''}">Podcastes <span>></span></a></li>
                <li data-view="notImplemented"><a href="#" class="${currentMenuIndex === 4 ? 'active' : ''}">Extras <span>></span></a></li>
                <li data-view="notImplemented"><a href="#" class="${currentMenuIndex === 5 ? 'active' : ''}">Settings <span>></span></a></li>
                <li data-view="notImplemented"><a href="#" class="${currentMenuIndex === 6 ? 'active' : ''}">Shuffle Songs <span>></span></a></li>
            </ul>
        `;
        screenElement.innerHTML = menuHtml;
        currentView = 'menu';
        attachMenuListeners();
        const closeBtn = document.getElementById('close-ipod-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                window.close();
            });
        }
    }

    function renderSongList() {
        const songListHtml = `
            <div class="notification-bar">
                <div>Music</div>
                <div class="battery"></div>
                <button id="close-ipod-btn">
                    <i class="material-icons" style="font-size: 12px;">close</i>
                </button>
            </div>
            <div class="song-list-view">
                ${songs.map((song, index) => 
                    `<div class="song-item ${index === currentSongIndex ? 'selected' : ''}" data-index="${index}">
                        <div class="song-title">${song.title}</div>
                        <div class="song-artist">${song.artist}</div>
                    </div>`
                ).join('')}
            </div>
        `;
        screenElement.innerHTML = songListHtml;
        currentView = 'songList';
        attachSongListListeners();
        const closeBtn = document.getElementById('close-ipod-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                window.close();
            });
        }
    }

    function renderNowPlaying() {
        const song = songs[currentSongIndex] || {};
        const nowPlayingHtml = `
            <div class="notification-bar">
                <div>Now Playing</div>
                <div class="battery"></div>
                <button id="close-ipod-btn">
                    <i class="material-icons" style="font-size: 12px;">close</i>
                </button>
            </div>
            <div class="now-playing-view">
                 <div class="song-info">
                    <div class="album-art" id="album-art-visual">
                         <i class="material-icons">music_note</i>
                     </div>
                     <div class="song-details">
                         <div id="song-title" class="title">${song.title || 'No Song Selected'}</div>
                         <div id="song-artist" class="artist">${song.artist || ''}</div>
                     </div>
                 </div>
                 <div class="progress-container">
                     <div class="progress-bar">
                         <div id="progress" style="width: 0%;"></div>
                     </div>
                     <div class="time-info">
                         <span id="current-time">0:00</span>
                         <span id="total-time">0:00</span>
                     </div>
                 </div>
                 <div class="playback-info">
                     <span id="playback-status">Stopped</span>
                 </div>
            </div>
        `;
        screenElement.innerHTML = nowPlayingHtml;
        currentView = 'nowPlaying';
        songTitleElement = screenElement.querySelector('#song-title');
        songArtistElement = screenElement.querySelector('#song-artist');
        progressElement = screenElement.querySelector('#progress');
        currentTimeElement = screenElement.querySelector('#current-time');
        totalTimeElement = screenElement.querySelector('#total-time');
        playbackStatusElement = screenElement.querySelector('#playback-status');
        albumArtElement = screenElement.querySelector('#album-art-visual i');
        
        updateNowPlayingInfo();
        updateProgress();
        const closeBtn = document.getElementById('close-ipod-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                window.close();
            });
        }
    }

    function showView(view) {
        switch(view) {
            case 'menu':
                renderMenu();
                break;
            case 'songList':
                renderSongList();
                break;
            case 'nowPlaying':
                renderNowPlaying();
                break;
            case 'notImplemented':
                screenElement.innerHTML = `<div class="notification-bar"><div>iPod</div><div class="battery"></div></div><div style="padding: 20px; text-align: center;">Not Implemented</div>`;
                currentView = 'notImplemented';
                break;
        }
    }

    function playSong(index) {
        if (index < 0 || index >= songs.length || isLoading) return;
        isLoading = true;
        const song = songs[index];
        currentSongIndex = index;
        showView('nowPlaying');
        
        audioPlayer.pause();
        audioPlayer.src = song.url;
        audioPlayer.load();
        audioPlayer.play().then(() => {
            isPlaying = true;
            updatePlaybackStatus('Playing');
            if (albumArtElement) albumArtElement.classList.add('fa-spin');
            isLoading = false;
            const currentPlayPauseBtn = document.querySelector('.vertical-button button:last-child');
            if(currentPlayPauseBtn) currentPlayPauseBtn.innerHTML = '<i class="material-icons">pause</i>';
            updateNowPlayingInfo();
        }).catch(error => {
            console.error('Audio playback error:', error);
            isPlaying = false;
            updatePlaybackStatus('Error: Autoplay blocked or invalid source');
            if (albumArtElement) albumArtElement.classList.remove('fa-spin');
            const currentPlayPauseBtn = document.querySelector('.vertical-button button:last-child');
            if(currentPlayPauseBtn) currentPlayPauseBtn.innerHTML = '<i class="material-icons">play_arrow</i>';
            isLoading = false;
            alert('Playback failed. Please try clicking play again or check the audio source.');
        });
    }

    function updateSongListSelection() {
        renderSongList();
    }

    function updateNowPlayingInfo() {
        const song = songs[currentSongIndex] || {};
        if(songTitleElement) songTitleElement.textContent = song.title || 'No Song Selected';
        if(songArtistElement) songArtistElement.textContent = song.artist || '';
    }

    function updateProgress() {
        if (!audioPlayer.duration || isNaN(audioPlayer.duration)) {
            if(progressElement) progressElement.style.width = '0%';
            if(currentTimeElement) currentTimeElement.textContent = '0:00';
            if(totalTimeElement) totalTimeElement.textContent = '0:00';
            return;
        }
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        if(progressElement) progressElement.style.width = percent + '%';
        if(currentTimeElement) currentTimeElement.textContent = formatTime(audioPlayer.currentTime);
        if(totalTimeElement) totalTimeElement.textContent = formatTime(audioPlayer.duration);
    }

    function formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function updatePlaybackStatus(status) {
        if(playbackStatusElement) playbackStatusElement.textContent = status;
    }

    

    function togglePlayPause() {
        const currentPlayPauseBtn = document.querySelector('.vertical-button button:last-child');
        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
            if(currentPlayPauseBtn) currentPlayPauseBtn.innerHTML = '<i class="material-icons">play_arrow</i>';
            updatePlaybackStatus('Paused');
            if (albumArtElement) albumArtElement.classList.remove('fa-spin');
        } else {
            if (currentSongIndex !== -1 && songs[currentSongIndex]) {
                 audioPlayer.play().catch(error => {
                    console.error('Audio playback error:', error);
                    updatePlaybackStatus('Error: Autoplay blocked or invalid source');
                });
                isPlaying = true;
                if(currentPlayPauseBtn) currentPlayPauseBtn.innerHTML = '<i class="material-icons">pause</i>';
                updatePlaybackStatus('Playing');
                if (albumArtElement) albumArtElement.classList.add('fa-spin');
            } else {
                console.log('No song selected to play.');
                 updatePlaybackStatus('Stopped');
            }
        }
        updateNowPlayingInfo();
    }

    function nextSong() {
         if (songs.length === 0) return;
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playSong(currentSongIndex);
    }

    function prevSong() {
        if (songs.length === 0) return;
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        playSong(currentSongIndex);
    }

    function attachMenuListeners() {
        document.querySelectorAll('.screen .menu li a').forEach((item, index) => {
            item.parentElement.addEventListener('click', (e) => {
                 e.preventDefault();
                currentMenuIndex = index;
                 document.querySelectorAll('.screen .menu li a').forEach((link, idx) => {
                    link.classList.toggle('active', idx === currentMenuIndex);
                 });

                const view = item.parentElement.dataset.view;
                if (view) {
                    showView(view);
                } else {
                     alert('View not defined');
                }
            });
        });
    }

    function attachSongListListeners() {
        document.querySelectorAll('.song-item').forEach(item => {
            item.addEventListener('click', () => {
                currentSongIndex = parseInt(item.dataset.index);
                playSong(currentSongIndex);
            });
        });
    }

    renderMenu();

    centerBtn.addEventListener('click', () => {
        if (currentView === 'menu') {
            const activeMenuItem = document.querySelector('.screen .menu li a.active');
            if (activeMenuItem) {
                const view = activeMenuItem.parentElement.dataset.view;
                 if (view) {
                    showView(view);
                } else {
                     alert('View not defined');
                }
            }
        } else if (currentView === 'songList') {
             if (currentSongIndex !== -1 && songs[currentSongIndex]) {
                 playSong(currentSongIndex);
             } else if (songs.length > 0) {
                  currentSongIndex = 0;
                 playSong(currentSongIndex);
             } else {
                 console.log('No songs available to play.');
                 updatePlaybackStatus('No songs');
             }
        } else if (currentView === 'nowPlaying') {
            togglePlayPause();
        } else if (currentView === 'addSong') {
            // Add song functionality is removed for now based on new UI
            // addSongConfirm.click();
        }
    });

    menuBtn.addEventListener('click', () => {
        audioPlayer.pause();
        isPlaying = false;
         const currentPlayPauseBtn = document.querySelector('.vertical-button button:last-child');
         if(currentPlayPauseBtn) currentPlayPauseBtn.innerHTML = '<i class="material-icons">play_arrow</i>';
        updatePlaybackStatus('Stopped');
         if (albumArtElement) albumArtElement.classList.remove('fa-spin');
        showView('menu');
    });

    nextBtn.addEventListener('click', () => {
        if (currentView === 'nowPlaying' || currentView === 'songList') {
            nextSong();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentView === 'nowPlaying' || currentView === 'songList') {
            prevSong();
        }
    });

    screenElement.addEventListener('click', (e) => {
        if (currentView === 'nowPlaying' && e.target.closest('.progress-bar')) {
            const progressBar = e.target.closest('.progress-bar');
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
             if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                audioPlayer.currentTime = pos * audioPlayer.duration;
                updateProgress();
            }
        }
    });

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', () => {
        nextSong();
    });
    audioPlayer.addEventListener('loadedmetadata', updateProgress);
    audioPlayer.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        isPlaying = false;
         const currentPlayPauseBtn = document.querySelector('.vertical-button button:last-child');
         if(currentPlayPauseBtn) currentPlayPauseBtn.innerHTML = '<i class="material-icons">play_arrow</i>';
        updatePlaybackStatus('Error: Invalid audio source');
        isLoading = false;
    });

    // Add event listener for the close button
    document.getElementById('close-ipod-btn').addEventListener('click', function() {
        window.close();
    });

    // --- Manual Drag Functionality ---
    const notificationBar = document.querySelector('.ipod-frame .screen .notification-bar');
    let isDragging = false;
    let offsetX, offsetY;
    let initialWindowX, initialWindowY; // Store initial window position

    if (notificationBar) {
        notificationBar.addEventListener('mousedown', async (e) => { // Made function async
            // Check if clicking on a non-draggable element (like buttons or battery)
            if (e.target.closest('button') || e.target.closest('.battery')) {
                return; // Don't start dragging if clicking controls or battery
            }

            isDragging = true;

            // Get initial window position
            const currentWindow = require('@electron/remote').getCurrentWindow();
            const windowId = currentWindow.id;
            const position = await window.ipod.getPosition(windowId);
            initialWindowX = position.x;
            initialWindowY = position.y;

            // Calculate the offset from the mouse pointer to the window's top-left corner
            offsetX = e.clientX;
            offsetY = e.clientY;

            // Add event listeners for mousemove and mouseup to the whole document
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            e.preventDefault(); // Prevent default behavior
        });
    }

    function onMouseMove(e) {
        if (!isDragging) return;

        // Calculate the new absolute window position
        const newX = initialWindowX + (e.clientX - offsetX);
        const newY = initialWindowY + (e.clientY - offsetY);
        
        // Send the new absolute position to the main process via IPC
        if (window.ipod && typeof window.ipod.move === 'function') {
            window.ipod.move(newX, newY);
        }
    }

    function onMouseUp() {
        isDragging = false;
        // Remove the event listeners
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // Ensure the notification bar has -webkit-app-region: drag; property in CSS
    // and buttons/battery have -webkit-app-region: no-drag;
});

