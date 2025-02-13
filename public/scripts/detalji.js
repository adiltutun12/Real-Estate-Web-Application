window.onload = function () {
    // Dinamički dohvaćen ID nekretnine iz URL-a
    const urlParams = new URLSearchParams(window.location.search);
    const nekretninaId = parseInt(urlParams.get('id'), 10);

    if (isNaN(nekretninaId)) {
        console.error("Nije pronađen validan ID nekretnine u URL-u.");
        return;
    }

    console.log(`Učitavam detalje za nekretninu sa ID-em: ${nekretninaId}`);

    // Funkcija za prikazivanje detalja nekretnine
    function prikaziDetaljeNekretnine(nekretnina) {
        document.getElementById('naziv').textContent = nekretnina.naziv || 'Nepoznato';
        document.getElementById('kvadratura').textContent = nekretnina.kvadratura || 'Nepoznato';
        document.getElementById('cijena').textContent = nekretnina.cijena || 'Nepoznato';
        document.getElementById('tip-grijanja').textContent = nekretnina.tip_grijanja || 'Nepoznato';
        document.getElementById('godina-izgradnje').textContent = nekretnina.godina_izgradnje || 'Nepoznato';
        document.getElementById('datum-objave').textContent = nekretnina.datum_objave || 'Nepoznato';
        document.getElementById('opis-tekst').textContent = nekretnina.opis || 'Nema opisa';

        // Ažuriraj link za lokaciju
        const lokacijaLink = document.getElementById('lokacija-link');
        lokacijaLink.textContent = nekretnina.lokacija || 'Nepoznato';
        lokacijaLink.onclick = function () {
            PoziviAjax.getTop5Nekretnina(nekretnina.lokacija, (err, topNekretnine) => {
                if (err) {
                    console.error("Greška prilikom dohvatanja top 5 nekretnina:", err);
                } else {
                    localStorage.setItem('top5Nekretnine', JSON.stringify(topNekretnine));
                    window.location.href = '../html/nekretnine.html';
                }
            });
        };

        const slikaElement = document.getElementById('slika-nekretnine');
        if (slikaElement) {
            slikaElement.src = `../resources/${nekretnina.id}.jpg`; //Postavi putanju slike na osnovu ID-a
            slikaElement.alt = nekretnina.naziv || 'Nekretnina'; //Postavljam alternativni tekst
            slikaElement.onerror = function () {
                slikaElement.src = '../resources/default.jpg'; //Ako slika nije dostupna, koristi default sliku
            };
        }
    }

    //Dohvati detalje nekretnine preko AJAX-a
    PoziviAjax.getNekretnina(nekretninaId, (error, nekretnina) => {
        if (error) {
            console.error("Greška prilikom dohvatanja detalja nekretnine:", error);
        } else {
            console.log("Dobijeni detalji nekretnine sa servera:", nekretnina);
            prikaziDetaljeNekretnine(nekretnina);

            //Emituj događaj za učitavanje carousel-a
            const event = new CustomEvent('detaljiUcitani', { detail: { nekretnina } });
            window.dispatchEvent(event);
        }
    });
};
