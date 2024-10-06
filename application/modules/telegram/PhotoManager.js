const { Jimp } = require('jimp');
const fs = require('fs');

async function createCollage(programs, programIndex) {
    const assignments = programs[programIndex - 1]?.speech?.assignments || [];
    const photoUrls = assignments.map(assignment => `https://conf24.uic.dev/api/${assignment.person.photo ? assignment.person.photo : 'upload/speaker.jpg'}`);
    // Проверяем, валидны ли ссылки на изображения
    // Загружаем изображения
    const images = await Promise.all(photoUrls.map(url => {
        return Jimp.read(url).then(file => {
            return file;
        }).catch(err => {
            return Jimp.read(`https://conf24.uic.dev/api/upload/speaker.jpg`);
        });

    }));

    // Определяем размер коллажа
    const collageWidth = 756;
    const collageHeight = 745;

    // Создаем пустой холст для коллажа
    const collageImage = await Jimp.read('https://multonpartners-ref.hh.ru/assets/images/logos/SeEYmD9MgxQn3QV4n4hE17rBanTLXyFO7LnbG7M3.jpg');

    // Определяем позицию для каждого изображения
    const numImages = images.length;
    const rowWidth = Math.floor(collageWidth / numImages);
    const rowHeight = Math.floor(collageHeight / numImages * 2);
    let x = 0;
    let y = 0;

    // Добавляем изображения на холст
    for (let i = 0; i < numImages; i++) {
        const image = images[i];

        // Изменяем размер изображения, чтобы оно поместилось в ячейку'
        await image.contain({ w: rowWidth, h: rowHeight });
        // Добавляем изображение на холст
        await collageImage.composite(image, x, y);

        x += rowWidth;

        // Переходим на новую строку, если достигнута ширина холста
        if (x >= collageWidth) {
            x = 0;
            y += image.bitmap.height;
        }
    }

    // Сохраняем коллаж
    await collageImage.write(`upload/speakers-${assignments.map((x) => x.person.id).join('-')}.png`);
    return `upload/speakers-${assignments.map((x) => x.person.id).join('-')}.png`;
}

module.exports = { createCollage };