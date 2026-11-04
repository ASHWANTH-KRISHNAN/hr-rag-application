from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)

class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)

class Source(BaseModel):
    filename: str
    chunk_id: str
    distance: float | None = None

class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]

class IngestResponse(BaseModel):
    indexed_chunks: int
    files_processed: int
    message: str
