const config = require('./config.json');

module.exports = {
  name: 'auto-role',
  version: '1.0.0',
  description: 'Attribue automatiquement un rôle aux nouveaux membres',
  
  events: {
    async guildMemberAdd(member, client) {
      // Récupérer le roleId configuré pour ce serveur
      const roleId = config.roles[member.guild.id];
      
      if (!roleId) {
        console.log(`[AutoRole] Aucun rôle configuré pour ${member.guild.name}`);
        return;
      }
      
      try {
        const role = member.guild.roles.cache.get(roleId);
        
        if (!role) {
          console.error(`[AutoRole] Rôle ${roleId} introuvable dans ${member.guild.name}`);
          return;
        }
        
        await member.roles.add(role);
        console.log(`[AutoRole] Rôle ${role.name} attribué à ${member.user.tag} dans ${member.guild.name}`);
      } catch (error) {
        console.error(`[AutoRole] Erreur lors de l'attribution du rôle:`, error);
      }
    }
  },
  
  async init(client) {
    console.log(`[${this.name}] Module auto-role initialisé`);
    console.log(`[${this.name}] Serveurs configurés:`, Object.keys(config.roles).length);
  },
  
  async cleanup(client) {
    console.log(`[${this.name}] Module auto-role nettoyé`);
  }
};
