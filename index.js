const express = require('express');
const session = require("express-session");
const path = require('path');
const fs = require('fs').promises; 
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;


const { Korisnik, Nekretnina, Upit, Ponuda, Zahtjev, sequelize } = require('./public/models/models');


app.use(session({
  secret: 'tajna sifra',
  resave: true,
  saveUninitialized: true
})); 

app.use(express.static(__dirname + '/public'));

// Enable JSON parsing without body-parser
app.use(express.json());


/* ---------------- SERVING HTML -------------------- */

// Async function for serving html files
async function serveHTMLFile(req, res, fileName) {
  const htmlPath = path.join(__dirname, 'public/html', fileName);
  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    res.send(content);
  } catch (error) {
    console.error('Error serving HTML file:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
}

// Array of HTML files and their routes
const routes = [
  { route: '/nekretnine.html', file: 'nekretnine.html' },
  { route: '/detalji.html', file: 'detalji.html' },
  { route: '/meni.html', file: 'meni.html' },
  { route: '/prijava.html', file: 'prijava.html' },
  { route: '/profil.html', file: 'profil.html' },
  // Practical for adding more .html files as the project grows
];

// Loop through the array so HTML can be served
routes.forEach(({ route, file }) => {
  app.get(route, async (req, res) => {
    await serveHTMLFile(req, res, file);
  });
});

/* ----------- SERVING OTHER ROUTES --------------- */

// Async function for reading json data from data folder 
async function readJsonFile(filename) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    const rawdata = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(rawdata);
  } catch (error) {
    throw error;
  }
}

// Async function for reading json data from data folder 
async function saveJsonFile(filename, data) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw error;
  }
}


//Login sam uradio uspješno pomoću baze podataka 
let loginAttempts = {};
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const now = Date.now();

    //Inicijalizacija podataka za korisnika u loginAttempts
    if (!loginAttempts[username]) {
        loginAttempts[username] = { count: 0, blockedUntil: null, firstBlocked: true };
    }

    const userData = loginAttempts[username];

    //Provjera da li je korisnik blokiran
    if (userData.blockedUntil) {
        if (now < userData.blockedUntil) {
            // Korisnik je još uvijek blokiran
            if (userData.firstBlocked) {
                await fs.appendFile('prijave.txt', `[${new Date().toISOString()}] - username: "${username}" - status: "blokiran"\n`);
                userData.firstBlocked = false; //Postavi na false da se poruka "blokiran" ne ponavlja
            } else {
                await fs.appendFile('prijave.txt', `[${new Date().toISOString()}] - username: "${username}" - status: "neuspjesno"\n`);
            }

            return res.status(429).json({ greska: "Previse neuspjesnih pokusaja. Pokusajte ponovo za 1 minutu." });
        } else {
            //Blokada je istekla, resetujem broj pokušaja i firstBlocked
            userData.count = 0;
            userData.blockedUntil = null;
            userData.firstBlocked = true;
        }
    }

    try {
        //Pronalazim korisnika u bazi podataka
        const korisnik = await Korisnik.findOne({ where: { username } });

        if (korisnik && await bcrypt.compare(password, korisnik.password)) {
            //Resetovanje broja pokušaja ako je prijava uspješna
            userData.count = 0;
            userData.blockedUntil = null;
            userData.firstBlocked = true;

            //Postavljanje sesije
            req.session.username = username;

            //Logovanje uspješne prijave
            await fs.appendFile('prijave.txt', `[${new Date().toISOString()}] - username: "${username}" - status: "uspjesno"\n`);

            return res.json({ poruka: 'Uspješna prijava' });
        } else {
            userData.count++;

            //Ako broj pokušaja premaši 3, postavlja se blokada na 1 minut
            if (userData.count >= 3) {
                userData.blockedUntil = now + 60 * 1000; // 1 minut blokade
                userData.firstBlocked = true; // Postavi na true za prvi pokušaj tokom blokade
            }

            //Logovanje neuspješne prijave
            await fs.appendFile('prijave.txt', `[${new Date().toISOString()}] - username: "${username}" - status: "neuspjesno"\n`);

            return res.status(401).json({ poruka: 'Neuspješna prijava' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ greska: 'Internal Server Error' });
    }
});



//NOVA RUTA ZA TOP 5 LOKACIJA ODREDJENE NEKRETNINE 
app.get('/nekretnine/top5', async (req, res) => {
  const lokacija = req.query.lokacija; //Dohvaćam lokaciju iz query string-a

  if (!lokacija) {
      return res.status(400).json({ greska: "Parametar 'lokacija' je obavezan." });
  }

  try {
      //Dohvati nekretnine iz baze filtrirane po lokaciji, sortirane po datumu objave (najnovije prvo), limit 5
      const nekretnine = await Nekretnina.findAll({
          where: { lokacija },
          order: [['datum_objave', 'DESC']], //Sortiranje po datumu objave (najnovije prvo)
          limit: 5, //Maksimalno 5 nekretnina
      });

      if (nekretnine.length === 0) {
          return res.status(404).json({ poruka: "Nema nekretnina za zadanu lokaciju." });
      }

      return res.status(200).json(nekretnine); //Vraća niz nekretnina kao odgovor
  } catch (error) {
      console.error('Greška prilikom obrade rute /nekretnine/top5:', error);
      return res.status(500).json({ greska: "Došlo je do greške na serveru." });
  }
});



/*
Delete everything from the session.
*/
app.post('/logout', (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Clear all information from the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).json({ greska: 'Internal Server Error' });
    } else {
      res.status(200).json({ poruka: 'Uspješna odjava' });
    }
  });
});

//Ruta koja se koristi za vraćanje podataka korisnika prepravljena da radi sa bazom podataka
app.get('/korisnik', async (req, res) => {
  //Provjera da li je korisnik prijavljen
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const username = req.session.username;

  try {
    //Pronalazim korisnika u bazi prema username-u
    const korisnik = await Korisnik.findOne({ where: { username } });

    if (!korisnik) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    //Podaci za odgovor (isključujemo password iz odgovora)
    const userData = {
      id: korisnik.id,
      ime: korisnik.ime,
      prezime: korisnik.prezime,
      username: korisnik.username,
      admin: korisnik.admin, //Dodaj admin status ako je relevantno
    };

    res.status(200).json(userData); //Vraćanje podataka o korisniku
  } catch (error) {
    console.error('Greška prilikom dohvaćanja podataka korisnika:', error.message);
    res.status(500).json({ greska: 'Došlo je do greške na serveru.' });
  }
});


/*
Allows logged user to make a request for a property
*/


//OVUUU PROVJERIIIII BITNOO BAS DA JE PROVJERISSSSS
//Prepavljena ruta (post) tako da se moze korisiti sa bazom 
app.post('/upit', async (req, res) => {
  const { username } = req.session;
  const { nekretninaId, tekst } = req.body;

  if (!username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  try {
    const korisnik = await Korisnik.findOne({ where: { username } });
    if (!korisnik) throw new Error('Korisnik nije pronađen');

    const nekretnina = await Nekretnina.findByPk(nekretninaId);
    if (!nekretnina) {
      return res.status(400).json({ greska: `Nekretnina sa id-em ${nekretninaId} ne postoji` });
    }

    const brojUpita = await Upit.count({ where: { KorisnikId: korisnik.id, NekretninaId: nekretnina.id } });
    if (brojUpita >= 3) {
      return res.status(429).json({ greska: 'Previše upita za istu nekretninu.' });
    }

    await Upit.create({
      tekst: tekst,
      korisnikId: korisnik.id,
      nekretninaId: nekretnina.id,
    });

    res.json({ poruka: 'Upit je uspješno dodan.' });
  } catch (error) {
    console.error('Greška pri dodavanju upita:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});




app.get('/upiti/moji', async (req, res) => {
    try {
        //Provjeravam da li je korisnik prijavljen
        if (!req.session || !req.session.username) {
            return res.status(401).json({ greska: 'Neautorizovan pristup' });
        }

        //Pronalazak prijavljenog korisnika na osnovu username-a iz sesije
        const loggedInUser = await Korisnik.findOne({ where: { username: req.session.username } });

        if (!loggedInUser) {
            return res.status(401).json({ greska: 'Neautorizovan pristup' });
        }

        //Pronalazim sve upite za prijavljenog korisnika
        const korisnikoviUpiti = await Upit.findAll({
            where: { korisnikId: loggedInUser.id },
            attributes: ['tekst', 'nekretninaId'], // Vraćamo samo potrebna polja
        });

        //Ako korisnik nema upita, vrati prazan niz sa statusom 404
        if (korisnikoviUpiti.length === 0) {
            return res.status(404).json([]);
        }

        //Formatiranje upita za izlaz
        const formatiraniUpiti = korisnikoviUpiti.map(upit => ({
            id_nekretnine: upit.nekretninaId,
            tekst_upita: upit.tekst,
        }));

        //Vrati sve korisnikove upite sa statusom 200
        res.status(200).json(formatiraniUpiti);
    } catch (error) {
        console.error('Error fetching user queries:', error.message);
        res.status(500).json({ greska: 'Internal Server Error' });
    }
});

//Uradjeno mi je ovo samo sto mi je pomoću id-a, odnosno vraća posljednja tri upita
app.get('/nekretnina/:id', async (req, res) => {
    try {
        // Dohvati ID nekretnine iz URL parametara
        const nekretninaId = parseInt(req.params.id, 10);
        
        // Pronađi nekretninu sa zadatim ID-em, uključujući posljednja 3 upita
        const nekretnina = await Nekretnina.findByPk(nekretninaId, {
            include: [{
                model: Upit,
                limit: 3,
                order: [['id', 'DESC']], // Posljednji upiti (opadajući po vremenu ili po ID-u vidjeti koje trebaju ovo pitati?????????????????????)
            }],
        });

        // Ako nekretnina nije pronađena, vrati status 404
        if (!nekretnina) {
            return res.status(404).json({ greska: `Nekretnina sa id-em ${nekretninaId} ne postoji` });
        }

        // Vrati detalje nekretnine sa statusom 200
        res.status(200).json(nekretnina);
    } catch (error) {
        console.error('Error fetching property details:', error.message);
        res.status(500).json({ greska: 'Internal Server Error' });
    }
});

//Prepravljena ruta tako da radi sa bazom podataka 
app.get('/next/upiti/nekretnina:id', async (req, res) => {
    const nekretninaId = parseInt(req.params.id, 10);
    const stranica = parseInt(req.query.page, 10);

    //Provjera validnosti parametara
    if (isNaN(nekretninaId) || isNaN(stranica) || stranica < 0) {
        return res.status(400).json({ greska: "Page mora biti broj veći ili jednak 0" });
    }

    try {
        //Dohvati sve upite za zadanu nekretninu
        const upiti = await Upit.findAll({
            where: { nekretninaId },
            order: [['id', 'DESC']], //Posljednji dodani upiti prvi ovdje takodjer vidi jel po datumu kreiranja iako mislim da jeste tako da bi to trebalo biti to
            //Ovdje može biti još i po 'createdAt' 
        });

        if (!upiti.length) {
            return res.status(404).json({ greska: `Nema upita za nekretninu sa ID-em ${nekretninaId}` });
        }

        const ukupnoUpita = upiti.length;
        const upitiPoStranici = 3;

        //Logika za page = 0 (posljednja 3 upita)
        if (stranica === 0) {
            const posljednjaTri = upiti.slice(0, Math.min(upitiPoStranici, ukupnoUpita));
            return res.status(200).json(posljednjaTri.map(upit => ({
                korisnikId: upit.korisnikId,
                tekst: upit.tekst,
            })));
        }

        //Izračunavanje opsega za trenutnu stranicu
        const pocetak = (stranica - 1) * upitiPoStranici + 3;
        const kraj = pocetak + upitiPoStranici;

        const stranicaUpiti = upiti.slice(pocetak, kraj);

        //Ako nema više upita za trenutnu stranicu
        if (!stranicaUpiti.length) {
            return res.status(200).json([]); //Ovdje sam imao problema kada dođem do kraja carousel-a vraćalo mi je grešku
        }

        //Vraćanje upita za traženu stranicu
        return res.status(200).json(stranicaUpiti.map(upit => ({
            korisnikId: upit.korisnikId,
            tekst: upit.tekst,
        })));
    } catch (error) {
        console.error('Greška prilikom dohvaćanja upita:', error.message);
        res.status(500).json({ greska: 'Internal Server Error' });
    }
});


app.get('/nekretnina/:id/interesovanja', async (req, res) => {
  const nekretninaId = req.params.id;

  try {
      //Provjera da li nekretnina postoji
      const nekretnina = await Nekretnina.findByPk(nekretninaId);
      if (!nekretnina) {
          return res.status(404).json({ greska: 'Nekretnina nije pronađena.' });
      }

      //Dohvaćam sva interesovanja vezana za nekretninu
      const upiti = await Upit.findAll({ where: { NekretninaId: nekretninaId } });
      const zahtjevi = await Zahtjev.findAll({ where: { NekretninaId: nekretninaId } });
      const ponude = await Ponuda.findAll({ where: { NekretninaId: nekretninaId } });

      //Dohvaćam prijavljenog korisnika (ako postoji)
      const loggedInUser = req.session?.username 
          ? await Korisnik.findOne({ where: { username: req.session.username } }) 
          : null;

      const isAdmin = loggedInUser?.admin;

      if (isAdmin) {
          //Ako je admin prijavljen, vraća sve podatke bez filtriranja
          return res.json({ upiti, zahtjevi, ponude });
      }

      //Filtriranje ponuda za obične korisnike
      const filtriranePonude = await Promise.all(ponude.map(async (ponuda) => {
          if (loggedInUser && ponuda.KorisnikId === loggedInUser.id) {
              return ponuda; // Vraća ponudu ako je korisnik njen kreator
          }

          if (ponuda.vezanaPonudaId) {
              const vezanaPonuda = await Ponuda.findByPk(ponuda.vezanaPonudaId);
              if (vezanaPonuda && vezanaPonuda.KorisnikId === loggedInUser?.id) {
                  return ponuda; //Vraća ponudu ako je vezana za korisnika
              }
          }

          //Uklanjanje cijene ponude za ostale korisnike
          const { cijenaPonude, ...ponudaBezCijene } = ponuda.toJSON();
          return ponudaBezCijene;
      }));

      //Slanje odgovora sa filtriranim interesovanjima
      res.json({
          upiti,
          zahtjevi,
          ponude: filtriranePonude,
      });
  } catch (error) {
      console.error('Greška prilikom dohvata interesovanja:', error);
      res.status(500).json({ greska: 'Greška na serveru.' });
  }
});



/*
Updates any user field
*/
app.put('/korisnik', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const { ime, prezime, username, password } = req.body;

  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });

    if (!korisnik) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }
    if (ime) korisnik.ime = ime;
    if (prezime) korisnik.prezime = prezime;
    if (username) korisnik.username = username;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      korisnik.password = hashedPassword;
    }

    await korisnik.save();
    res.status(200).json({ poruka: 'Podaci su uspješno ažurirani' });
  } catch (error) {
    console.error('Greška prilikom ažuriranja korisnika:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


/*
Returns all properties from the file.
*/

//Vidi i ovu ali mislim da mi je dobra jer vrćam incijalno kao sto je bilo i prije u nekretnine.json fajlu tako i ovdje vraćam, jer se vrćalo tamo za nekretnine također i upiti tako i ovdje radim
app.get('/nekretnine', async (req, res) => {
  try {
    //Dohvaćam svie nekretnine iz baze zajedno sa povezanim upitima
    const nekretnineData = await Nekretnina.findAll({
      include: [
        {
          model: Upit, //Povezujem upite
          attributes: ['korisnikId','tekst'], //Polja koja želimo iz modela Upit - ovdje dodati jos polja ako budu bila potrebna
        },
      ],
    });

    res.status(200).json(nekretnineData); 
  } catch (error) {
    console.error('Greška prilikom dohvaćanja nekretnina:', error);
    res.status(500).json({ greska: 'Došlo je do greške na serveru.' });
  }
});


app.post('/nekretnina/:id/ponuda', async (req, res) => {
  const nekretninaId = req.params.id;
  const { tekst, cijenaPonude, datumPonude, vezanaPonudaId, odbijenaPonuda } = req.body;

  try {
      //Provjera postojanja nekretnine
      const nekretnina = await Nekretnina.findByPk(nekretninaId);
      if (!nekretnina) {
          return res.status(404).json({ greska: 'Nekretnina nije pronađena.' });
      }

      //Provjera prijavljenog korisnika
      const loggedInUser = req.session?.username
          ? await Korisnik.findOne({ where: { username: req.session.username } })
          : null;

      if (!loggedInUser) {
          return res.status(401).json({ greska: 'Korisnik nije prijavljen.' });
      }

      //Provjera validnosti vezane ponude
      if (vezanaPonudaId !== null) {
          const vezanaPonuda = await Ponuda.findByPk(vezanaPonudaId);
          if (!vezanaPonuda) {
              return res.status(400).json({ greska: 'Vezana ponuda nije pronađena.' });
          }

          if (vezanaPonuda.korisnikId !== loggedInUser.id && !loggedInUser.admin) {
              return res.status(403).json({ greska: 'Nemate dozvolu za odgovor na ovu ponudu.' });
          }

          if (vezanaPonuda.odbijenaPonuda) {
              return res.status(400).json({ greska: 'Ponuda je odbijena. Nije moguće dodati novu ponudu.' });
          }
      }

      //Provjera postojanja početne ponude za korisnika
      if (vezanaPonudaId === null) {
          const postojiPonuda = await Ponuda.findOne({
              where: {
                  nekretninaId: nekretninaId,
                  korisnikId: loggedInUser.id,
                  vezanaPonudaId: null,
              },
          });

          if (postojiPonuda) {
              return res.status(400).json({ greska: 'Već imate početnu ponudu za ovu nekretninu.' });
          }
      }

      //Kreiranje nove ponude
      const novaPonuda = await Ponuda.create({
          tekst,
          cijenaPonude: cijenaPonude,
          datumPonude,
          odbijenaPonuda,
          nekretninaId: nekretninaId,
          korisnikId: loggedInUser.id,
          vezanaPonudaId: vezanaPonudaId !== null ? vezanaPonudaId : null,
        });

      return res.status(200).json(novaPonuda);
  } catch (error) {
      console.error('Greška prilikom kreiranja ponude:', error);
      return res.status(500).json({ greska: 'Došlo je do greške na serveru.' });
  }
});



// Dodavanje testnog slucaja ovdje da vidim jel mi radi bez postmana
/* OVAJ KOD SAM NAPISAO SAMO KAO TESTNI DA PROVJERIM POST RUTU I ONA ZAPRAVO RADI KAKO BI TREBALO 
app.get('/test/ponuda', async (req, res) => {
  if (!req.session || !req.session.username) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const testData = {
      tekst: "Nudim 300000 BAM za nekretninu.",
      ponudaCijene: 300000,
      datumPonude: "2025-01-15",
      idVezanePonude: null,
      odbijenaPonuda: false,
  };

  try {
      // Dohvati prijavljenog korisnika iz baze na osnovu sesije
      const loggedInUser = await Korisnik.findOne({ where: { username: req.session.username } });

      if (!loggedInUser) {
          return res.status(401).json({ greska: 'Neautorizovan pristup' });
      }

      // Kreiraj novu ponudu sa ID-jem prijavljenog korisnika
      const novaPonuda = await Ponuda.create({
          tekst: testData.tekst,
          cijenaPonude: testData.ponudaCijene,
          datumPonude: testData.datumPonude,
          odbijenaPonuda: testData.odbijenaPonuda,
          nekretninaId: 1, 
          korisnikId: loggedInUser.id,
          vezanaPonudaId: null,
      });

      res.status(201).json(novaPonuda);
  } catch (error) {
      console.error('Greška prilikom dodavanja ponude:', error.message);
      res.status(500).json({ greska: 'Greška na serveru.' });
  }
});
*/

app.post('/nekretnina/:id/zahtjev', async (req, res) => {
  const nekretninaId = req.params.id; //Dohvati ID nekretnine iz URL-a
  const { tekst, trazeniDatum } = req.body; //Ekstrakcija podataka iz tijela zahtjeva
  const korisnickoIme = req.session?.username; //Dohvati username iz sesije

  if (!korisnickoIme) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  try {
      //Validacija traženog datuma
      const danas = new Date();
      const trazeniDatumObj = new Date(trazeniDatum);
      if (isNaN(trazeniDatumObj.getTime()) || trazeniDatumObj < danas) {
          return res.status(400).json({ greska: 'Traženi datum mora biti validan i u budućnosti.' });
      }

      //Provjera postojanja nekretnine
      const nekretnina = await Nekretnina.findByPk(nekretninaId);
      if (!nekretnina) {
          return res.status(404).json({ greska: `Nekretnina sa ID-em ${nekretninaId} ne postoji.` });
      }

      //Dohvati korisnika iz baze
      const korisnik = await Korisnik.findOne({ where: { username: korisnickoIme } });
      if (!korisnik) {
          return res.status(404).json({ greska: 'Korisnik nije pronađen.' });
      }

      //Kreiranje novog zahtjeva
      const noviZahtjev = await Zahtjev.create({
          tekst,
          trazeniDatum,
          nekretninaId: nekretnina.id, 
          korisnikId: korisnik.id, 
      });

      return res.status(200).json(noviZahtjev);


  } catch (error) {
      console.error('Greška prilikom kreiranja zahtjeva:', error.message);
      res.status(500).json({ greska: 'Greška na serveru.' });
  }
});


//Napisan takodjer kod kako bih mogao izvrsiti testiranje u get-u, bez POSTMAN-a
/*
app.get('/test/zahtjev', async (req, res) => {
  // Testni podaci
  const testData = {
      tekst: "Želim razgledanje nekretnine.",
      trazeniDatum: "2025-01-01",
  };
  const nekretninaId = 1; 

  try {
      // Provjeri da li je korisnik prijavljen
      if (!req.session || !req.session.username) {
          return res.status(401).json({ greska: 'Neautorizovan pristup' });
      }

      // Dohvati prijavljenog korisnika
      const loggedInUser = await Korisnik.findOne({ where: { username: req.session.username } });
      if (!loggedInUser) {
          return res.status(401).json({ greska: 'Neautorizovan pristup' });
      }

      // Provjeri da li nekretnina postoji
      const nekretnina = await Nekretnina.findByPk(nekretninaId);
      if (!nekretnina) {
          return res.status(404).json({ greska: `Nekretnina sa ID-em ${nekretninaId} ne postoji.` });
      }

      // Kreiraj novi zahtjev
      const noviZahtjev = await Zahtjev.create({
          tekst: testData.tekst,
          trazeniDatum: testData.trazeniDatum,
          odobren: false,
          nekretninaId,
          korisnikId: loggedInUser.id,
      });

      res.status(201).json({
          poruka: 'Testni zahtjev je uspješno kreiran.',
          zahtjev: noviZahtjev,
      });
  } catch (error) {
      console.error('Greška prilikom kreiranja zahtjeva (test):', error.message);
      res.status(500).json({ greska: 'Došlo je do greške na serveru.' });
  }
});
*/

//Dodavanje put metode vezane za zahtjev  -- MISLIM DA JE OKEJ OVA RUTA ALI MORAĆU MALO JOS PROVJERITI JEL TO TO SVE TU BITNO 
app.put('/nekretnina/:id/zahtjev/:zid', async (req, res) => {
  const nekretninaId = req.params.id;
  const zahtjevId = req.params.zid;
  const { odobren, addToTekst } = req.body;

  try {
      //Provjeravam autentifikaciju i administratorsku ulogu
      const loggedInUser = req.session?.username
          ? await Korisnik.findOne({ where: { username: req.session.username } })
          : null;

      if (!loggedInUser || !loggedInUser.admin) {
          return res.status(403).json({ greska: 'Samo admin može odgovoriti na zahtjev.' });
      }

      const zahtjev = await Zahtjev.findByPk(zahtjevId);
    if (!zahtjev || zahtjev.NekretninaId != nekretninaId) {
      return res.status(404).json({ greska: 'Zahtjev ejkfnwejfnije pronađen.' });
    }

    if (!odobren && !addToTekst) {
      return res.status(400).json({ greska: 'Ako zahtjev nije odobren, mora biti poslan i text uz njega.' });
    }

    let noviTekst = zahtjev.tekst;
    if (addToTekst) {
      noviTekst += ` ODGOVOR ADMINA: ${addToTekst}`;
    }

    await zahtjev.update({
      odobren,
      tekst: noviTekst,
    });

    return res.json({ zahtjev });
  } catch (error) {
    console.error('Greška prilikom odgovaranja na zahtjev:', error);
    return res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

//Napisan kod kako bih mogao izvrsiiti testiranje bez postamana
/*
app.get('/test/zahtjev/update', async (req, res) => {
  // Testni podaci
  const testData = {
      odobren: true,
      addToTekst: "Bujrum, dođite pogledajte, ali samo ako ćete ponijeti novac.",
  };
  const nekretninaId = 1; 
  const zahtjevId = 6; 

  try {
      // Provjeri da li je korisnik prijavljen
      if (!req.session || !req.session.username) {
          return res.status(401).json({ greska: 'Neautorizovan pristup' });
      }

      // Dohvati prijavljenog korisnika
      const loggedInUser = await Korisnik.findOne({ where: { username: req.session.username } });
      if (!loggedInUser || !loggedInUser.admin) {
          return res.status(403).json({ greska: 'Pristup dozvoljen samo administratorima.' });
      }

      // Dohvati zahtjev
      const zahtjev = await Zahtjev.findOne({ where: { id: zahtjevId, nekretninaId } });
      if (!zahtjev) {
          return res.status(404).json({ greska: `Zahtjev sa ID-em ${zahtjevId} za nekretninu ${nekretninaId} ne postoji.` });
      }

      // Ažuriraj zahtjev
      const noviTekst = testData.odobren
          ? zahtjev.tekst
          : `${zahtjev.tekst} ODGOVOR ADMINA: ${testData.addToTekst}`;

      zahtjev.odobren = testData.odobren;
      zahtjev.tekst = noviTekst;

      await zahtjev.save();

      res.status(200).json({
          poruka: 'Testni zahtjev je uspješno ažuriran.',
          zahtjev,
      });
  } catch (error) {
      console.error('Greška prilikom ažuriranja zahtjeva (test):', error.message);
      res.status(500).json({ greska: 'Došlo je do greške na serveru.' });
  }
});
*/


/* ----------------- MARKETING ROUTES ----------------- */

// Route that increments value of pretrage for one based on list of ids in nizNekretnina
app.post('/marketing/nekretnine', async (req, res) => {
  const { nizNekretnina } = req.body;

  try {
    // Load JSON data
    let preferencije = await readJsonFile('preferencije');

    // Check format
    if (!preferencije || !Array.isArray(preferencije)) {
      console.error('Neispravan format podataka u preferencije.json.');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Init object for search
    preferencije = preferencije.map((nekretnina) => {
      nekretnina.pretrage = nekretnina.pretrage || 0;
      return nekretnina;
    });

    // Update atribute pretraga
    nizNekretnina.forEach((id) => {
      const nekretnina = preferencije.find((item) => item.id === id);
      if (nekretnina) {
        nekretnina.pretrage += 1;
      }
    });

    // Save JSON file
    await saveJsonFile('preferencije', preferencije);

    res.status(200).json({});
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const nekretninaData = preferencije.find((item) => item.id === parseInt(id, 10));

    if (nekretninaData) {
      // Update clicks
      nekretninaData.klikovi = (nekretninaData.klikovi || 0) + 1;

      // Save JSON file
      await saveJsonFile('preferencije', preferencije);

      res.status(200).json({ success: true, message: 'Broj klikova ažuriran.' });
    } else {
      res.status(404).json({ error: 'Nekretnina nije pronađena.' });
    }
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/pretrage', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, pretrage: nekretninaData ? nekretninaData.pretrage : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/klikovi', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, klikovi: nekretninaData ? nekretninaData.klikovi : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
