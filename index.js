const express = require('express')
const app = express()

const movieDB_key = process.env.TMDB_KEY;
const API_root =  "https://api.themoviedb.org/3";
const latestMovieEndpoint = "/movie/latest"
const movieEndpoint = "/movie"

const priceURL = "http://localhost:3000/moviePrice/";
const peopleURL = "https://example.com";

app.get('/', (req, res) => {
  res.send('<h1>Microservice front page!</h1>')
})

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function fetchJSON(url) {
	try {
		const response = await fetch(url, { cache: 'no-store' });
		if (!response.ok) {
		  throw new Error(`Response status: ${response.status}`);
		}

		const json = await response.json();
		console.log(json);

		return json;
	} catch (error) {
		console.error(error.message);
	}
}

// ------------------------------------------------

app.get('/moviePrice/:id', (req, res) => {
	console.log("Getting price for movie: " + req.query.id);
	let monedas = ["bitcoin", "dolares estadounidenses", "dolares australianos", "pesos argentinos", "yen"];
	res.send({
		precio: randomIntFromInterval(10, 1000),
		moneda: monedas[randomIntFromInterval(0, monedas.length-1)]
	});
});

async function getPriceForMovie(id) {
	let priceJSON = await fetchJSON(priceURL + id);
	return priceJSON;
}

// ------------------------------------------------

async function fetchLatestID() {
	let json = await fetchJSON(API_root + latestMovieEndpoint + "?api_key=" + movieDB_key);
	return json;
}

async function getMovieData(id) {
	let json = await fetchJSON(API_root + movieEndpoint + "/" + id + "?api_key=" + movieDB_key);
	return json;
}

async function random_movie() {
	let latestMovie = await fetchLatestID();
	let latestID = latestMovie.id;
	let random_ID_data = {};

	// from 0 to latestID, there could be a movie
	let done = false;
	let randomID;
	while (!done) {
		randomID = randomIntFromInterval(1, latestID);
		random_ID_data = await getMovieData(randomID);
		console.log("fetching id " + randomID)
		console.log(random_ID_data);

		if (random_ID_data != undefined) {
			done = true;
		}
	}

	// at this point, we know the ID is valid
	let priceJSON = await getPriceForMovie(randomID);
	random_ID_data.precio = priceJSON.precio
	random_ID_data.moneda = priceJSON.moneda;

	// let peopleJSON = await getPeopleForMovie(randomID);
	let peopleJSON = { personas: "placeholder, placeholder, y placeholder" }
	random_ID_data.personas = peopleJSON.personas;

	return random_ID_data;
}

app.get('/randomMovie', async (req, res) => {
  let movieJSONFromTMDB = await random_movie();
  res.send({
  	"titulo": movieJSONFromTMDB.title,
    "imagenfondo": "https://image.tmdb.org/t/p/original" + movieJSONFromTMDB.poster_path,
    "resumen": movieJSONFromTMDB.overview,
    "precio": movieJSONFromTMDB.precio + " " + movieJSONFromTMDB.moneda,
    "personas": movieJSONFromTMDB.personas
  });
})


app.listen(3000, function () {
  console.log('Starting service!');
});