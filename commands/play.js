const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")
const { QueryType } = require("discord-player")
const { Player } = require("discord-music-player");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("play a song from YouTube.")
		.addSubcommand(subcommand =>
			subcommand
				.setName("search")
				.setDescription("Searches for a song and plays it")
				.addStringOption(option =>
					option.setName("searchterms").setDescription("search keywords").setRequired(true)
				)
		)
        .addSubcommand(subcommand =>
			subcommand
				.setName("playlist")
				.setDescription("Plays a playlist from YT")
				.addStringOption(option => option.setName("url").setDescription("the playlist's url").setRequired(true))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("song")
				.setDescription("Plays a single song from YT")
				.addStringOption(option => option.setName("url").setDescription("the song's url").setRequired(true))
		),
	execute: async ({ client, interaction }) => {

        // Make sure the user is inside a voice channel
		if (!interaction.member.voice.channel) return interaction.reply("Você precisa estar em um canal de voz para tocar uma música.");

        // Create a play queue for the server
        const queue = await client.player.nodes.create(interaction.guild);

        // Wait until you are connected to the channel
		if (!queue.connection) await queue.connect(interaction.member.voice.channel)

		let embed = new EmbedBuilder()


		if (interaction.options.getSubcommand() === "song") {
            let url = interaction.options.getString("url")

            // Search for the song using the discord-player
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO
            })

            // finish if no tracks were found
            if (result.tracks.length === 0)
                return interaction.reply("Sem resultados")

            // Add the track to the queue
            const song = result.tracks[0]
            const wasEmpty = queue.tracks.length === 0;
            await queue.addTrack(song);
            if (wasEmpty) await queue.play();
            embed
                .setDescription(`**[${song.title}](${song.url})** foi adicionado à fila`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duração: ${song.duration}` })

		}
        else if (interaction.options.getSubcommand() === "playlist") {

            // Search for the playlist using the discord-player
            let url = interaction.options.getString("url")
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            })

            if (result.tracks.length === 0)
                return interaction.reply(`Nenhuma playlist encontrada com ${url}`)

            // Add the tracks to the queue
            const playlist = result.playlist
            const wasEmpty = queue.tracks.length === 0;
            await queue.addTracks(result.tracks);
            if (wasEmpty) await queue.play();
            embed
                .setDescription(`**${result.tracks.length} músicas de [${playlist.title}](${playlist.url})** foram adicionadas à fila`)
                .setThumbnail(playlist.thumbnail)

		}
        else if (interaction.options.getSubcommand() === "search") {

            // Search for the song using the discord-player
            let url = interaction.options.getString("searchterms")
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            })

            // finish if no tracks were found
            if (result.tracks.length === 0)
                return interaction.editReply("Sem resultados")

            // Add the track to the queue
            const song = result.tracks[0]
            const wasEmpty = queue.tracks.length === 0;
            await queue.addTrack(song);
            if (wasEmpty) await queue.play();
            embed
                .setDescription(`**[${song.title}](${song.url})** foi adicionado à fila`)
                .setThumbnail(song.thumbnail)
                .setFooter(`Duração: ${song.duration}`)
		}

        // Respond with the embed containing information about the player
        await interaction.reply({
            embeds: [embed],
        })

        client.player.on("songAdd", (queue, song) => {
            console.log(`A música ${song.name} foi adicionada à fila!`);
        });

        client.player.on("songFirst", (queue, song) => {
            console.log(`A música ${song.name} começou a tocar!`);
        });
	},
}
