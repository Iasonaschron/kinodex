import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { authedFetch } from "../api.js";
import ListCard from "./Listcard";
import "../styles.css";

const API_KEY = "295a9366";

function getGreeting() {
    const h = new Date().getHours();
    if (h < 5)  return "Still up";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Good night";
}

export default function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const username = user?.username;

    const [searchInput, setSearchInput]     = useState("");
    const [searchMode, setSearchMode]       = useState("title");
    const [recommendations, setRecs]        = useState([]);
    const [recsLoading, setRecsLoading]     = useState(true);
    const [mylists, setMyLists]             = useState([]);
    const [listPreviews, setListPreviews]   = useState({});

    // Popup state
    const [popupOpen, setPopupOpen]         = useState(false);
    const [popupMovie, setPopupMovie]       = useState(null);   // OMDb object
    const [popupLoading, setPopupLoading]   = useState(false);
    const [popupError, setPopupError]       = useState("");
    const [popupImdbID, setPopupImdbID]     = useState("");
    const dialogRef = useRef(null);

    useEffect(() => {
        document.body.classList.add("retro-dark");
        return () => document.body.classList.remove("retro-dark");
    }, []);

    // Fetch personalised recommendations
    useEffect(() => {
        if (!username) return;
        let cancelled = false;
        (async () => {
            setRecsLoading(true);
            try {
                const res = await authedFetch("/api/recommendations");
                if (!res.ok) throw new Error();
                const { recommendations: ids } = await res.json();
                if (cancelled || !ids?.length) return;
                const details = await Promise.all(
                    ids.map(id =>
                        fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`)
                            .then(r => r.json())
                            .catch(() => null)
                    )
                );
                if (!cancelled)
                    setRecs(details.filter(m => m && m.Response !== "False"));
            } catch { /* fail silently */ }
            finally { if (!cancelled) setRecsLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [username]);

    // Fetch list names + preview IDs
    useEffect(() => {
        if (!username) return;
        (async () => {
            try {
                const res = await fetch(
                    `http://localhost:3001/api/lists/${encodeURIComponent(username)}`
                );
                if (!res.ok) return;
                const data = await res.json();
                setMyLists(data.map(l => l.name));
                // Fetch preview IDs for each list (first 4 movies)
                data.forEach(async (l) => {
                    try {
                        const r = await fetch(
                            `http://localhost:3001/api/lists/${encodeURIComponent(username)}/${encodeURIComponent(l.name)}/items`
                        );
                        const items = await r.json();
                        const ids = (items || []).slice(0, 4).map(x => x.movie_id);
                        setListPreviews(prev => ({ ...prev, [l.name]: ids }));
                    } catch { /* ignore */ }
                });
            } catch { /* ignore */ }
        })();
    }, [username]);

    // Open / close the movie detail dialog
    useEffect(() => {
        const el = dialogRef.current;
        if (!el) return;
        if (popupOpen && !el.open) el.showModal();
        else if (!popupOpen && el.open) el.close();
    }, [popupOpen]);

    // Load OMDb details when popup opens
    useEffect(() => {
        if (!popupOpen || !popupImdbID) return;
        let cancelled = false;
        setPopupLoading(true);
        setPopupError("");
        setPopupMovie(null);
        (async () => {
            try {
                const res = await fetch(
                    `https://www.omdbapi.com/?apikey=${API_KEY}&i=${popupImdbID}&plot=full`
                );
                const data = await res.json();
                if (!cancelled) {
                    if (data.Response === "False") setPopupError(data.Error || "Not found.");
                    else setPopupMovie(data);
                }
            } catch {
                if (!cancelled) setPopupError("Network error.");
            } finally {
                if (!cancelled) setPopupLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [popupOpen, popupImdbID]);

    const openMovie = (imdbID) => {
        setPopupImdbID(imdbID);
        setPopupOpen(true);
    };

    const closePopup = () => {
        setPopupOpen(false);
        setPopupImdbID("");
        setPopupMovie(null);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const q = searchInput.trim();
        if (!q) return;
        navigate(`/dashboard?q=${encodeURIComponent(q)}&mode=${searchMode}`);
    };

    return (
        <>
            {/* ── Movie detail popup ─────────────────────────────────── */}
            <dialog
                id="home-detail"
                ref={dialogRef}
                onClose={closePopup}
            >
                <button
                    id="close-menu"
                    onClick={closePopup}
                    aria-label="Close"
                >✖</button>

                <div className="movie-sheet">
                    <header className="movie-sheet__header">
                        <div>
                            <h2 className="movie-sheet__title">
                                {popupMovie?.Title ?? ""}
                            </h2>
                            <div className="movie-sheet__meta">
                                {popupMovie?.Year    && <span>{popupMovie.Year}</span>}
                                {popupMovie?.Rated   && <span>{popupMovie.Rated}</span>}
                                {popupMovie?.Runtime && <span>{popupMovie.Runtime}</span>}
                                {popupMovie?.Genre   && <span>{popupMovie.Genre}</span>}
                            </div>
                        </div>
                    </header>

                    <section className="movie-sheet__body">
                        <div className="movie-sheet__poster-wrap">
                            {popupLoading
                                ? <div className="skeleton skeleton--poster" />
                                : <img
                                    className="movie-sheet__poster"
                                    src={
                                        popupMovie?.Poster && popupMovie.Poster !== "N/A"
                                            ? popupMovie.Poster
                                            : "assets/nomovie.jpg"
                                    }
                                    alt={popupMovie?.Title ?? ""}
                                    loading="lazy"
                                />
                            }
                        </div>

                        <div className="movie-sheet__info">
                            {popupLoading && (
                                <>
                                    <div className="skeleton skeleton--line" />
                                    <div className="skeleton skeleton--line" />
                                    <div className="skeleton skeleton--para" />
                                </>
                            )}
                            {!popupLoading && popupError && (
                                <p className="movie-sheet__error">{popupError}</p>
                            )}
                            {!popupLoading && !popupError && popupMovie && (
                                <>
                                    {popupMovie.imdbRating && popupMovie.imdbRating !== "N/A" && (
                                        <p className="movie-sheet__rating">
                                            IMDb: <strong>{popupMovie.imdbRating}</strong>/10
                                        </p>
                                    )}
                                    {popupMovie.Plot && popupMovie.Plot !== "N/A" && (
                                        <p className="movie-sheet__plot">{popupMovie.Plot}</p>
                                    )}
                                    <dl className="movie-sheet__facts">
                                        {popupMovie.Director && popupMovie.Director !== "N/A" && (
                                            <><dt>Director</dt><dd>{popupMovie.Director}</dd></>
                                        )}
                                        {popupMovie.Actors && popupMovie.Actors !== "N/A" && (
                                            <><dt>Cast</dt><dd>{popupMovie.Actors}</dd></>
                                        )}
                                        {popupMovie.Released && popupMovie.Released !== "N/A" && (
                                            <><dt>Released</dt><dd>{popupMovie.Released}</dd></>
                                        )}
                                    </dl>

                                    {/* CTA — goes to Dashboard where they can actually add to a list */}
                                    <button
                                        className="home-popup-cta"
                                        onClick={() => {
                                            closePopup();
                                            navigate("/dashboard", {
                                                state: {
                                                    openMovie: {
                                                        imdbID: popupImdbID,
                                                        Title: popupMovie.Title,
                                                    },
                                                },
                                            });
                                        }}
                                    >
                                        + Add to a list
                                    </button>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </dialog>

            {/* ── Top bar ────────────────────────────────────────────── */}
            <header id="header-home" className="appbar">
                <div className="appbar__row">
                    <h1 className="brand">kinodex</h1>

                    {/* Search — navigates to Dashboard with query */}
                    <form
                        className="home-searchbar"
                        role="search"
                        onSubmit={handleSearch}
                    >
                        <button
                            type="button"
                            className={`vibe-toggle${searchMode === "vibe" ? " vibe-toggle--active" : ""}`}
                            onClick={() => setSearchMode(m => m === "vibe" ? "title" : "vibe")}
                            title={
                                searchMode === "vibe"
                                    ? "Vibe Search on — click to switch to Title Search"
                                    : "Switch to Vibe Search: describe a mood or theme"
                            }
                            aria-pressed={searchMode === "vibe"}
                        >
                            ✦
                        </button>
                        <input
                            type="search"
                            placeholder={
                                searchMode === "vibe"
                                    ? "Describe a vibe or mood…"
                                    : "Search movies…"
                            }
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                        <button type="submit" className="icon-btn" aria-label="Search">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="11" cy="11" r="7" />
                                <path d="M20 20l-3.5-3.5" />
                            </svg>
                        </button>
                    </form>

                    <div className="appbar__actions">
                        <button
                            className="buttons-header-class"
                            onClick={() => navigate("/dashboard")}
                        >
                            My Lists
                        </button>
                        <button className="buttons-header-class" onClick={logout}>
                            Log out
                        </button>
                        <div className="avatar" title={username}>
                            {(username || "U").slice(0, 1).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main content ───────────────────────────────────────── */}
            <main className="home-main">

                {/* Greeting */}
                <section className="home-hero">
                    <p className="home-greeting">
                        {getGreeting()}, <strong>{username}</strong>
                    </p>
                    <p className="home-sub">
                        Here's what's waiting for you
                    </p>
                </section>

                {/* For You */}
                <section className="home-section">
                    <h2 className="home-section-title">
                        For You
                        <span
                            className="for-you-tooltip"
                            title="Recommendations powered by MinHash collaborative filtering — based on what users with similar taste have saved"
                        >
                            &nbsp;ⓘ
                        </span>
                    </h2>

                    {recsLoading ? (
                        <div className="home-rec-row">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="home-rec-card home-rec-card--skel">
                                    <div className="home-rec-card__poster skeleton" />
                                    <div className="skeleton skeleton--line" style={{ marginTop: 8, width: "75%" }} />
                                </div>
                            ))}
                        </div>
                    ) : recommendations.length === 0 ? (
                        <p className="home-empty">
                            Save some movies to your lists and we'll recommend what to watch next.
                        </p>
                    ) : (
                        <div className="home-rec-row">
                            {recommendations.map(movie => (
                                <button
                                    key={movie.imdbID}
                                    className="home-rec-card"
                                    onClick={() => openMovie(movie.imdbID)}
                                >
                                    <div className="home-rec-card__poster">
                                        <img
                                            src={
                                                movie.Poster && movie.Poster !== "N/A"
                                                    ? movie.Poster
                                                    : "assets/nomovie.jpg"
                                            }
                                            alt={movie.Title}
                                            loading="lazy"
                                        />
                                    </div>
                                    <p className="home-rec-title">{movie.Title}</p>
                                    <p className="home-rec-year">{movie.Year}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* My Lists — thumbnail grid */}
                {mylists.length > 0 && (
                    <section className="home-section">
                        <h2 className="home-section-title">My Lists</h2>
                        <div className="home-lists-grid">
                            {mylists.map(name => (
                                <ListCard
                                    key={name}
                                    title={name}
                                    previewIds={listPreviews[name] || []}
                                    onCardClick={() => navigate("/dashboard", { state: { openList: name } })}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
