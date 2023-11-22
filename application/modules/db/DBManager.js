const { Slot, Section, Company, Person, Program, Speech, Event, Track, User, Mark, Schedule, Question, Quser, RecoveryLink } = require("../../models/models");
const { Op } = require('sequelize');
const sequelize = require('./DB');
const bcrypt = require('bcryptjs');
class DBManager {

    async getSections() {
        const sections = await Section.findAll({
            include: [
                {
                    model: Person,
                    include: [
                        {
                            model: Company
                        }
                    ]
                },
                {
                    model: Company,
                }
            ],
            order: [['sort', 'ASC']]
        });

        if (sections)
            return sections;
    }

    async getProgramsBySectionId(sectionId) {
        const programs = await Program.findAll({
            where: {
                sectionId: sectionId,
            },
            include: [
                {
                    model: Section,
                    include: [
                        {
                            model: Person,
                            include: [
                                {
                                    model: Company
                                }
                            ],

                        },
                        {
                            model: Company
                        }
                    ]
                },
                {
                    model: Slot
                },
                {
                    model: Speech,
                    include: [
                        {
                            model: Person,
                            include: [
                                {
                                    model: Company
                                }
                            ],
                        },
                        {
                            model: Track,
                        },
                    ],
                }
            ],
            order: [[Slot, 'name', 'ASC']],
        });

        if (programs) {
            return programs;
        }
    }

    async getSpeech(speechId) {
        const speech = await Speech.findByPk(speechId, {
            include: [
                {
                    model: Person,
                    include: [
                        {
                            model: Company
                        }
                    ]
                },
            ],
        });
        if (speech) {
            const program = await Program.findOne({
                where: { speechId: speechId },
                include: [{ model: Section }]
            });
            if (program) {
                return { speech, program };
            }

        }
    }

    async getAllPrograms() {
        const programs = await Program.findAll(
            {
                include: [
                    {
                        model: Section,
                        include: [
                            {
                                model: Person,
                                include: [
                                    {
                                        model: Company
                                    }
                                ],
                            },
                            {
                                model: Company
                            }
                        ]
                    },
                    {
                        model: Slot
                    },
                    {
                        model: Speech,
                        include: [
                            {
                                model: Person,
                                include: [
                                    {
                                        model: Company
                                    }
                                ],
                            },
                            {
                                model: Track,
                            }
                        ],
                    }
                ],

            }
        )

        if (programs)
            return programs;
    }

    async getSlots() {
        const slots = await Slot.findAll({
            attributes: ['id', 'name', 'time_start'],
            order: [['name', 'ASC']]
        });

        if (slots)
            return slots;
    }

    async getEvents() {
        const events = await Event.findAll({
            include: [{ model: Slot }]
        });

        if (events)
            return events;
    }

    async getEventBySlotId(slotId) {
        try {
            const event = await Event.findOne(
                {
                    where: { slotId: slotId },
                    include: [
                        {
                            model: Slot
                        }
                    ]
                }
            );
            if (event)
                return event;
        } catch (e) {
            return null;
        }

    }

    async getProgramsBySlotId(slotId) {
        try {
            const programs = await Program.findAll(
                {
                    where: { slotId: slotId },
                    include: [
                        {
                            model: Section,
                            include: [
                                {
                                    model: Person,
                                    include: [
                                        {
                                            model: Company
                                        }
                                    ],
                                },
                                {
                                    model: Company
                                }
                            ]
                        },
                        {
                            model: Slot
                        },
                        {
                            model: Speech,
                            include: [
                                {
                                    model: Person,
                                    include: [
                                        {
                                            model: Company
                                        }
                                    ],
                                },
                                {
                                    model: Track,
                                }
                            ],
                        }
                    ],

                }
            )

            if (programs)
                return programs;
        } catch (e) {
            return [];
        }

    }

    async getSlotIdByTime(time_now) {
        const slot = await Slot.findOne({
            attributes: ['id'],
            where: {
                [Op.or]: [
                    {
                        time_start: { [Op.lte]: time_now },
                        time_end: { [Op.gt]: time_now }
                    },
                    {
                        time_start: { [Op.lte]: time_now },
                        time_end: { [Op.eq]: "00:00" }
                    }
                ]
            },
        });

        if (slot)
            return slot
    }

    async setMarkToSpeech(telegramId, speechId, markName, mark) {
        const user = await User.findOne({
            attributes: ['id'],
            where: {
                telegram_id: `${telegramId}`
            }
        });

        if (user) {
            const markModel = await Mark.findOne({
                where: {
                    userId: user.id,
                    speechId: speechId
                }
            });

            if (markModel) {
                // Обновляем значение в существующей записи
                markModel[markName] = mark;
                await markModel.save();
            } else {
                // Создаем новую запись
                if (markName == 'mark_1') {
                    await Mark.create({
                        userId: user.id,
                        speechId: speechId,
                        mark_1: mark
                    });
                } else {
                    await Mark.create({
                        userId: user.id,
                        speechId: speechId,
                        mark_2: mark
                    });
                }
            }
        }
    }

    async setCommentToSpeech(telegramId, speechId, comment) {
        const user = await User.findOne({
            attributes: ['id'],
            where: {
                telegram_id: `${telegramId}`
            }
        });

        if (user) {
            const markModel = await Mark.findOne({
                where: {
                    userId: user.id,
                    speechId: speechId
                }
            });

            if (markModel) {
                // Обновляем значение в существующей записи
                markModel.comment = comment;
                await markModel.save();
            } else {

                await Mark.create({
                    userId: user.id,
                    speechId: speechId,
                    comment: comment
                });
            }
        }

    }

    async setQuestionToSpeech(telegram_id, programId, text) {
        const user = await User.findOne({ where: { telegram_id: `${telegram_id}` } });
        if (user) {
            await Question.create({
                userId: user.id,
                programId: programId,
                text: text
            });
        }
    }

    async getSpeakers() {
        const programs = await Program.findAll({
            include: [
                {
                    model: Section,
                    include: [
                        {
                            model: Person,
                            include: [
                                {
                                    model: Company
                                }
                            ],
                        },
                        {
                            model: Company
                        }
                    ]
                },
                {
                    model: Speech,
                    include: [
                        {
                            model: Person,
                            include: [
                                {
                                    model: Company
                                }
                            ],
                            order: [['last_name', 'ASC']],
                        },
                        {
                            model: Track,
                        },
                    ],
                    duplicating: false,
                }
            ],
            duplicating: false,
            order: [[Speech, Person, 'last_name', 'ASC']],
            distinct: true
        });

        if (programs) {
            return [...new Map(programs.map(program => [program?.speech?.person?.id, program])).values()];;
        }

    }

    async setFollowSpeech(telegram_id, programId) {
        const user = await User.findOne({ where: { telegram_id: `${telegram_id}` } });

        if (user) {
            const schedule = await Schedule.findOne({
                where: {
                    userId: user.id,
                    programId: programId
                }
            });

            if (schedule) {
                return false;
            } else {
                await Schedule.create({
                    userId: user.id,
                    programId: programId
                });
                return true;
            }
        }
    }

    async removeFollowSpeech(telegram_id, programId) {
        const user = await User.findOne({ where: { telegram_id: `${telegram_id}` } });
        if (user) {
            try {
                const schedule = await Schedule.findOne({
                    where: {
                        userId: user.id,
                        programId: programId
                    }
                });
                if (schedule) {
                    await Schedule.destroy({
                        where: {
                            userId: user.id,
                            programId: programId
                        }
                    });
                    return true;
                } else return false;
            } catch (e) {
                console.log([e]);
                return false;
            }
        }
    }

    async getFollowPrograms(telegram_id) {
        const user = await User.findOne({ where: { telegram_id: `${telegram_id}` } })

        if (user) {
            const schedule = await Schedule.findAll({
                where: {
                    userId: `${user.id}`,
                },
                include: [
                    {
                        model: Program,
                        include: [
                            {
                                model: Section,
                                include: [
                                    {
                                        model: Person,
                                        include: [
                                            {
                                                model: Company
                                            }
                                        ],

                                    },
                                    {
                                        model: Company
                                    }
                                ]
                            },
                            {
                                model: Slot
                            },
                            {
                                model: Speech,
                                include: [
                                    {
                                        model: Person,
                                        include: [
                                            {
                                                model: Company
                                            }
                                        ],
                                    },
                                    {
                                        model: Track,
                                    },
                                ],
                            }
                        ],

                    }
                ],
                order: [[Program, Slot, 'name', 'ASC']],
            });

            if (schedule) {
                return schedule;
            }
        }
    }

    async getQuser(login) {
        const quser = await Quser.findOne({ where: { login: login } });
        if (quser)
            return quser;
        else return false;
    }

    async getQusers() {
        const qusers = await Quser.findAll();
        if (qusers) {
            return qusers
        }
        else return false;
    }

    async checkRecoveryLink(link) {
        const recoveryLink = await RecoveryLink.findOne({ where: { link: link } });
        if (recoveryLink)
            return false;
        else return true;
    }

    async deleteRecoveryLink(quserId) {
        await RecoveryLink.destroy({
            where: {
                quserId: quserId,
            }
        });
    }

    insertRecoveryLink = async (quserId, link) => {
        const recoveryLink = await RecoveryLink.findOne({
            where: {
                quserId: quserId,
            }
        });
        if (recoveryLink) {
            await this.deleteRecoveryLink(quserId)
        }

        await RecoveryLink.create({
            quserId: quserId,
            link: link
        });
    }

    async getQuserByLink(link) {
        const recoveryLink = await RecoveryLink.findOne({
            where: {
                link: link,
            },
            include: [
                {
                    model: Quser,
                }
            ]
        });

        if (recoveryLink)
            return recoveryLink
    }
}

module.exports = new DBManager();