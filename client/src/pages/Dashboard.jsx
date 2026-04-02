import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { authedFetch } from "../api.js";
import { createPortal } from "react-dom";
import '../styles.css';
import ListCard from "./Listcard";
import Pagination from "./Pagination";


async function apiFetch(path, { method = "GET", body, headers } = {}) {
    const res = await fetch("http://localhost:3001/api" + path, {
        method,
        headers: { "Content-Type": "application/json", ...(headers || {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        let msg = "";
        try { msg = await res.text(); } catch { }
        const err = new Error(msg || `${res.status} ${res.statusText}`);
        err.status = res.status;
        throw err;
    }
    return res.status === 204 ? null : res.json();
}


const Dashboard = () => {

    const [mylists, setMyLists] = useState([]);

    const [inputText, setInputText] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [searchResults, setSearchResults] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentList, setCurrentList] = useState(null);
    const [currentListDescription, setCurrentListDescription] = useState(null);
    const [isShowing, setIsShowing] = useState(false);
    const [showCreateListDialog, setShowCreateListDialog] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newListDescription, setNewListDescription] = useState("");
    const [movieToAdd, setMovieToAdd] = useState("");
    const [currentMovieTitle, setCurrentMovieTitle] = useState("");
    const [isViewingList, setIsViewingList] = useState(false);
    const [isEditingList, setIsEditingList] = useState(false);
    const [editDesc, setEditDesc] = useState("");
    const [previewIds, setPreviewIds] = useState({});
    const [showAddMovieDialog, setShowAddMovieDialog] = useState(false);
    const [addMovieQuery, setAddMovieQuery] = useState("");
    const [addMovieResults, setAddMovieResults] = useState([]);
    const [addMovieSearching, setAddMovieSearching] = useState(false);
    const [movieDetails, setMovieDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [toasts, setToasts] = useState([]);

    const [searchMode, setSearchMode] = useState("title");

    const popupRef = useRef(null);
    const createListDialogRef = useRef(null);
    const addMovieDialogRef = useRef(null);
    const listNameRef = useRef(null);

    const API_KEY = "295a9366";
    const PAGE_SIZE = 10;
    const { user, logout } = useAuth();
    const owner = user?.username;

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    useEffect(() => {
        document.body.classList.add("retro-dark");
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await apiFetch(`/lists/${encodeURIComponent(owner)}`);
                if (!cancelled) {
                    const normalized = data.map(l => ({ title: l.name, description: l.description }));
                    setMyLists(normalized);
                    normalized.forEach(l => refreshListPreview(l.title));
                }
            } catch (e) {
                console.warn("Failed to load lists:", e.message);
            }
        })();
        return () => { cancelled = true; };
    }, [owner]);

    async function refreshListPreview(listTitle) {
        if (!listTitle) return;
        const items = await apiFetch(
            `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}/items`
        );
        const ids = (items ?? []).map(x => x.movie_id).slice(0, 4);
        setPreviewIds(prev => ({ ...prev, [listTitle]: ids }));
    }

    useEffect(() => {
        const q = searchParams.get("q");
        const mode = searchParams.get("mode");
        if (mode === "vibe") setSearchMode("vibe");
        if (q) {
            setInputText(q);
            if (mode !== "vibe") setQuery(q);
        }
        if (location.state?.openMovie) {
            const { imdbID, Title } = location.state.openMovie;
            setTimeout(() => handleMovieClick(imdbID, Title), 50);
            navigate(location.pathname + location.search, { replace: true, state: {} });
        }
        if (location.state?.openList) {
            setTimeout(() => handleListCardClick(location.state.openList), 50);
            navigate(location.pathname + location.search, { replace: true, state: {} });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!query) return;
        const loadMovieCards = async () => {
            const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&page=${page}`;
            setCurrentList(null);
            setCurrentListDescription(null);
            setIsSearching(true);
            try {
                const res = await fetch(url);
                const data = await res.json();
                if (!data.Search) { setSearchResults([]); return; }
                setSearchResults(data.Search);
                setTotalPages(Math.ceil(data.totalResults / PAGE_SIZE));
            } catch (err) {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };
        loadMovieCards();
    }, [page, query]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setIsViewingList(false);
        if (searchMode === "vibe") {
            handleVibeSearch(inputText);
        } else {
            setPage(1);
            setQuery(inputText);
        }
    };

    const handleVibeSearch = async (vibeQuery) => {
        if (!vibeQuery.trim()) return;
        setCurrentList(null);
        setCurrentListDescription(null);
        setIsSearching(true);
        setQuery("");
        try {
            const res = await authedFetch("/api/semantic-search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: vibeQuery }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                notify("error", err.error || "Vibe search failed");
                return;
            }
            const { results } = await res.json();
            const cards = await Promise.all(
                (results ?? []).map(async (r) => {
                    if (r.imdb_id) {
                        try {
                            const omdb = await fetch(
                                `https://www.omdbapi.com/?apikey=${API_KEY}&i=${r.imdb_id}`
                            ).then(x => x.json());
                            if (omdb.Response !== "False") return omdb;
                        } catch { }
                    }
                    return {
                        imdbID: r.imdb_id || `ml-${Math.random()}`,
                        Title: r.title,
                        Year: r.year,
                        Poster: "N/A",
                        Type: "movie",
                    };
                })
            );
            setSearchResults(cards);
            setTotalPages(1);
        } catch (err) {
            notify("error", err.message || "Vibe search failed");
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (!currentList) { setSearchResults([]); return; }
        setSearchResults([]);
        setIsLoadingList(true);
        const loadListMovies = async () => {
            setTotalPages(1);
            setQuery("");
            try {
                let movies = await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/items`);
                let ids = movies.map(movie => movie.movie_id);
                const items = await Promise.all(
                    ids.map(id => fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`).then(r => r.json()))
                );
                setSearchResults(items);
            } catch (err) {
                setCurrentList(null);
                setCurrentListDescription(null);
                setSearchResults([]);
            } finally {
                setIsLoadingList(false);
            }
        };
        loadListMovies();
    }, [currentList]);

    // Movie detail popup open/close + load details
    useEffect(() => {
        const popup = popupRef.current;
        if (!popup) return;
        if (isShowing && !popup.open) popup.showModal();
        else if (!isShowing && popup.open) popup.close();
        if (!isShowing || !movieToAdd) return;
        let cancelled = false;
        (async () => {
            try {
                setDetailsLoading(true);
                setDetailsError("");
                setMovieDetails(null);
                const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movieToAdd}&plot=full`);
                const data = await res.json();
                if (!cancelled) {
                    if (data.Response === "False") setDetailsError(data.Error || "Failed to load details.");
                    else setMovieDetails(data);
                }
            } catch (e) {
                if (!cancelled) setDetailsError("Network error while loading details.");
            } finally {
                if (!cancelled) setDetailsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [isShowing]);

    // Create list dialog open/close
    useEffect(() => {
        const el = createListDialogRef.current;
        if (!el) return;
        if (showCreateListDialog && !el.open) el.showModal();
        else if (!showCreateListDialog && el.open) el.close();
    }, [showCreateListDialog]);

    // Add movie dialog open/close
    useEffect(() => {
        const el = addMovieDialogRef.current;
        if (!el) return;
        if (showAddMovieDialog && !el.open) el.showModal();
        else if (!showAddMovieDialog && el.open) el.close();
    }, [showAddMovieDialog]);

    const handleOnClose = () => {
        setIsShowing(false);
        setMovieToAdd("");
        setNewListDescription("");
        setNewListName("");
        if (listNameRef.current) listNameRef.current.reset();
    };

    const handleNewListSubmit = async (e) => {
        e.preventDefault();
        if (mylists.find(l => l.title === newListName)) {
            notify("error", "A list with that name already exists");
            return;
        }
        try {
            await apiFetch(`/lists/${encodeURIComponent(owner)}`, {
                method: "POST",
                body: { title: newListName, description: newListDescription }
            });
            setMyLists(prev => [...prev, { title: newListName, description: newListDescription }]);
            notify("success", `Created "${newListName}"`);
            if (listNameRef.current) listNameRef.current.reset();
            setNewListDescription("");
            setNewListName("");
            setShowCreateListDialog(false);
        } catch (err) {
            notify("error", err.message || "Create list failed");
        }
    };

    const handleMovieClick = (movieId, movieTitle) => {
        setIsShowing(true);
        setMovieToAdd(movieId);
        setCurrentMovieTitle(movieTitle);
    };

    const addToList = async (listTitle) => {
        try {
            await apiFetch(
                `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}/items`,
                { method: "POST", body: { movie_id: movieToAdd } }
            );
            if (currentList === listTitle) {
                const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movieToAdd}`);
                const movie = await res.json();
                setSearchResults(prev => [movie, ...prev]);
            }
            const items = await apiFetch(
                `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}/items`
            );
            setPreviewIds(prev => ({ ...prev, [listTitle]: items.map(x => x.movie_id).slice(0, 4) }));
            notify("success", `Added to "${listTitle}"`);
        } catch (err) {
            if (err.status === 409 || /already/i.test(err.message)) {
                notify("info", `Already in "${listTitle}"`);
            } else {
                notify("error", err.message || "Failed to add movie");
            }
        }
    };

    const handleListCardClick = async (listTitle) => {
        setCurrentList(listTitle);
        setIsViewingList(true);
        setIsEditingList(false);
        try {
            const descr = await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}/description`);
            setCurrentListDescription(descr.description);
        } catch (e) {
            notify("error", e.message || "Failed to load description");
        }
    };

    const startEditingList = () => {
        setEditDesc(currentListDescription || "");
        setIsEditingList(true);
    };

    const handleEditDone = async () => {
        if (editDesc !== (currentListDescription || "")) {
            try {
                await apiFetch(
                    `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/description`,
                    { method: "PATCH", body: { description: editDesc } }
                );
                setCurrentListDescription(editDesc);
                setMyLists(prev => prev.map(l =>
                    l.title === currentList ? { ...l, description: editDesc } : l
                ));
                notify("success", "Description saved");
            } catch (e) {
                notify("error", "Failed to save description");
            }
        }
        setIsEditingList(false);
    };

    const handleDeleteCurrentList = async () => {
        const listToDelete = currentList;
        setIsEditingList(false);
        setIsViewingList(false);
        await handleListDelete(listToDelete);
    };

    const closeAddMovieDialog = () => {
        setShowAddMovieDialog(false);
        setAddMovieQuery("");
        setAddMovieResults([]);
    };

    const handleAddMovieSearch = async (e) => {
        e.preventDefault();
        if (!addMovieQuery.trim()) return;
        setAddMovieSearching(true);
        try {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(addMovieQuery)}`);
            const data = await res.json();
            setAddMovieResults(data.Search || []);
        } catch {
            setAddMovieResults([]);
        } finally {
            setAddMovieSearching(false);
        }
    };

    const handleAddMovieToList = async (imdbID, title) => {
        try {
            await apiFetch(
                `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/items`,
                { method: "POST", body: { movie_id: imdbID } }
            );
            const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`);
            const movie = await res.json();
            setSearchResults(prev => prev.find(m => m.imdbID === imdbID) ? prev : [movie, ...prev]);
            const items = await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/items`);
            setPreviewIds(prev => ({ ...prev, [currentList]: items.map(x => x.movie_id).slice(0, 4) }));
            notify("success", `Added "${title}"`);
        } catch (err) {
            if (err.status === 409 || /already/i.test(err.message)) {
                notify("info", `Already in this list`);
            } else {
                notify("error", err.message || "Failed to add movie");
            }
        }
    };

    const handleListDelete = async (listTitle) => {
        const before = mylists;
        try {
            await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}`, { method: "DELETE" });
            setMyLists(prev => prev.filter(l => l.title !== listTitle));
            if (currentList === listTitle) {
                setCurrentList(null);
                setCurrentListDescription(null);
                setSearchResults([]);
            }
            notify("success", `Deleted "${listTitle}"`);
        } catch (e) {
            setMyLists(before);
            notify("error", e.message || "Failed to delete list");
        }
    };

    const handleMovieDelete = async (movieSelected) => {
        try {
            await apiFetch(
                `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/items/${encodeURIComponent(movieSelected)}`,
                { method: "DELETE" }
            );
            setSearchResults(prev => prev.filter(m => m.imdbID !== movieSelected));
            const items = await apiFetch(
                `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/items`
            );
            setPreviewIds(prev => ({ ...prev, [currentList]: items.map(x => x.movie_id).slice(0, 4) }));
            notify("success", "Removed from list");
        } catch (e) {
            notify("error", e.message || "Failed to remove");
        }
    };

    function notify(type, text, ms = 2500) {
        const id = String(Date.now() + Math.random());
        setToasts(ts => [...ts, { id, type, text }]);
        if (ms) setTimeout(() => dismiss(id), ms);
    }

    function dismiss(id) {
        setToasts(ts => ts.filter(t => t.id !== id));
    }

    return (
        <>
            <ToastPortal target={(isShowing && popupRef?.current) || document.body}>
                <ToastHost toasts={toasts} dismiss={dismiss} />
            </ToastPortal>

            {/* ── Movie detail popup ─────────────────────────────── */}
            <dialog id="add-menu" onClose={handleOnClose} ref={popupRef}>
                <button id="close-menu" onClick={() => setIsShowing(false)} aria-label="Close">✖</button>

                <div className="movie-sheet">
                    <div className="movie-sheet__top">
                        <div className="movie-sheet__poster-wrap">
                            {detailsLoading
                                ? <div className="skeleton skeleton--poster" />
                                : <img
                                    className="movie-sheet__poster"
                                    src={movieDetails?.Poster && movieDetails.Poster !== "N/A" ? movieDetails.Poster : "assets/nomovie.jpg"}
                                    alt={movieDetails?.Title || currentMovieTitle}
                                    loading="lazy"
                                />
                            }
                        </div>

                        <div className="movie-sheet__info">
                            <h2 className="movie-sheet__title">{movieDetails?.Title || currentMovieTitle}</h2>
                            <div className="movie-sheet__meta">
                                {movieDetails?.Year    && <span>{movieDetails.Year}</span>}
                                {movieDetails?.Rated   && <span>{movieDetails.Rated}</span>}
                                {movieDetails?.Runtime && <span>{movieDetails.Runtime}</span>}
                                {movieDetails?.Genre   && <span>{movieDetails.Genre}</span>}
                            </div>

                            {detailsLoading && (
                                <>
                                    <div className="skeleton skeleton--line" style={{ marginTop: 14 }} />
                                    <div className="skeleton skeleton--line" />
                                    <div className="skeleton skeleton--para" />
                                </>
                            )}
                            {!detailsLoading && detailsError && <p className="movie-sheet__error">{detailsError}</p>}
                            {!detailsLoading && !detailsError && movieDetails && (
                                <>
                                    {movieDetails.imdbRating && movieDetails.imdbRating !== "N/A" && (
                                        <p className="movie-sheet__rating">IMDb: <strong>{movieDetails.imdbRating}</strong>/10</p>
                                    )}
                                    {movieDetails.Plot && movieDetails.Plot !== "N/A" && (
                                        <p className="movie-sheet__plot">{movieDetails.Plot}</p>
                                    )}
                                    <dl className="movie-sheet__facts">
                                        {movieDetails.Director && movieDetails.Director !== "N/A" && (
                                            <><dt>Director</dt><dd>{movieDetails.Director}</dd></>
                                        )}
                                        {movieDetails.Actors && movieDetails.Actors !== "N/A" && (
                                            <><dt>Cast</dt><dd>{movieDetails.Actors}</dd></>
                                        )}
                                        {movieDetails.Released && movieDetails.Released !== "N/A" && (
                                            <><dt>Released</dt><dd>{movieDetails.Released}</dd></>
                                        )}
                                        {movieDetails.BoxOffice && movieDetails.BoxOffice !== "N/A" && (
                                            <><dt>Box Office</dt><dd>{movieDetails.BoxOffice}</dd></>
                                        )}
                                    </dl>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Add to list — thumbnail cards */}
                    <div className="movie-sheet__lists-section">
                        <h4>Add to a list</h4>
                        <div className="movie-sheet__list-cards">
                            {mylists.map((list) => (
                                <ListCard
                                    key={list.title}
                                    title={list.title}
                                    previewIds={previewIds[list.title] || []}
                                    onCardClick={() => addToList(list.title)}
                                />
                            ))}
                            <button className="newlist-card-tile" onClick={() => setShowCreateListDialog(true)}>
                                <div className="newlist-card-tile__grid">+</div>
                                <p>New list</p>
                            </button>
                        </div>
                    </div>
                </div>
            </dialog>

            {/* ── Create list dialog ─────────────────────────────── */}
            <dialog id="create-list-dialog" ref={createListDialogRef} onClose={() => setShowCreateListDialog(false)}>
                <button id="close-menu" onClick={() => setShowCreateListDialog(false)} aria-label="Close">✖</button>
                <div className="create-list-sheet">
                    <h2 className="create-list-sheet__title">New list</h2>
                    <form className="create-list-sheet__form" onSubmit={handleNewListSubmit} ref={listNameRef}>
                        <div className="create-list-field">
                            <label htmlFor="cl-name">Name</label>
                            <input
                                id="cl-name"
                                type="text"
                                placeholder="e.g. Friday Night Horror"
                                required
                                onChange={(e) => setNewListName(e.target.value)}
                            />
                        </div>
                        <div className="create-list-field">
                            <label htmlFor="cl-desc">
                                Description <span className="create-list-field__opt">(optional)</span>
                            </label>
                            <textarea
                                id="cl-desc"
                                rows={3}
                                placeholder="What's this list about?"
                                value={newListDescription}
                                onChange={(e) => setNewListDescription(e.target.value)}
                            />
                        </div>
                        <div className="create-list-actions">
                            <button type="submit" className="create-list-submit">Create list</button>
                            <button type="button" className="btn-ghost" onClick={() => setShowCreateListDialog(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            </dialog>

            {/* ── Add movie to list dialog ───────────────────────── */}
            <dialog id="add-movie-dialog" ref={addMovieDialogRef} onClose={closeAddMovieDialog}>
                <button id="close-menu" onClick={closeAddMovieDialog} aria-label="Close">x</button>
                <div className="add-movie-sheet">
                    <h2 className="add-movie-sheet__title">Add to "{currentList}"</h2>
                    <form className="add-movie-form" onSubmit={handleAddMovieSearch}>
                        <input
                            type="text"
                            className="add-movie-input"
                            placeholder="Search movies..."
                            value={addMovieQuery}
                            onChange={(e) => setAddMovieQuery(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn-soft">Search</button>
                    </form>
                    {addMovieSearching && (
                        <div className="add-movie-grid">
                            {Array.from({ length: 5 }).map((_, i) => <MovieCardSkeleton key={i} />)}
                        </div>
                    )}
                    {!addMovieSearching && addMovieResults.length > 0 && (
                        <div className="add-movie-grid">
                            {addMovieResults.map(movie => (
                                <div
                                    key={movie.imdbID}
                                    className="add-movie-card"
                                    onClick={() => handleAddMovieToList(movie.imdbID, movie.Title)}
                                >
                                    <div className="add-movie-poster">
                                        <img
                                            src={movie.Poster !== "N/A" ? movie.Poster : "assets/nomovie.jpg"}
                                            alt={movie.Title}
                                            loading="lazy"
                                        />
                                    </div>
                                    <p className="add-movie-card__title">{movie.Title}</p>
                                    <p className="add-movie-card__year">{movie.Year}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {!addMovieSearching && addMovieResults.length === 0 && addMovieQuery && (
                        <p className="add-movie-empty">No results.</p>
                    )}
                </div>
            </dialog>

            {/* ── App bar ────────────────────────────────────────── */}
            <header id="header-dashboard" className="appbar">
                <div className="appbar__row">
                    <button id="title-button" type="button" onClick={() => navigate("/home")}>
                        <h1 className="brand">kinodex</h1>
                    </button>

                    <form id="search-form" role="search" onSubmit={handleSearchSubmit}>
                        <button
                            type="button"
                            className={`vibe-toggle${searchMode === "vibe" ? " vibe-toggle--active" : ""}`}
                            onClick={() => setSearchMode(m => m === "vibe" ? "title" : "vibe")}
                            title={searchMode === "vibe" ? "Vibe Search on — click to switch back" : "Switch to Vibe Search"}
                            aria-pressed={searchMode === "vibe"}
                        >
                            ✦
                        </button>
                        <input
                            id="search"
                            type="search"
                            name="q"
                            aria-label="Search movies"
                            placeholder={searchMode === "vibe" ? "Describe a vibe…" : "Search movies…"}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button id="submit-search" type="submit" className="icon-btn" aria-label="Search">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="11" cy="11" r="7" />
                                <path d="M20 20l-3.5-3.5" />
                            </svg>
                        </button>
                    </form>

                    <div className="appbar__actions">
                        <button className="buttons-header-class" onClick={() => navigate("/home")}>Home</button>
                        <button className="buttons-header-class" onClick={logout}>Log out</button>
                        <div className="avatar" title={user?.username || ""}>
                            {(user?.username || "U").slice(0, 1).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Layout ─────────────────────────────────────────── */}
            <main id="center">

                {/* Sidebar */}
                <div id="left-side">
                    <section id="my-lists">
                        <header id="my-lists-top" className="lists-toolbar">
                            <h4 id="my-lists-title">My lists</h4>
                            <button
                                className="btn-ghost"
                                onClick={() => setShowCreateListDialog(true)}
                                title="New list"
                            >
                                +
                            </button>
                        </header>

                        <section id="my-lists-show">
                            {mylists.map((list) => (
                                <ListCard
                                    key={list.title}
                                    title={list.title}
                                    previewIds={previewIds[list.title] || []}
                                    onCardClick={() => handleListCardClick(list.title)}
                                    isActive={currentList === list.title}
                                />
                            ))}
                        </section>
                    </section>
                </div>

                {/* Right panel */}
                <div id="right-side">
                    {isViewingList && currentList && (
                        <section id="top-search-results">
                            <div className="list-header">
                                <div className="list-header__meta">
                                    <p key={currentList} id="list-title" className="fade-in">{currentList}</p>
                                    {isEditingList ? (
                                        <textarea
                                            className="list-desc-edit"
                                            rows={2}
                                            placeholder="Add a description..."
                                            value={editDesc}
                                            onChange={(e) => setEditDesc(e.target.value)}
                                        />
                                    ) : (
                                        currentListDescription && (
                                            <p id="current-list-description" className="fade-in">{currentListDescription}</p>
                                        )
                                    )}
                                </div>
                                <div className="list-header__actions">
                                    {isEditingList ? (
                                        <>
                                            <button className="btn-danger-sm" onClick={handleDeleteCurrentList}>
                                                Delete list
                                            </button>
                                            <button className="btn-soft" onClick={handleEditDone}>
                                                Done
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn-soft" onClick={() => setShowAddMovieDialog(true)}>
                                                + Add movie
                                            </button>
                                            <button className="btn-ghost" onClick={startEditingList}>
                                                Edit
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    <section id="search-results" aria-busy={isSearching || isLoadingList}>
                        {(isSearching || isLoadingList)
                            ? Array.from({ length: 10 }).map((_, i) => <MovieCardSkeleton key={`sk-${i}`} />)
                            : searchResults.map((movie) => (
                                <div className="movie-card-wrapper" key={movie.imdbID + currentList}>
                                    {isEditingList && (
                                        <button
                                            className="movie-card-del"
                                            onClick={() => handleMovieDelete(movie.imdbID)}
                                            aria-label="Remove from list"
                                        >
                                            x
                                        </button>
                                    )}
                                    <article className="movie-card">
                                        <button className="poster-button" onClick={() => handleMovieClick(movie.imdbID, movie.Title)}>
                                            <FadeImg
                                                src={movie.Poster !== "N/A" ? movie.Poster : "assets/nomovie.jpg"}
                                                alt={movie.Title}
                                            />
                                        </button>
                                        <h3>{movie.Title}</h3>
                                        <p>{movie.Year}</p>
                                    </article>
                                </div>
                            ))
                        }
                    </section>

                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </div>

            </main>
        </>
    );
};


function FadeImg({ src, alt }) {
    const [loaded, setLoaded] = React.useState(false);
    return (
        <img
            className={`fade-img${loaded ? " is-loaded" : ""}`}
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
        />
    );
}

function MovieCardSkeleton() {
    return (
        <div className="movie-card-wrapper" aria-hidden="true">
            <article className="movie-card">
                <div className="movie-skel__poster skeleton" />
                <div className="movie-skel__title skeleton" />
                <div className="movie-skel__year skeleton" />
            </article>
        </div>
    );
}

function ToastHost({ toasts, dismiss }) {
    return (
        <div className="toast-host" aria-live="polite" aria-atomic="true">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast--${t.type}`} role="status">
                    <div className="toast__dot" />
                    <div className="toast__msg">{t.text}</div>
                    <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">x</button>
                </div>
            ))}
        </div>
    );
}

function ToastPortal({ target, children }) {
    const [container] = React.useState(() => {
        const el = document.createElement("div");
        el.className = "toast-portal";
        return el;
    });
    React.useEffect(() => {
        if (!target) return;
        target.appendChild(container);
        return () => { try { target.removeChild(container); } catch { } };
    }, [target, container]);
    return createPortal(children, container);
}


export default Dashboard;
