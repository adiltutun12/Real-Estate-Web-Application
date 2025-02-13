document.addEventListener("DOMContentLoaded", () => {
    const upitiContainer = document.getElementById('upiti');
    const sviUpiti = Array.from(upitiContainer.getElementsByClassName('upit'));
    const carouselNav = document.querySelector('.carousel-nav');
    let trenutniIndex = 0; //trenutno aktivni upit

    function prikaziElement(index) {
        //prikaz jednog elementa
        upitiContainer.innerHTML = `
            <div class="upit">
                ${sviUpiti[index].innerHTML}
            </div>
        `;
    }

    function resetujUpite() {
        //prikaz svih elemenata
        upitiContainer.innerHTML = sviUpiti.map(upit => `
            <div class="upit">
                ${upit.innerHTML}
            </div>
        `).join('');
    }

    function inicijalizujCarousel() {
        const jeMaliEkran = window.matchMedia('(max-width: 600px)').matches;

        if (jeMaliEkran) {
            //postavljanje dugmadi pomocu innerHTML-a
            carouselNav.innerHTML = `
                <button id="prev">Prethodni</button>
                <button id="next">Sljedeći</button>
            `;

            //dodavanje funkcionalnosti za novo kreirana dugmad
            const dugmeLijevo = document.getElementById('prev');
            const dugmeDesno = document.getElementById('next');

            dugmeLijevo.addEventListener('click', fnLijevo);
            dugmeDesno.addEventListener('click', fnDesno);

            prikaziElement(trenutniIndex); // Prikaz trenutnog elementa
        } else {
            //uklanjanje dugmadi
            carouselNav.innerHTML = ''; //očistiti navigacioni dio 
            resetujUpite(); //prikaz svih upita
        }
    }

    function fnLijevo() {
        trenutniIndex = (trenutniIndex - 1 + sviUpiti.length) % sviUpiti.length;
        prikaziElement(trenutniIndex);
    }

    function fnDesno() {
        trenutniIndex = (trenutniIndex + 1) % sviUpiti.length;
        prikaziElement(trenutniIndex);
    }

    //inicijalizacija carousela
    inicijalizujCarousel();
    window.addEventListener('resize', inicijalizujCarousel);
});

