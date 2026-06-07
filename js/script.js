async function loadData(latitude, longitude) {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen`;
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function loadWetterData(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code`;
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(error);
        return false;
    }
}


const staedteKoordinaten = {
    zuerich: { lat: 47.3769, lon: 8.5417, name: "Zürich" },
    bern: { lat: 46.9480, lon: 7.4474, name: "Bern" },
    chur: { lat: 46.8508, lon: 9.5320, name: "Chur" }
};

const locationSelect = document.getElementById('location-select');
const currentDateEl = document.getElementById('current-date');
const currentTimeEl = document.getElementById('current-time');
const mainLoad = document.getElementById('main-load');
const loadSubtext = document.getElementById('load-subtext');

const valTemp = document.getElementById('val-temp');
const valRain = document.getElementById('val-rain');
const valWind = document.getElementById('val-wind');

const pBirke = document.getElementById('pollen-birke');
const pBeifuss = document.getElementById('pollen-beifuss');
const pOlive = document.getElementById('pollen-olive');
const pAmbrosia = document.getElementById('pollen-ambrosia');
const pGraeser = document.getElementById('pollen-graeser');
const graphLine = document.getElementById('graph-line');

const wetterBanner = document.querySelector('.wetter-banner'); 

let aktuelleLottieAnimation = null;

function aktualisiereStatusAnimation(dateiName) {
    if (aktuelleLottieAnimation) {
        aktuelleLottieAnimation.destroy();
    }
    
    aktuelleLottieAnimation = lottie.loadAnimation({
        container: document.getElementById('lottie-status-container'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: `./img/${dateiName}` 
    });
}

function setzeAktuellesDatum() {
    const jetzt = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = jetzt.toLocaleDateString('de-DE', options);
    
    const stunden = jetzt.getHours() < 10 ? '0' + jetzt.getHours() : jetzt.getHours();
    currentTimeEl.textContent = `${stunden}:00`;
    
    return jetzt.getHours(); 
}

async function ladeAPIDaten(stadtKey) {
    const stadt = staedteKoordinaten[stadtKey];
    if (!stadt) return;

    const aktuelleStunde = setzeAktuellesDatum();

    try {
        const pollenResponse = await loadData(stadt.lat, stadt.lon);
        const wetterResponse = await loadWetterData(stadt.lat, stadt.lon);

        let b, bf, o, a, g;
        let tempWert, regenChance, windWert, wetterCode;

     
        if (!pollenResponse || !wetterResponse || pollenResponse.error || wetterResponse.error) {
            console.warn("API temporär nicht erreichbar. Nutze Fallback-Werte.");
            loadSubtext.innerHTML = `⚠️ API überlastet. Zeige Test-Daten für ${stadt.name}.`;
            
            b = 4.2; bf = 1.0; o = 0.0; a = 1.5; g = 12.6;
            tempWert = 16; regenChance = 20; windWert = 8; wetterCode = 1; 
        } else {
            b = pollenResponse.hourly.birch_pollen[aktuelleStunde] || 0;
            bf = pollenResponse.hourly.mugwort_pollen[aktuelleStunde] || 0;
            o = pollenResponse.hourly.olive_pollen[aktuelleStunde] || 0;
            a = pollenResponse.hourly.ragweed_pollen[aktuelleStunde] || 0;
            g = pollenResponse.hourly.grass_pollen[aktuelleStunde] || 0;

            tempWert = wetterResponse.hourly.temperature_2m[aktuelleStunde];
            regenChance = wetterResponse.hourly.precipitation_probability[aktuelleStunde];
            windWert = wetterResponse.hourly.wind_speed_10m[aktuelleStunde];
            wetterCode = wetterResponse.hourly.weather_code[aktuelleStunde] || 0;
            
            loadSubtext.innerHTML = `Live-Daten für ${stadt.name} wurden geladen.`;
        }


        pBirke.textContent = b.toFixed(1);
        pBeifuss.textContent = bf.toFixed(1);
        pOlive.textContent = o.toFixed(1);
        pAmbrosia.textContent = a.toFixed(1);
        pGraeser.textContent = g.toFixed(1);

 
        valTemp.textContent = `${tempWert}°C`;
        valRain.textContent = `${regenChance}%`;
        valWind.textContent = `${windWert} km/h`;


        if (wetterBanner) {
            if (wetterCode === 0) {
                wetterBanner.style.backgroundImage = "url('img/sonnig.png')";
            } else if (wetterCode === 1 || wetterCode === 2) {
                wetterBanner.style.backgroundImage = "url('img/sonnigbewolkt.png')";
            } else if (wetterCode === 3) {
                wetterBanner.style.backgroundImage = "url('img/bewolkt.png')";
            } else if ((wetterCode >= 51 && wetterCode <= 65) || (wetterCode >= 80 && wetterCode <= 82)) {
                wetterBanner.style.backgroundImage = "url('img/regen.png')";
            } else {
                wetterBanner.style.backgroundImage = "url('img/bewolkt.png')";
            }
        }

        const maxPollen = Math.max(b, bf, o, a, g);
        if (maxPollen > 15) {
            mainLoad.textContent = "hoch";
            mainLoad.className = "load-high";
            if (!pollenResponse?.error) loadSubtext.innerHTML = `Starke Pollenbelastung in ${stadt.name}.`;
            
   
            aktualisiereStatusAnimation('bad.json');
        } else if (maxPollen > 2) {
            mainLoad.textContent = "mässig";
            mainLoad.className = "";
            if (!pollenResponse?.error) loadSubtext.innerHTML = `Mässige Pollenbelastung in ${stadt.name}.`;
            
   
            aktualisiereStatusAnimation('good.json');
        } else {
            mainLoad.textContent = "schwach";
            mainLoad.className = "";
            if (!pollenResponse?.error) loadSubtext.innerHTML = `Geringe Belastung in ${stadt.name}. Durchatmen möglich!`;
            
         
            aktualisiereStatusAnimation('good.json');
        }

   
        const yB = 280 - Math.min(b * 6, 240);
        const yBf = 280 - Math.min(bf * 6, 240);
        const yO = 280 - Math.min(o * 6, 240);
        const yA = 280 - Math.min(a * 6, 240);
        const yG = 280 - Math.min(g * 6, 240);

        if (graphLine) {
            graphLine.setAttribute('points', `120,${yB} 360,${yBf} 600,${yO} 840,${yA} 1080,${yG}`);
        }

    } catch (error) {
        console.error("Fehler im Verarbeitungsablauf:", error);
        loadSubtext.textContent = "Fehler beim Verarbeiten der Live-Werte.";
    }
}


locationSelect.addEventListener('change', (e) => ladeAPIDaten(e.target.value));


ladeAPIDaten('zuerich');