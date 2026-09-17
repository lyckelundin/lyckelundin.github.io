// Hämtar en 7-dagars väderprognos för Stockholm från Open-Meteo (gratis, ingen API-nyckel behövs)
// Kör med: node hamta-vader-stockholm.js

const fs = require('fs');

// Stockholms koordinater
const LATITUDE = 59.3293;
const LONGITUDE = 18.0686;

const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Europe%2FStockholm&forecast_days=7`;

async function hamtaVader() {
    try {
        console.log('Hämtar väderdata för Stockholm...');
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API svarade med status ${response.status}`);
        }

        const data = await response.json();

        // Bygg om datan till en enklare, mer läsbar struktur
        const prognos = data.daily.time.map((datum, index) => ({
            datum: datum,
            max_temp_c: data.daily.temperature_2m_max[index],
            min_temp_c: data.daily.temperature_2m_min[index],
            nederbord_mm: data.daily.precipitation_sum[index],
            vader_kod: data.daily.weathercode[index]
        }));

        const resultat = {
            stad: 'Stockholm',
            hamtad: new Date().toISOString(),
            prognos: prognos
        };

        fs.writeFileSync('vader-stockholm-7dagar.json', JSON.stringify(resultat, null, 2), 'utf-8');
        console.log('Klart! Sparade som vader-stockholm-7dagar.json');
        console.log(JSON.stringify(resultat, null, 2));

    } catch (error) {
        console.error('Något gick fel:', error.message);
    }
}

hamtaVader();