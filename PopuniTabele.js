const { Korisnik, Nekretnina, Upit, sequelize } = require('./public/models/models');
const bcrypt = require('bcrypt');

(async () => {
    try {
        console.log('Inicijalizacija podataka...');

        // Dodavanje korisnika
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);
        const useradil = await bcrypt.hash('adil', 10);

        await Korisnik.bulkCreate([
            {
                ime: 'Admin',
                prezime: 'Adminić',
                username: 'admin',
                password: adminPassword,
                admin: true,
            },
            {
                ime: 'Korisnik',
                prezime: 'Korisnićić',
                username: 'user',
                password: userPassword,
                admin: false,
            },
            {
                ime: 'Adil',
                prezime: 'Tutun',
                username: 'adil',
                password: useradil,
                admin: false,
            }
        ], { ignoreDuplicates: true }); //Ignoriše duple korisnike

        console.log('Korisnici su uspješno dodani.');

        // Dodavanje nekretnina
        await Nekretnina.bulkCreate([
            {
                tip_nekretnine: 'Stan',
                naziv: 'Luksuzni stan u centru',
                kvadratura: 85,
                cijena: 250000,
                tip_grijanja: 'Centralno',
                lokacija: 'Sarajevo',
                godina_izgradnje: 2020,
                datum_objave: '2025-01-01',
                opis: 'Stan sa prelijepim pogledom.',
            },
            {
                tip_nekretnine: 'Kuća',
                naziv: 'Prostrana kuća sa vrtom',
                kvadratura: 200,
                cijena: 450000,
                tip_grijanja: 'Pelet',
                lokacija: 'Mostar',
                godina_izgradnje: 2018,
                datum_objave: '2025-01-10',
                opis: 'Kuća idealna za porodice.',
            },
            {
                tip_nekretnine: 'Poslovni prostor',
                naziv: 'Praktična garsonjera',
                kvadratura: 30,
                cijena: 70000,
                tip_grijanja: 'Struja',
                lokacija: 'Banja Luka',
                godina_izgradnje: 2015,
                datum_objave: '2025-01-05',
                opis: 'Mala ali udobna.',
            },
        ], { ignoreDuplicates: true }); //Ignoriše duple nekretnine

        console.log('Nekretnine su uspješno dodane.');

        // Dodavanje upita
        await Upit.bulkCreate([
            { tekst: 'Kolika je cijena?', createdAt: new Date(), updatedAt: new Date(), korisnikId: 1, nekretninaId: 1 },
            { tekst: 'Može li niža cijena?', createdAt: new Date(), updatedAt: new Date(), korisnikId: 2, nekretninaId: 1 },
            { tekst: 'Kada mogu doći na pregled?', createdAt: new Date(), updatedAt: new Date(), korisnikId: 2, nekretninaId: 3 },
            { tekst: 'Kolika je kvadratura?', createdAt: new Date(), updatedAt: new Date(), korisnikId: 1, nekretninaId: 3 },
            { tekst: 'Ima li dodatnih troškova?', createdAt: new Date(), updatedAt: new Date(), korisnikId: 2, nekretninaId: 2 },
            { tekst: 'Da li je stan adaptiran?', createdAt: new Date(), updatedAt: new Date(), korisnikId: 1, nekretninaId: 2 },
            { tekst: 'Da li nekretnina ima pogled na grad ili planinu?', createdAt: new Date(), updatedAt: new Date(), korisnikId: 1, nekretninaId: 2 },
            { tekst: 'Koliko ima soba?', createdAt: new Date(), updatedAt: new Date(), korisnikId: 1, nekretninaId: 2 },
            { tekst: 'Za koliko je osoba odgovarajuća nekretnina', createdAt: new Date(), updatedAt: new Date(), korisnikId: 1, nekretninaId: 2 },
        ], { ignoreDuplicates: true }); // Ignoriše duple upite

        console.log('Upiti su uspješno dodani.'); 
    } catch (error) {
        console.error('Greška prilikom inicijalizacije podataka:', error.message);
    }
})();



/* OVO MI JE POTREBNO PRETVORITI U OVAJ KOD KASNIJE KAKO BI SE MOGLO OVO SVE TESTIRATI ALI ETO IMA U BAZI OVIH DOSTA STVARI - INCIJALNE TABELE POTREBNE ZA TESTIRANJE

INSERT INTO zahtjevs (tekst, trazeniDatum, odobren, createdAt, updatedAt, korisnikId, nekretninaId) VALUES
('Trebam termin za razgledanje', '2025-01-20', false, NOW(), NOW(), 1, 1),
('Da li je dostupno od iduće sedmice?', '2025-01-22', true, NOW(), NOW(), 2, 2),
('Molim vas više informacija o troškovima održavanja', '2025-01-25', false, NOW(), NOW(), 1, 3),
('Je li nekretnina uknjižena?', '2025-01-26', true, NOW(), NOW(), 3, 1),
('Koje su mogućnosti plaćanja?', '2025-01-27', false, NOW(), NOW(), 2, 3);


INSERT INTO ponudas (tekst, cijenaPonude, datumPonude, odbijenaPonuda, createdAt, updatedAt, korisnikId, nekretninaId, vezanaPonudaId) VALUES
('Nudim 240000 BAM za nekretninu', 240000, '2025-01-15', false, NOW(), NOW(), 1, 1, NULL),
('Moja konačna ponuda je 245000 BAM', 245000, '2025-01-17', false, NOW(), NOW(), 2, 1, 1),
('Da li prihvatate moju ponudu od 50000 BAM?', 50000, '2025-01-18', true, NOW(), NOW(), 3, 3, NULL),
('Pristajem na vašu kontra-ponudu', 51000, '2025-01-19', false, NOW(), NOW(), 1, 3, 3),
('Moja ponuda za nekretninu je 300000 BAM', 300000, '2025-01-20', false, NOW(), NOW(), 2, 2, NULL);

*/