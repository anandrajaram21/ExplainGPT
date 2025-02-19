"""
TinyStories Dataset Preparation
------------------------------
This script downloads and processes the TinyStories dataset for training a GPT model.
It handles:
1. Downloading the dataset from HuggingFace
2. Tokenizing the text using GPT-2 tokenizer
3. Converting tokens to tensors
4. Saving processed data for training

The script processes both training and validation splits, tracking statistics about
the dataset such as token counts and sequence lengths.

Usage:
    python prepare.py  # Saves processed data to the same directory
    
Output:
    - train.pt: Training data tensor
    - val.pt: Validation data tensor
"""

import os
import torch
import tiktoken
from datasets import load_dataset
from tqdm import tqdm
from utils.logger import setup_logger

logger = setup_logger(__name__)

def prepare_dataset(save_dir=None):
    """
    Prepare the TinyStories dataset for training.
    
    This function:
    1. Downloads the raw dataset
    2. Tokenizes all stories
    3. Concatenates tokens into continuous sequences
    4. Saves the processed data as PyTorch tensors
    
    Args:
        save_dir (str, optional): Directory to save processed data.
            Defaults to script directory.
    
    Returns:
        tuple: Paths to saved (train_data, val_data) files
    
    Statistics tracked:
        - Number of tokens
        - Number of stories
        - Sequence lengths
        - Total dataset size
    """
    if save_dir is None:
        save_dir = os.path.dirname(__file__)
    
    logger.info("Starting dataset preparation...")
    logger.info(f"Data will be saved to: {save_dir}")
    
    # Download and load dataset
    logger.info("Downloading TinyStories dataset from HuggingFace...")
    dataset = load_dataset("roneneldan/TinyStories")
    logger.info(f"Dataset downloaded - Train: {len(dataset['train']):,} stories, "
               f"Val: {len(dataset['validation']):,} stories")
    
    # Initialize tokenizer
    logger.info("Initializing GPT-2 tokenizer...")
    enc = tiktoken.get_encoding("gpt2")
    
    def process_text(example):
        """
        Tokenize a single text example.
        
        Args:
            example (dict): Dataset example containing 'text' field
            
        Returns:
            dict: Processed example with token IDs and length
        """
        ids = enc.encode_ordinary(example['text'])
        return {'ids': ids, 'len': len(ids)}
    
    # Track dataset statistics
    stats = {
        'n_tokens': 0,        # Total number of tokens
        'n_sequences': 0,     # Number of stories
        'seq_lengths': [],    # Length of each story
        'max_length': 0,      # Longest story length
        'min_length': float('inf')  # Shortest story length
    }
    
    # Process training data
    logger.info("Processing training split...")
    train_data = []
    for item in tqdm(dataset['train'], desc="Training split"):
        processed = process_text(item)
        train_data.extend(processed['ids'])
        
        # Update statistics
        stats['n_tokens'] += processed['len']
        stats['n_sequences'] += 1
        stats['seq_lengths'].append(processed['len'])
        stats['max_length'] = max(stats['max_length'], processed['len'])
        stats['min_length'] = min(stats['min_length'], processed['len'])
    
    # Process validation data
    logger.info("Processing validation split...")
    val_data = []
    for item in tqdm(dataset['validation'], desc="Validation split"):
        processed = process_text(item)
        val_data.extend(processed['ids'])
    
    # Convert to tensors
    logger.info("Converting to PyTorch tensors...")
    train_data = torch.tensor(train_data, dtype=torch.long)
    val_data = torch.tensor(val_data, dtype=torch.long)
    
    # Save processed data
    train_path = os.path.join(save_dir, 'train.pt')
    val_path = os.path.join(save_dir, 'val.pt')
    
    logger.info("Saving processed data...")
    torch.save(train_data, train_path)
    torch.save(val_data, val_path)
    
    # Log final statistics
    avg_seq_length = stats['n_tokens'] / stats['n_sequences']
    logger.info("Dataset preparation completed successfully!")
    logger.info(f"Training set: {len(train_data):,} tokens")
    logger.info(f"Validation set: {len(val_data):,} tokens")
    logger.info(f"Number of stories: {stats['n_sequences']:,}")
    logger.info(f"Average story length: {avg_seq_length:.1f} tokens")
    logger.info(f"Shortest story: {stats['min_length']} tokens")
    logger.info(f"Longest story: {stats['max_length']} tokens")
    logger.info(f"Data saved to: {train_path} and {val_path}")
    
    return train_path, val_path

if __name__ == '__main__':
    prepare_dataset()

