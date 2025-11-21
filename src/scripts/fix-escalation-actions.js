/**
 * Script de migration pour corriger les actions en majuscules vers minuscules
 * dans les EscalationRules existantes
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { EscalationRule } = require('../models');

async function fixEscalationActions() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Mettre à jour toutes les règles avec des actions en majuscules
    const result = await EscalationRule.updateMany(
      { action: { $in: ['WARN', 'MUTE', 'KICK', 'BAN'] } },
      [
        {
          $set: {
            action: { $toLower: '$action' }
          }
        }
      ]
    );

    console.log(`✅ ${result.modifiedCount} règles d'escalation mises à jour`);
    
    // Afficher les règles restantes
    const remaining = await EscalationRule.find({});
    console.log(`\n📊 Total de règles en DB: ${remaining.length}`);
    
    if (remaining.length > 0) {
      console.log('\nExemple de règles:');
      remaining.slice(0, 3).forEach(rule => {
        console.log(`  - ${rule.infractionType} niveau ${rule.level}: ${rule.action}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Migration terminée');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixEscalationActions();
