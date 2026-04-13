from __future__ import annotations

from pathlib import Path
from typing import Optional

from langchain_community.document_loaders import TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import settings


class FarmingRAG:
  def __init__(self) -> None:
    self._vectorstore: Optional[FAISS] = None

  @property
  def vectorstore_path(self) -> Path:
    settings.vectorstore_dir.mkdir(parents=True, exist_ok=True)
    return settings.vectorstore_dir / "faiss_index"

  def _get_embeddings(self) -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
      model_name="sentence-transformers/all-MiniLM-L6-v2",
      model_kwargs={"device": "cpu"},
      encode_kwargs={"normalize_embeddings": True},
    )

  def _load_documents(self) -> list:
    md_path = settings.farming_markdown_path
    if not md_path.exists():
      raise FileNotFoundError(
        f"Farming data file not found at {md_path}. "
        "Please make sure Farming_Data_RAG.md exists at the project root."
      )

    loader = TextLoader(str(md_path), encoding="utf-8")
    return loader.load()

  def _build_vectorstore(self) -> FAISS:
    documents = self._load_documents()
    splitter = RecursiveCharacterTextSplitter(
      chunk_size=900,
      chunk_overlap=150,
      separators=["\n\n", "\n", ".", " "],
    )
    splits = splitter.split_documents(documents)
    embeddings = self._get_embeddings()
    vectorstore = FAISS.from_documents(splits, embeddings)
    vectorstore.save_local(str(self.vectorstore_path))
    self._vectorstore = vectorstore
    return vectorstore

  def load_or_create_vectorstore(self) -> FAISS:
    if self._vectorstore is not None:
      return self._vectorstore

    if self.vectorstore_path.exists():
      embeddings = self._get_embeddings()
      self._vectorstore = FAISS.load_local(
        str(self.vectorstore_path),
        embeddings,
        allow_dangerous_deserialization=True,
      )
      return self._vectorstore

    return self._build_vectorstore()

  def ingest(self) -> dict:
    vectorstore = self._build_vectorstore()
    return {
      "status": "ok",
      "documents_indexed": vectorstore.index.ntotal,
      "source_path": str(settings.farming_markdown_path),
    }

  def ask(self, question: str) -> dict:
    if not settings.groq_api_key:
      raise ValueError("GROQ_API_KEY is not set in .env")

    vectorstore = self.load_or_create_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    docs = retriever.invoke(question)
    context_text = "\n\n".join(doc.page_content for doc in docs)

    system_prompt = """You are an agronomy expert for the Farm To Home AI Assistant.
Use ONLY the provided context to answer. If the context lacks detail, say so clearly.
Give practical, field-ready guidance in 3-6 bullet points.
Do not guess pesticide doses or fertiliser rates not in the context.
Always respond in the same language as the user.

Context:
{context}"""

    prompt = ChatPromptTemplate.from_messages([
      ("system", system_prompt),
      ("human", "{input}"),
    ])

    llm = ChatGroq(
      model="llama-3.3-70b-versatile",
      api_key=settings.groq_api_key,
      temperature=0.2,
    )

    chain = prompt | llm | StrOutputParser()
    answer = chain.invoke({"context": context_text, "input": question})

    sources = []
    for doc in docs:
      metadata = doc.metadata or {}
      sources.append({
        "source": metadata.get("source", str(settings.farming_markdown_path)),
        "start_index": metadata.get("start_index"),
      })

    return {"answer": answer, "response": answer, "sources": sources}


rag_pipeline = FarmingRAG()
