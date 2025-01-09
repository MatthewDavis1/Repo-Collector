# Repository Content Collector

A tool that allows you to combine multiple files into a single document. Available in two versions:
1. A web tool for combining files from GitHub repositories
2. A CLI tool for combining files from local directories

## Web Version

A simple web tool that allows you to combine multiple files from a GitHub repository into a single document. Perfect for code reviews, documentation, or sharing code snippets.

### Web Features

- Select multiple files from any public GitHub repository
- Clearly separated file contents with visual delimiters
- Base64 encoding support for images with optional size limiting
- One-click copy to clipboard
- Clean, modern UI with folder tree navigation

### Web Usage

1. Enter a GitHub repository URL
2. Select files from the file tree
3. Configure image options (if needed):
   - Enable base64 encoding for images
   - Set maximum image size (optional)
4. Click "Combine Selected Files"
5. Copy the combined content with the copy button

## CLI Version

A command-line tool that combines files from local directories into a single document. Supports wildcards for file matching and handles both text and image files.

### CLI Features

- Process files from local directories recursively
- Match files using wildcards (e.g., *.py, *.md)
- Base64 encoding support for images
- Optional image resizing
- Clear file separators in output

### CLI Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### CLI Usage

Basic usage:
```bash
# Combine all files in a directory
python repoformatter.py /path/to/directory

# Specify output file
python repoformatter.py /path/to/directory -o output.txt

# Match specific file patterns
python repoformatter.py /path/to/directory -p "*.py" "*.md"

# Include images with size limit
python repoformatter.py /path/to/directory --images --max-image-size 1000000
```

Command-line options:
- `directory`: Directory to process (required)
- `-o, --output`: Output file (default: combined_output.txt)
- `-p, --patterns`: File patterns to match (e.g., "*.py" "*.md")
- `--images`: Include images as base64
- `--max-image-size`: Maximum image size in pixels (width * height)

## Web Setup

1. Clone this repository
2. Open `index.html` in a web browser
3. Start using the tool

No server setup or build process required - it runs entirely in the browser. 