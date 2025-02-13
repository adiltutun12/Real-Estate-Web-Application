document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('detaljiUcitani'));
    }, 100); 
});

function prikaziZahtjeveIPonude(idNekretnine) {
    if (!document.getElementById('zahtjeviContainer') || !document.getElementById('ponudeContainer')) {
        console.error("Elementi za zahtjeve ili ponude nisu pronađeni.");
        return;
    }

    PoziviAjax.getInteresovanja(idNekretnine, (error, rezultati) => {
        if (error) {
            console.error('Greška pri dohvaćanju interesovanja:', error);
            return;
        }
        prikaziZahtjeve(rezultati.zahtjevi);
        prikaziPonude(rezultati.ponude);
    });
}

function prikaziZahtjeve(zahtjevi) {
    const container = document.getElementById('zahtjeviContainer');
    zahtjevi.forEach(zahtjev => {
        let div = document.createElement('div');
        div.classList.add('zahtjev');
        div.innerHTML = `<p><strong>Korisnik ${zahtjev.KorisnikId}</strong>: ${zahtjev.tekst}</p>`;
        container.appendChild(div);
    });
}

function prikaziPonude(ponude) {
    const container = document.getElementById('ponudeContainer');
    const ponudeHTML = ponude.map(p => `
        <div class="ponuda">
            <p><strong>ID:</strong> ${p.id}</p>
            <p><strong>Tekst:</strong> ${p.tekst}</p>
            <p><strong>Status:</strong> ${p.status}</p>
        </div>
    `).join('');
    container.innerHTML = ponudeHTML || '<p>Nema ponuda za prikaz.</p>';
}