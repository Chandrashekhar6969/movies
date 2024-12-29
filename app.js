const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost/3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbMovie = (object) => {
  return {
    movieName: object.movie_name,
  };
};

//1 Get All Movies
app.get("/movies/", async (request, response) => {
  const movieQuery = `
    SELECT 
        movie_name
    FROM 
        movie;
    `;
  const moviesArray = await db.all(movieQuery);
  //   console.log(moviesArray);
  response.send(moviesArray.map((eachMovie) => convertDbMovie(eachMovie)));
});

//2 Post New Movie
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovie = `
    INSERT INTO 
        movie(director_id, movie_name, lead_actor)
    VALUES 
        (${directorId}, '${movieName}', '${leadActor}');
    `;
  const dbResponse = await db.run(addMovie);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};
//3 Get Specific Movie
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieQuery = `
    SELECT 
        *
    FROM 
        movie
    WHERE 
        movie_id = ${movieId};`;
  const movie = db.get(movieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//4 Update movie details on movieId
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovie = `
    UPDATE 
        movie
    SET 
        movie_id = ${movieId}, director_id = ${directorId}, movie_name = '${movieName}',        lead_actor ='${leadActor}'
    WHERE 
        movie_id = ${movieId};`;
  await db.run(updateMovie);
  response.send("Movie Details Updated");
});

//5 Delete movie by movieID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `
    DELETE FROM 
        movie
    WHERE 
        movie_id = ${movieId};`;
  await db.run(deleteMovie);
  response.send("Movie Removed");
});

const convertDbDirector = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};
//6 GET list of directors
app.get("/directors/", async (request, response) => {
  const directorQuery = `
    SELECT 
        *
    FROM 
        director;`;
  const directors = db.all(directorQuery);
  response.send(
    directors.map((eachDirector) => convertDbDirector(eachDirector))
  );
});

const convertMovieName = (obj) => {
  return {
    movieName: obj.movie_name,
  };
};

//7 Get list of movies of a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const moviesQuery = `
    SELECT
        movie_name
    FROM 
        movie
    WHERE 
        director_id = ${directorId};`;
  const movies = await db.all(moviesQuery);
  response.send(movies.map((eachMovie) => convertDbMovie(eachMovie)));
});

module.exports = app;
