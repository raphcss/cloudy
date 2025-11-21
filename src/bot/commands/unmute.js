const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { canModerate, canTarget } = require('../utils/permissions');
const { applySanction } = require('../utils/apiClient');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute un membre (retirer le timeout)')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le membre à unmute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('Raison de l\'unmute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    // Vérifier les permissions
    const hasPerm = await canModerate(interaction.member, interaction.guildId);
    if (!hasPerm) {
      return interaction.editReply({
        content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
      });
    }

    // Vérifier si le membre peut être modéré
    const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!targetMember) {
      return interaction.editReply({
        content: '❌ Membre introuvable dans ce serveur.',
      });
    }

    const canTargetUser = await canTarget(interaction.member, targetMember);
    if (!canTargetUser) {
      return interaction.editReply({
        content: '❌ Vous ne pouvez pas unmute ce membre (rôle supérieur ou égal au vôtre).',
      });
    }

    // Vérifier si le membre est mute
    if (!targetMember.communicationDisabledUntil) {
      return interaction.editReply({
        content: '❌ Ce membre n\'est pas mute.',
      });
    }

    try {
      // Retirer le timeout Discord
      await targetMember.timeout(null, `Unmute par ${interaction.user.tag}: ${reason}`);

      // Enregistrer dans l'API (optionnel - pour historique)
      // Note: Techniquement unmute n'est pas une "sanction" mais une action de révocation
      // On pourrait l'enregistrer comme log de modération

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔊 Membre Unmute')
        .setDescription(`**${target.tag}** a été unmute avec succès.`)
        .addFields(
          { name: '👤 Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
          { name: '👮 Modérateur', value: interaction.user.tag, inline: true },
          { name: '📝 Raison', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${target.id}` });

      await interaction.editReply({ embeds: [embed] });

      // Notification en DM
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🔊 Vous avez été unmute')
          .setDescription(`Vous avez été unmute sur **${interaction.guild.name}**.`)
          .addFields(
            { name: '👮 Modérateur', value: interaction.user.tag, inline: true },
            { name: '📝 Raison', value: reason, inline: false }
          )
          .setTimestamp();

        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log(`Impossible d'envoyer un DM à ${target.tag}`);
      }
    } catch (error) {
      console.error('Erreur unmute:', error);
      await interaction.editReply({
        content: `❌ Erreur lors de l'unmute: ${error.message}`,
      });
    }
  },
};
