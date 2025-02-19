"""
Training Configuration for TinyGPT
---------------------------------
This module defines the configuration for training a small GPT model on the TinyStories
dataset. The configuration is optimized for training on consumer GPUs with limited VRAM.

The configuration includes:
- Model architecture parameters (layers, heads, dimensions)
- Training hyperparameters (batch size, learning rate, etc.)
- Optimizer settings (weight decay, betas)
- Learning rate schedule parameters
- System settings (device, precision)
"""

import torch

def _can_use_triton():
    try:
        import triton
        return True
    except ImportError:
        return False

class TrainingConfig:
    """Configuration for training the TinyGPT model."""
    
    # Wandb configuration
    wandb_project = "tinygpt"
    wandb_entity = None  # Set to your wandb username/entity
    wandb_log_model = True
    
    # Model architecture
    n_layer = 4           # Number of transformer layers
    n_head = 4           # Number of attention heads per layer
    n_embd = 128         # Embedding dimension for tokens and positions
    block_size = 64      # Maximum sequence length (context window)
    vocab_size = 50304   # GPT-2 vocabulary size
    dropout = 0.2        # Dropout probability for regularization
    bias = True          # Whether to use bias terms in linear layers

    # Training hyperparameters
    batch_size = 12      # Number of sequences per batch
    learning_rate = 1e-3  # Initial learning rate
    max_iters = 2000     # Total number of training iterations
    lr_decay_iters = 2000  # Number of iterations for LR decay
    warmup_iters = 100   # Number of iterations for LR warmup
    eval_interval = 200  # How often to evaluate on validation set
    eval_iters = 20     # Number of batches for evaluation
    
    # Optimizer settings
    weight_decay = 0.1   # L2 regularization strength
    beta1 = 0.9         # Adam optimizer beta1 (momentum)
    beta2 = 0.95        # Adam optimizer beta2 (RMSprop)
    grad_clip = 1.0     # Gradient clipping threshold
    
    # Learning rate schedule
    decay_lr = True     # Whether to use learning rate decay
    min_lr = 6e-5       # Minimum learning rate after decay
    
    # System settings
    device = 'cuda' if torch.cuda.is_available() else 'cpu'  # Training device
    dtype = 'float16'   # Data type for training (float16 for memory efficiency)
    compile = False     # Whether to use torch.compile (disabled for compatibility)
