from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
from schemas import ChatInput
from model import chat_service
from logger import get_logger
import json
import asyncio

logger = get_logger(__name__)
router = APIRouter()

@router.post("/")
async def chat(chat_input: ChatInput, request: Request):
    logger.info(f"Chat request received with temperature={chat_input.temperature}, max_tokens={chat_input.max_tokens}, stream={chat_input.stream}")
    
    model = request.app.state.model
    tokenizer = request.app.state.tokenizer

    if model is None:
        logger.error("Model not found")
        return JSONResponse(
            status_code=400,
            content={"status": 400, "message": "Model not found"}
        )
    if tokenizer is None:
        logger.error("Tokenizer not found")
        return JSONResponse(
            status_code=400,
            content={"status": 400, "message": "Tokenizer not found"}
        )

    try:
        # Set up the chat service with current model and tokenizer
        chat_service.set_model_tokenizer(model, tokenizer)
        
        # Format the prompt from messages
        chat_str = ""
        for msg in chat_input.messages:
            if msg.role == "user":
                chat_str += f"User: {msg.content}\n"
            elif msg.role == "assistant":
                chat_str += f"Assistant: {msg.content}\n"
        
        # Add the final prompt for assistant to respond to
        chat_str += "Assistant: "
        
        logger.debug(f"Formatted chat prompt: {chat_str[:100]}...")

        # Default max tokens if not specified or too large
        max_tokens = min(chat_input.max_tokens, 300) if chat_input.max_tokens else 300
        logger.debug(f"Using max_tokens={max_tokens} for chat generation")

        if chat_input.stream:
            async def event_generator():
                try:
                    async for token_json in chat_service.generate_stream(
                        prompt=chat_str,
                        temperature=chat_input.temperature,
                        max_tokens=max_tokens
                    ):
                        # Check for errors
                        token_data = json.loads(token_json)
                        if "error" in token_data:
                            logger.error(f"Error in stream: {token_data['error']}")
                            yield f"data: {token_json}\n\n"
                            break
                        
                        # Format as server-sent event
                        yield f"data: {token_json}\n\n"
                        
                        # Give the event loop a chance to process other tasks
                        await asyncio.sleep(0)
                        
                except Exception as e:
                    logger.error(f"Error in stream generation: {str(e)}", exc_info=True)
                    error_json = json.dumps({"error": str(e)})
                    yield f"data: {error_json}\n\n"
                finally:
                    # End the stream
                    yield "data: [DONE]\n\n"
                    logger.debug("Stream completed")
            
            return StreamingResponse(
                event_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Content-Type": "text/event-stream"
                }
            )
        else:
            try:
                assistant_response = chat_service.generate_text(
                    prompt=chat_str,
                    temperature=chat_input.temperature,
                    max_tokens=max_tokens
                )
                
                return JSONResponse(
                    content={
                        "status": 200,
                        "message": {
                            "role": "assistant",
                            "content": assistant_response
                        }
                    }
                )
            except Exception as e:
                logger.error(f"Error in chat generation: {str(e)}", exc_info=True)
                return JSONResponse(
                    status_code=500,
                    content={"status": 500, "message": f"Error generating chat response: {str(e)}"}
                )
            
    except Exception as e:
        logger.error(f"Error in chat route: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"status": 500, "message": f"Error in chat: {str(e)}"}
        ) 