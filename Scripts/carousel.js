function postaviCarousel(glavniElement, sviElementi, indeks = 0) {
    if (!glavniElement || !Array.isArray(sviElementi) || sviElementi.length === 0 || indeks < 0 || indeks >= sviElementi.length) {
        return null;
    }

    function prikaziElement(index) {
        glavniElement.innerHTML = sviElementi[index].innerHTML;
    }
    
    prikaziElement(indeks);  //Prikaz inicijalnog elementa

    function fnLijevo() {
        indeks = (indeks - 1 + sviElementi.length) % sviElementi.length;
        prikaziElement(indeks);
    }

    function fnDesno() {
        indeks = (indeks + 1) % sviElementi.length;
        prikaziElement(indeks);
    }

    return { fnLijevo, fnDesno };
}
