const { Client, Message } = require("discord.js");
const Level = require("../../models/Level");
const calculateLevelXp = require("../../utils/calculateLevelXp");
const cooldowns = new Set();

function getRandomXp(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
  if (
    !message.inGuild() ||
    message.author.bot ||
    cooldowns.has(message.author.id)
  )
    return;

  const xp = getRandomXp(5, 10);

  const query = {
    userId: message.author.id,
    guildId: message.guild.id,
  };

  try {
    const level = await Level.findOne(query);
    if (level) {
      level.xp += xp;
      if (level.xp > calculateLevelXp(level.level)) {
        level.xp = 0;
        level.level++;
        message.channel.send(
          `🚀 ${message.member} You have leveled up to level ${level.level}`
        );
      }
      await level.save().catch((err) => {
        console.log(`Error saving updated level ${err}`);
      });
      cooldowns.add(message.author.id);
      setTimeout(() => {
        cooldowns.delete(message.author.id);
      }, 60_000);
    } else {
      // no level found, create a new on exist
      const newLevel = new Level({
        userId: message.author.id,
        guildId: message.guild.id,
        xp: xp,
      });
      await newLevel.save();
      cooldowns.add(message.author.id);
      setTimeout(() => {
        cooldowns.delete(message.author.id);
      }, 60_000);
    }
  } catch (error) {
    console.error(`Error giving +exp ${error}`);
  }
};
