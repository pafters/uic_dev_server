//ADMINBRO
const AdminBro = require('admin-bro');
const AdminBroSequelize = require('@admin-bro/sequelize');
const AdminBroExpress = require('@admin-bro/express');

const models = require('../../models/models');
const sequelize = require('../db/DB');

// const { before } = require('admin-bro').Record;

//ADMINBRO
AdminBro.registerAdapter(AdminBroSequelize);

const adminBro = new AdminBro({
    databases: [sequelize],
    resources:
        [{
            resource: models.Company,
            options: {
                properties: {
                    description: {
                        type: 'richtext',
                    },
                    logo: {
                        isVisible: { list: false, filter: true, show: true, edit: true },
                        components: {
                            edit: AdminBro.bundle('../../components/UploadFiles.jsx'),
                            show: AdminBro.bundle('../../components/FilesView.jsx'),
                        }
                    },
                    createdAt: {
                        isVisible: false,
                    },
                    updatedAt: {
                        isVisible: false,
                    },
                },
            },

        },
        {
            resource: models.Person,
            options: {
                properties: {
                    photo: {
                        isVisible: { list: false, filter: true, show: true, edit: true },
                        components: {
                            edit: AdminBro.bundle('../../components/UploadFiles.jsx'),
                            show: AdminBro.bundle('../../components/FilesView.jsx'),
                        }
                    },
                    createdAt: {
                        isVisible: false,
                    },
                    updatedAt: {
                        isVisible: false,
                    },
                    name: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    },
                    first_name: {
                        isVisible: { list: false, filter: true, show: true, edit: true }
                    },
                    middle_name: {
                        isVisible: { list: false, filter: true, show: true, edit: true }
                    },
                    last_name: {
                        isVisible: { list: false, filter: true, show: true, edit: true }
                    },
                    description: {
                        type: 'richtext'
                    }
                },
                actions: {
                    edit: {
                        after: async (response, request, context) => setNameForTable(response, request, context, 'person')
                    },
                    new: {
                        after: async (response, request, context) => setNameForTable(response, request, context, 'person')
                    },
                },

            },
        },
        {
            resource: models.Speech,
            options: {
                properties: {
                    presentation: {
                        isVisible: { list: false, filter: true, show: true, edit: true },
                        components: {
                            edit: AdminBro.bundle('../../components/UploadFiles.jsx'),
                            show: AdminBro.bundle('../../components/FilesView.jsx'),
                        }
                    },
                    createdAt: {
                        isVisible: false,
                    },
                    updatedAt: {
                        isVisible: false,
                    },
                    abstract: {
                        type: 'richtext'
                    },
                    name: {
                        isVisible: { list: true, filter: true, show: true, edit: true },
                    }
                },
            },
        },
        {
            resource: models.Section,
            options: {
                properties: {
                    createdAt: {
                        isVisible: false,
                    },
                    updatedAt: {
                        isVisible: false,
                    }
                },
            },
        },
        {
            resource: models.Slot,
            options: {
                properties: {
                    createdAt: {
                        isVisible: false,
                    },
                    updatedAt: {
                        isVisible: false,
                    },
                    name: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    }
                },
                actions: {
                    new: {
                        after: async (response, request, context) => setNameForTable(response, request, context, 'slot')
                    },
                    edit: {
                        after: async (response, request, context) => setNameForTable(response, request, context, 'slot')
                    },
                },
            },
        },
        {
            resource: models.Day,
            options: {
                properties: {
                    createdAt: {
                        isVisible: false,
                    },
                    updatedAt: {
                        isVisible: false,
                    },
                    name: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    }
                },
                actions: {
                    new: {
                        after: async (response, request, context) => setNameForTable(response, request, context, 'day')
                    },
                    edit: {
                        after: async (response, request, context) => setNameForTable(response, request, context, 'day')
                    },
                },
            },
        },
        {
            resource: models.Track,
            options: {
                properties: {
                    createdAt: {
                        isVisible: false,
                    },
                    updatedAt: {
                        isVisible: false,
                    },
                },
            },
        }, {
            resource: models.Program,
            options: {
                properties: {
                    createdAt: {
                        isVisible: false,
                    },
                    updatedAt: {
                        isVisible: false,
                    },
                    name: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    }
                },
                actions: {
                    new: {
                        after: async (response, request, context) => setNameForTable(response, request, context, 'program')
                    },
                    edit: {
                        after: async (response, request, context) => setNameForTable(response, request, context, 'program')
                    },
                },
            },
        }],
    rootPath: '/admin'
});

function formatDate(dateString) {
    const months = [
        'января', 'февраля', 'марта', 'апреля',
        'мая', 'июня', 'июля', 'августа',
        'сентября', 'октября', 'ноября', 'декабря'
    ];

    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];

    return `${day} ${month}`;
};

//Внесение данных в поле name таблиц для дружелюбного дизайна
async function setNameForTable(response, request, context, tableName) {
    const { record } = context;

    const { time_start, time_end, last_name, first_name, middle_name, sectionId, slotId, date } = record.params;

    let newName = '';
    if (tableName == 'slot')
        newName = `${time_start} - ${time_end}`;
    else if (tableName == 'person') {
        if (middle_name) {
            newName = `${first_name} ${middle_name} ${last_name}`;
        } else {
            newName = `${first_name} ${last_name}`;
        }
    }
    else if (tableName == 'program') {
        const slot = await models.Slot.findByPk(slotId, { attributes: ['name'] })
        const section = await models.Section.findByPk(sectionId, { attributes: ['name'] })
        if (slot && section) {
            newName = `${String(section.name)} : ${String(slot.name)}`.replace(/\s+/g, ' ');;
        }
    }
    else if (tableName == 'day') {
        newName = formatDate(date);
    }

    // Update the value of the 'name' field in the record
    await record.update({ name: newName });

    // Additional script or actions to execute

    return response;
}

//Окно авторизации
const router = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
    authenticate: async (email, password) => {
        if (email === process.env.DB_EMAIL && password === process.env.DB_PASSWORD) {
            return { email: process.env.DB_EMAIL, password: process.env.DB_PASSWORD }
        }
        return null
    },
    cookiePassword: 'some-secret-password-used-to-secure-cookie',
});

module.exports = { adminBro, router }