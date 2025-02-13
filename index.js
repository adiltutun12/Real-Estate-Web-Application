const express = require('express');
const session = require("express-session");
const path = require('path');
const fs = require('fs').promises; // Using asynchronus API for file read and write
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

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


let loginAttempts = {}; //{ username: { count: broj_pokusaja, blockedUntil: vrijeme_blokade, firstBlocked: true } }

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const now = Date.now();

    //Inicijalizacija podataka za korisnika u loginAttempts
    if (!loginAttempts[username]) {
        loginAttempts[username] = { count: 0, blockedUntil: null, firstBlocked: true };
    }

    const userData = loginAttempts[username];

    // Provjera da li je korisnik blokiran
    if (userData.blockedUntil) {
        if (now < userData.blockedUntil) {
            //Korisnik je još uvijek blokiran
            if (userData.firstBlocked) {
                await fs.appendFile('prijave.txt', `[${new Date().toISOString()}] - username: "${username}" - status: "blokiran"\n`);
                userData.firstBlocked = false; //Postavi na false da se poruka "blokiran" ne ponavlja
            } else {
                await fs.appendFile('prijave.txt', `[${new Date().toISOString()}] - username: "${username}" - status: "neuspjesno"\n`);
            }

            return res.status(429).json({ greska: "Previse neuspjesnih pokusaja. Pokusajte ponovo za 1 minutu." });
        } else {
            //Blokada je istekla, resetujemo broj pokušaja i firstBlocked
            userData.count = 0;
            userData.blockedUntil = null;
            userData.firstBlocked = true;
        }
    }

    try {
        //Učitaj korisnike iz JSON fajla
        const korisnici = await readJsonFile('korisnici');
        const korisnik = korisnici.find(k => k.username === username);

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
                userData.blockedUntil = now + 60 * 1000; //1 minut blokade
                userData.firstBlocked = true; //Postavi na true za prvi pokušaj tokom blokade
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




//NOVA RUTA ZA TOP 5 LOKACIJA ODREDJENE NEKRETNINE - /nekretnine/top5
// Dodao sam u nekretnine.json jos stanova tako da bih mogao pravilno testirati - radi
app.get('/nekretnine/top5', async (req, res) => {
    const lokacija = req.query.lokacija; //Dohvaćam lokaciju iz query string-a

    if (!lokacija) {
        return res.status(400).json({ greska: "Parametar 'lokacija' je obavezan." });
    }

    try {
        //Podaci iz fajla nekretnine.json
        const nekretninePath = path.join(__dirname, 'data', 'nekretnine.json');
        const data = await fs.readFile(nekretninePath, 'utf-8');
        const nekretnine = JSON.parse(data);

        //Filtriraj nekretnine na osnovu lokacije
        const filtriraneNekretnine = nekretnine.filter(nekretnina => nekretnina.lokacija === lokacija);

        //Sortiraj nekretnine po datumu objave (najnovije prvo)
        const sortiraneNekretnine = filtriraneNekretnine.sort((a, b) => {
            const datumA = new Date(a.datum_objave.split('.').reverse().join('-'));
            const datumB = new Date(b.datum_objave.split('.').reverse().join('-'));
            return datumB - datumA; // Sortira od najnovije ka najstarijoj
        });

        //Vrati prvih 5 nekretnina
        const top5Nekretnine = sortiraneNekretnine.slice(0, 5);

        return res.status(200).json(top5Nekretnine); //odgovor koji je definisan da vraca ovih top pet nekretnina
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
      res.status(200).json({ poruka: 'Uspješno ste se odjavili' });
    }
  });
});

/*
Returns currently logged user data. First takes the username from the session and grabs other data
from the .json file.
*/
app.get('/korisnik', async (req, res) => {
  // Check if the username is present in the session
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // User is logged in, fetch additional user data
  const username = req.session.username;

  try {
    // Read user data from the JSON file
    const users = await readJsonFile('korisnici');

    // Find the user by username
    const user = users.find((u) => u.username === username);

    if (!user) {
      // User not found (should not happen if users are correctly managed)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Send user data
    const userData = {
      id: user.id,
      ime: user.ime,
      prezime: user.prezime,
      username: user.username,
      password: user.password // Should exclude the password for security reasons
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Allows logged user to make a request for a property
*/
app.post('/upit', async (req, res) => {
  //Provjera da li je korisnik autentifikovan
  if (!req.session.username) { 
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  //Izvlačenje podataka
  const { nekretnina_id, tekst_upita } = req.body;

  try {
    //Učitavanje podatttaka o korisnicima i nekretninama
    const users = await readJsonFile('korisnici');
    const nekretnine = await readJsonFile('nekretnine');

    //Pronalazak prijavljenog korisnika
    const loggedInUser = users.find(user => user.username === req.session.username);

    if (!loggedInUser) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    //Pronalazak nekretnine sa zadatim ID-om
    const nekretnina = nekretnine.find(property => property.id === nekretnina_id);

    if (!nekretnina) {
      return res.status(400).json({ greska: `Nekretnina sa id-em ${nekretnina_id} ne postoji` });
    }

    //Prije dodavanja novong upita krostim filter da pronadjemo sve upite koje je isti korisnik vec napravio za tu nekretninu
    const korisnikoviUpiti = nekretnina.upiti.filter(upit => upit.korisnik_id === loggedInUser.id);

    //Ovim postavljem ogranicenje na maximalno 3 upita, ako se premasi isto vracamo statusni kod 429 i tijelo odggovora
    if (korisnikoviUpiti.length >= 3) {
      //Korisnik je premašio limit za upite
      return res.status(429).json({ greska: 'Previse upita za istu nekretninu.' });
    }

    //Dodaj novi upit u listu upita za nekretninu
    nekretnina.upiti.push({
      korisnik_id: loggedInUser.id,
      tekst_upita: tekst_upita
    });

    //Sačuvaj ažurirane podatke nazad u JSON fajl
    await saveJsonFile('nekretnine', nekretnine);

    res.status(200).json({ poruka: 'Upit je uspješno dodan' });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.get('/upiti/moji', async (req, res) => {
  try {
      //Provjeri da li je korisnik prijavljen
      if (!req.session || !req.session.username) {
          return res.status(401).json({ greska: 'Neautorizovan pristup' });
      }

      //Učitaj korisnike i nekretnine iz JSONa
      const korisnici = await readJsonFile('korisnici');
      const nekretnine = await readJsonFile('nekretnine');

      //Pronađi prijavljenog korisnika na osnovu username-a iz sesije
      const loggedInUser = korisnici.find(user => user.username === req.session.username);

      if (!loggedInUser) {
          return res.status(401).json({ greska: 'Neautorizovan pristup' });
      }

      //Pronađi sve upite korisnika iz svih nekretnina
      const korisnikoviUpiti = [];
      nekretnine.forEach(nekretnina => {
          nekretnina.upiti.forEach(upit => {
              if (upit.korisnik_id === loggedInUser.id) {
                  korisnikoviUpiti.push({
                      id_nekretnine: nekretnina.id,
                      tekst_upita: upit.tekst_upita
                  });
              }
          });
      });

      //Ako korisnik nema upita, vrati prazan niz sa statusom 404
      if (korisnikoviUpiti.length === 0) {
          return res.status(404).json([]);
      }

      //Vrati sve korisnikove upite sa statusom 200
      res.status(200).json(korisnikoviUpiti);
  } catch (error) {
      console.error('Error fetching user queries:', error);
      res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.get('/nekretnina/:id', async (req, res) => {
  try {
      //Dohvati ID nekretnine iz URL parametara
      const nekretninaId = parseInt(req.params.id, 10);
      //Učitaj podatke o nekretninama iz JSONa
      const nekretnine = await readJsonFile('nekretnine');
      //Pronađi nekretninu sa zadatim ID-em
      const nekretnina = nekretnine.find(property => property.id === nekretninaId);

      //Ako nekretnina nije pronađena, vrati status 404
      if (!nekretnina) {
          return res.status(404).json({ greska: `Nekretnina sa id-em ${nekretninaId} ne postoji` });
      }
  	  //Kopiraj nekretninu i skrati listu upita na posljednja 3
      const detaljiNekretnine = {
          ...nekretnina,
          upiti: nekretnina.upiti.slice(-3)
      };
      // Vrati detalje nekretnine sa statusom 200
      res.status(200).json(detaljiNekretnine);
  } catch (error) {
      console.error('Error fetching property details:', error);
      res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.get('/next/upiti/nekretnina:id', async (req, res) => {
  const nekretninaId = parseInt(req.params.id, 10);
  const stranica = parseInt(req.query.page, 10);

  //Provjera validnosti parametara
  if (isNaN(nekretninaId) || isNaN(stranica) || stranica < 0) {
    return res.status(400).json({ greska: "Page mora biti broj veći ili jednak 0" });
  }

  try {
    //Dohvaćanje nekretnina 
    const nekretnine = await readJsonFile('nekretnine');
    const nekretnina = nekretnine.find(property => property.id === nekretninaId);

    //Provjera da li nekretnina postoji
    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa id ${nekretninaId} ne postoji` });
    }

    const ukupnoUpita = nekretnina.upiti.length;
    const upitiPoStranici = 3;

    //Provjera da li ima više od 3 upita
    if (ukupnoUpita <= 3) {
      return res.status(404).json([]); //Ako ima 3 ili manje upita, nema više upita za prikaz
    }

    const validniUpiti = [...nekretnina.upiti].reverse();

    //Dodao sam logiku za page = 0, referencirajući se na forum
    if (stranica === 0) {
      const posljednjaTri = validniUpiti.slice(0, Math.min(upitiPoStranici, ukupnoUpita));
      return res.status(200).json(
        posljednjaTri.map(upit => ({
          korisnik_id: upit.korisnik_id,
          tekst_upita: upit.tekst_upita,
        }))
      );
    }

    //Računanje opsega za trenutnu stranicu
    const pocetak = (stranica - 1) * upitiPoStranici + 3;
    const kraj = pocetak + upitiPoStranici;

    const stranicaUpiti = validniUpiti.slice(pocetak, kraj);

    //Ako nema više upita za trenutnu stranicu
    if (stranicaUpiti.length === 0) {
      return res.status(404).json([]);
    }

    // Vraćanje upita za traženu stranicu
    return res.status(200).json(
      stranicaUpiti.map(upit => ({
        korisnik_id: upit.korisnik_id,
        tekst_upita: upit.tekst_upita,
      }))
    );
  } catch (error) {
    console.error('Greška prilikom dohvaćanja upita:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


/*
Updates any user field
*/
app.put('/korisnik', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Get data from the request body
  const { ime, prezime, username, password } = req.body;

  try {
    // Read user data from the JSON file
    const users = await readJsonFile('korisnici');

    // Find the user by username
    const loggedInUser = users.find((user) => user.username === req.session.username);

    if (!loggedInUser) {
      // User not found (should not happen if users are correctly managed)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Update user data with the provided values
    if (ime) loggedInUser.ime = ime;
    if (prezime) loggedInUser.prezime = prezime;
    if (username) loggedInUser.username = username;
    if (password) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      loggedInUser.password = hashedPassword;
    }

    // Save the updated user data back to the JSON file
    await saveJsonFile('korisnici', users);
    res.status(200).json({ poruka: 'Podaci su uspješno ažurirani' });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Returns all properties from the file.
*/
app.get('/nekretnine', async (req, res) => {
  try {
    const nekretnineData = await readJsonFile('nekretnine');
    console.log('Odgovor sa servera:', nekretnineData); //Dodano za debug

    res.json(nekretnineData);
  } catch (error) {
    console.error('Error fetching properties data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

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
