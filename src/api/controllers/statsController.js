const InfractionCounter = require('../../models/InfractionCounter');
const Sanction = require('../../models/Sanction');

/**
 * Get guild statistics
 */
exports.getGuildStats = async (req, res) => {
  try {
    const { guildId } = req.params;
    const discordClient = req.app.get('discordClient');

    // Get all infraction counters for this guild
    const infractionCounters = await InfractionCounter.find({ guildId });

    // Calculate total infractions
    const totalInfractions = infractionCounters.reduce(
      (sum, counter) => sum + counter.count,
      0
    );

    // Get unique offenders
    const uniqueUserIds = [...new Set(infractionCounters.map(c => c.userId))];
    const uniqueOffenders = uniqueUserIds.length;

    // Get infraction breakdown by type
    const infractionsByType = {};
    infractionCounters.forEach(counter => {
      if (!infractionsByType[counter.infractionType]) {
        infractionsByType[counter.infractionType] = 0;
      }
      infractionsByType[counter.infractionType] += counter.count;
    });

    // Convert to array and calculate percentages
    const infractionBreakdown = Object.entries(infractionsByType)
      .map(([type, count]) => ({
        type: type.toUpperCase(),
        count,
        percentage: totalInfractions > 0 ? (count / totalInfractions) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Find most common infraction
    const mostCommonInfraction = infractionBreakdown.length > 0
      ? infractionBreakdown[0].type
      : 'N/A';

    // Get top offenders
    const userInfractionCounts = {};
    infractionCounters.forEach(counter => {
      if (!userInfractionCounts[counter.userId]) {
        userInfractionCounts[counter.userId] = {
          userId: counter.userId,
          totalCount: 0,
          lastInfraction: counter.lastInfractionAt,
        };
      }
      userInfractionCounts[counter.userId].totalCount += counter.count;
      
      // Update last infraction date if newer
      if (counter.lastInfractionAt > userInfractionCounts[counter.userId].lastInfraction) {
        userInfractionCounts[counter.userId].lastInfraction = counter.lastInfractionAt;
      }
    });

    // Convert to array and sort
    let topOffenders = Object.values(userInfractionCounts)
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 10);

    // Enrich with Discord usernames
    const guild = discordClient.guilds.cache.get(guildId);
    if (guild) {
      for (let offender of topOffenders) {
        try {
          const member = await guild.members.fetch(offender.userId);
          offender.userName = member.user.globalName || member.user.username;
        } catch (error) {
          offender.userName = null;
        }
      }
    }

    res.json({
      success: true,
      totalInfractions,
      uniqueOffenders,
      mostCommonInfraction,
      infractionBreakdown,
      topOffenders,
    });
  } catch (error) {
    console.error('Error fetching guild stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
};
