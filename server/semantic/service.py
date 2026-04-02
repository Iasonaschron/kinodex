"""
Semantic Search Microservice
=============================
Uses sentence-transformers (all-MiniLM-L6-v2) to embed MovieLens movie
descriptions and serve cosine-similarity-based "vibe" search.

On first run:
  1. Downloads the MovieLens ml-latest-small dataset (~3 MB zip).
  2. Builds a text description per movie from title + genres + user tags.
  3. Embeds all descriptions and caches to disk (data/embeddings.npy +
     data/records.json) so subsequent starts are fast (~1–2 s).

Exposes:
  POST /search   { "query": "...", "top_k": 10 }
                 → { "results": [ { title, year, genres, imdb_id, score } ] }
  GET  /health   → { "ok": true }

Start with:
  python service.py
  (or: uvicorn service:app --port 5001, after swapping Flask for FastAPI)
"""

import csv
import io
import json
import os
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np
import requests
from flask import Flask, jsonify, request
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATASET_URL = (
    "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
)
DATA_DIR = Path(__file__).parent / "data"
EMBEDDINGS_FILE = DATA_DIR / "embeddings.npy"
RECORDS_FILE = DATA_DIR / "records.json"
MODEL_NAME = "all-MiniLM-L6-v2"

# ---------------------------------------------------------------------------
# Globals (populated at startup)
# ---------------------------------------------------------------------------

model: SentenceTransformer = None
embeddings: np.ndarray = None   # shape (N, 384), L2-normalised
movie_records: list = None      # list of { title, year, genres, imdb_id }

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Dataset helpers
# ---------------------------------------------------------------------------


def _download_dataset() -> None:
    """Download the MovieLens zip to DATA_DIR if not already present."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = DATA_DIR / "ml-latest-small.zip"
    if zip_path.exists():
        return
    print("Downloading MovieLens ml-latest-small dataset…", flush=True)
    response = requests.get(DATASET_URL, stream=True, timeout=60)
    response.raise_for_status()
    with open(zip_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=65536):
            f.write(chunk)
    print("Download complete.", flush=True)


def _read_zip_csv(zip_path: Path, filename: str) -> str:
    with zipfile.ZipFile(zip_path) as zf:
        return zf.read(f"ml-latest-small/{filename}").decode("utf-8")


def _build_corpus():
    """
    Parse the MovieLens CSVs and return (records, descriptions).

    records      — list of dicts: { title, year, genres, imdb_id }
    descriptions — list of strings to embed (one per movie)
    """
    zip_path = DATA_DIR / "ml-latest-small.zip"
    movies_csv = _read_zip_csv(zip_path, "movies.csv")
    links_csv = _read_zip_csv(zip_path, "links.csv")
    tags_csv = _read_zip_csv(zip_path, "tags.csv")

    # movies.csv  — movieId, title, genres
    movies = {}
    for row in csv.DictReader(io.StringIO(movies_csv)):
        movies[row["movieId"]] = {
            "raw_title": row["title"],
            "genres": row["genres"].replace("|", ", "),
        }

    # links.csv   — movieId, imdbId, tmdbId
    links = {}
    for row in csv.DictReader(io.StringIO(links_csv)):
        if row.get("imdbId"):
            # Pad to 7 digits and prepend "tt" to match OMDb / IMDb format.
            links[row["movieId"]] = f"tt{row['imdbId'].zfill(7)}"

    # tags.csv    — userId, movieId, tag, timestamp
    # Aggregate up to 5 unique tags per movie to enrich the description.
    movie_tags: dict[str, list[str]] = defaultdict(list)
    for row in csv.DictReader(io.StringIO(tags_csv)):
        tag = row["tag"].strip().lower()
        existing = movie_tags[row["movieId"]]
        if tag not in existing:
            existing.append(tag)

    records = []
    descriptions = []

    for movie_id, m in movies.items():
        raw_title = m["raw_title"]

        # Extract "(YYYY)" from the end of the title string.
        year = ""
        if raw_title.endswith(")") and len(raw_title) > 6 and raw_title[-5] == "(":
            year = raw_title[-5:-1]
            clean_title = raw_title[:-7].strip()
        else:
            clean_title = raw_title

        imdb_id = links.get(movie_id, "")
        genres = m["genres"]
        tags = movie_tags[movie_id][:5]

        # Build the text that will be embedded.
        # Format: "Title | Genre1, Genre2 | tag1 tag2 tag3"
        parts = [clean_title]
        if genres and genres != "(no genres listed)":
            parts.append(genres)
        if tags:
            parts.append(" ".join(tags))
        description = " | ".join(parts)

        records.append(
            {
                "title": clean_title,
                "year": year,
                "genres": genres,
                "imdb_id": imdb_id,
            }
        )
        descriptions.append(description)

    return records, descriptions


# ---------------------------------------------------------------------------
# Startup: load or build embeddings
# ---------------------------------------------------------------------------


def _load_or_build() -> None:
    global model, embeddings, movie_records

    print("Loading sentence-transformers model…", flush=True)
    model = SentenceTransformer(MODEL_NAME)

    if EMBEDDINGS_FILE.exists() and RECORDS_FILE.exists():
        print("Loading cached embeddings…", flush=True)
        embeddings = np.load(str(EMBEDDINGS_FILE))
        with open(RECORDS_FILE, encoding="utf-8") as f:
            movie_records = json.load(f)
        print(f"Ready — {len(movie_records)} movies indexed.", flush=True)
        return

    # Cache miss: download dataset and build from scratch.
    _download_dataset()
    print("Building corpus…", flush=True)
    records, descriptions = _build_corpus()

    print(f"Embedding {len(descriptions)} movies (this takes a minute)…", flush=True)
    raw = model.encode(descriptions, show_progress_bar=True, batch_size=128)

    # L2-normalise so cosine similarity reduces to a dot product at query time.
    norms = np.linalg.norm(raw, axis=1, keepdims=True)
    normalised = raw / np.maximum(norms, 1e-9)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    np.save(str(EMBEDDINGS_FILE), normalised)
    with open(RECORDS_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)

    embeddings = normalised
    movie_records = records
    print(f"Done. {len(records)} movies indexed and cached.", flush=True)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})


@app.route("/search", methods=["POST"])
def search():
    data = request.get_json(silent=True) or {}
    query = str(data.get("query", "")).strip()
    top_k = min(int(data.get("top_k", 10)), 50)  # cap at 50

    if not query:
        return jsonify({"error": "query is required"}), 400

    # Embed and normalise the query vector.
    query_vec = model.encode([query])[0]
    norm = float(np.linalg.norm(query_vec))
    if norm > 0:
        query_vec = query_vec / norm

    # Cosine similarity = dot product (both sides are L2-normalised).
    scores = embeddings @ query_vec  # shape (N,)
    top_indices = np.argsort(scores)[::-1][:top_k]

    results = []
    for idx in top_indices:
        r = movie_records[int(idx)]
        results.append(
            {
                "title": r["title"],
                "year": r["year"],
                "genres": r["genres"],
                "imdb_id": r["imdb_id"],
                "score": float(scores[idx]),
            }
        )

    return jsonify({"results": results})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    _load_or_build()
    port = int(os.environ.get("SEMANTIC_PORT", 5001))
    app.run(host="0.0.0.0", port=port)
