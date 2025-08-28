/**
 * Galaxy Scene Module - Three.js powered dynamic starfield and nebula
 * Optimized for projector use with low-power GPU settings
 */

import * as THREE from './lib/three.module.js';

class GalaxyScene {
    constructor() {
        this.container = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.starLayers = [];
        this.nebula = null;
        this.animationId = null;
        this.isInitialized = false;
        this.resizeObserver = null;
        
        // Performance settings
        this.maxPixelRatio = 1.75;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
    }
    
    initGalaxy(containerEl) {
        if (this.isInitialized) {
            return;
        }
        
        this.container = containerEl;
        
        // Check WebGL support
        if (!this.checkWebGLSupport()) {
            console.warn('WebGL not available, falling back to CSS scenes');
            return false;
        }
        
        try {
            this.setupRenderer();
            this.setupCamera();
            this.setupScene();
            this.createStarLayers();
            this.createNebula();
            this.setupLighting();
            this.setupResizeHandler();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize galaxy scene:', error);
            return false;
        }
    }
    
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: 'low-power'
        });
        
        // Performance optimizations
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.maxPixelRatio));
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.autoClear = false;
        
        // Attach to container
        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.pointerEvents = 'none';
        this.renderer.domElement.style.zIndex = '-1';
    }
    
    setupCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 10, 100);
    }
    
    createStarLayers() {
        // Layer 1: Distant stars (small, slow movement)
        const distantStars = this.createStarField(1000, 0.5, 0.8, 0xffffff);
        distantStars.position.z = -50;
        this.scene.add(distantStars);
        this.starLayers.push(distantStars);
        
        // Layer 2: Near stars (larger, faster movement)
        const nearStars = this.createStarField(500, 1.2, 1.5, 0x88ccff);
        nearStars.position.z = -30;
        this.scene.add(nearStars);
        this.starLayers.push(nearStars);
    }
    
    createStarField(count, size, speed, color) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Random positions in a sphere
            const radius = 20 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Random colors with slight variation
            const colorVariation = 0.3;
            colors[i3] = Math.max(0, Math.min(1, (color >> 16 & 255) / 255 + (Math.random() - 0.5) * colorVariation));
            colors[i3 + 1] = Math.max(0, Math.min(1, (color >> 8 & 255) / 255 + (Math.random() - 0.5) * colorVariation));
            colors[i3 + 2] = Math.max(0, Math.min(1, (color & 255) / 255 + (Math.random() - 0.5) * colorVariation));
            
            // Random movement speeds
            speeds[i] = speed * (0.5 + Math.random() * 0.5);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        
        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        const points = new THREE.Points(geometry, material);
        points.userData = { speeds: speeds };
        
        return points;
    }
    
    createNebula() {
        // Create a subtle procedural nebula using particles
        const nebulaGeometry = new THREE.BufferGeometry();
        const nebulaCount = 200;
        const positions = new Float32Array(nebulaCount * 3);
        const colors = new Float32Array(nebulaCount * 3);
        const sizes = new Float32Array(nebulaCount);
        
        for (let i = 0; i < nebulaCount; i++) {
            const i3 = i * 3;
            
            // Create a cloud-like distribution
            const radius = 15 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Soft, dark nebula colors
            const nebulaColors = [
                0x1a0a2e, // Deep purple
                0x16213e, // Dark blue
                0x0f3460, // Navy blue
                0x533483   // Purple
            ];
            const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
            
            colors[i3] = (color >> 16 & 255) / 255;
            colors[i3 + 1] = (color >> 8 & 255) / 255;
            colors[i3 + 2] = (color & 255) / 255;
            
            // Varying sizes for depth effect
            sizes[i] = 2 + Math.random() * 4;
        }
        
        nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 3));
        
        const nebulaMaterial = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: 0.15, // Very subtle
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });
        
        this.nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        this.scene.add(this.nebula);
    }
    
    setupLighting() {
        // Ambient light for subtle illumination
        const ambientLight = new THREE.AmbientLight(0x111111, 0.1);
        this.scene.add(ambientLight);
    }
    
    setupResizeHandler() {
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeGalaxy();
        });
        this.resizeObserver.observe(this.container);
    }
    
    startGalaxy() {
        if (!this.isInitialized || this.animationId) {
            return;
        }
        
        this.animate();
    }
    
    animate(currentTime = 0) {
        if (!this.isInitialized) return;
        
        // Frame rate limiting
        if (currentTime - this.lastFrameTime < this.frameInterval) {
            this.animationId = requestAnimationFrame((time) => this.animate(time));
            return;
        }
        
        this.lastFrameTime = currentTime;
        
        // Animate star layers
        this.starLayers.forEach((layer, index) => {
            const speeds = layer.userData.speeds;
            const positions = layer.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Move stars in a gentle spiral
                const speed = speeds[i / 3] * 0.001;
                positions[i] += speed;
                positions[i + 1] += speed * 0.3;
                
                // Wrap around when stars go too far
                if (positions[i] > 25) positions[i] = -25;
                if (positions[i + 1] > 25) positions[i + 1] = -25;
            }
            
            layer.geometry.attributes.position.needsUpdate = true;
        });
        
        // Gentle camera movement
        const time = currentTime * 0.0001;
        this.camera.position.x = Math.sin(time * 0.5) * 0.5;
        this.camera.position.y = Math.cos(time * 0.3) * 0.3;
        this.camera.lookAt(0, 0, 0);
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    stopGalaxy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resizeGalaxy() {
        if (!this.isInitialized) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    disposeGalaxy() {
        this.stopGalaxy();
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        if (this.scene) {
            // Dispose of geometries and materials
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.scene = null;
        }
        
        this.camera = null;
        this.starLayers = [];
        this.nebula = null;
        this.isInitialized = false;
    }
}

// Export singleton instance
const galaxyScene = new GalaxyScene();

export function initGalaxy(containerEl) {
    return galaxyScene.initGalaxy(containerEl);
}

export function startGalaxy() {
    galaxyScene.startGalaxy();
}

export function stopGalaxy() {
    galaxyScene.stopGalaxy();
}

export function resizeGalaxy() {
    galaxyScene.resizeGalaxy();
}

export function disposeGalaxy() {
    galaxyScene.disposeGalaxy();
} 