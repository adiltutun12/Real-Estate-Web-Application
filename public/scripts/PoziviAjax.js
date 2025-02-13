const PoziviAjax = (() => {
    // fnCallback se u svim metodama poziva kada stigne
    // odgovor sa servera putem Ajax-a
    // svaki callback kao parametre ima error i data,
    // error je null ako je status 200 i data je tijelo odgovora
    // ako postoji greška, poruka se prosljeđuje u error parametru
    // callback-a, a data je tada null

    function ajaxRequest(method, url, data, callback) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    callback(null, xhr.responseText);
                } else {
                    callback({ status: xhr.status, statusText: xhr.statusText }, null);
                }
            }
        };
        xhr.send(data ? JSON.stringify(data) : null);
    } 

    // vraća korisnika koji je trenutno prijavljen na sistem
    function impl_getKorisnik(fnCallback) {
        let ajax = new XMLHttpRequest();

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    console.log('Uspješan zahtjev, status 200');
                    fnCallback(null, JSON.parse(ajax.responseText));
                } else if (ajax.status == 401) {
                    console.log('Neuspješan zahtjev, status 401');
                    fnCallback("error", null);
                } else {
                    console.log('Nepoznat status:', ajax.status);
                }
            }
        };

        ajax.open("GET", "http://localhost:3000/korisnik/", true);
        ajax.setRequestHeader("Content-Type", "application/json");
        ajax.send();
    }

    // ažurira podatke loginovanog korisnika
    function impl_putKorisnik(noviPodaci, fnCallback) {
        // Check if user is authenticated
        if (!req.session.username) {
            // User is not logged in
            return fnCallback({ status: 401, statusText: 'Neautorizovan pristup' }, null);
        }

        // Get data from request body
        const { ime, prezime, username, password } = noviPodaci;

        // Read user data from the JSON file
        const users = readJsonFile('korisnici');

        // Find the user by username
        const loggedInUser = users.find((user) => user.username === req.session.username);

        if (!loggedInUser) {
            // User not found (should not happen if users are correctly managed)
            return fnCallback({ status: 401, statusText: 'Neautorizovan pristup' }, null);
        }

        // Update user data with the provided values
        if (ime) loggedInUser.ime = ime;
        if (prezime) loggedInUser.prezime = prezime;
        if (username) loggedInUser.adresa = adresa;
        if (password) loggedInUser.brojTelefona = brojTelefona;

        // Save the updated user data back to the JSON file
        saveJsonFile('korisnici', users);

        fnCallback(null, { poruka: 'Podaci su uspješno ažurirani' });
    }

    function impl_postUpit(nekretnina_id, podaci, fnCallback) {
            ajaxRequest('POST', '/upit', podaci, (error, data) => {
                if (error) {
                    fnCallback(error, null);
                } else {
                    try {
                        const upitResponse = JSON.parse(data);
                        console.log("Upit uspješno dodan:", upitResponse);
                        fnCallback(null, upitResponse);
                    } catch (parseError) {
                        console.error("Greška prilikom parsiranja odgovora:", parseError);
                        fnCallback(parseError, null);
                    }
                }
            });
            }

    function impl_getNekretnine(fnCallback) {
        // Koristimo AJAX poziv da bismo dohvatili podatke s servera
        ajaxRequest('GET', '/nekretnine', null, (error, data) => {
            // Ako se dogodi greška pri dohvaćanju podataka, proslijedi grešku kroz callback
            if (error) {
                fnCallback(error, null);
            } else {
                // Ako su podaci uspješno dohvaćeni, parsiraj JSON i proslijedi ih kroz callback
                try {
                    const nekretnine = JSON.parse(data);
                    fnCallback(null, nekretnine);
                } catch (parseError) {
                    // Ako se dogodi greška pri parsiranju JSON-a, proslijedi grešku kroz callback
                    fnCallback(parseError, null);
                }
            }
        });
    }


        function impl_postLogin(username, password, fnCallback) {
            var ajax = new XMLHttpRequest();
    
            ajax.onreadystatechange = function () {
                if (ajax.readyState == 4 && ajax.status == 200) {
                    fnCallback(null, ajax.response);
                } else if (ajax.readyState == 4) {
                    //Obrada grešaka sa servera
                    fnCallback({
                        status: ajax.status,
                        statusText: ajax.statusText,
                        response: ajax.responseText
                    }, null);
                }
            };
    
            ajax.open("POST", "http://localhost:3000/login", true);
            ajax.setRequestHeader("Content-Type", "application/json");
            var objekat = {
                "username": username,
                "password": password
            };
            ajax.send(JSON.stringify(objekat));
        }

    function impl_postLogout(fnCallback) {
        let ajax = new XMLHttpRequest()

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4 && ajax.status == 200) {
                fnCallback(null, ajax.response)
            }
            else if (ajax.readyState == 4) {
                //desio se neki error
                fnCallback(ajax.statusText, null)
            }
        }
        ajax.open("POST", "http://localhost:3000/logout", true)
        ajax.send()
    }

    //dodane u ove funkcije svugdje dodano rucno parsiranje

    function impl_getTop5Nekretnina(lokacija, fnCallback) {
        const url = `http://localhost:3000/nekretnine/top5?lokacija=${encodeURIComponent(lokacija)}`;
        ajaxRequest('GET', url, null, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    // Parsiranje JSON odgovora
                    const top5Nekretnine = JSON.parse(data);
                    fnCallback(null, top5Nekretnine);
                } catch (parseError) {
                    console.error('Greška prilikom parsiranja JSON-a za /nekretnine/top5:', parseError);
                    fnCallback(parseError, null);
                }
            }
        });
    }
    

    function impl_getMojiUpiti(fnCallback) {
        ajaxRequest('GET', 'http://localhost:3000/upiti/moji', null, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    // Parsiranje JSON odgovora
                    const upiti = JSON.parse(data);
                    fnCallback(null, upiti);
                } catch (parseError) {
                    console.error('Greška prilikom parsiranja JSON-a za /upiti/moji:', parseError);
                    fnCallback(parseError, null);
                }
            }
        });
    }
    

    function impl_getNekretnina(id, fnCallback) {
    const url = `http://localhost:3000/nekretnina/${id}`;
    ajaxRequest('GET', url, null, (error, data) => {
        if (error) {
            console.error("Greška u AJAX pozivu za dohvatanje nekretnine:", error);
            fnCallback(error, null);
        } else {
            try {
                const nekretnina = JSON.parse(data);
                console.log("Uspješno dobivena nekretnina sa servera:", nekretnina);
                fnCallback(null, nekretnina);
            } catch (parseError) {
                console.error("Greška prilikom parsiranja JSON odgovora:", parseError);
                fnCallback(parseError, null);
            }
        }
    });
}

    
function impl_getNextUpiti(nekretnina_id, page, fnCallback) {
        const url = `http://localhost:3000/next/upiti/nekretnina${nekretnina_id}?page=${page}`;
        ajaxRequest('GET', url, null, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const upiti = JSON.parse(data);
                    fnCallback(null, upiti);
                } catch (parseError) {
                    console.error('Greška prilikom parsiranja JSON-a za /next/upiti/nekretnina:', parseError);
                    fnCallback(parseError, null);
                }
            }
        });
}

    function impl_getInteresovanja(nekretninaId, fnCallback) {
        ajaxRequest('GET', `/nekretnina/${nekretninaId}/interesovanja`, null, (error, data) => {
          if (error) {
            fnCallback(error, null);
          } else {
            try {
              const interesovanja = JSON.parse(data);
              fnCallback(null, interesovanja);
            } catch (parseError) {
              fnCallback(parseError, null);
            }
          }
        });
      }

      function impl_postPonuda(nekretninaId, podaciPonude, fnCallback) {
        const url = `http://localhost:3000/nekretnina/${nekretninaId}/ponuda`;
        ajaxRequest('POST', url, podaciPonude, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const response = JSON.parse(data); 
                    fnCallback(null, response);
                } catch (parseError) {
                    console.error('Greška prilikom parsiranja JSON-a za /nekretnina/:id/ponuda:', parseError);
                    fnCallback(parseError, null);
                }
            }
        });
    }
    
    

    function impl_postZahtjev(nekretninaId, podaciZahtjeva, fnCallback) {
        const url = `http://localhost:3000/nekretnina/${nekretninaId}/zahtjev`;
        ajaxRequest('POST', url, podaciZahtjeva, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const response = JSON.parse(data);
                    fnCallback(null, response);
                } catch (parseError) {
                    console.error('Greška prilikom parsiranja JSON-a za /nekretnina/:id/zahtjev:', parseError);
                    fnCallback(parseError, null);
                }
            }
        });
    }
    
    function impl_putZahtjev(nekretninaId, zahtjevId, podaciZahtjeva, fnCallback) {
        const url = `http://localhost:3000/nekretnina/${nekretninaId}/zahtjev/${zahtjevId}`;
        ajaxRequest('PUT', url, podaciZahtjeva, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const response = JSON.parse(data);
                    fnCallback(null, response);
                } catch (parseError) {
                    console.error('Greška prilikom parsiranja JSON-a za PUT /nekretnina/:id/zahtjev/:zid:', parseError);
                    fnCallback(parseError, null);
                }
            }
        });
    }
    
    return {
        getTop5Nekretnina: impl_getTop5Nekretnina,
        getMojiUpiti: impl_getMojiUpiti,
        getNekretnina: impl_getNekretnina,
        getNextUpiti: impl_getNextUpiti,
        postLogin: impl_postLogin,
        postLogout: impl_postLogout,
        getKorisnik: impl_getKorisnik,
        putKorisnik: impl_putKorisnik,
        postUpit: impl_postUpit,
        getNekretnine: impl_getNekretnine,
        getInteresovanja : impl_getInteresovanja, 
        postPonuda: impl_postPonuda,
        postZahtjev: impl_postZahtjev,
        putZahtjev: impl_putZahtjev,
    };
})();