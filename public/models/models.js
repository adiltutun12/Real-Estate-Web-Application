const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./db'); // Putanja do postojećeg Sequelize modula

// Definicija modela

// Korisnik
const Korisnik = sequelize.define('Korisnik', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ime: { type: DataTypes.STRING, allowNull: false },
    prezime: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    admin: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// Nekretnina
const Nekretnina = sequelize.define('Nekretnina', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tip_nekretnine: { type: DataTypes.STRING, allowNull: false },
    naziv: { type: DataTypes.STRING, allowNull: false },
    kvadratura: { type: DataTypes.FLOAT, allowNull: false },
    cijena: { type: DataTypes.FLOAT, allowNull: false },
    tip_grijanja: { type: DataTypes.STRING },
    lokacija: { type: DataTypes.STRING, allowNull: false },
    godina_izgradnje: { type: DataTypes.INTEGER },
    datum_objave: { type: DataTypes.DATEONLY, allowNull: false },
    opis: { type: DataTypes.TEXT },
});

// Upit
const Upit = sequelize.define('Upit', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
});

// Zahtjev
const Zahtjev = sequelize.define('Zahtjev', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
    trazeniDatum: { type: DataTypes.DATEONLY, allowNull: false },
    odobren: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// Ponuda
const Ponuda = sequelize.define('Ponuda', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
    cijenaPonude: { type: DataTypes.FLOAT, allowNull: false },
    datumPonude: { type: DataTypes.DATEONLY, allowNull: false },
    odbijenaPonuda: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// Relacije između modela
Korisnik.hasMany(Nekretnina, { foreignKey: 'vlasnikId' });
Nekretnina.belongsTo(Korisnik, { foreignKey: 'vlasnikId' });

Korisnik.hasMany(Upit, { foreignKey: 'korisnikId' });
Upit.belongsTo(Korisnik, { foreignKey: 'korisnikId' });
Nekretnina.hasMany(Upit, { foreignKey: 'nekretninaId' });
Upit.belongsTo(Nekretnina, { foreignKey: 'nekretninaId' });

Korisnik.hasMany(Zahtjev, { foreignKey: 'korisnikId' });
Zahtjev.belongsTo(Korisnik, { foreignKey: 'korisnikId' });
Nekretnina.hasMany(Zahtjev, { foreignKey: 'nekretninaId' });
Zahtjev.belongsTo(Nekretnina, { foreignKey: 'nekretninaId' });

Korisnik.hasMany(Ponuda, { foreignKey: 'korisnikId' });
Ponuda.belongsTo(Korisnik, { foreignKey: 'korisnikId' });
Nekretnina.hasMany(Ponuda, { foreignKey: 'nekretninaId' });
Ponuda.belongsTo(Nekretnina, { foreignKey: 'nekretninaId' });

Ponuda.hasMany(Ponuda, { as: 'vezanePonude', foreignKey: 'vezanaPonudaId' });
Ponuda.belongsTo(Ponuda, { as: 'vezanaPonuda', foreignKey: 'vezanaPonudaId' });

// Funkcija za dohvat "interesovanja"
Nekretnina.prototype.getInteresovanja = async function () {
    const upiti = await Upit.findAll({ where: { nekretninaId: this.id } });
    const zahtjevi = await Zahtjev.findAll({ where: { nekretninaId: this.id } });
    const ponude = await Ponuda.findAll({ where: { nekretninaId: this.id } });
    return { upiti, zahtjevi, ponude };
};

// Inicijalizacija baze
(async () => {
    try {
        console.log('Povezivanje na bazu...');
        await sequelize.authenticate(); // Testiram konekciju na bazu
        console.log('Uspješno povezivanje na bazu podataka.');

        console.log('Sinhronizacija modela sa bazom...');
        await sequelize.sync({ alter: true }); // Koristim `alter` da ažurira postojeće tabele bez brisanja podataka
        console.log('Tabele su uspješno kreirane ili ažurirane.');
    } catch (error) {
        console.error('Greška prilikom sinhronizacije baze:', error.message);
    }
})();

// Exportijem model
module.exports = {
    Korisnik,
    Nekretnina,
    Upit,
    Zahtjev,
    Ponuda,
};
