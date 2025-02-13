window.onload = function () {
    const listaUpita = document.getElementById('lista-upita');
  
    // Dohvatanje svih upita za prijavljenog korisnika
    PoziviAjax.getMojiUpiti((err, data) => {
      if (err) {
        if (err.status === 401) {
          alert("Neautorizovan pristup. Prijavite se.");
          window.location.href = "prijava.html"; //Redirektanje korisnika na prijavu
        } else {
          alert("Greška prilikom dohvatanja upita.");
        }
      } else {
        if (data.length === 0) {
          listaUpita.innerHTML = "<li>Nemate nijedan upit.</li>";
        } else {
          data.forEach(upit => {
            const li = document.createElement('li');
            li.textContent = `ID nekretnine: ${upit.id_nekretnine}, Tekst: ${upit.tekst_upita}`;
            listaUpita.appendChild(li);
          });
        }
      }
    });
  };
  