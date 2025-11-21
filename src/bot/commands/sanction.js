const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { canModerate, canTarget } = require('../utils/permissions');
const { applySanction } = require('../utils/apiClient');
const { InfractionType } = require('../../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sanction')
    .setDescription('Appliquer une sanction à un utilisateur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('L\'utilisateur à sanctionner')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('utilisateur');
    const member = interaction.guild.members.cache.get(target.id);

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

    const targetCheck = await canTarget(interaction.member, member);
    if (!targetCheck.success) {
      return interaction.reply({
        content: `❌ ${targetCheck.message}`,
        ephemeral: true,
      });
    }

    // Récupérer les types d'infractions de la base de données
    try {
      const infractionTypes = await InfractionType.find({
        guildId: interaction.guildId,
        enabled: true
      }).sort({ key: 1 });

      if (!infractionTypes || infractionTypes.length === 0) {
        return interaction.reply({
          content: '❌ Aucun type d\'infraction configuré pour ce serveur. Veuillez configurer les types d\'infraction dans le panel web.',
          ephemeral: true,
        });
      }

      // Créer le menu déroulant avec les types d'infraction
      const options = infractionTypes.map(type => ({
        label: type.label,
        value: type.key,
        description: type.description ? type.description.substring(0, 100) : undefined,
        emoji: type.icon || undefined
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`sanction_type_${target.id}`)
        .setPlaceholder('Sélectionnez le type d\'infraction')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: `**Sanction pour ${target.tag}**\nVeuillez sélectionner le type d\'infraction :`,
        components: [row],
        ephemeral: true
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des types d\'infraction:', error);
      return interaction.reply({
        content: '❌ Erreur lors de la récupération des types d\'infraction.',
        ephemeral: true,
      });
    }
  },

  async handleSelect(interaction) {
    const userId = interaction.customId.split('_')[2];
    const infractionType = interaction.values[0];
    
    // Récupérer le type d'infraction pour vérifier si un commentaire est requis
    const infractionTypeDoc = await InfractionType.findOne({
      guildId: interaction.guildId,
      key: infractionType
    });

    // Si le type requiert un commentaire personnalisé, ouvrir un modal
    if (infractionTypeDoc?.requiresCustomReason) {
      const modal = new ModalBuilder()
        .setCustomId(`sanction_reason_${userId}_${infractionType}`)
        .setTitle(`${infractionTypeDoc.icon} ${infractionTypeDoc.label}`);

      const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Raison détaillée')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Expliquez la raison de cette sanction...')
        .setRequired(true)
        .setMinLength(5)
        .setMaxLength(500);

      const row = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(row);

      return interaction.showModal(modal);
    }

    // Sinon, appliquer directement la sanction sans raison personnalisée
    await applySanctionToUser(interaction, userId, infractionType, null);
  },

  async handleModal(interaction) {
    const parts = interaction.customId.split('_');
    const userId = parts[2];
    const infractionType = parts[3];
    const reason = interaction.fields.getTextInputValue('reason');

    await applySanctionToUser(interaction, userId, infractionType, reason);
  },
};

async function applySanctionToUser(interaction, userId, infractionType, customReason) {
  await interaction.deferUpdate();

  const target = await interaction.client.users.fetch(userId);
  const member = interaction.guild.members.cache.get(userId);

  try {
    // Récupérer le label du type d'infraction
    const infractionTypeDoc = await InfractionType.findOne({
      guildId: interaction.guildId,
      key: infractionType
    });

    const reason = customReason || infractionTypeDoc?.label || infractionType;

    // Appliquer la sanction via l'API (avec escalade automatique)
    const result = await applySanction(interaction.guildId, {
      userId: target.id,
      moderatorId: interaction.user.id,
      infractionType,
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
      // MP avant kick
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle('👢 Expulsion')
          .setDescription(`Vous avez été expulsé de **${interaction.guild.name}**`)
          .addFields(
            { name: 'Raison', value: reason },
            { name: 'Type', value: infractionTypeDoc?.label || infractionType },
            { name: 'Niveau', value: `${sanction.infractionLevel}${sanction.infractionLevel === 1 ? 'ère' : 'ème'} infraction de ce type` }
          )
          .setTimestamp();

        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log('Impossible d\'envoyer un MP');
      }

      await member.kick(reason);
    } else if (sanction.action === 'ban') {
      // MP avant ban
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🔨 Bannissement')
          .setDescription(`Vous avez été banni de **${interaction.guild.name}**`)
          .addFields(
            { name: 'Raison', value: reason },
            { name: 'Type', value: infractionTypeDoc?.label || infractionType },
            { name: 'Niveau', value: `${sanction.infractionLevel}${sanction.infractionLevel === 1 ? 'ère' : 'ème'} infraction de ce type` }
          );

        if (sanction.durationMs) {
          dmEmbed.addFields({ name: 'Durée', value: formatDuration(sanction.durationMs) });
        }

        dmEmbed.setTimestamp();
        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log('Impossible d\'envoyer un MP');
      }

      await interaction.guild.members.ban(target.id, { reason });
    } else if (sanction.action === 'warn') {
      // MP pour warn
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('⚠️ Avertissement')
          .setDescription(`Vous avez reçu un avertissement sur **${interaction.guild.name}**`)
          .addFields(
            { name: 'Raison', value: reason },
            { name: 'Type', value: infractionTypeDoc?.label || infractionType },
            { name: 'Niveau', value: `${sanction.infractionLevel}${sanction.infractionLevel === 1 ? 'ère' : 'ème'} infraction de ce type` }
          )
          .setTimestamp();

        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log('Impossible d\'envoyer un MP');
      }
    }

    // Réponse de confirmation
    const embed = new EmbedBuilder()
      .setColor(getActionColor(sanction.action))
      .setTitle(`✅ ${getActionLabel(sanction.action)}`)
      .addFields(
        { name: 'Utilisateur', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Type', value: infractionTypeDoc?.label || infractionType, inline: true },
        { name: 'Action appliquée', value: getActionLabel(sanction.action), inline: true },
        { name: 'Niveau', value: `${sanction.infractionLevel}${sanction.infractionLevel === 1 ? 'ère' : 'ème'} infraction`, inline: true },
        { name: 'Raison', value: reason }
      );

    if (sanction.durationMs) {
      embed.addFields({ name: 'Durée', value: formatDuration(sanction.durationMs), inline: true });
    }

    embed.setTimestamp();

    await interaction.editReply({ 
      content: null,
      embeds: [embed],
      components: [] 
    });
  } catch (error) {
    console.error('Erreur sanction:', error);
    await interaction.editReply({
      content: `❌ Erreur: ${error.message}`,
      embeds: [],
      components: []
    });
  }
}

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

function getActionLabel(action) {
  const labels = {
    warn: '⚠️ Avertissement',
    mute: '🔇 Mute',
    kick: '👢 Expulsion',
    ban: '🔨 Bannissement'
  };
  return labels[action] || action;
}

function getActionColor(action) {
  const colors = {
    warn: '#FFA500',
    mute: '#FF6B6B',
    kick: '#FF6B6B',
    ban: '#FF0000'
  };
  return colors[action] || '#95a5a6';
}
