const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { canModerate, canTarget } = require('../utils/permissions');
const { applySanction } = require('../utils/apiClient');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un utilisateur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('L\'utilisateur à avertir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('La raison de l\'avertissement')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison');
    const member = interaction.guild.members.cache.get(target.id);

    // Vérifier les permissions
    const hasPerm = await canModerate(interaction.member, interaction.guildId);
    if (!hasPerm) {
      return interaction.reply({
        content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
        ephemeral: true,
      });
    }

    if (!member) {
      return interaction.reply({
        content: '❌ Utilisateur non trouvé sur ce serveur.',
        ephemeral: true,
      });
    }

    // Vérifier si on peut cibler cet utilisateur
    const targetCheck = await canTarget(interaction.member, member);
    if (!targetCheck.success) {
      return interaction.reply({
        content: `❌ ${targetCheck.message}`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      // Appeler l'API pour enregistrer la sanction (sans overrideAction pour utiliser l'escalation)
      const result = await applySanction(interaction.guildId, {
        userId: target.id,
        moderatorId: interaction.user.id,
        infractionType: 'other', // Type générique
        reason,
        userName: target.tag,
        moderatorName: interaction.user.tag,
      });

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de l\'application de la sanction');
      }

      const sanction = result.sanction;

      // Appliquer l'action d'escalation
      if (sanction.action === 'mute' && member) {
        const duration = sanction.durationMs || 3600000; // 1h par défaut
        await member.timeout(duration, reason);
      } else if (sanction.action === 'kick' && member) {
        await member.kick(reason);
      } else if (sanction.action === 'ban') {
        await interaction.guild.members.ban(target.id, { reason });
      }

      // Envoyer un message privé à l'utilisateur
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(sanction.action === 'warn' ? '#FFA500' : '#FF0000')
          .setTitle(getActionEmoji(sanction.action) + ' ' + getActionTitle(sanction.action))
          .setDescription(`Vous avez reçu une sanction sur **${interaction.guild.name}**`)
          .addFields(
            { name: 'Raison', value: reason },
            { name: 'Action', value: getActionLabel(sanction.action) },
            { name: 'Niveau', value: `${sanction.infractionLevel}${sanction.infractionLevel === 1 ? 'ère' : 'ème'} sanction` }
          );

        if (sanction.durationMs) {
          dmEmbed.addFields({ name: 'Durée', value: formatDuration(sanction.durationMs) });
        }

        dmEmbed.setFooter({ text: 'Les infractions répétées entraînent des sanctions progressives' })
          .setTimestamp();

        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log('Impossible d\'envoyer un MP à l\'utilisateur');
      }

      // Réponse dans le channel
      const embed = new EmbedBuilder()
        .setColor(sanction.action === 'warn' ? '#FFA500' : '#FF0000')
        .setTitle('✅ Sanction appliquée')
        .addFields(
          { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Action', value: getActionLabel(sanction.action), inline: true },
          { name: 'Raison', value: reason },
          { name: 'Niveau de sanction', value: `${sanction.infractionLevel}${sanction.infractionLevel === 1 ? 'ère' : 'ème'}` }
        );

      if (sanction.durationMs) {
        embed.addFields({ name: 'Durée', value: formatDuration(sanction.durationMs), inline: true });
      }

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur warn:', error);
      await interaction.editReply({
        content: `❌ Erreur: ${error.message}`,
      });
    }
  },
};

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
}

function getActionEmoji(action) {
  const emojis = {
    warn: '⚠️',
    mute: '🔇',
    kick: '👢',
    ban: '🔨'
  };
  return emojis[action] || '❓';
}

function getActionTitle(action) {
  const titles = {
    warn: 'Avertissement',
    mute: 'Mute',
    kick: 'Expulsion',
    ban: 'Bannissement'
  };
  return titles[action] || 'Sanction';
}

function getActionLabel(action) {
  const labels = {
    warn: '⚠️ Avertissement',
    mute: '🔇 Mute',
    kick: '👢 Kick',
    ban: '🔨 Ban'
  };
  return labels[action] || action;
}
