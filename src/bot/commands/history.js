const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { canModerate } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Obtenir le lien vers l\'historique d\'un utilisateur sur le panel web')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('L\'utilisateur dont voir l\'historique')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser('utilisateur');

    const hasPerm = await canModerate(interaction.member, interaction.guildId);
    if (!hasPerm) {
      return interaction.editReply({
        content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
      });
    }

    // Construire l'URL du panel web
    const panelUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const profileUrl = `${panelUrl}/guild/${interaction.guildId}?tab=search&userId=${target.id}`;

    // Créer l'embed avec le lien
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📋 Historique de ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .setDescription(
        `**Utilisateur:** ${target.tag}\n` +
        `**ID Discord:** ${target.id}\n\n` +
        `🔗 **[Voir l'historique complet sur le panel web ➜](${profileUrl})**`
      )
      .setTimestamp()
      .setFooter({ text: 'Panel de modération' });

    await interaction.editReply({ embeds: [embed] });
  },
};
