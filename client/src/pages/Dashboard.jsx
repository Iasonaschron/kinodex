import React, { useEffect, useState, useRef, forwardRef } from "react";
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

    const [inputText, setInputText] = useState(""); // textbox value
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [searchResults, setSearchResults] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentList, setCurrentList] = useState(null);
    const [currentListDescription, setCurrentListDescription] = useState(null);
    const [listMovies, setListMovies] = useState([]);
    const [isShowing, setIsShowing] = useState(false);
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newListDescription, setNewListDescription] = useState("")
    const [movieToAdd, setMovieToAdd] = useState("");
    const [currentMovieTitle, setCurrentMovieTitle] = useState("");
    const [isViewingList, setIsViewingList] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [previewIds, setPreviewIds] = useState({}); // { [listTitle]: [imdbID,...] }
    const [movieDetails, setMovieDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [toasts, setToasts] = useState([]);


    const popupRef = useRef(null);
    const listNameRef = useRef(null);
    const listDescRef = useRef(null);

    const API_KEY = "295a9366";
    const PAGE_SIZE = 10;
    const { user, logout } = useAuth();
    const owner = user?.username;

    useEffect(() => {
        document.body.classList.add("retro-dark");
    }, []);

    //this handles loading the lists in the beginning? kinda
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
                console.log(mylists);
                console.warn("Failed to load lists:", e.message);
            }
        })();
        return () => { cancelled = true; };
    }, [owner]);

    async function refreshListPreview(listTitle) {
        if (!listTitle) return;
        const items = await apiFetch(
            `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}/items`
        ); // -> [{ movie_id }]
        const ids = (items ?? []).map(x => x.movie_id).slice(0, 4);
        setPreviewIds(prev => ({ ...prev, [listTitle]: ids }));
    }

    //loads movie cards when searching and when switching pages
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

                if (!data.Search) {
                    setSearchResults([]);
                    return;
                }
                setSearchResults(data.Search);
                setTotalPages(Math.ceil(data.totalResults / PAGE_SIZE));
            } catch (err) {
                console.log(err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }
        loadMovieCards();

    }, [page, query]);


    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        setQuery(inputText);
        setIsViewingList(false);
    }

    /*
    Handles clicking on lists. Is called when the currentList changes
    */
    useEffect(() => {

        if (!currentList) {
            setListMovies([]);
            return;
        };

        setSearchResults([]);
        setIsLoadingList(true);


        const loadListMovies = async () => {

            let list = mylists.find(list => list.title == currentList);
            setTotalPages(1);
            setQuery("");

            try {

                let movies = await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/items`);
                let ids = movies.map(movie => movie.movie_id);
                const items = await Promise.all(
                    ids.map(id => fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`).then(r => r.json()))
                );

                console.log(items);

                setSearchResults(items)

            } catch (err) {
                console.log(err);
                setCurrentList(null);
                setCurrentListDescription(null);
                setSearchResults([]);
            } finally {
                setIsLoadingList(false);
            }
        }

        loadListMovies();

    }, [currentList]);


    /*
    Has to do with showing and hiding the popup
    */
    useEffect(() => {

        console.log(isShowing);

        const popup = popupRef.current;

        if (!popup) return;

        if (isShowing && !popup.open) {
            popup.showModal();
        } else if (!isShowing && popup.open) {
            popup.close();
        }

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
                    if (data.Response === "False") {
                        setDetailsError(data.Error || "Failed to load details.");
                    } else {
                        setMovieDetails(data);
                    }
                }
            } catch (e) {
                if (!cancelled) setDetailsError("Network error while loading details.");
            } finally {
                if (!cancelled) setDetailsLoading(false);
            }
        })();

        return () => { cancelled = true; };

    }, [isShowing]);

    useEffect(() => {

    }, [isCreatingList]);

    const handleOnClose = () => {
        setIsShowing(false);
        setIsCreatingList(false);
        setMovieToAdd("");

        let newListForm = listNameRef.current;
        setNewListDescription("");
        newListForm.reset();
    }

    //new list
    const handleNewListSubmit = async (e) => {
        e.preventDefault();

        const lists = mylists;
        const list = lists.find(list => list.title == newListName);

        if (list) {
            console.warn("List with this title already exists!");
            return;
        }

        try {
            console.log("Trying to create list with name: " + newListName);

            await apiFetch(`/lists/${encodeURIComponent(owner)}`, { method: "POST", body: { title: newListName, description: newListDescription } });

            console.log("Created list with name: " + newListName);

            setMyLists(prev => [...prev, { title: newListName, description: newListDescription }]);
            notify("success", `Created list “${newListName}”`);

            const newListForm = listNameRef.current;
            setNewListDescription("");
            newListForm.reset();
            setIsCreatingList(false);
        } catch (err) {
            console.warn("Create list failed:", err.message);
            notify("error", err.message || "Create list failed");
        }
    }

    const handleMovieClick = (movieId, movieTitle) => {
        setIsShowing(true);
        setMovieToAdd(movieId);
        setCurrentMovieTitle(movieTitle);
        console.log(movieTitle);
    }

    //adding a movie to a list
    const addToList = async (listTitle) => {
        const list = mylists.find(list => list.title == listTitle);
        console.log("adding " + movieToAdd + " to " + listTitle);

        console.log(list);

        try {
            console.log("adding " + movieToAdd + " to " + list.title);

            await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}/items`,
                {
                    method: "POST",
                    body: { movie_id: movieToAdd }
                })

            console.log("added " + movieToAdd + " to " + list.title);

            if (currentList === listTitle) {
                const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movieToAdd}`);
                const movie = await res.json();
                setSearchResults(prev => [movie, ...prev]);
            }
            const items = await apiFetch(
                `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}/items`
            );
            const ids = items.map(x => x.movie_id).slice(0, 4);
            setPreviewIds(prev => ({ ...prev, [listTitle]: ids }));

            notify("success", `Added “${currentMovieTitle || movieToAdd}” to “${listTitle}”`);

        } catch (err) {
            console.warn(err.message);
            if (err.status === 409 || /already/i.test(err.message)) {
                notify("info", `That movie is already in “${listTitle}”`);
            } else {
                notify("error", err.message || "Failed to add movie");
            }
        }
    }

    const handleListCardClick = async (listTitle) => {
        setCurrentList(listTitle);
        setIsViewingList(true);

        try {
            const descr = await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}/description`);
            setCurrentListDescription(descr.description);
            console.log(descr);
        } catch (e) {
            console.warn(e.message);
            notify("error", e.message || "Failed to load description");
        }
    }

    const handleListDelete = async (listTitle) => {
        const before = mylists;

        try {
            await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(listTitle)}`,
                { method: "DELETE" })

            setMyLists(prev => prev.filter(list => list.title !== listTitle));

            if (currentList === listTitle) {
                setCurrentList(null);
                setCurrentListDescription(null);
                setSearchResults([]);
            }
            notify("success", `Deleted list “${listTitle}”`);
        } catch (e) {
            setMyLists(before); // rollback
            console.warn(e.message);
            notify("error", e.message || "Failed to delete list");
        }

    }

    const handleMovieDelete = async (movieSelected) => {

        try {
            await apiFetch(`/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/items/${encodeURIComponent(movieSelected)}`,
                { method: "DELETE" })

            setSearchResults(prev => prev.filter(m => m.imdbID !== movieSelected));

            const items = await apiFetch(
                `/lists/${encodeURIComponent(owner)}/${encodeURIComponent(currentList)}/items`
            );
            const ids = items.map(x => x.movie_id).slice(0, 4);
            setPreviewIds(prev => ({ ...prev, [currentList]: ids }));
            notify("success", "Removed from list");
        } catch (e) {
            console.warn(e.message);
            notify("error", e.message || "Failed to remove");
        }
    }

    function notify(type, text, ms = 2500) {
        const id = String(Date.now() + Math.random());
        setToasts(ts => [...ts, { id, type, text }]);
        if (ms) setTimeout(() => dismiss(id), ms);
    }

    function dismiss(id) {
        setToasts(ts => ts.filter(t => t.id !== id));
    }

    /*  
    HTML down here
    */
    return (
        <>
            <ToastPortal target={(isShowing && popupRef?.current) || document.body}>
                <ToastHost toasts={toasts} dismiss={dismiss} />
            </ToastPortal>

            <dialog id="add-menu" onClose={() => handleOnClose()} ref={popupRef}>
                <button id="close-menu" onClick={() => setIsShowing(false)} aria-label="Close">✖</button>

                <div className="movie-sheet">
                    {/* HEADER */}
                    <header className="movie-sheet__header">
                        <div>
                            <h2 className="movie-sheet__title">
                                {movieDetails?.Title || currentMovieTitle}
                            </h2>
                            <div className="movie-sheet__meta">
                                {movieDetails?.Year && <span>{movieDetails.Year}</span>}
                                {movieDetails?.Rated && <span>{movieDetails.Rated}</span>}
                                {movieDetails?.Runtime && <span>{movieDetails.Runtime}</span>}
                                {movieDetails?.Genre && <span>{movieDetails.Genre}</span>}
                            </div>
                        </div>
                    </header>

                    {/* BODY */}
                    <section className="movie-sheet__body">
                        {/* LEFT: Poster */}
                        <div className="movie-sheet__poster-wrap">
                            {detailsLoading ? (
                                <div className="skeleton skeleton--poster" />
                            ) : (
                                <img
                                    className="movie-sheet__poster"
                                    src={
                                        movieDetails?.Poster && movieDetails.Poster !== "N/A"
                                            ? movieDetails.Poster
                                            : "assets/nomovie.jpg"
                                    }
                                    alt={movieDetails?.Title || currentMovieTitle}
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {/* RIGHT: Info */}
                        <div className="movie-sheet__info">
                            {detailsLoading && (
                                <>
                                    <div className="skeleton skeleton--line" />
                                    <div className="skeleton skeleton--line" />
                                    <div className="skeleton skeleton--para" />
                                </>
                            )}

                            {!detailsLoading && detailsError && (
                                <p className="movie-sheet__error">{detailsError}</p>
                            )}

                            {!detailsLoading && !detailsError && movieDetails && (
                                <>
                                    {movieDetails.imdbRating && movieDetails.imdbRating !== "N/A" && (
                                        <p className="movie-sheet__rating">
                                            IMDb: <strong>{movieDetails.imdbRating}</strong>/10
                                        </p>
                                    )}

                                    {movieDetails.Plot && movieDetails.Plot !== "N/A" && (
                                        <p className="movie-sheet__plot">{movieDetails.Plot}</p>
                                    )}

                                    <dl className="movie-sheet__facts">
                                        {movieDetails.Director && movieDetails.Director !== "N/A" && (
                                            <>
                                                <dt>Director</dt><dd>{movieDetails.Director}</dd>
                                            </>
                                        )}
                                        {movieDetails.Writer && movieDetails.Writer !== "N/A" && (
                                            <>
                                                <dt>Writer</dt><dd>{movieDetails.Writer}</dd>
                                            </>
                                        )}
                                        {movieDetails.Actors && movieDetails.Actors !== "N/A" && (
                                            <>
                                                <dt>Cast</dt><dd>{movieDetails.Actors}</dd>
                                            </>
                                        )}
                                        {movieDetails.Released && movieDetails.Released !== "N/A" && (
                                            <>
                                                <dt>Released</dt><dd>{movieDetails.Released}</dd>
                                            </>
                                        )}
                                        {movieDetails.BoxOffice && movieDetails.BoxOffice !== "N/A" && (
                                            <>
                                                <dt>Box Office</dt><dd>{movieDetails.BoxOffice}</dd>
                                            </>
                                        )}
                                        {movieDetails.Awards && movieDetails.Awards !== "N/A" && (
                                            <>
                                                <dt>Awards</dt><dd>{movieDetails.Awards}</dd>
                                            </>
                                        )}
                                    </dl>
                                </>
                            )}
                        </div>
                    </section>

                    {/* ADD TO LISTS */}
                    <section className="movie-sheet__lists">
                        <h4>Add <em>{movieDetails?.Title || currentMovieTitle}</em> to a list</h4>
                        <div className="movie-sheet__lists-grid">
                            {mylists.map((list) => (
                                <ListCard
                                    key={list.title}
                                    title={list.title}
                                    previewIds={previewIds[list.title] || []}
                                    onCardClick={() => addToList(list.title)}
                                />
                            ))}
                        </div>

                        <div className="movie-sheet__newlist">

                            <form
                                id="new-list-form"
                                hidden={!isCreatingList}
                                onSubmit={handleNewListSubmit}
                                ref={listNameRef}
                            >
                                <input
                                    type="text"
                                    id="new-list-input"
                                    placeholder="List title…"
                                    required
                                    onChange={(e) => setNewListName(e.target.value)}
                                />
                                <button type="submit" id="new-list-form-button">Create</button>
                            </form>
                        </div>
                    </section>
                </div>
            </dialog>

            <dialog id="error" className="hidden"></dialog>

            <header id="header-dashboard" className="appbar">
                <div className="appbar__row">
                    {/* Brand */}
                    <button id="title-button" type="button" onClick={() => (window.location.href = "/dashboard")}>
                        <h1 className="brand">kinodex</h1>
                    </button>

                    {/* Search */}
                    <form id="search-form" role="search" onSubmit={handleSearchSubmit}>
                        <input
                            id="search"
                            type="search"
                            name="q"
                            aria-label="Search movies"
                            placeholder="Search movies…"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            required
                        />

                        {/* Search button */}
                        <button
                            id="submit-search"
                            type="submit"
                            className="icon-btn"
                            aria-label="Search"
                        >
                            {/* Magnifier icon */}
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="11" cy="11" r="7" />
                                <path d="M20 20l-3.5-3.5" />
                            </svg>
                        </button>
                    </form>

                    {/* Actions */}
                    <div className="appbar__actions">
                        <button className="buttons-header-class">Friends</button>
                        <button className="buttons-header-class" onClick={logout}>Log out</button>
                        <div className="avatar" title={user?.username || ""}>
                            {(user?.username || "U").slice(0, 1).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>



            <main id="center">

                <div id="left-side">
                    <section id="main-dashboard">

                        <section id="my-lists">
                            <header id="my-lists-top" className="lists-toolbar">
                                <h4 id="my-lists-title">My lists</h4>

                                {!isEditing ? (
                                    <button className="btn-ghost" onClick={() => setIsEditing(true)}>
                                        ✎ Edit
                                    </button>
                                ) : (
                                    <div className="lists-toolbar__actions">

                                        <button className="btn-ghost" onClick={() => setIsEditing(false)}>
                                            Done
                                        </button>
                                    </div>
                                )}
                            </header>

                            {/* Inline new-list form only while editing */}
                            {isEditing && isCreatingList && (
                                <form id="sidebar-newlist-form" onSubmit={handleNewListSubmit}>
                                    <input
                                        type="text"
                                        id="new-list-title"
                                        placeholder="List title…"
                                        required
                                        onChange={(e) => setNewListName(e.target.value)}
                                    />

                                    <textarea
                                        id="new-list-desc"
                                        rows={4}
                                        placeholder="List description..."
                                        value={newListDescription}
                                        onChange={(e) => setNewListDescription(e.target.value)}
                                        ref={listDescRef}
                                    />
                                    <button type="submit" className="btn-soft">Create</button>
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={() => setIsCreatingList(false)}
                                    >
                                        Cancel
                                    </button>
                                </form>
                            )}

                            <section id="my-lists-show">
                                {isEditing && (
                                    <button className="newlist-tile" onClick={() => setIsCreatingList(true)}>
                                        <span>＋</span>
                                        <em>New list</em>
                                    </button>
                                )}

                                {mylists.map((list) => (
                                    <ListCard
                                        key={list.title}
                                        title={list.title}
                                        previewIds={previewIds[list.title] || []}
                                        onCardClick={() => handleListCardClick(list.title)}
                                        isEditing={isEditing}
                                        deleteList={() => handleListDelete(list.title)}
                                    />
                                ))}
                            </section>
                        </section>


                    </section>
                </div>

                <div id="right-side">
                    <section id="top-search-results">
                        <p key={currentList} id="list-title" className="fade-in">{currentList ? currentList : ""}</p>
                    </section>

                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                    <div id={isViewingList ? "bruh" : ""}>
                        {isViewingList && (
                            <>
                                <p key={currentList} id="current-list-description" className="fade-in">{currentListDescription}</p>
                            </>
                        )}

                        <section id="search-results" aria-busy={isSearching}>
                            {isSearching
                                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <MovieCardSkeleton key={`sk-${i}`} />)
                                : searchResults.map((movie) => (
                                    <div className={`movie-card-wrapper${isEditing ? ' editing' : ''}`} key={movie.imdbID + currentList}>
                                        {isEditing && isViewingList && (
                                            <button id="delete-button-movie" onClick={() => handleMovieDelete(movie.imdbID)}>×</button>
                                        )}
                                        <article
                                            className="movie-card"
                                            style={{
                                                transform: isEditing && isViewingList ? `translateY(${30}px)` : "translateY(0)",
                                                transition: "transform 250ms cubic-bezier(.4,.2,.2,1)",
                                            }}
                                        >
                                            <button className="poster-button" data-id={movie.imdbID} onClick={() => handleMovieClick(movie.imdbID, movie.Title)}>
                                                <FadeImg
                                                    src={movie.Poster !== "N/A" ? movie.Poster : "assets/nomovie.jpg"}
                                                    alt={movie.Title}
                                                />
                                            </button>
                                            <h3>{movie.Title}</h3>
                                            <p>{movie.Year}</p>
                                        </article>
                                    </div>
                                ))}

                        </section>

                    </div>

                </div>


            </main>


        </>
    );
};


// Smoothly fade images in when they load
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

// A single movie-card skeleton
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
                    <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
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
        return () => {
            try { target.removeChild(container); } catch { }
        };
    }, [target, container]);

    return createPortal(children, container);
}


export default Dashboard;