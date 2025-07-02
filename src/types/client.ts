import { Client, Collection } from 'discord.js';

export class CommandClient extends Client {
  public commands!: Collection<string, any>;
}