// Sostituisci la funzione getLiveFlightData nel tuo index.html

// Ottieni dati live da OpenSky tramite Netlify Function
async function getLiveFlightData(icao24) {
    try {
        const url = `/.netlify/functions/opensky-search?icao24=${icao24}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP Error: ${response.status}`);
        }
        
        if (result.success && result.data) {
            const state = result.data;
            return {
                icao24: state.icao24,
                callsign: state.callsign,
                longitude: state.longitude,
                latitude: state.latitude,
                altitude: state.baro_altitude,
                speed_horizontal: state.velocity ? Math.round(state.velocity * 3.6) : null, // m/s to km/h
                heading: state.true_track
            };
        }
        
        return null;
    } catch (error) {
        console.error('Errore OpenSky Function:', error);
        return null;
    }
}