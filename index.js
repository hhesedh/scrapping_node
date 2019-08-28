/* eslint-disable no-console */
const request = require('request');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const obtemjsonTrackInfo = arquivo => {
  const jsonTrackInfo = arquivo
    .split('\n')
    .find(linha => linha.includes('trackinfo:'))
    .slice(0, -1)
    .replace('trackinfo:', '')
    .trim();

  return JSON.parse(jsonTrackInfo);
};

const obtemNomeAlbum = arquivo => {
  const nomeAlbum = arquivo
    .split('\n')
    .find(linha => linha.includes('album_title:'))
    .split('"')[1]
    .replace(/\W+/g, ' ');

  return nomeAlbum;
};

const obtemjsonDeMusicas = jsonTrackInfo => {
  const jsonDeMusicas = jsonTrackInfo
    .filter(element => element.file)
    .map(element => {
      return {
        url: element.file['mp3-128'],
        title: element.title.replace(/\W+/g, ' ')
      };
    });
  return jsonDeMusicas;
};

const obtemMusicas = async (nomeAlbum, musica) => {
  const writer = fs.createWriteStream(
    path.join(nomeAlbum, `${musica.title}.mp3`)
  );

  const response = await request.get(musica.url).on('error', err => {
    throw err;
  });

  response.pipe(
    writer,
    console.log(`Baixando música ${musica.title}.mp3`)
  );

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const argv = yargs.alias('u', 'url').demandOption('url').argv;

request(argv.url, async (err, res, body) => {
  if (err) throw err;

  const html = await body;
  const jsonTrackInfo = obtemjsonTrackInfo(html);
  const nomeAlbum = obtemNomeAlbum(html);
  const jsonDeMusicas = obtemjsonDeMusicas(jsonTrackInfo);

  if (!fs.existsSync(nomeAlbum)) fs.mkdirSync(nomeAlbum);

  for (let element of jsonDeMusicas) {
    await obtemMusicas(nomeAlbum, element);
  }
  console.log('Fim! :)');
});
