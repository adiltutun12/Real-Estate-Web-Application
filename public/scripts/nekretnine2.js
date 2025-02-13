function spojiNekretnine(divReferenca, instancaModula, tip_nekretnine) {
    // pozivanje metode za filtriranje
    const filtriraneNekretnine = instancaModula.filtrirajNekretnine({ tip_nekretnine: tip_nekretnine });

    // iscrtavanje elemenata u divReferenca element

    // Ciscenje svih elemenata liste
    divReferenca.innerHTML = '';

    if (filtriraneNekretnine.length === 0) {
        divReferenca.innerHTML = '<p>Trenutno nema dostupnih nekretnina ovoga tipa.</p>';
    } else {
        filtriraneNekretnine.forEach(nekretnina => {
            const nekretninaElement = document.createElement('div');
            if (tip_nekretnine === "Stan") {
                nekretninaElement.classList.add('nekretnina', 'stan');
                nekretninaElement.id = `${nekretnina.id}`;
            }
            else if (tip_nekretnine === "Kuća") {
                nekretninaElement.classList.add('nekretnina', 'kuca');
                nekretninaElement.id = `${nekretnina.id}`;
            }
            else {
                nekretninaElement.classList.add('nekretnina', 'pp');
                nekretninaElement.id = `${nekretnina.id}`;
            }

            // Added search and click count divs
            const pretrageDiv = document.createElement('div');
            pretrageDiv.id = `pretrage-${nekretnina.id}`;
            pretrageDiv.textContent = `pretrage: ${nekretnina.pretrage || 0}`;
            nekretninaElement.appendChild(pretrageDiv);

            const klikoviDiv = document.createElement('div');
            klikoviDiv.id = `klikovi-${nekretnina.id}`;
            klikoviDiv.textContent = `klikovi: ${nekretnina.klikovi || 0}`;
            nekretninaElement.appendChild(klikoviDiv);

            const slikaElement = document.createElement('img');
            slikaElement.classList.add('slika-nekretnine');
            slikaElement.src = `../Resources/${nekretnina.id}.jpg`;
            slikaElement.alt = nekretnina.naziv;
            nekretninaElement.appendChild(slikaElement);

            const detaljiElement = document.createElement('div');
            detaljiElement.classList.add('detalji-nekretnine');
            detaljiElement.innerHTML = `
                <h3>${nekretnina.naziv}</h3>
                <p>Kvadratura: ${nekretnina.kvadratura} m²</p>
            `;
            nekretninaElement.appendChild(detaljiElement);

            const cijenaElement = document.createElement('div');
            cijenaElement.classList.add('cijena-nekretnine');
            cijenaElement.innerHTML = `<p>Cijena: ${nekretnina.cijena} BAM</p>`;
            nekretninaElement.appendChild(cijenaElement);

            // Dodavanje dugmeta "Detalji"
            const detaljiDugme = document.createElement('a');
            detaljiDugme.classList.add('detalji-dugme');
            detaljiDugme.textContent = 'Detalji';
            detaljiDugme.href = `../html/detalji.html?id=${nekretnina.id}`; // Dinamičko dodavanje ID-a nekretnine
            detaljiDugme.addEventListener('click', function (e) {
                e.preventDefault(); // Sprečavanje default ponašanja
                const idNekretnine = nekretnina.id;
                MarketingAjax.klikNekretnina(idNekretnine); // Bilježenje klika
                window.location.href = detaljiDugme.href; // Preusmjeravanje na detalji.html
            });
            nekretninaElement.appendChild(detaljiDugme);
            divReferenca.appendChild(nekretninaElement);
        });
    }
}

const listaNekretnina = []

const listaKorisnika = []

const divStan = document.getElementById("stan");
const divKuca = document.getElementById("kuca");
const divPp = document.getElementById("pp");

// Instanciranje modula
let nekretnine = SpisakNekretnina();
const top5Nekretnine = localStorage.getItem('top5Nekretnine');

if (top5Nekretnine) {
    // Prikaz Top 5 nekretnina
    const nekretninePodaci = JSON.parse(top5Nekretnine);

    console.log("Prikaz Top 5 nekretnina:", nekretninePodaci);
const top5Instance = {
    filtrirajNekretnine: kriterijumi => {
        return nekretninePodaci.filter(nekretnina => nekretnina.tip_nekretnine === kriterijumi.tip_nekretnine);
    }
};

// Prikaz za svaki tip posebno
spojiNekretnine(divStan, top5Instance, "Stan");
spojiNekretnine(divKuca, top5Instance, "Kuća");
spojiNekretnine(divPp, top5Instance, "Poslovni prostor");

    // Očisti localStorage nakon prikaza
    localStorage.removeItem('top5Nekretnine');
} else {
    // Ako nema podataka o top 5 nekretnina, prikaži sve nekretnine
    PoziviAjax.getNekretnine((error, listaNekretnina) => {
        if (error) {
            console.error("Greška prilikom dohvatanja nekretnina sa servera:", error);
        } else {
            console.log("Lista nekretnina dobivena sa servera:", listaNekretnina);

            nekretnine.init(listaNekretnina, listaKorisnika);

            spojiNekretnine(divStan, nekretnine, "Stan");
            spojiNekretnine(divKuca, nekretnine, "Kuća");
            spojiNekretnine(divPp, nekretnine, "Poslovni prostor");
        }
    });
}



function filtrirajNekretnine(filtriraneNekretnine) {
    const filtriraneNekretnineInstance = SpisakNekretnina();
    filtriraneNekretnineInstance.init(filtriraneNekretnine, listaKorisnika);

    spojiNekretnine(divStan, filtriraneNekretnineInstance, "Stan");
    spojiNekretnine(divKuca, filtriraneNekretnineInstance, "Kuća");
    spojiNekretnine(divPp, filtriraneNekretnineInstance, "Poslovni prostor");
}

function filtrirajOnClick() {
    const kriterij = {
        min_cijena: parseFloat(document.getElementById('minCijena').value) || 0,
        max_cijena: parseFloat(document.getElementById('maxCijena').value) || Infinity,
        min_kvadratura: parseFloat(document.getElementById('minKvadratura').value) || 0,
        max_kvadratura: parseFloat(document.getElementById('maxKvadratura').value) || Infinity
    };

    const filtriraneNekretnine = nekretnine.filtrirajNekretnine(kriterij);

    MarketingAjax.novoFiltriranje(
        filtriraneNekretnine.map(nekretnina => nekretnina.id)
    );

    filtrirajNekretnine(filtriraneNekretnine);
}

document.getElementById('dugmePretraga').addEventListener('click', filtrirajOnClick);

setInterval(() => {
    MarketingAjax.osvjeziPretrage(document.getElementById('divNekretnine'));
    MarketingAjax.osvjeziKlikove(document.getElementById('divNekretnine'));
}, 500);