// QUESTO È IL CODICE PER IL FILE: netlify/functions/flight-search.js

exports.handler = async (event, context) => {
  // La tua API key sarà qui automaticamente dalle variabili d'ambiente
  const API_KEY = process.env.AVIATIONSTACK_API_KEY;
  const BASE_URL = 'http://api.aviationstack.com/v1';

  // Permette al browser di chiamare questa function
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Gestisce le richieste di controllo del browser
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Accetta solo richieste GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Metodo non consentito' }),
    };
  }

  try {
    // Prende il codice volo dall'URL (es: ?flight_iata=LH441)
    const { flight_iata } = event.queryStringParameters || {};
    
    // Controlla che il codice volo sia presente
    if (!flight_iata) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Codice volo mancante' }),
      };
    }

    // Controlla che l'API key sia configurata
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key non configurata' }),
      };
    }

    // Chiama AviationStack API
    const url = `${BASE_URL}/flights?access_key=${API_KEY}&flight_iata=${flight_iata}`;
    
    console.log(`Cercando volo: ${flight_iata}`);
    
    const response = await fetch(url);
    const data = await response.json();

    // Controlla se la richiesta è andata a buon fine
    if (!response.ok) {
      throw new Error(`Errore API: ${response.status}`);
    }

    // Restituisce i dati del volo al frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Errore nella function:', error);
    
    // Restituisce errore al frontend
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Errore del server',
        message: error.message 
      }),
    };
  }
};