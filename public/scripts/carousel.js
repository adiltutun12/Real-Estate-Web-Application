window.addEventListener('detaljiUcitani', function (event) {
    const { nekretnina } = event.detail;

    let sviUpiti = nekretnina.upiti.slice(-3); // Inicijalno prikazujemo posljednja 3 upita
    let trenutniIndex = 0;
    let currentPage = 1; // Početna stranica za sljedeće upite
    let hasMoreUpiti = true;
    let isLoading = false; // Sprečavanje višestrukih API poziva

    const carousel = document.querySelector('.carousel');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');

    function prikaziTrenutniUpit() {
        const trenutniUpit = sviUpiti[trenutniIndex]; // Dohvaćanje trenutnog upita
        carousel.innerHTML = trenutniUpit
            ? `
                <div class="carousel-item">
                    <p><strong>Korisnik ID:</strong> ${trenutniUpit.korisnik_id}</p>
                    <p>${trenutniUpit.tekst_upita}</p>
                </div>
            `
            : '<p>Nema dostupnih upita.</p>';
    }

    // Funkcija za učitavanje sljedećih upita
    function ucitajSljedeceUpite(callback) {
        if (!hasMoreUpiti || isLoading) return;

        isLoading = true;
        PoziviAjax.getNextUpiti(nekretnina.id, currentPage, (err, upiti) => {
            isLoading = false;
            if (err || upiti.length === 0) {
                hasMoreUpiti = false;
                console.log("Nema više upita za učitavanje.");
            } else {
                sviUpiti.push(...upiti); // Dodavanje novih upita na kraj liste
                currentPage++;
                callback && callback();
            }
        });
    }

    function fnLijevo() {
        if (trenutniIndex > 0) {
            trenutniIndex--; // Smanjujem indeks
        } else {
            trenutniIndex = sviUpiti.length - 1; // Prelazim na posljednji upit
        }
        prikaziTrenutniUpit();
    }

    function fnDesno() {
        if (trenutniIndex < sviUpiti.length - 1) {
            trenutniIndex++; // Povećavam indeks
        } else if (hasMoreUpiti) {
            // Ako nema više lokalnih upita, učitaj sljedeće upite
            ucitajSljedeceUpite(() => {
                trenutniIndex++; // Prelazim na sljedeći
                prikaziTrenutniUpit();
            });
            return;
        } else {
            trenutniIndex = 0; // Vraćam se na prvi upit
        }
        prikaziTrenutniUpit();
    }

    // Povezivanje dugmadi za navigaciju
    prevButton.addEventListener('click', fnLijevo);
    nextButton.addEventListener('click', fnDesno);

    // Prikaz početnog upita
    prikaziTrenutniUpit();
});
