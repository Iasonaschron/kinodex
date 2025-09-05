import React, { useEffect, useState } from "react";
import '../styles.css';

const API_KEY = "295a9366";

const Listcard = ({title, previewIds, onCardClick, isEditing, deleteList}) => {

    const [posters, setPosters] = useState(Array(4));
    
    useEffect(() => {

        const loadPosters = async () => {

            console.log("Preview ids " + previewIds);

            const tempPosters = await Promise.all (

            previewIds.map(async (movieId) => {

                try {
                    const url = `https://www.omdbapi.com/?apikey=${API_KEY}&i=${movieId}`
                    const res = await fetch(url);
                    const data = await res.json();

                    return data.Poster;
                } catch (err) {
                    return "/nomovie.jpg"
                }
            }))

        
        setPosters(tempPosters);
        }

        loadPosters();

    }, [previewIds]);


    return (
    <div className={`listcard-wrapper${isEditing ? ' editing' : ''}`}>
    
    {isEditing && (
        <>
            <button id="delete-button" onClick={deleteList}>×</button>
        </>
    )} 
    <section className="listcard" style={{transform: isEditing ? `translateY(${30}px)` : "translateY(0)",
          transition: "transform 250ms cubic-bezier(.4,.2,.2,1)"
        }}>
    <div>
    <button id="{title}" className="list" onClick={onCardClick}>
        {posters.map((poster, index) => (   
            <img key={index} src={poster} alt={'/nomovie.jpg'}/>
        ))}
    </button>
    <p>{title}</p>
    </div>
    </section>
    
    </div>    
    
    );
};

export default Listcard;