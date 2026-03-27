const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto').webcrypto;
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const Gig = require('./models/Gig');
const fs = require('fs');
const http = require('http');

// Load academic structure to ensure realistic student and gig data generation.
const collegeData = JSON.parse(fs.readFileSync(path.join(__dirname, '../COLLEGES.json'), 'utf-8'));
const allCourses = collegeData.colleges.flatMap(c => [
    ...c.programs.undergraduate,
    ...c.programs.graduate
]);

/**
 * Seeds the database with a high volume of realistic student profiles and marketplace gigs.
 * Includes force-logout signaling to ensure UI state remains consistent across resets.
 */
async function seed(numUsers = 10, numGigs = 30) {
    try {
        // Broadcasts a logout signal to all connected clients before wiping the database.
        try {
            const serverPort = process.env.PORT || 5000;
            http.get(`http://localhost:${serverPort}/api/system/force-logout-all`, (res) => {
                console.log('📢 Sent global logout signal to server.');
            }).on('error', (e) => {
                // Server might be down, ignore.
            });
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) { /* ignore */ }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🐾 Alab is seeding the database with realistic Cats...');

        await User.deleteMany({});
        await Gig.deleteMany({});

        const hashedPassword = await bcrypt.hash('password', 10);
        const createdUsers = [];
        const credentials = [];

        // Creates a static administrative/monitor account for development testing.
        const monitorUser = new User({
            name: "Mark Leo Bagood",
            msu_email: "markleo.bagood@g.msuiit.edu.ph",
            password: hashedPassword,
            college: "College of Computer Studies",
            course: "Bachelor of Science in Computer Science",
            rating: 5.0,
            auto_pounce_message: "I am monitoring the pride. 🐾"
        });
        await monitorUser.save();
        createdUsers.push(monitorUser);
        credentials.push({ email: monitorUser.msu_email, password: 'password', name: monitorUser.name });

        // Generates realistic student profiles with unique ECDH public keys for E2EE simulation.
        for (let i = 0; i < numUsers; i++) {
            const college = faker.helpers.arrayElement(collegeData.colleges);
            const course = faker.helpers.arrayElement([
                ...college.programs.undergraduate,
                ...college.programs.graduate
            ]);

            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const middleInitial = faker.string.alpha({ length: 1, casing: 'upper' });
            
            const fullName = `${firstName} ${middleInitial}. ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@g.msuiit.edu.ph`;

            const keyPair = await crypto.subtle.generateKey(
                { name: "ECDH", namedCurve: "P-256" },
                true,
                ["deriveKey"]
            );
            const exported = await crypto.subtle.exportKey("spki", keyPair.publicKey);
            const publicKeyBase64 = Buffer.from(exported).toString('base64');

            const user = new User({
                name: fullName,
                msu_email: email,
                password: hashedPassword,
                college: college.name,
                course: course,
                rating: faker.number.float({ min: 3.5, max: 5, precision: 0.1 }),
                auto_pounce_message: `Hello I'm ${firstName}, I'm a student from ${college.acronym} and I want to help you with this job.`,
                publicKey: publicKeyBase64
            });

            await user.save();
            createdUsers.push(user);
            
            if (i < 10) {
                credentials.push({ email, password: 'password', name: fullName });
            }
        }
        console.log(`✅ Created ${numUsers} Cats with properly capitalized names.`);

        // Populates the marketplace with random gigs targeting various academic expertises.
        for (let j = 0; j < numGigs; j++) {
            const requester = faker.helpers.arrayElement(createdUsers);
            const isCustomReward = faker.datatype.boolean(0.3);

            const reward = {
                type: isCustomReward ? 'CUSTOM' : 'PHP',
                value: isCustomReward ? "I'll treat you to lunch at the canteen!" : faker.commerce.price({ min: 100, max: 2000 })
            };

            const gig = new Gig({
                requester: requester._id,
                title: faker.hacker.phrase(),
                description: faker.lorem.paragraph().substring(0, 500),
                images: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => faker.image.url()),
                targeted_expertises: faker.helpers.arrayElements(allCourses, { min: 1, max: 3 }),
                reward,
                status: 'OPEN',
                createdAt: faker.date.recent({ days: 7 })
            });
            await gig.save();
        }
        console.log(`✅ Created ${numGigs} Gigs.`);

        console.log('\n🐾 --- READY TO POUNCE: SAMPLE CREDENTIALS ---');
        console.table(credentials);
        console.log('🐾 --------------------------------------------\n');

        console.log('🐾 Seeding complete! Closing connection...');
        process.exit();
    } catch (err) {
        console.error('❌ Error seeding:', err);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
seed(parseInt(args[0]) || 100, parseInt(args[1]) || 200);
