const Jimp = require('jimp');
const fs = require('fs');

async function processImage(filename) {
    try {
        console.log(`Processing ${filename}...`);
        const img = await Jimp.read(`assets/images/${filename}.jpg`);
        
        img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            
            // If pixel is very close to white (e.g. background)
            if (r > 240 && g > 240 && b > 240) {
                this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (transparent)
            }
        });
        
        // Save as PNG
        await img.writeAsync(`assets/images/${filename}.png`);
        console.log(`Saved ${filename}.png`);
    } catch (err) {
        console.error(err);
    }
}

async function main() {
    await processImage('icon_tennis');
    await processImage('icon_meat');
    await processImage('icon_bone');
    await processImage('icon_paw');
    await processImage('icon_drumstick');
    await processImage('icon_cheese');
    await processImage('icon_shoe');
    await processImage('icon_yarn');
    await processImage('icon_cookie');
}

main();
