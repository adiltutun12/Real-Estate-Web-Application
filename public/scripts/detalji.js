document.addEventListener('detaljiUcitani', () => {
    const upitiContainer = document.getElementById('upitiContainer');
    const zahtjeviContainer = document.getElementById('zahtjeviContainer');
    const ponudeContainer = document.getElementById('ponudeContainer');

    if (!upitiContainer || !zahtjeviContainer || !ponudeContainer) {
        console.error('Upiti, zahtjevi ili ponude container nije pronađen.');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const idNekretnine = params.get('id');
    if (!idNekretnine) {
        console.error('ID nekretnine nije pronađen u URL-u.');
        return;
    }

    PoziviAjax.getKorisnik((error, korisnik) => {
        if (error) {
            console.error('Greška pri dohvaćanju korisnika:', error);
            return;
        }

        PoziviAjax.getInteresovanja(idNekretnine, (error, rezultati) => {
            if (error) {
                console.error('Greška pri dohvaćanju interesovanja:', error);
                return;
            }

            PoziviAjax.getNekretnina(idNekretnine, (error, trenutnaNekretnina) => {
                if (error) {
                    console.error('Greška pri dohvaćanju nekretnine:', error);
                    return;
                }

                if (!trenutnaNekretnina) {
                    console.error('Nekretnina s tim ID-om nije pronađena.');
                    return;
                }
                ucitajSveUpite(0, idNekretnine, upitiContainer, 'upit', korisnik, 'prevBtn', 'nextBtn');
                setupCarousel(zahtjeviContainer, rezultati.zahtjevi, 'zahtjev', korisnik, 'prevBtn1', 'nextBtn1');
                setupCarousel(ponudeContainer, rezultati.ponude, 'ponuda', korisnik, 'prevBtn2', 'nextBtn2');
            });
        });
    });
});

//Kreirana funkcija koja rekurzivno učitava sve upite, dok se ne učitaju svi radi rute koja vraaća posljednja tri upita
function ucitajSveUpite(stranica, nekretninaId, container, className, korisnik, prevBtnId, nextBtnId) {
    PoziviAjax.getNextUpiti(nekretninaId, stranica, (error, upiti) => {
        if (error || upiti.length === 0) {
            let elements = Array.from(container.querySelectorAll(`.${className}`));
            let carousel = postaviCarousel(container, elements, 0);
            handleCarouselNavigation(carousel, prevBtnId, nextBtnId);
            return;
        }

        upiti.forEach(upit => {
            let div = document.createElement('div');
            div.classList.add(className);
            div.innerHTML = `<p><strong>Korisnik ${upit.korisnikId}</strong>: ${upit.tekst}</p>`;
            container.appendChild(div);
        });

        ucitajSveUpite(stranica + 1, nekretninaId, container, className, korisnik, prevBtnId, nextBtnId);
    });
}

function setupCarousel(container, items, className, korisnik, prevBtnId, nextBtnId) {
    items.forEach(item => {
        let div = document.createElement('div');
        div.classList.add(className);
        div.innerHTML = createItemContent(item, className, korisnik);
        container.appendChild(div);
    });

    let elements = Array.from(container.querySelectorAll(`.${className}`));
    let carousel = postaviCarousel(container, elements, 0);
    handleCarouselNavigation(carousel, prevBtnId, nextBtnId);
}

function createItemContent(item, className, korisnik) {
    if (className === 'zahtjev') {
        let status = item.odobren ? "true" : "false";
        let additionalInfo = korisnik.admin || korisnik.id === item.korisnikId ? 
            `<p><strong>NekretninaID:</strong> ${item.nekretninaId}</p>
             <p><strong>KorisnikID:</strong> ${item.korisnikId}</p>` : '';
        return `
            <p><strong>ID zahtjeva:</strong> ${item.id}</p>
            <p><strong> Tekst: </strong> ${item.tekst}</p>
            <p><strong>Datum:</strong> ${item.trazeniDatum}</p>
            <p><strong>Status:</strong> ${status}</p>
            ${additionalInfo}`;
    } else if (className === 'ponuda') {
        let status = item.odbijenaPonuda ? "true" : "false";
        return `
            <p><strong>ID ponude:</strong> ${item.id}</p>
            <p><strong>Tekst:</strong> ${item.tekst}</p>
            <p><strong>Status:</strong> ${status}</p>`;
    }
}

function handleCarouselNavigation(carousel, prevBtnId, nextBtnId) {
    let prevButton = document.getElementById(prevBtnId);
    let nextButton = document.getElementById(nextBtnId);

    prevButton.addEventListener('click', () => carousel.fnLijevo());
    nextButton.addEventListener('click', () => carousel.fnDesno());
}
