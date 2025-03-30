import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const iconURL: string = "https://cdn.notsobot.com/brands/google-go.png";
const primaryColor: number = 0x94078C;


export const searchSuccessfulEmbed = (imageURL: string, searchTerm: string) => {

  return {
    author: {
      name: `${searchTerm}`,
      icon_url: iconURL,
    },
    color: primaryColor,
    image: {
      url: imageURL,
    }
  }

};

  
export const searchFailEmbed = (searchTerm: string) => {

    return {
    title: "❗FEHLER❗",
    description: `Es wurden leider keine mit deiner Suchanfrage **${searchTerm}** übereinstimmenden Dokumente gefunden.`,
    author: {
      name: `${searchTerm}`,
      icon_url: iconURL,
    },
    color: primaryColor
  } 

};


export const imageNavigationButtons = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId('gobackPage')
      .setLabel('◁')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  )
  .addComponents(
    new ButtonBuilder() 
      .setCustomId('skipPage')
      .setLabel('▷')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(false)
  )
  .addComponents(
    new ButtonBuilder()
      .setCustomId('endSearch')
      .setLabel('✔')
      .setStyle(ButtonStyle.Success)
  )
  .addComponents(
    new ButtonBuilder()
      .setCustomId('deleteSearch')
      .setLabel('✖')
      .setStyle(ButtonStyle.Danger)
  );