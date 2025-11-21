module.exports = {
  name: 'ping-custom',
  version: '1.0.0',
  description: 'Commande ping personnalisée avec latence',
  
  commands: [
    {
      data: {
        name: 'pingcustom',
        description: 'Répond avec pong et affiche la latence du bot',
      },
      async execute(interaction) {
        const ping = interaction.client.ws.ping;
        const startTime = Date.now();
        
        await interaction.reply('🏓 Pong!');
        
        const endTime = Date.now();
        const roundTrip = endTime - startTime;
        
        await interaction.editReply(
          `🏓 Pong!\n` +
          `⏱️ Latence WebSocket: ${ping}ms\n` +
          `⏱️ Temps de réponse: ${roundTrip}ms`
        );
      }
    }
  ],
  
  async init(client) {
    console.log(`[${this.name}] Module initialisé avec succès!`);
  },
  
  async cleanup(client) {
    console.log(`[${this.name}] Module nettoyé`);
  }
};
