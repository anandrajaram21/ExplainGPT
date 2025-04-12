# ExplainGPT

ExplainGPT is a project that allows you to interact with language models, visualize token probabilities, and understand model behavior through an intuitive interface.

## Features

- Generate text using language models
- Visualize token probabilities for generated text
- Interactive playground for model exploration
- Model selection capability
- Token-by-token explanation of generated output

## Project Structure

- **Frontend**: Next.js application with React 19 and Tailwind CSS
- **Backend**: FastAPI Python server that handles model loading and text generation

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Sync dependencies using uv:

   ```bash
   uv sync
   ```

3. Activate the virtual environment:

   ```bash
   # If using standard venv
   source .venv/bin/activate  # On Unix/macOS
   # OR
   .venv\Scripts\activate     # On Windows
   ```

4. Run the FastAPI server:
   ```bash
   fastapi dev main.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Start the development server:

   ```bash
   bun run dev
   ```

4. Access the application at [http://localhost:3000](http://localhost:3000)

## Technologies

- **Frontend**: Next.js, React, Tailwind CSS, Radix UI
- **Backend**: FastAPI, PyTorch, Transformers
- **Development**: Bun, uv

## License

[MIT License](LICENSE)
