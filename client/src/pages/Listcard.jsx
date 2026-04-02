import React, { useEffect, useState } from "react";
import '../styles.css';

const API_KEY = "295a9366";

const Listcard = ({ title, previewIds, onCardClick, isActive }) => {

    const [posters, setPosters] = useState([]);

    useEffect(() => {
        const loadPosters = async () => {
            const results = await Promise.all(
                previewIds.map(async (movieId) => {
                    try {
                        const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movieId}`);
                        const data = await res.json();
                        return data.Poster && data.Poster !== "N/A" ? data.Poster : null;
                    } catch {
                        return null;
                    }
                })
            );
            setPosters(results);
        };
        loadPosters();
    }, [previewIds]);

    return (
        <div className={`listcard-wrapper${isActive ? " is-active" : ""}`}>
            <section
                className="listcard"
                style={{ borderColor: isActive ? "var(--accent-border)" : undefined }}
            >
                <button className="list" onClick={onCardClick}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        posters[i]
                            ? <img key={i} src={posters[i]} alt="" />
                            : <div key={i} className="listcard-empty-slot" />
                    ))}
                </button>
                <p>{title}</p>
            </section>
        </div>
    );
};

export default Listcard;
