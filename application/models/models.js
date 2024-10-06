const sequelize = require('../modules/db/DB');
const { DataTypes } = require('sequelize');

const Person = sequelize.define('person', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    middle_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    gender: {
        type: DataTypes.ENUM('Мужской', 'Женский'),
        allowNull: false
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    position: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

const User = sequelize.define('user', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    telegram_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

const Company = sequelize.define('company', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    website: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true
    },
});

const Section = sequelize.define('section', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    sort: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 10
    },
    color: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    live: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

const Speech = sequelize.define('speech', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    abstract: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    presentation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    video: {
        type: DataTypes.STRING,
        allowNull: true
    },
    listeners: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
});

const Assignment = sequelize.define('assignment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
})

const Track = sequelize.define('track', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

const Day = sequelize.define('day', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
});

const Slot = sequelize.define('slot', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    time_start: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    time_end: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

const Program = sequelize.define('program', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    show: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

const Event = sequelize.define('event', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

const Question = sequelize.define('question', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        unique: false         // отключение проверки уникальности внешнего ключа userId
    },
    programId: {
        type: DataTypes.INTEGER,
        unique: false         // отключение проверки уникальности внешнего ключа programId
    }
});

const Schedule = sequelize.define('schedule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
});


const Mark = sequelize.define('mark', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    mark_1: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    mark_2: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
});

const Quser = sequelize.define('quser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ticket_num: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    login: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    access23: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    ticket_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    promo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    order_num: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    order_date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    source: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    position: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    scan_date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    discount_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    discount_num: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    login: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

const RecoveryLink = sequelize.define('recovery_link', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false,
    },
})

//PERSON 
Person.hasOne(Section); //Person - Section 1:1
Section.belongsTo(Person);

Person.hasMany(Assignment);
Assignment.belongsTo(Person);
//END PERSON 

//SPEECH
Speech.hasMany(Assignment);
Assignment.belongsTo(Speech);
//END SPEECH

//COMPANY
Company.hasMany(Section)
Section.belongsTo(Company);

Company.hasMany(Person); //Company - Person 1:M
Person.belongsTo(Company);
//END COMPANY


//SECTION
Section.hasMany(Program);
Program.belongsTo(Section);
//END SECTION

//SLOT
Slot.hasMany(Program);
Program.belongsTo(Slot);

Slot.hasMany(Event);
Event.belongsTo(Slot);
//END SLOT



//PROGRAM
Speech.hasOne(Program);
Program.belongsTo(Speech);
//END PROGRAM

//TRACK
Track.hasMany(Speech);
Speech.belongsTo(Track);
//END TRACK

//DAY
Day.hasMany(Program);
Program.belongsTo(Day);

Day.hasMany(Event);
Event.belongsTo(Day);
//END DAY

//SPEECH
Speech.hasMany(Mark);
Mark.belongsTo(Speech);
//END SPEECH

//USER
User.hasMany(Mark);
Mark.belongsTo(User);
//END USER

//QUESTION
User.belongsToMany(Program, { through: { model: Question, unique: false }, foreignKey: 'userId' });
Program.belongsToMany(User, { through: { model: Question, unique: false }, foreignKey: 'programId' });

User.hasMany(Question, { foreignKey: 'userId', unique: false });
Program.hasMany(Question, { foreignKey: 'programId', unique: false });
//END QUESTION

//SCHEDULE
User.belongsToMany(Program, { through: Schedule })
Program.belongsToMany(User, { through: Schedule })

User.hasMany(Schedule);
Schedule.belongsTo(User);
Program.hasMany(Schedule);
Schedule.belongsTo(Program)
//END SCHEDULE


Quser.hasOne(RecoveryLink); //RecoveryLink - Quser 1:1
RecoveryLink.belongsTo(Quser);


module.exports = {
    Person,
    User,
    Company,
    Section,
    Speech,
    Track,
    Day,
    Slot,
    Program,
    Schedule,
    Mark,
    Event,
    Question,
    Quser,
    RecoveryLink,
    Assignment
}