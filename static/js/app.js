/**
 * Vibe Projector - Frontend Application
 * Handles real-time updates from Spotify, UI interactions, scene management, and error handling
 */

// Video-based galaxy scene - no Three.js imports needed

class VibeProjector {
    constructor() {
        this.pollInterval = 3000; // 3 seconds
        this.pollTimer = null;
        this.isConnected = false;
        this.currentTrack = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.networkError = false;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeVideo();
        this.startPolling();
    }
    
    initializeVideo() {
        if (this.galaxyVideo) {
            // Ensure video plays and handles errors
            this.galaxyVideo.addEventListener('loadeddata', () => {
                console.log('Galaxy video loaded successfully');
                this.galaxyVideo.play().catch(e => {
                    console.warn('Video autoplay failed:', e);
                    this.showVideoOverlay();
                });
            });
            
            this.galaxyVideo.addEventListener('error', (e) => {
                console.error('Video error:', e);
                this.showToast('Video background failed to load', 'error');
            });
            
            this.galaxyVideo.addEventListener('ended', () => {
                // Restart video when it ends (for loop)
                this.galaxyVideo.currentTime = 0;
                this.galaxyVideo.play().catch(e => console.warn('Video restart failed:', e));
            });
            
            // Force video to be visible
            this.galaxyVideo.style.display = 'block';
            this.galaxyVideo.style.opacity = '1';
            this.galaxyVideo.style.visibility = 'visible';
        }
    }
    
    initializeElements() {
        // Main elements
        this.projector = document.getElementById('projector');
        this.mainCard = document.getElementById('main-card');
        this.connectSection = document.getElementById('connect-section');
        
        // Galaxy video background
        this.galaxyContainer = document.getElementById('bg-galaxy');
        this.galaxyVideo = document.getElementById('galaxy-video');
        this.videoOverlay = document.getElementById('video-overlay');
        this.playVideoBtn = document.getElementById('play-video-btn');
        
        // Fullscreen elements
        this.fullscreenToggle = document.getElementById('fullscreen-toggle');
        this.fullscreenIcon = document.getElementById('fullscreen-icon');
        
        // Status elements
        this.statusBadge = document.getElementById('status-badge');
        this.statusText = document.getElementById('status-text');
        
        // Toast elements
        this.toastContainer = document.getElementById('toast-container');
        
        // Track information elements
        this.coverImage = document.getElementById('cover-image');
        this.coverPlaceholder = document.getElementById('cover-placeholder');
        this.trackTitle = document.getElementById('track-title');
        this.trackArtist = document.getElementById('track-artist');
        this.deviceInfo = document.getElementById('device-info');
        
        // Progress elements
        this.progressContainer = document.getElementById('progress-container');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTime = document.getElementById('current-time');
        this.totalTime = document.getElementById('total-time');
        
        // Overlays
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.errorOverlay = document.getElementById('error-overlay');
        this.errorMessage = document.getElementById('error-message');
    }
    
    bindEvents() {
        // Fullscreen keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            }
        });
        
        // Fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenUI();
        });
        
        // Fullscreen toggle button
        this.fullscreenToggle.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Video play button
        if (this.playVideoBtn) {
            this.playVideoBtn.addEventListener('click', () => {
                this.playVideoBackground();
            });
        }
        
        // Click to fullscreen (mobile friendly)
        this.projector.addEventListener('click', (e) => {
            // Don't trigger fullscreen if clicking on interactive elements
            if (e.target.closest('.fullscreen-toggle') || 
                e.target.closest('.connect-btn') || 
                e.target.closest('.retry-btn')) {
                return;
            }
            
            if (!document.fullscreenElement) {
                this.toggleFullscreen();
            }
        });
        
        // Network status monitoring
        window.addEventListener('online', () => {
            this.handleNetworkOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkOffline();
        });
        
        // Video automatically handles resize, no special handling needed
    }
    
    // Galaxy video background is always active - no scene switching needed
    
    updateFullscreenIcon() {
        if (document.fullscreenElement) {
            this.fullscreenIcon.innerHTML = '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>';
        } else {
            this.fullscreenIcon.innerHTML = '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
        }
    }
    
    startPolling() {
        this.pollTimer = setInterval(() => {
            this.fetchNowPlaying();
        }, this.pollInterval);
        
        // Video visibility check (every 5 seconds)
        this.videoTimer = setInterval(() => {
            this.ensureVideoVisible();
        }, 5000);
        
        // Initial fetch
        this.fetchNowPlaying();
        
        // Ensure video stays visible
        this.ensureVideoVisible();
    }
    
    ensureVideoVisible() {
        if (this.galaxyVideo) {
            // Force video to be visible and playing
            this.galaxyVideo.style.display = 'block';
            this.galaxyVideo.style.opacity = '1';
            this.galaxyVideo.style.visibility = 'visible';
            
            // Ensure video is playing
            if (this.galaxyVideo.paused) {
                this.galaxyVideo.play().catch(e => {
                    console.warn('Video play failed:', e);
                    this.showVideoOverlay();
                });
            }
            
            // Debug info
            console.log('Video state:', {
                paused: this.galaxyVideo.paused,
                readyState: this.galaxyVideo.readyState,
                currentSrc: this.galaxyVideo.currentSrc,
                display: this.galaxyVideo.style.display,
                opacity: this.galaxyVideo.style.opacity,
                visibility: this.galaxyVideo.style.visibility
            });
        }
    }
    
    showVideoOverlay() {
        if (this.videoOverlay) {
            this.videoOverlay.style.display = 'flex';
        }
    }
    
    hideVideoOverlay() {
        if (this.videoOverlay) {
            this.videoOverlay.style.display = 'none';
        }
    }
    
    playVideoBackground() {
        if (this.galaxyVideo) {
            this.galaxyVideo.play().then(() => {
                this.hideVideoOverlay();
                this.showToast('Video background started', 'success');
            }).catch(e => {
                console.error('Failed to play video:', e);
                this.showToast('Failed to play video: ' + e.message, 'error');
            });
        }
    }
    
    async fetchNowPlaying() {
        try {
            // Reset retry count on successful request
            this.retryCount = 0;
            this.networkError = false;
            
            const response = await fetch('/nowplaying');
            
            if (response.status === 401) {
                // Unauthorized - show connect button
                this.handleUnauthorized();
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.updateUI(data);
            
        } catch (error) {
            console.error('Error fetching now playing:', error);
            this.handleError(error.message);
        }
    }
    
    updateUI(data) {
        if (data.error) {
            this.handleError(data.error);
            return;
        }
        
        // Hide loading overlay
        this.loadingOverlay.style.display = 'none';
        
        // Update status based on playback state
        if (data.title && data.artist) {
            if (data.isPlaying) {
                this.updateStatus('playing');
                this.showToast('Now playing: ' + data.title, 'success');
            } else {
                this.updateStatus('paused');
                this.showToast('Paused: ' + data.title, 'info');
            }
            
            this.updateTrackInfo(data);
            this.showMainCard();
        } else {
            // Nothing playing
            this.updateStatus('nothing-playing');
            this.showToast('Nothing currently playing', 'info');
            this.showNoTrackState();
        }
        
        // Update progress
        this.updateProgress(data.progressMs, data.durationMs);
        
        // Update device info
        if (data.deviceName) {
            this.deviceInfo.textContent = data.deviceName;
        }
        
        this.isConnected = true;
        this.clearCardErrorState();
    }
    
    updateStatus(status) {
        // Remove all status classes
        this.statusBadge.className = 'status-badge';
        
        switch (status) {
            case 'playing':
                this.statusText.textContent = 'Now Playing';
                this.statusBadge.classList.add('playing');
                break;
            case 'paused':
                this.statusText.textContent = 'Paused';
                this.statusBadge.classList.add('paused');
                break;
            case 'connecting':
                this.statusText.textContent = 'Connecting...';
                this.statusBadge.classList.add('connecting');
                break;
            case 'nothing-playing':
                this.statusText.textContent = 'Nothing Playing';
                this.statusBadge.classList.add('nothing-playing');
                break;
            case 'network-error':
                this.statusText.textContent = 'Network Error';
                this.statusBadge.classList.add('network-error');
                break;
            case 'disconnected':
                this.statusText.textContent = 'Not Connected';
                this.statusBadge.classList.add('disconnected');
                break;
        }
    }
    
    updateTrackInfo(data) {
        // Update title and artist
        this.trackTitle.textContent = data.title;
        this.trackArtist.textContent = data.artist;
        
        // Update cover image
        if (data.coverUrl) {
            this.coverImage.src = data.coverUrl;
            this.coverImage.style.display = 'block';
            this.coverPlaceholder.style.display = 'none';
        } else {
            this.coverImage.style.display = 'none';
            this.coverPlaceholder.style.display = 'flex';
        }
    }
    
    updateProgress(progressMs, durationMs) {
        if (durationMs > 0) {
            const progressPercent = (progressMs / durationMs) * 100;
            this.progressFill.style.width = `${progressPercent}%`;
            
            this.currentTime.textContent = this.formatTime(progressMs);
            this.totalTime.textContent = this.formatTime(durationMs);
            
            this.progressContainer.style.display = 'block';
        } else {
            this.progressContainer.style.display = 'none';
        }
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    showMainCard() {
        this.mainCard.style.display = 'block';
        this.connectSection.style.display = 'none';
    }
    
    showNoTrackState() {
        this.trackTitle.textContent = 'No Track Playing';
        this.trackArtist.textContent = 'Start playing music on Spotify';
        this.coverImage.style.display = 'none';
        this.coverPlaceholder.style.display = 'flex';
        this.progressContainer.style.display = 'none';
        this.deviceInfo.textContent = 'No device connected';
        
        this.showMainCard();
    }
    
    handleUnauthorized() {
        this.loadingOverlay.style.display = 'none';
        this.mainCard.style.display = 'none';
        this.connectSection.style.display = 'block';
        this.updateStatus('disconnected');
        this.showToast('Token expired — log in again', 'warning');
        this.isConnected = false;
    }
    
    handleError(message) {
        this.loadingOverlay.style.display = 'none';
        
        // Determine error type and show appropriate toast
        if (message.includes('network') || message.includes('fetch')) {
            this.handleNetworkError();
        } else if (message.includes('unauthorized') || message.includes('401')) {
            this.handleUnauthorized();
        } else {
            this.showToast(message, 'error');
        }
        
        // Show error overlay for critical errors
        if (message.includes('network') || message.includes('fetch')) {
            this.errorMessage.textContent = message;
            this.errorOverlay.style.display = 'flex';
        }
    }
    
    handleNetworkError() {
        this.networkError = true;
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            this.updateStatus('network-error');
            this.showToast(`Network error, retrying... (${this.retryCount}/${this.maxRetries})`, 'warning');
            
            // Retry after a delay
            setTimeout(() => {
                if (this.networkError) {
                    this.fetchNowPlaying();
                }
            }, 2000 * this.retryCount); // Exponential backoff
        } else {
            this.showToast('Network connection failed. Please check your internet connection.', 'error');
            this.updateStatus('network-error');
        }
    }
    
    handleNetworkOnline() {
        if (this.networkError) {
            this.networkError = false;
            this.retryCount = 0;
            this.showToast('Network connection restored', 'success');
            this.updateStatus('connecting');
            this.fetchNowPlaying();
        }
    }
    
    handleNetworkOffline() {
        this.networkError = true;
        this.showToast('Network connection lost', 'error');
        this.updateStatus('network-error');
    }
    
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Create icon based on type
        const icon = this.createToastIcon(type);
        
        // Create message
        const messageEl = document.createElement('span');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.removeToast(toast);
        
        // Assemble toast
        toast.appendChild(icon);
        toast.appendChild(messageEl);
        toast.appendChild(closeBtn);
        
        // Add to container
        this.toastContainer.appendChild(toast);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
        
        return toast;
    }
    
    createToastIcon(type) {
        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        
        switch (type) {
            case 'success':
                icon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
                break;
            case 'error':
                icon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
                break;
            case 'warning':
                icon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
                break;
            default:
                icon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
        }
        
        return icon;
    }
    
    removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    setCardErrorState(type) {
        this.mainCard.classList.remove('error-state', 'warning-state');
        if (type === 'error') {
            this.mainCard.classList.add('error-state');
        } else if (type === 'warning') {
            this.mainCard.classList.add('warning-state');
        }
    }
    
    clearCardErrorState() {
        this.mainCard.classList.remove('error-state', 'warning-state');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.projector.requestFullscreen) {
                this.projector.requestFullscreen();
            } else if (this.projector.webkitRequestFullscreen) {
                this.projector.webkitRequestFullscreen();
            } else if (this.projector.msRequestFullscreen) {
                this.projector.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    updateFullscreenUI() {
        this.updateFullscreenIcon();
        
        // Hide UI elements in fullscreen mode
        const uiElements = document.querySelectorAll('.scene-indicator, .fullscreen-toggle, .scene-hint');
        uiElements.forEach(element => {
            if (document.fullscreenElement) {
                element.style.display = 'none';
            } else {
                element.style.display = 'block';
            }
        });
    }
    
    // Cleanup method for page unload
    cleanup() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
        if (this.videoTimer) {
            clearInterval(this.videoTimer);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const projector = new VibeProjector();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        projector.cleanup();
    });
}); 