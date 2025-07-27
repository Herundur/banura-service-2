import { SlashCommandBuilder } from "discord.js";
import LOGGER from "../../config/logger.js";

export default {
    data: new SlashCommandBuilder()
        .setName("flip")
        .setDescription("Effektive Behandlungsmethode hinsichtlich chronischer Entscheidungsschwäche.")
        .addStringOption(option =>
            option.setName('grund')
                .setDescription('Wieso wird die Münze geworfen?')
                .setRequired(true)),
    async execute(interaction: any) {
      const reason: string = interaction.options.getString('grund')!;
      const random = Math.random() < 0.5 ? "Heads" : "Tails";
      const resultEmoji = random === "Heads" ? "✅" : "❌";
      const baseMessage = `🪙  |  Grund: **${reason}**  |  `;
      const flipStages = [
          "Die Münze wird geworfen.",
          "Die Münze wird geworfen..",
          "Die Münze wird geworfen...",
          "Die Münze wird geworfen.",
          "Die Münze wird geworfen..",
          "Die Münze wird geworfen...",
      ];

      // Send initial message
      await interaction.reply(baseMessage + flipStages[0]);

      // Sequentially edit message to simulate animation
      for (let i = 1; i < flipStages.length; i++) {
          await new Promise(res => setTimeout(res, 600));
          await interaction.editReply(baseMessage + flipStages[i]);
      }

      // Final result after suspense
      await new Promise(res => setTimeout(res, 1000));
      await interaction.editReply(baseMessage + `Ergebnis: ||${resultEmoji}||`);

      LOGGER.info(`/flip von "${interaction.user.tag}" mit dem Grund "${reason}" ausgeführt. Ergebnis war "${resultEmoji}"`);
    }

}