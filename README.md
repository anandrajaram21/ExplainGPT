# ExplainGPT

A project that aims to explain the inner workings of a GPT Model. Includes a simple implementation of a GPT Model trained on a small dataset.

## Features

- Minimal GPT architecture
- Trained on TinyStories dataset
- Optimized for consumer GPUs
- Interactive story generation
- Detailed logging and monitoring
- Configurable model size and training parameters

## Requirements

- Python 3.8+
- PyTorch 2.0+
- CUDA-capable GPU (8GB+ VRAM recommended)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/anandrajaram21/ExplainGPT.git
cd ExplainGPT
```

2. Create and activate a virtual environment (optional but recommended):

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

3. Setup Project

```bash
pip install -r requirements.txt
pip install -e .
```

## Project Structure

```
ExplainGPT/
├── config/
│   └── train_tinystories.py
├── data/
│   └── tinystories/
│       └── prepare.py
├── model/
│   ├── __init__.py
│   └── gpt.py
├── utils/
│   ├── __init__.py
│   └── logger.py
├── .gitignore
├── LICENSE
├── README.md
├── requirements.txt
├── train.py
└── sample.py
```

## Usage

### 1. Prepare the Dataset

First, download and process the TinyStories dataset:

```bash
python data/tinystories/prepare.py
```

This will:

- Download the dataset from HuggingFace
- Tokenize the text using GPT-2 tokenizer
- Save processed data as PyTorch tensors

### 2. Configure Training

Edit `config/train_tinystories.py` to adjust model and training parameters:

- Model size (layers, heads, dimensions)
- Batch size and learning rate
- Training duration
- Hardware settings

Default configuration is optimized for 8GB VRAM GPUs.

### 3. Train the Model

Start training:

```bash
python train.py
```

The training script will:

- Initialize model and optimizer
- Train using the processed dataset
- Log progress and metrics
- Save the best model checkpoint

Training progress is logged to the `logs` directory and displayed in the console.

### 4. Generate Stories

After training, generate stories using:

```bash
python sample.py
```

This opens an interactive prompt where you can:

- Enter text prompts
- Generate story continuations
- Try different generation parameters

Generation parameters can be adjusted:

- `temperature`: Controls randomness (0.7-0.9 recommended)
- `top_k`: Limits vocabulary choices
- `top_p`: Uses nucleus sampling
- `max_tokens`: Controls generation length

## Model Architecture

The current configuration uses:

- 4 transformer layers
- 4 attention heads
- 128 embedding dimension
- 64 token context window
- ~2.5M parameters

This configuration balances model capacity with training efficiency on consumer hardware.

## Customization

### Adjusting Model Size

For more/less VRAM, modify in `config/train_tinystories.py`:

```python
n_layer = 4     # Number of transformer layers
n_head = 4      # Number of attention heads
n_embd = 128    # Embedding dimension
block_size = 64 # Context window size
```

### Training Parameters

Key training parameters:

```python
batch_size = 12        # Decrease if out of memory
learning_rate = 1e-3   # Adjust based on training stability
max_iters = 2000      # Total training iterations
```

## Logging

Training progress is logged to:

- Console output (INFO level)
- Log files in `logs/` directory (DEBUG level)
- Includes loss metrics, training speed, and model statistics

## License

MIT License
