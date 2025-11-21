require('dotenv').config();
const connectDB = require('../config/database');
const { User } = require('../models');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../config/constants');

/**
 * Script pour créer l'utilisateur Master initial
 */
async function seedMasterUser() {
  try {
    await connectDB();

    const email = process.env.MASTER_EMAIL || 'admin@example.com';
    const password = process.env.MASTER_PASSWORD || 'changeme123';
    const discordId = process.env.MASTER_DISCORD_ID || null;

    // Vérifier si un master existe déjà
    const existingMaster = await User.findOne({ globalRole: ROLES.MASTER });

    if (existingMaster) {
      console.log('⚠️ Un utilisateur Master existe déjà:');
      console.log(`   Email: ${existingMaster.email}`);
      console.log(`   ID: ${existingMaster._id}`);
      console.log('\nAucune action effectuée.');
      process.exit(0);
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Promouvoir l'utilisateur existant
      existingUser.globalRole = ROLES.MASTER;
      await existingUser.save();

      console.log('✅ Utilisateur existant promu Master:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   ID: ${existingUser._id}`);
    } else {
      // Créer un nouvel utilisateur Master
      const passwordHash = await hashPassword(password);

      const masterUser = await User.create({
        email,
        passwordHash,
        username: 'Master Admin',
        discordId: discordId || undefined,
        globalRole: ROLES.MASTER,
      });

      console.log('✅ Utilisateur Master créé avec succès!');
      console.log(`   Email: ${masterUser.email}`);
      console.log(`   Password: ${password}`);
      console.log(`   ID: ${masterUser._id}`);
      console.log('\n⚠️ IMPORTANT: Changez le mot de passe dès que possible!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedMasterUser();
