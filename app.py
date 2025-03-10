"""
Streamlit app for the ExplainGPT model.
Provides a web interface for story generation with adjustable parameters.
"""

import streamlit as st
import torch
import os
from model.gpt import GPT
from config.train_tinystories import TrainingConfig
from sample import generate_story

# Page config
st.set_page_config(
    page_title="ExplainGPT Story Generator",
    page_icon="📚",
    layout="wide"
)

@st.cache_resource
def load_gpt_model():
    """Load the GPT model with error handling."""
    try:
        if not os.path.exists('best_model.pt'):
            st.error("Model file 'best_model.pt' not found. Please train the model first.")
            return None
            
        # Initialize model
        config = TrainingConfig()
        model = GPT(config)
        
        # Load state dict
        state_dict = torch.load('best_model.pt', map_location=config.device)
        model.load_state_dict(state_dict)
        
        # Move to device and set eval mode
        model = model.to(config.device)
        model.eval()
        
        return model
    except Exception as e:
        st.error(f"Error loading model: {str(e)}")
        return None

def main():
    # Title and description
    st.title("📚 ExplainGPT Story Generator")
    st.markdown("""
    This app uses a small GPT model trained on the TinyStories dataset to generate short stories.
    Enter a prompt and adjust the generation parameters to create different stories.
    """)
    
    # Load model
    model = load_gpt_model()
    
    if model is None:
        st.stop()
    
    # Input section
    st.header("Story Generation")
    
    # Text input for prompt
    prompt = st.text_area(
        "Enter your prompt:",
        value="Once upon a time,",
        height=100,
        help="Enter the beginning of your story here."
    )
    
    # Generation parameters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        temperature = st.slider(
            "Temperature",
            min_value=0.1,
            max_value=1.0,
            value=0.8,
            step=0.1,
            help="Higher values make the output more random, lower values make it more focused."
        )
    
    with col2:
        top_p = st.slider(
            "Top-p (nucleus sampling)",
            min_value=0.1,
            max_value=1.0,
            value=0.9,
            step=0.1,
            help="Cumulative probability threshold for nucleus sampling."
        )
    
    with col3:
        max_tokens = st.slider(
            "Maximum length",
            min_value=50,
            max_value=500,
            value=200,
            step=50,
            help="Maximum number of tokens to generate."
        )
    
    # Generation button
    if st.button("Generate Story", type="primary"):
        with st.spinner("Generating story..."):
            try:
                # Generate story
                story = generate_story(
                    prompt,
                    model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p
                )
                
                # Display story
                st.subheader("Generated Story")
                st.markdown(f"```{story}```")
                
                # Display generation info
                st.info(f"""
                Generation parameters:
                - Temperature: {temperature}
                - Top-p: {top_p}
                - Max tokens: {max_tokens}
                """)
                
            except Exception as e:
                st.error(f"Error generating story: {str(e)}")
    
    # Model information
    st.header("Model Information")
    st.markdown(f"""
    - Model architecture: {model.config.n_layer} layers, {model.config.n_head} heads
    - Embedding dimension: {model.config.n_embd}
    - Context window: {model.config.block_size} tokens
    - Total parameters: {sum(p.numel() for p in model.parameters()):,}
    """)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    This app uses a minimal GPT implementation trained on the TinyStories dataset.
    The model is designed to generate simple, coherent stories suitable for children.
    """)

if __name__ == "__main__":
    main() 