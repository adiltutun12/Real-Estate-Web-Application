const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('wt24', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Povezan na MySQL bazu.');
    } catch (error) {
        console.error('Greška prilikom povezivanja sa bazom:', error);
    }
})();

module.exports = sequelize;
