"""
Training script for TinyGPT model.
"""

import os
import time
import math
import torch
from model.gpt import GPT
from config.train_tinystories import TrainingConfig
from utils.logger import setup_logger

logger = setup_logger(__name__)

def get_batch(split, config, data):
    """Get a batch of data."""
    data = data['train'] if split == 'train' else data['val']
    ix = torch.randint(len(data) - config.block_size, (config.batch_size,))
    x = torch.stack([data[i:i+config.block_size] for i in ix])
    y = torch.stack([data[i+1:i+config.block_size+1] for i in ix])
    x, y = x.to(config.device), y.to(config.device)
    return x, y

def get_lr(iter, config):
    """Calculate learning rate with warmup and cosine decay."""
    if iter < config.warmup_iters:
        return config.learning_rate * iter / config.warmup_iters
    if iter > config.lr_decay_iters:
        return config.min_lr
    decay_ratio = (iter - config.warmup_iters) / (config.lr_decay_iters - config.warmup_iters)
    coeff = 0.5 * (1.0 + math.cos(math.pi * decay_ratio))
    return config.min_lr + coeff * (config.learning_rate - config.min_lr)

@torch.no_grad()
def estimate_loss(model, config, data):
    """Estimate loss on train and validation sets."""
    out = {}
    model.eval()
    for split in ['train', 'val']:
        losses = torch.zeros(config.eval_iters)
        for k in range(config.eval_iters):
            X, Y = get_batch(split, config, data)
            logits, loss = model(X, Y)
            losses[k] = loss.item()
        out[split] = losses.mean()
    model.train()
    return out

def main():
    # Initialize config
    config = TrainingConfig()
    logger.info(f"Starting training with device: {config.device}")
    
    # Load data
    logger.info("Loading dataset...")
    train_data = torch.load(os.path.join('data', 'tinystories', 'train.pt'))
    val_data = torch.load(os.path.join('data', 'tinystories', 'val.pt'))
    data = {'train': train_data, 'val': val_data}
    logger.info(f"Dataset loaded - Train: {len(train_data):,} tokens, Val: {len(val_data):,} tokens")
    
    # Initialize model
    logger.info(f"Initializing model - {config.n_layer} layers, {config.n_head} heads, {config.n_embd} dim")
    model = GPT(config)
    model.to(config.device)
    n_params = sum(p.numel() for p in model.parameters())
    logger.info(f"Model initialized with {n_params:,} parameters")
    
    # Initialize optimizer
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.learning_rate,
        betas=(config.beta1, config.beta2),
        weight_decay=config.weight_decay,
    )
    logger.info(f"Optimizer initialized with lr={config.learning_rate}")
    
    # Training loop
    best_val_loss = float('inf')
    t0 = time.time()
    
    logger.info("Starting training loop...")
    for iter in range(config.max_iters):
        # Learning rate schedule
        lr = get_lr(iter, config) if config.decay_lr else config.learning_rate
        for param_group in optimizer.param_groups:
            param_group['lr'] = lr
        
        # Forward pass
        x, y = get_batch('train', config, data)
        logits, loss = model(x, y)
        
        # Backward pass
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), config.grad_clip)
        optimizer.step()
        
        # Periodic logging
        if iter % 10 == 0:
            t1 = time.time()
            dt = t1 - t0
            t0 = t1
            
            tokens_per_sec = config.batch_size * config.block_size / dt
            logger.debug(
                f"Iter {iter}: loss={loss.item():.4f}, "
                f"time={dt*1000:.2f}ms, "
                f"tokens/sec={tokens_per_sec:.0f}, "
                f"lr={lr:.2e}"
            )
        
        # Evaluation
        if iter % config.eval_interval == 0:
            losses = estimate_loss(model, config, data)
            logger.info(
                f"Iter {iter}: train_loss={losses['train']:.4f}, "
                f"val_loss={losses['val']:.4f}"
            )
            
            # Save best model
            if losses['val'] < best_val_loss:
                best_val_loss = losses['val']
                logger.info(f"New best validation loss: {best_val_loss:.4f}")
                torch.save(model.state_dict(), 'best_model.pt')
    
    logger.info("Training completed!")
    logger.info(f"Best validation loss: {best_val_loss:.4f}")

if __name__ == '__main__':
    main()
