function postaviCarousel(glavniElement, sviElementi, pocetniIndeks = 0) {
    if (!glavniElement || !Array.isArray(sviElementi) || sviElementi.length === 0 || pocetniIndeks < 0 || pocetniIndeks >= sviElementi.length) {
        return null;
    }

    let trenutniIndeks = pocetniIndeks;

    function prikaziElement(indeks) {
        glavniElement.innerHTML = sviElementi[indeks].innerHTML;
    }

    prikaziElement(trenutniIndeks);

    return {
        fnLijevo: function () {
            trenutniIndeks = (trenutniIndeks - 1 + sviElementi.length) % sviElementi.length;
            prikaziElement(trenutniIndeks);
        },
        fnDesno: function () {
            trenutniIndeks = (trenutniIndeks + 1) % sviElementi.length;
            prikaziElement(trenutniIndeks);
        }
    };
}
