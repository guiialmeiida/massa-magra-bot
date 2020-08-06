'use strict';

const Discord = require('discord.js');
const ytdl = require('ytdl-core');

const client = new Discord.Client();

const queue = new Map();

const {prefix, token} = require('./config.json');

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('reconnecting', () => {
  console.log('Reconnecting!');
});

client.on('disconnect', () => {
  console.log('Disconnect!');
});

client.on('message', message => {
  const serverQueue = queue.get(message.guild.id);

  if (!message.content.startsWith(prefix)) return;

	if (message.content === `${prefix}massamagra`) {
      message.channel.send(`T\no\n \nc\no\nm\n \nf\no\nm\ne`);
  } else if (message.content === `${prefix}server`) {
      message.channel.send(`Nome do servidor: ${message.guild.name}\nTotal de membros: ${message.guild.memberCount}`);
  } else if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}next`)) {
    next(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}clear`)) {
    clear(message, serverQueue);
    return;
  }
});

client.on('guildMemberAdd', member => {
  const channel = member.guild.channels.cache.find(ch => ch.name === 'geral');
  if (!channel) return;
  channel.send(`Bem vindo ${member}, ao servidor dos desocupados na quarentena!!!!!!!!!!!!!`);
});


async function execute(message, serverQueue) {
  const args = message.content.split(' ');
  
  console.log(args[1])
  
  if (typeof args[1] !== 'undefined') {
    const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
    const urlValid = videoPattern.test(args[1]);

    if (!urlValid) {
      return message.channel.send('URL Inválida!');
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send('Você precisa estar em um canal de voz para eu poder tocar a música!');
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.channel.send('Preciso de permissões para tocar as músicas!');
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      };

      queue.set(message.guild.id, queueContruct);

      queueContruct.songs.push(song);

      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      console.log(serverQueue.songs);
      return message.channel.send(`${song.title} foi adicionado a fila!`);
    }
  
  }
  else {
    return message.channel.send(`Preciso de uma URL para tocar alguma música!`);
  }

}

function next(message, serverQueue) {
	if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
	if (!serverQueue) return message.channel.send('There is no song that I could skip!');
	serverQueue.connection.dispatcher.end();
}

function clear(message, serverQueue) {
	if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection.play(ytdl(song.url))
		.on('end', () => {
			console.log('Music ended!');
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => {
			console.error(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}


client.login(process.env.BOT_TOKEN);



