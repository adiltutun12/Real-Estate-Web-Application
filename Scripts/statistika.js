document.addEventListener("DOMContentLoaded", () => {
    const statistika = StatistikaNekretnina();
    statistika.init(listaNekretnina, listaKorisnika);

    //Prosječna kvadratura
    document.getElementById("btnIzracunajKvadraturu").addEventListener("click", () => {
        const kriterij = {
            tip_nekretnine: document.getElementById("tipNekretnineKvadratura").value,
            tip_grijanja: document.getElementById("tipGrijanjaKvadratura").value,
            min_kvadratura: Number(document.getElementById("minKvadraturaKvadratura").value),
            max_kvadratura: Number(document.getElementById("maxKvadraturaKvadratura").value),
            min_godina_izgradnje: Number(document.getElementById("minGodinaKvadratura").value),
            max_godina_izgradnje: Number(document.getElementById("maxGodinaKvadratura").value),
        };
        const prosjecna = statistika.prosjecnaKvadratura(kriterij);
        document.getElementById("prosjecnaKvadraturaRezultat").textContent = `Prosječna kvadratura: ${prosjecna}`;
    });

    //Outlier
    document.getElementById("btnIzracunajOutlier").addEventListener("click", () => {
        const kriterij = {
            tip_nekretnine: document.getElementById("tipNekretnineOutlier").value,
        };
        const atribut = document.getElementById("atributOutlier").value;
        const outlier = statistika.outlier(kriterij, atribut);
        document.getElementById("outlierRezultat").textContent = `Najveći outlier (${atribut}): ${outlier ? outlier.naziv : "Nema podataka"}`;
    });

    //Moje Nekretnine
    document.getElementById("btnMojeNekretnine").addEventListener("click", () => {
        const kriterij = {
            id: Number(document.getElementById("korisnikId").value),
            tip_nekretnine: document.getElementById("tipNekretnineMoje").value,
            lokacija: document.getElementById("lokacijaMoje").value.trim(),
        };
        const moje = statistika.mojeNekretnine(kriterij);
        const rezultatDiv = document.getElementById("mojeNekretnineRezultat");
        rezultatDiv.innerHTML = moje.length
            ? moje.map(n => `${n.naziv} - ${n.cijena} BAM`).join("<br>")
            : "Nema podataka za zadatog korisnika.";
    });

    //Histogram
    document.getElementById("btnIzracunajHistogram").addEventListener("click", () => {
        const periodi = parseRanges(document.getElementById("periodiHistogram").value);
        const rasponiCijena = parseRanges(document.getElementById("rasponiCijenaHistogram").value);
        const histogramData = statistika.histogramCijena(periodi, rasponiCijena);
        const chartsDiv = document.getElementById("charts");
        chartsDiv.innerHTML = "";

        periodi.forEach((period, indeksPerioda) => {
            const dataForPeriod = histogramData.filter(h => h.indeksPerioda === indeksPerioda);
            const labels = rasponiCijena.map((raspon, indeksRaspona) => `${raspon.od}-${raspon.do}`);
            const data = rasponiCijena.map((_, indeksRaspona) => {
                const match = dataForPeriod.find(h => h.indeksRasponaCijena === indeksRaspona);
                return match ? match.brojNekretnina : 0;
            });

            const canvas = document.createElement("canvas");
            chartsDiv.appendChild(canvas);

            new Chart(canvas, {
                type: "bar",
                data: {
                    labels,
                    datasets: [{
                        label: `Period: ${period.od}-${period.do}`,
                        data,
                        backgroundColor: "rgba(255, 153, 0, 0.6)",
                        borderColor: "rgba(255, 153, 0, 1)",
                        borderWidth: 1,
                    }],
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { title: { display: true, text: "Raspon Cijena (BAM)" } },
                        y: { title: { display: true, text: "Broj Nekretnina" }, beginAtZero: true },
                    },
                },
            });
        });
    });

    function parseRanges(input) {
        return input.split(",").map(range => {
            const [od, do_] = range.split("-").map(Number);
            return { od, do: do_ };
        });
    }
});
