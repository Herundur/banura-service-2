import { 
	SlashCommandBuilder, 
	EmbedBuilder, 
	ActionRowBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	MessageFlags, 
	ModalBuilder, 
	ModalActionRowComponentBuilder, 
	TextInputBuilder, 
	TextInputStyle, 
	ModalSubmitInteraction 
} from 'discord.js';
import LOGGER from "../../config/logger.js";
import { GOOGLE_IMG_SCRAP } from 'google-img-scrap';

class MessageData {
  searchTerm: string;
  imageURLs: string[];
  index: number;
	isDeleted: boolean; 
	isAccepted: boolean; 

  constructor(searchTerm: string, imageURLs: string[]) {
    this.searchTerm = searchTerm;
    this.imageURLs = imageURLs;
    this.index = 0;
    this.isDeleted = false;
    this.isAccepted = false;
  }

	getCurrentImageURL(): string {
    return this.imageURLs[this.index];
  }

  nextImage(): void {
    if (this.index < this.imageURLs.length - 1) {
      this.index++;
    }
  }

  previousImage(): void {
    if (this.index > 0) {
      this.index--;
    }
  }
}

const messageDataMap: Map<string, MessageData> = new Map();

export default {
	data: new SlashCommandBuilder()
						.setName('img')
						.setDescription('Dieser Befehl sucht nach Bildern auf Google.')
						.addStringOption(option =>
								option.setName('suchbegriff')
										.setDescription('Nach was soll gesucht werden?')
										.setRequired(true)),
	async execute(interaction: any) {
		try {
			await interaction.deferReply();

			const searchTerm: string = interaction.options.getString('suchbegriff')!;
			LOGGER.info(`/img von "${interaction.user.tag}" mit dem Suchbegriff "${searchTerm}" ausgeführt.`);

			const images: string[] = await getGoogleImages(searchTerm);
			if (images.length === 0) {
				await interaction.editReply({ content: `Keine Bilder unter Suchbegriff "${searchTerm}" gefunden.`, flags: MessageFlags.Ephemeral });
				return;
			}
			const modalPage = addInputFieldToPageModal(images.length);

			const messageData = new MessageData(searchTerm, images)

			let embed: EmbedBuilder = createEmbed(messageData);

			const message = await interaction.editReply({ embeds: [embed], components: [buttons], withResponse: true });
			messageDataMap.set(message.id, messageData);

			const collector = message.createMessageComponentCollector({ time: 30_000 }); // 30 seconds

			collector.on('collect', async (i: any) => {
				if (i.user.id !== interaction.user.id) {
					await i.reply({ content: 'Du hast keine Berechtigung, mit diesen Buttons zu interagieren. Nur der Nutzer, der den Befehl ursprünglich ausgeführt hat, kann dies tun.', flags: MessageFlags.Ephemeral });
					return;
				}

				switch (i.customId) {
					case 'back':
						messageData.previousImage();
						if (messageData.index <= 0) buttons.components[0].setDisabled(true);
						if (messageData.index < images.length - 1) buttons.components[1].setDisabled(false);
						embed = createEmbed(messageData);
						await i.update({  embeds: [embed], components: [buttons]});
						break;
					case 'forward':
						messageData.nextImage();
						if (messageData.index >= images.length - 1) buttons.components[1].setDisabled(true);
						if (messageData.index > 0) buttons.components[0].setDisabled(false);
						embed = createEmbed(messageData);
						await i.update({  embeds: [embed], components: [buttons]});
						break;
					case 'pageNumber':
						await i.showModal(modalPage);
						break;
					case 'accept':
						messageData.isAccepted = true;
						embed = createEmbed(messageData);
						await i.update({  embeds: [embed], components: [] });
						break;
					case 'cancel':
						messageData.isDeleted = true;
						message.delete();
						break;
					default:
						await i.reply({ content: 'Unbekannte Aktion!', flags: MessageFlags.Ephemeral });
				}
				collector.resetTimer();
			});
			
			collector.on('end', async (i: any) => {
				try {
					if (messageData.isDeleted) return;
					embed = createEmbed(messageData);
					await interaction.editReply({  embeds: [embed], components: [] });
				} catch (err) {
					LOGGER.warn("DiscordAPI hat versucht auf eine manuell gelöschte Message zuzugreifen:", err);
				}
			});

		} catch (error) {
			LOGGER.error("Beim Suchen der Bilder ist ein Fehler aufgetreten:", error);
			try {
				await interaction.editReply({ content: 'Beim Suchen der Bilder ist ein Fehler aufgetreten.', flags: MessageFlags.Ephemeral });
			} catch (err) {
				LOGGER.error("Beim Senden der Fehlernachricht ist auch ein Fehler aufgetreten:", err);
			}
		}
	}
};

/* 
------------------------------------------
Buttons
------------------------------------------
*/

const backButton = new ButtonBuilder()
	.setCustomId('back')
	.setEmoji("1395037156396896336")
	.setStyle(ButtonStyle.Secondary)
	.setDisabled(true);

const forwardButton = new ButtonBuilder()
	.setCustomId('forward')
	.setEmoji("1395037365117911113")
	.setStyle(ButtonStyle.Secondary)
	.setDisabled(false);

const pageNumberButton = new ButtonBuilder()
	.setCustomId('pageNumber')
	.setEmoji("1395036233029386380")
	.setStyle(ButtonStyle.Secondary)
	.setDisabled(false);

const acceptButton = new ButtonBuilder()
	.setCustomId('accept')
	.setEmoji("1395067554632044655")
	.setStyle(ButtonStyle.Success);

const cancelButton = new ButtonBuilder()
	.setCustomId('cancel')
	.setLabel('✖')
	.setStyle(ButtonStyle.Danger);

const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, forwardButton, pageNumberButton, acceptButton, cancelButton);

/* 
------------------------------------------
Helper Functions
------------------------------------------
*/

const allowedTypes = ['jpg', 'jpeg', 'JPG', 'JPEG', 'png', 'PNG', 'webm'];

async function getGoogleImages(searchTerm: string): Promise<string[]> {

	const response = await GOOGLE_IMG_SCRAP({ search: searchTerm });

	const filteredImages = response.result.filter(image => {
		const ext = image.url.split('.').pop()?.split(/\#|\?/)[0];
		return ext && allowedTypes.includes(ext);
	});

	const images = await Promise.all(filteredImages.map(async (image) => {
		return image.url;
	}));

	return images;
}

function createEmbed(messageData: MessageData): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setURL(messageData.getCurrentImageURL())
		.setImage(messageData.getCurrentImageURL())
		.setAuthor({ name: messageData.searchTerm, url: messageData.getCurrentImageURL(), iconURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/768px-Google_Favicon_2025.svg.png?20250526093708" })
		.setColor("#9c59b6");

	if (!messageData.isAccepted) embed.setFooter({ text: `Bild ${messageData.index + 1}/${messageData.imageURLs.length}` });

	return embed;
}

function addInputFieldToPageModal(numberOfImages: number): ModalBuilder {
	const modalPage = new ModalBuilder()
  .setCustomId('pageNumberModal')
  .setTitle('Springe zu einer Seite');

	const inputFieldPage = new TextInputBuilder()
		.setCustomId('pageNumberInput')
		.setLabel(`Seitenzahl eingeben (1-${numberOfImages})`)
		.setRequired(true)
		.setPlaceholder(`z.B. ${numberOfImages}`)
		.setMinLength(1)
		.setMaxLength(numberOfImages.toString().length)
		.setStyle(TextInputStyle.Short);

	const modalInputs = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(inputFieldPage);
	modalPage.addComponents(modalInputs);

	return modalPage;
}

export async function reactToPageModal(interaction: ModalSubmitInteraction) {
	try {
		const input = interaction.fields.getTextInputValue('pageNumberInput');

		const pageNumber = parseInt(input);

		if (!interaction.message) return;

		const messageData = messageDataMap.get(interaction.message.id);

		if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > messageData!.imageURLs.length) {
			await interaction.reply({
				content: `Bitte gib eine gültige Seitenzahl ein. Nur Zahlen zwischen 1 und ${messageData!.imageURLs.length} sind erlaubt`,
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		messageData!.index = pageNumber - 1;

		await interaction.deferUpdate();

		if (messageData!.index <= 0) buttons.components[0].setDisabled(true);
		if (messageData!.index < messageData!.imageURLs.length - 1) buttons.components[1].setDisabled(false);
		if (messageData!.index >= messageData!.imageURLs.length - 1) buttons.components[1].setDisabled(true);
		if (messageData!.index > 0) buttons.components[0].setDisabled(false);

		const embed = createEmbed(messageData!);
		await interaction.message.edit({  embeds: [embed], components: [buttons]});
	} catch (error) {
		LOGGER.error("Beim Springen zu anderem Bild ist ein Fehler aufgetreten:", error);
	}
}