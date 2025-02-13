//ovo je moj kod koji ispravno obradjuje greske i izvrsava sve kako bi se trebalo izvrsavati 
window.onload = function () {
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    let dugme = document.getElementById("dugme");

    dugme.onclick = function () {
        PoziviAjax.postLogin(username.value, password.value, function (err, data) {
            if (err) {
                // Obrada grešaka na osnovu statusnih kodova
                if (err.status === 429) {
                    // Previše pokušaja
                    alert("Previše neuspješnih pokušaja. Pokušajte ponovo za 1 minutu.");
                } else if (err.status === 401) {
                    // Neispravni podaci
                    alert("Neuspješna prijava. Provjerite korisničko ime i lozinku.");
                } else {
                    // Ostale greške
                    alert("Došlo je do greške: " + err.statusText);
                }
            } else {
                // Uspješna prijava
                var message = JSON.parse(data);
                if (message.poruka === "Uspješna prijava") {
                    alert("Prijava uspješna!");
                    window.location.href = "http://localhost:3000/nekretnine.html"; // Preusmjeravanje
                }
            }
        });
    };
};

