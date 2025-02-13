let StatistikaNekretnina = function () {
    let spisakNekretninaModul;

    let init = function (listaNekretnina, listaKorisnika) {
        spisakNekretninaModul = SpisakNekretnina();
        spisakNekretninaModul.init(listaNekretnina, listaKorisnika);
    };

    let prosjecnaKvadratura = function (kriterij) {
        const filtriraneNekretnine = spisakNekretninaModul.filtrirajNekretnine(kriterij);
        if (filtriraneNekretnine.length === 0) return 0;
        const totalKvadratura = filtriraneNekretnine.reduce((sum, nekretnina) => sum + nekretnina.kvadratura, 0);
        return totalKvadratura / filtriraneNekretnine.length;
    };

    let outlier = function (kriterij, nazivSvojstva) {
        const filtriraneNekretnine = spisakNekretninaModul.filtrirajNekretnine(kriterij);
        if (filtriraneNekretnine.length === 0) return null;

        const srednjaVrijednost = filtriraneNekretnine.reduce((sum, nekretnina) => sum + nekretnina[nazivSvojstva], 0) / filtriraneNekretnine.length;

        return filtriraneNekretnine.reduce((maxOutlier, nekretnina) => {
            const odstupanje = Math.abs(nekretnina[nazivSvojstva] - srednjaVrijednost);
            const maxOdstupanje = Math.abs(maxOutlier[nazivSvojstva] - srednjaVrijednost);
            return odstupanje > maxOdstupanje ? nekretnina : maxOutlier;
        }, filtriraneNekretnine[0]);
    };

    let mojeNekretnine = function (kriterij) {
        const korisnikId = kriterij.id;

        //Filtriraj nekretnine po korisniku
        let filtriraneNekretnine = spisakNekretninaModul.listaNekretnina.filter(nekretnina =>
            nekretnina.upiti.some(upit => upit.korisnik_id === korisnikId)
        );

        //Filtriraj prema tipu nekretnine
        if (kriterij.tip_nekretnine) {
            filtriraneNekretnine = filtriraneNekretnine.filter(nekretnina =>
                nekretnina.tip_nekretnine === kriterij.tip_nekretnine
            );
        }

        //Filtriraj prema lokaciji
        if (kriterij.lokacija) {
            filtriraneNekretnine = filtriraneNekretnine.filter(nekretnina =>
                nekretnina.lokacija.toLowerCase().includes(kriterij.lokacija.toLowerCase())
            );
        }

        //Sortiraj po broju upita korisnika
        return filtriraneNekretnine.sort((a, b) =>
            b.upiti.filter(upit => upit.korisnik_id === korisnikId).length -
            a.upiti.filter(upit => upit.korisnik_id === korisnikId).length
        );
    };

    //Funkcija za parsiranje datuma iz formata "dd.mm.yyyy."
    function parseDatum(datumString) {
        const [dan, mjesec, godina] = datumString.split(".").map(Number);
        return new Date(godina, mjesec - 1, dan); //Mjesec je 0-indeksiran u Date objektima
    }

    let histogramCijena = function (periodi, rasponiCijena) {
        let histogram = [];
        
        periodi.forEach((period, indeksPerioda) => {
            const nekretnineUPeriodu = spisakNekretninaModul.listaNekretnina.filter(nekretnina => {
                const datumObjave = parseDatum(nekretnina.datum_objave);
                const godinaObjave = datumObjave.getFullYear();
                return godinaObjave >= period.od && godinaObjave <= period.do;
            });

            rasponiCijena.forEach((raspon, indeksRasponaCijena) => {
                const brojNekretnina = nekretnineUPeriodu.filter(nekretnina =>
                    nekretnina.cijena >= raspon.od && nekretnina.cijena <= raspon.do
                ).length;

                histogram.push({
                    indeksPerioda: indeksPerioda,
                    indeksRasponaCijena: indeksRasponaCijena,
                    brojNekretnina: brojNekretnina
                });
            });
        });

        return histogram;
    };


    return {
        init: init,
        prosjecnaKvadratura: prosjecnaKvadratura,
        outlier: outlier,
        mojeNekretnine: mojeNekretnine,
        histogramCijena: histogramCijena
    };
};
