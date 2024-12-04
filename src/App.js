import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useLocalStorageState } from "./useLocalStorageState";
import { useKey } from "./useKey";

const average = (arr) => arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = process.env.REACT_APP_OMDB_API_KEY;

export default function App() {
  const [query, setQuery] = useState("avengers");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, SetSelectedId] = useState(null);

  const [watched, setWatched] = useLocalStorageState([], "watched");

  function handleMovieSelection(id) {
    SetSelectedId((selectedId) => (selectedId === id ? null : id));
  }
  function handleCloseMovie() {
    SetSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }
  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  //memory storage useeffect
  // useEffect(
  //   function () {
  //     localStorage.setItem("watched", JSON.stringify(watched));
  //   },
  //   [watched]
  // );

  const [sortOrder, setSortOrder] = useState("title");
  const handleSort = (criteria) => {
    setSortOrder(criteria);

    const sortedMovies = [...movies].sort((a, b) => {
      if (criteria === "title") {
        return a.Title.localeCompare(b.Title);
      } else if (criteria === "year") {
        return parseInt(a.Year) - parseInt(b.Year);
      }

      return 0;
    });
    setMovies(sortedMovies);
  };

  useEffect(
    function () {
      const controller = new AbortController();
      async function fectMovies() {
        try {
          setIsLoading(true);
          setError("");

          const res = await fetch(`https://www.omdbapi.com/?apikey=${KEY}&s=${query}`, {
            signal: controller.signal
          });
          if (!res.ok) throw new Error("Something went wrong ");

          const data = await res.json();
          if (data.Response === "False") throw new Error("movies not found");
          // console.log(data);
          setMovies(data.Search);
          setError("");
          // console.log(data.Search);
        } catch (err) {
          console.log(err.message);
          if (err.name !== "AbortError") {
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }
      if (query.length < 3) {
        setMovies([]);
        setError("");
        return;
      }

      fectMovies();
      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <div className='sort-buttons'>
        <button onClick={() => handleSort("title")}>Sort by Title</button>
        <button onClick={() => handleSort("year")}>Sort by Year</button>
        <button onClick={() => window.print()}>Download pdf</button>
      </div>

      <Main className='flex flex-sm-column bg-slate-400'>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleMovieSelection} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList watched={watched} onDeleteWatched={handleDeleteWatched} />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}
function Loader() {
  return <p className='loader'>loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className='error'>
      <span>🛑 </span>
      {message}
    </p>
  );
}

function NavBar({ children }) {
  return (
    <nav className='grid grid-cols-3 mx-0 items-center h-18 px-8 py-8  bg-green-500 rounded-md'>
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className='logo'>
      <span role='img'>🍿</span>
      <h1>MoviesFinder</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery("");
  });

  return (
    <input
      className='search'
      type='text'
      placeholder='Search movies...'
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className='num-results'>
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className='main'>{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className='box'>
      <button className='btn-toggle' onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>

      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className='list list-movies'>
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);

  const watchedUserRating = watched.find((movie) => movie.imdbID === selectedId)?.userRating;

  const {
    Title: title,
    Year: year,
    Rated: rated,
    Released: released,
    Runtime: runtime,
    Awards: awards,
    Plot: plot,
    imdbRating,
    Actors: actors,
    Director: director,
    Genre: genre,
    Poster: poster
  } = movie;

  function handleAdd() {
    const newMovie = {
      imdbRating: Number(imdbRating),
      imdbID: selectedId,
      poster,
      title,
      year,
      runtime: Number(runtime.split(" ").at(0)),
      userRating
    };
    onAddWatched(newMovie);
    onCloseMovie();
  }

  useKey("Escape", onCloseMovie);

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`);

        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      // Set the document title
      if (!title) return;
      document.title = title;

      // Set the favicon dynamically
      const favicon = document.querySelector("link[rel*='icon']") || document.createElement("link");
      favicon.type = "image/x-icon";
      favicon.rel = "shortcut icon";
      favicon.href = `${poster}`;
      document.head.appendChild(favicon);

      return function () {
        document.title = "usePopcorn";
        console.log(`the title of the page ${title}`);
        document.head.removeChild(favicon);
      };
    },
    [title]
  );

  return (
    <div className='details'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header className=''>
            <button onClick={onCloseMovie} className='btn-back'>
              &larr;
            </button>
            <img src={poster} alt={`poster of ${movie} movie `} />
            <div className='details-overview'>
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} iMDb rating
              </p>
            </div>
          </header>
          <section>
            <div className='rating'>
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={25}
                    key={movie.imdbID}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button onClick={handleAdd} className='btn-add'>
                      + Add to List
                    </button>
                  )}
                </>
              ) : (
                <p
                  style={{
                    color: "#CF2525",
                    textAlign: "center",
                    letterSpacing: "2px"
                  }}>
                  You Already Rated Movie with {watchedUserRating}⭐️ Rating
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p style={{ color: "green", fontWeight: 400 }}>{`Staring: ${actors}`}</p>
            <p>{`Directed by: ${director}`}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className='summary'>
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>
            <span></span>
            #️⃣ {watched.length} {watched.length > 1 ? "movies" : "movie"}
          </span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{Math.floor(avgRuntime)} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (
    <ul className='list'>
      {watched.map((movie) => (
        <WatchedMovie movie={movie} key={movie.imdbID} onDeleteWatched={onDeleteWatched} />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button className='btn-delete' onClick={() => onDeleteWatched(movie.imdbID)}>
          X
        </button>
      </div>
    </li>
  );
}
