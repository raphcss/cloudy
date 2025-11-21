const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { canModerate } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban un utilisateur du serveur')
    .addStringOption(option =>
      option
        .setName('userid')
        .setDescription('L\'ID Discord de l\'utilisateur à unban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('Raison de l\'unban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    // Vérifier les permissions
    const hasPerm = await canModerate(interaction.member, interaction.guildId);
    if (!hasPerm) {
      return interaction.editReply({
        content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
      });
    }

    // Vérifier que l'ID est valide (Discord snowflake)
    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.editReply({
        content: '❌ ID Discord invalide. L\'ID doit être un nombre de 17-20 chiffres.',
      });
    }

    try {
      // Vérifier si l'utilisateur est banni
      const bannedUser = await interaction.guild.bans.fetch(userId).catch(() => null);
      
      if (!bannedUser) {
        return interaction.editReply({
          content: '❌ Cet utilisateur n\'est pas banni de ce serveur.',
        });
      }

      // Unban l'utilisateur
      await interaction.guild.members.unban(userId, `Unban par ${interaction.user.tag}: ${reason}`);

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Utilisateur Unban')
        .setDescription(`**${bannedUser.user.tag}** a été unban avec succès.`)
        .addFields(
          { name: '👤 Utilisateur', value: `${bannedUser.user.tag} (${userId})`, inline: true },
          { name: '👮 Modérateur', value: interaction.user.tag, inline: true },
          { name: '📝 Raison', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${userId}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur unban:', error);
      await interaction.editReply({
        content: `❌ Erreur lors de l'unban: ${error.message}`,
      });
    }
  },
};
