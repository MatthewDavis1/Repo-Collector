#!/usr/bin/env python3
import argparse
import base64
import fnmatch
import os
from PIL import Image
import io
import mimetypes

def is_image_file(filename):
    """Check if a file is an image based on its extension."""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type and mime_type.startswith('image/')

def resize_image(image_path, max_pixels):
    """Resize an image if it exceeds max_pixels while maintaining aspect ratio."""
    with Image.open(image_path) as img:
        width, height = img.size
        if width * height > max_pixels:
            ratio = (max_pixels / (width * height)) ** 0.5
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format=img.format)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

def get_file_content(file_path, include_images=False, max_image_size=None):
    """Get the content of a file, handling both text and image files."""
    if is_image_file(file_path) and include_images:
        if max_image_size:
            return resize_image(file_path, max_image_size)
        with open(file_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    else:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            return f"[Binary file: {file_path}]"

def collect_files(directory, patterns=None):
    """Recursively collect files matching the given patterns."""
    if patterns is None:
        patterns = ['*']
    
    matches = []
    for root, _, files in os.walk(directory):
        for filename in files:
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, directory)
            
            # Skip hidden files and directories
            if any(part.startswith('.') for part in rel_path.split(os.sep)):
                continue
                
            # Check if file matches any of the patterns
            if any(fnmatch.fnmatch(rel_path, pattern) for pattern in patterns):
                matches.append((rel_path, file_path))
    
    return sorted(matches)  # Sort for consistent output

def combine_files(files, directory, include_images=False, max_image_size=None):
    """Combine the contents of multiple files with separators."""
    combined = []
    
    for rel_path, abs_path in files:
        middle_line = f"==================== File: {rel_path} ===================="
        separator = "=" * len(middle_line)
        
        content = get_file_content(abs_path, include_images, max_image_size)
        
        combined.extend([
            "",
            separator,
            middle_line,
            separator,
            "",
            content
        ])
    
    return "\n".join(combined).strip()

def main():
    parser = argparse.ArgumentParser(description='Combine multiple files from a directory into a single document.')
    parser.add_argument('directory', help='Directory to process')
    parser.add_argument('-o', '--output', default='combined_output.txt',
                        help='Output file (default: combined_output.txt)')
    parser.add_argument('-p', '--patterns', nargs='+', default=['*'],
                        help='File patterns to match (e.g., "*.py" "*.md")')
    parser.add_argument('--images', action='store_true',
                        help='Include images as base64')
    parser.add_argument('--max-image-size', type=int,
                        help='Maximum image size in pixels (width * height)')
    
    args = parser.parse_args()
    
    # Convert directory to absolute path
    directory = os.path.abspath(args.directory)
    
    if not os.path.isdir(directory):
        print(f"Error: '{directory}' is not a directory")
        return 1
    
    # Collect and combine files
    files = collect_files(directory, args.patterns)
    if not files:
        print(f"No files found matching patterns: {', '.join(args.patterns)}")
        return 1
    
    print(f"Found {len(files)} matching files")
    combined_content = combine_files(
        files,
        directory,
        include_images=args.images,
        max_image_size=args.max_image_size
    )
    
    # Write output
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(combined_content)
    
    print(f"Combined content written to: {args.output}")
    return 0

if __name__ == '__main__':
    exit(main()) 