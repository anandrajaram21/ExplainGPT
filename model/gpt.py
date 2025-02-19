"""
GPT Language Model Implementation
-------------------------------
A minimal GPT (Generative Pre-trained Transformer) implementation based on the 
architecture described in the GPT-2 paper. This implementation includes the core 
components: self-attention mechanism, transformer blocks, and the full language model.

Key Components:
- LayerNorm: Modified layer normalization with optional bias
- SelfAttention: Multi-head causal self-attention mechanism
- MLP: Position-wise feed-forward network
- Block: Full transformer block combining attention and MLP
- GPT: Complete language model with token+positional embeddings

The model uses a causal attention mask to ensure it can only attend to previous tokens
in the sequence, making it suitable for autoregressive text generation.
"""

import math
import torch
import torch.nn as nn
from torch.nn import functional as F

class LayerNorm(nn.Module):
    """
    Layer normalization with optional bias.
    
    Computes mean and variance for normalization across the last dimension.
    Includes learnable scale (weight) and optional bias parameters.
    """
    def __init__(self, ndim: int, bias: bool):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(ndim))
        self.bias = nn.Parameter(torch.zeros(ndim)) if bias else None

    def forward(self, x):
        return F.layer_norm(x, self.weight.shape, self.weight, self.bias, 1e-5)

class SelfAttention(nn.Module):
    """
    Multi-head causal self-attention mechanism.
    
    Implements scaled dot-product attention with a causal mask to prevent attending
    to future positions. Projects input into key, query, and value vectors.
    
    Attributes:
        n_head (int): Number of attention heads
        n_embd (int): Embedding dimension
        dropout (float): Dropout probability
        bias (torch.Tensor): Causal attention mask
    """
    def __init__(self, config):
        super().__init__()
        assert config.n_embd % config.n_head == 0
        
        # key, query, value projections
        self.kqv = nn.Linear(config.n_embd, 3 * config.n_embd, bias=config.bias)
        # output projection
        self.proj = nn.Linear(config.n_embd, config.n_embd, bias=config.bias)
        
        self.n_head = config.n_head
        self.n_embd = config.n_embd
        self.dropout = config.dropout
        
        # causal mask to ensure attention only looks at previous tokens
        self.register_buffer(
            "bias", 
            torch.tril(torch.ones(config.block_size, config.block_size))
                .view(1, 1, config.block_size, config.block_size)
        )

    def forward(self, x):
        B, T, C = x.shape  # batch, sequence length, embedding dim
        
        # calculate query, key, values for all heads in batch
        k, q, v = self.kqv(x).split(self.n_embd, dim=2)
        k = k.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)
        q = q.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)
        v = v.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)

        # causal self-attention; Self-attend: (B, nh, T, hs) x (B, nh, hs, T) -> (B, nh, T, T)
        att = (q @ k.transpose(-2, -1)) * (1.0 / math.sqrt(k.size(-1)))  # scale dot products
        att = att.masked_fill(self.bias[:,:,:T,:T] == 0, float('-inf'))  # mask future positions
        att = F.softmax(att, dim=-1)  # normalize
        att = F.dropout(att, p=self.dropout, training=self.training)
        y = att @ v  # apply attention to values
        y = y.transpose(1, 2).contiguous().view(B, T, C)  # restore shape
        
        return self.proj(y)

class MLP(nn.Module):
    """
    Multi-layer perceptron.
    
    A simple feed-forward network applied position-wise, consisting of:
    - Linear projection to 4x dimension
    - GELU activation
    - Dropout
    - Linear projection back to original dimension
    """
    def __init__(self, config):
        super().__init__()
        self.fc1 = nn.Linear(config.n_embd, 4 * config.n_embd, bias=config.bias)
        self.fc2 = nn.Linear(4 * config.n_embd, config.n_embd, bias=config.bias)
        self.dropout = config.dropout

    def forward(self, x):
        x = F.gelu(self.fc1(x))
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.fc2(x)
        return x

class Block(nn.Module):
    """
    Transformer block: communication followed by computation.
    
    Each block consists of:
    1. Layer normalization and self-attention (communication)
    2. Layer normalization and MLP (computation)
    Both paths include residual connections.
    """
    def __init__(self, config):
        super().__init__()
        self.ln1 = LayerNorm(config.n_embd, bias=config.bias)
        self.attn = SelfAttention(config)
        self.ln2 = LayerNorm(config.n_embd, bias=config.bias)
        self.mlp = MLP(config)

    def forward(self, x):
        x = x + self.attn(self.ln1(x))  # attention residual connection
        x = x + self.mlp(self.ln2(x))   # mlp residual connection
        return x

class GPT(nn.Module):
    """
    The full GPT language model, with token embeddings, positional embeddings,
    and a stack of transformer blocks.
    
    Architecture:
    1. Token embeddings: Convert token IDs to vectors
    2. Positional embeddings: Add position information
    3. Dropout: Applied to the combined embeddings
    4. Transformer blocks: Process the sequence
    5. Final layer norm
    6. Language model head: Project to vocabulary size
    
    The model can:
    - Compute loss for training (forward)
    - Generate text autoregressively (generate)
    """
    
    def __init__(self, config):
        super().__init__()
        self.config = config
        
        self.transformer = nn.ModuleDict(dict(
            wte = nn.Embedding(config.vocab_size, config.n_embd),  # token embeddings
            wpe = nn.Embedding(config.block_size, config.n_embd),  # position embeddings
            drop = nn.Dropout(config.dropout),
            h = nn.ModuleList([Block(config) for _ in range(config.n_layer)]),
            ln_f = LayerNorm(config.n_embd, bias=config.bias),
        ))
        self.lm_head = nn.Linear(config.n_embd, config.vocab_size, bias=False)
        
        # initialize weights
        self.apply(self._init_weights)

    def _init_weights(self, module):
        """Initialize weights with small random values."""
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(self, idx, targets=None):
        """
        Forward pass of the model.
        
        Args:
            idx: (batch_size, sequence_length) tensor of token indices
            targets: Optional (batch_size, sequence_length) tensor of target tokens
            
        Returns:
            logits: (batch_size, sequence_length, vocab_size) tensor of predictions
            loss: Optional scalar tensor of cross-entropy loss
        """
        device = idx.device
        b, t = idx.size()
        pos = torch.arange(0, t, dtype=torch.long, device=device)
        
        # forward the GPT model itself
        tok_emb = self.transformer.wte(idx)  # token embeddings
        pos_emb = self.transformer.wpe(pos)  # position embeddings
        x = self.transformer.drop(tok_emb + pos_emb)
        for block in self.transformer.h:
            x = block(x)
        x = self.transformer.ln_f(x)
        logits = self.lm_head(x)

        # compute loss if targets provided
        loss = None
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))

        return logits, loss

    @torch.no_grad()
    def generate(self, idx, max_new_tokens, temperature=1.0, top_k=None, top_p=None):
        """
        Generate text autoregressively.
        
        Args:
            idx: (batch_size, sequence_length) tensor of starting token indices
            max_new_tokens: Number of tokens to generate
            temperature: Sampling temperature (higher = more random)
            top_k: Number of top tokens to sample from (None = disabled)
            top_p: Cumulative probability threshold for nucleus sampling
            
        Returns:
            idx: (batch_size, sequence_length + max_new_tokens) tensor of token indices
        """
        for _ in range(max_new_tokens):
            # crop context if needed
            idx_cond = idx if idx.size(1) <= self.config.block_size else idx[:, -self.config.block_size:]
            # get predictions
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / temperature
            
            # apply sampling strategies
            if top_k is not None:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = -float('inf')
            if top_p is not None:
                sorted_logits, sorted_indices = torch.sort(logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                sorted_indices_to_remove = cumulative_probs > top_p
                sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                sorted_indices_to_remove[..., 0] = 0
                indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                logits[indices_to_remove] = -float('inf')
            
            # sample from the distribution
            probs = F.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
            # append sampled index to the running sequence
            idx = torch.cat((idx, idx_next), dim=1)

        return idx 