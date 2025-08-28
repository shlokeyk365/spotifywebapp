#!/usr/bin/env python3
"""
Video Re-encoding Script for Browser Compatibility
Re-encodes galaxyvid.mp4 to H.264 MP4 and WebM formats
"""

import os
from moviepy.editor import VideoFileClip

def reencode_video():
    input_file = "static/videos/galaxyvid.mp4"
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found!")
        return
    
    print("Loading video...")
    video = VideoFileClip(input_file)
    
    # Get video info
    duration = video.duration
    fps = video.fps
    size = video.size
    
    print(f"Video info: {duration:.2f}s, {fps}fps, {size[0]}x{size[1]}")
    
    # Re-encode to H.264 MP4 (browser-compatible)
    print("Creating H.264 MP4...")
    output_mp4 = "static/videos/galaxy-h264.mp4"
    video.write_videofile(
        output_mp4,
        codec='libx264',
        audio_codec='aac',
        preset='medium',
        ffmpeg_params=[
            '-crf', '23',  # Constant Rate Factor for good quality
            '-movflags', '+faststart',  # Optimize for web streaming
            '-pix_fmt', 'yuv420p'  # Ensure compatibility
        ]
    )
    
    # Create WebM fallback (VP9 codec)
    print("Creating WebM fallback...")
    output_webm = "static/videos/galaxy.webm"
    video.write_videofile(
        output_webm,
        codec='libvpx-vp9',
        audio_codec='libvorbis',
        preset='medium',
        ffmpeg_params=[
            '-crf', '30',  # VP9 CRF for good quality
            '-b:v', '0'  # Variable bitrate
        ]
    )
    
    # Clean up
    video.close()
    
    print(f"\n✅ Re-encoding complete!")
    print(f"📁 H.264 MP4: {output_mp4}")
    print(f"📁 WebM: {output_webm}")
    
    # Check file sizes
    mp4_size = os.path.getsize(output_mp4) / (1024 * 1024)
    webm_size = os.path.getsize(output_webm) / (1024 * 1024)
    original_size = os.path.getsize(input_file) / (1024 * 1024)
    
    print(f"\n📊 File sizes:")
    print(f"   Original: {original_size:.1f} MB")
    print(f"   H.264 MP4: {mp4_size:.1f} MB")
    print(f"   WebM: {webm_size:.1f} MB")

if __name__ == "__main__":
    reencode_video() 