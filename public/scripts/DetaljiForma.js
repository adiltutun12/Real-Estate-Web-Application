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

        // Ažuriram link za lokaciju
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
            slikaElement.src = `../resources/${nekretnina.id}.jpg`;//Postavi putanju slike na osnovu ID-a
            slikaElement.alt = nekretnina.naziv || 'Nekretnina'; //Postavljam alternativni tekst
            slikaElement.onerror = function () {
                slikaElement.src = '../resources/default.jpg';//Ako slika nije dostupna, koristi default sliku
            };
        }

    }

    
function prikaziFormuInteresovanja(idNekretnine) {
    const formaInteresovanja = document.getElementById('formaInteresovanja');
    if (!formaInteresovanja) {
        console.error("Element za formu interesovanja nije pronađen.");
        return;
    }
    
    const formHTML = `
        <form id="novaInteresovanjaForma">
            <label for="tipInteresovanja">Tip interesovanja:</label>
            <select id="tipInteresovanja" name="tipInteresovanja">
                <option value="upit">Upit</option>
                <option value="zahtjev">Zahtjev</option>
                <option value="ponuda">Ponuda</option>
            </select>
            <div id="dinamickiDioForme"></div>
            <button type="submit">Dodaj</button>
        </form>
    `;
    formaInteresovanja.innerHTML = formHTML;
    const tipInteresovanja = document.getElementById('tipInteresovanja');
    const dinamickiDioForme = document.getElementById('dinamickiDioForme');

    tipInteresovanja.addEventListener('change', () => {
        const odabraniTip = tipInteresovanja.value;
        dinamickiDioForme.innerHTML = '';

        if (odabraniTip === 'ponuda') {
            dinamickiDioForme.innerHTML = `
                <label for="tekstPonude">Tekst ponude:</label>
                <textarea id="tekstPonude" name="tekstPonude" required></textarea>
                <label for="cijenaPonude">Cijena ponude:</label>
                <input type="number" id="cijenaPonude" name="cijenaPonude" required />
                <label for="datumPonude">Datum ponude:</label>
                <input type="date" id="datumPonude" name="datumPonude" required />
                <label for="vezanaPonuda">Vezana ponuda (opcionalno):</label>
                <select id="vezanaPonuda" name="vezanaPonuda">
                    <option value="">Nema vezane ponude</option>
                </select>
                <label for="odbijPonudu">Odbij ponudu:</label>
                <select id="odbijPonudu" name="odbijPonudu">
                    <option value="false" selected>Ne</option>
                    <option value="true">Da</option>
                </select>
            `;
            const vezanaPonuda = document.getElementById('vezanaPonuda');
        
            PoziviAjax.getKorisnik((error, korisnik) => {
                if (error) {
                    console.error('Greška pri dohvaćanju korisnika:', error);
                    return;
                }
        
                PoziviAjax.getInteresovanja(idNekretnine, (error, interesovanja) => {
                    if (error) {
                        console.error('Greška pri dohvaćanju nekretnine:', error);
                        return;
                    }
        
                    if (korisnik.username === 'admin') {
                        const ponude = interesovanja.ponude;
                        vezanaPonuda.innerHTML += ponude
                            .map(p => `<option value="${p.id}">${p.id} - ${p.tekst}</option>`)
                            .join('');
                    } else {
                        const korisnikovePonude = interesovanja.ponude.filter(p => p.KorisnikId === korisnik.id);
                        const vezanePonudeZaKorisnika = interesovanja.ponude.filter(p => 
                            korisnikovePonude.some(kp => kp.id === p.vezanaPonudaId)
                        );  
        
                        const sveRelevantnePonude = [...korisnikovePonude, ...vezanePonudeZaKorisnika];
        
                        if (sveRelevantnePonude.length > 0) {
                            vezanaPonuda.innerHTML += sveRelevantnePonude
                                .map(p => `<option value="${p.id}">${p.id} - ${p.tekst}</option>`)
                                .join('');
                        } else {
                            vezanaPonuda.disabled = true;
                        }
                    }
                });
            });
        } else if (odabraniTip === 'zahtjev') {
            dinamickiDioForme.innerHTML = `
                <label for="tekstZahtjeva">Tekst zahtjeva:</label>
                <textarea id="tekstZahtjeva" name="tekstZahtjeva"></textarea>
                <label for="trazeniDatum">Traženi datum:</label>
                <input type="date" id="trazeniDatum" name="trazeniDatum" required />
            `;
        } else if (odabraniTip === 'upit') {
            dinamickiDioForme.innerHTML = `
                <label for="tekstUpita">Tekst upita:</label>
                <textarea id="tekstUpita" name="tekstUpita" required></textarea>
            `;
        }
    });

    const forma = document.getElementById('novaInteresovanjaForma');
    forma.addEventListener('submit', (e) => {
        e.preventDefault();

        const tip = tipInteresovanja.value;
        const podaci = {
            nekretninaId: idNekretnine,
        };

        if (tip === 'ponuda') {
            podaci.tekst = document.getElementById('tekstPonude').value;
            podaci.cijenaPonude = parseFloat(document.getElementById('cijenaPonude').value);
            podaci.datumPonude = document.getElementById('datumPonude').value;
            podaci.vezanaPonudaId = document.getElementById('vezanaPonuda').value || null;
            podaci.odbijenaPonuda = document.getElementById('odbijPonudu').value === 'true'; 
            PoziviAjax.postPonuda(idNekretnine, podaci, handleInteresovanjeResponse);
        } else if (tip === 'zahtjev') {
            podaci.tekst = document.getElementById('tekstZahtjeva').value;
            podaci.trazeniDatum = document.getElementById('trazeniDatum').value;
            console.log(podaci);
            PoziviAjax.postZahtjev(idNekretnine, podaci, handleInteresovanjeResponse);
        } else if (tip === 'upit') {
            podaci.tekst = document.getElementById('tekstUpita').value;
            PoziviAjax.postUpit(idNekretnine, podaci, handleInteresovanjeResponse);
        }
    });

    function handleInteresovanjeResponse(error, response) {
        if (error) {
            console.error('Greška prilikom dodavanja interesovanja:', error);
            alert('Greška prilikom dodavanja interesovanja.');
        } else {
            alert('Interesovanje uspješno dodano!');
            forma.reset(); 
        }
    }
}


    //Dohvati detalje nekretnine i prikaz forme interesovanja preko AJAX-a
    PoziviAjax.getNekretnina(nekretninaId, (error, nekretnina) => {
        if (error) {
            console.error("Greška prilikom dohvatanja detalja nekretnine:", error);
        } else {
            console.log("Dobijeni detalji nekretnine sa servera:", nekretnina);
            prikaziDetaljeNekretnine(nekretnina);
            prikaziFormuInteresovanja(nekretninaId);

            const event = new CustomEvent('detaljiUcitani', { detail: { nekretnina } });
            window.dispatchEvent(event);
        }
    });
    
};